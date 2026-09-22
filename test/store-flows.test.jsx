import { render, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { StrictMode } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, expect, test, vi } from 'vitest';
import App from '../src/app';
import AuthProvider from '../src/features/auth/model/auth-provider';

const id = '11111111-1111-4111-8111-111111111111';
const product = {
  id,
  slug: 'quiet-garden',
  name: 'Брелок «Тихий сад»',
  category: 'keychains',
  priceRub: 1200,
  description: 'Демонстрационное изделие с вышивкой',
  materials: 'Хлопок',
  dimensions: '5 см',
  productionTime: 'По согласованию',
  images: [],
  stock: 3,
  featured: true,
  active: true,
  isDemo: true,
};
const documents = [
  'pd-account',
  'account-terms',
  'offer',
  'privacy',
  'pd-marketing',
  'ads-email',
].map((id) => ({
  id,
  version: 'draft-v1',
  sha256: 'a'.repeat(64),
  title: id,
  type: id.startsWith('pd-') ? 'consent' : 'agreement',
  status: 'draft',
  notice: 'Проект',
  summary: [],
  sections: [['О документе', 'Отдельные условия.']],
}));
const response = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const start = (
  path,
  {
    failOrder = false,
    strictMode = false,
    owner = false,
    failCategoryDelete = false,
    emptyCategories = false,
  } = {},
) => {
  let authenticated = false;
  let failed = false;
  const calls = [];
  let products = [product];
  let categories = emptyCategories
    ? []
    : [
        { id: 'keychains', name: 'Брелоки' },
        { id: 'covers', name: 'Обложки на паспорт' },
      ];
  let nextCategory = 0;
  const tokens = {
    access_token: 'test-token',
    access_token_expires: Math.floor(Date.now() / 1000) + 3600,
  };
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url, options = {}) => {
      const endpoint = new URL(url).pathname.replace(/^\/api/, '');
      const body =
        options.body instanceof FormData
          ? JSON.parse(options.body.get('data'))
          : options.body
            ? JSON.parse(options.body)
            : null;
      calls.push({ endpoint, body, headers: options.headers });
      if (endpoint === '/auth/refresh-tokens')
        return owner ? response(tokens) : response({ message: 'No session' }, 401);
      if (['/shop/products', '/shop/admin/products'].includes(endpoint)) {
        if (options.method === 'POST') {
          products = [...products, { ...body, id: 'new-product' }];
          return response(products.at(-1), 201);
        }
        return response(products);
      }
      if (endpoint === '/shop/categories') return response(categories);
      if (endpoint === '/shop/admin/categories' && options.method === 'POST') {
        if (
          categories.some(
            (category) => category.name.toLowerCase() === body.name.trim().toLowerCase(),
          )
        )
          return response({ message: 'Категория с таким названием уже существует.' }, 409);
        const category = { id: 'category-' + ++nextCategory, name: body.name.trim() };
        categories = [...categories, category];
        return response(category, 201);
      }
      if (endpoint === '/shop/admin/categories')
        return response(
          categories.map((category) => ({
            ...category,
            productCount: products.filter((item) => item.category === category.id).length,
          })),
        );
      if (endpoint.startsWith('/shop/admin/categories/')) {
        const id = endpoint.split('/').at(-1);
        if (options.method === 'PATCH') {
          categories = categories.map((category) =>
            category.id === id ? { ...category, name: body.name } : category,
          );
          return response(categories.find((category) => category.id === id));
        }
        if (failCategoryDelete || products.some((item) => item.category === id))
          return response(
            {
              message:
                'В категории есть изделия. Сначала перенесите их в другую категорию или удалите.',
            },
            409,
          );
        categories = categories.filter((category) => category.id !== id);
        return response({ deleted: true });
      }
      if (endpoint === '/legal/documents') return response(documents);
      if (endpoint === '/auth/registration/request')
        return response({ message: 'Code sent', retry_after: 60, max_attempts: 5 });
      if (endpoint === '/auth/registration/confirm') {
        authenticated = true;
        return response(tokens);
      }
      if (endpoint === '/auth/login') {
        if (body.email === 'owner@example.test') {
          return response({
            admin_confirmation_required: true,
            challenge_id: 'a'.repeat(64),
            message: 'Код для входа отправлен на вашу почту.',
            expires_in: 300,
            retry_after: 60,
            max_attempts: 5,
          });
        }
        authenticated = true;
        return response(tokens);
      }
      if (endpoint === '/auth/login/admin/confirm') {
        authenticated = true;
        return response(tokens);
      }
      if (endpoint === '/auth/login/admin/resend') {
        return response({
          admin_confirmation_required: true,
          challenge_id: 'b'.repeat(64),
          message: 'Код для входа отправлен на вашу почту.',
          expires_in: 300,
          retry_after: 60,
          max_attempts: 5,
        });
      }
      if (endpoint === '/auth/session')
        return new Response(null, { status: authenticated || owner ? 204 : 401 });
      if (endpoint === '/users/me')
        return response({
          id: 1,
          name: 'Надежда',
          email: 'shopper@example.test',
          role: owner ? 'admin' : 'user',
        });
      if (endpoint === '/shop/me/consents') return response({ marketing: false });
      if (
        [
          '/shop/me/requests',
          '/shop/me/favorites',
          '/legal/me/events',
          '/shop/admin/requests',
        ].includes(endpoint)
      )
        return response([]);
      if (endpoint === '/shop/requests') {
        if (failOrder && !failed) {
          failed = true;
          return response({ message: 'Сервис временно недоступен' }, 503);
        }
        return response({
          id: 'request-id',
          number: 'REQ12345',
          subtotalRub: 1200,
          status: 'new',
          createdAt: new Date().toISOString(),
        });
      }
      return response({ message: 'Unexpected ' + endpoint }, 404);
    }),
  );
  const router = createMemoryRouter(
    [
      {
        path: '*',
        element: (
          <AuthProvider>
            <App />
          </AuthProvider>
        ),
      },
    ],
    { initialEntries: [path] },
  );
  const app = <RouterProvider router={router} />;
  render(strictMode ? <StrictMode>{app}</StrictMode> : app);
  return { calls, router };
};
beforeEach(() => localStorage.clear());

const openCategoryEditor = async () => {
  const button = await screen.findByRole('button', { name: 'Новая категория' });
  await waitFor(() => expect(button.disabled).toBe(false));
  fireEvent.click(button);
  return screen.getByRole('dialog', { name: 'Новая категория' });
};

test('owner creates a category, assigns a product and renames its catalog filter without changing the ID', async () => {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-category-photo');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  const { calls, router } = start('/admin/shop', { owner: true });
  let dialog = await openCategoryEditor();
  fireEvent.change(within(dialog).getByLabelText('Название категории'), {
    target: { value: 'Панно' },
  });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Сохранить категорию' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  const panel = screen.getByRole('region', { name: 'Категории' });
  await within(panel).findByRole('heading', { name: 'Панно' });

  fireEvent.click(screen.getByRole('button', { name: 'Новое изделие' }));
  dialog = screen.getByRole('dialog', { name: 'Новое изделие' });
  const category = within(dialog).getByLabelText('Категория');
  expect(category.required).toBe(false);
  fireEvent.change(category, { target: { value: 'category-1' } });
  fireEvent.change(within(dialog).getByLabelText('Название'), {
    target: { value: 'Вышитое панно «Лес»' },
  });
  fireEvent.change(within(dialog).getByLabelText('Цена, ₽'), { target: { value: '3500' } });
  fireEvent.click(within(dialog).getByLabelText('Показывать в каталоге'));
  fireEvent.change(within(dialog).getByLabelText('Добавить фотографии'), {
    target: { files: [new File(['photo'], 'panel.png', { type: 'image/png' })] },
  });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Сохранить изделие' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(
    calls.find((call) => call.endpoint === '/shop/admin/products' && call.body).body.category,
  ).toBe('category-1');

  const rename = within(panel).getByRole('button', { name: 'Переименовать категорию: Панно' });
  await waitFor(() => expect(rename.disabled).toBe(false));
  fireEvent.click(rename);
  dialog = screen.getByRole('dialog', { name: 'Переименовать категорию' });
  fireEvent.change(within(dialog).getByLabelText('Название категории'), {
    target: { value: 'Картины с вышивкой' },
  });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Сохранить категорию' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  await within(panel).findByRole('heading', { name: 'Картины с вышивкой' });
  expect(
    within(panel).getByRole('button', { name: 'Удалить категорию: Картины с вышивкой' }).disabled,
  ).toBe(true);

  fireEvent.click(
    within(screen.getByRole('navigation', { name: 'Главное меню' })).getByRole('link', {
      name: 'Коллекция',
    }),
  );
  const filter = await screen.findByRole('group', { name: 'Категории изделий' });
  fireEvent.click(await within(filter).findByRole('button', { name: 'Картины с вышивкой' }));
  expect(router.state.location.search).toBe('?category=category-1');
  expect(screen.getByRole('heading', { name: 'Вышитое панно «Лес»' })).toBeTruthy();
  expect(screen.queryByRole('heading', { name: product.name })).toBeNull();
  expect(within(filter).queryByRole('button', { name: 'Панно' })).toBeNull();
});

test('owner can delete an empty category while deletion of an occupied category stays disabled', async () => {
  const { calls } = start('/admin/shop', { owner: true });
  const panel = await screen.findByRole('region', { name: 'Категории' });
  const occupied = await within(panel).findByRole('button', { name: 'Удалить категорию: Брелоки' });
  expect(occupied.disabled).toBe(true);
  fireEvent.click(occupied);
  expect(screen.queryByRole('dialog')).toBeNull();
  const empty = within(panel).getByRole('button', {
    name: 'Удалить категорию: Обложки на паспорт',
  });
  await waitFor(() => expect(empty.disabled).toBe(false));
  fireEvent.click(empty);
  const dialog = screen.getByRole('dialog', { name: 'Удалить категорию?' });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Удалить категорию' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  await waitFor(() =>
    expect(within(panel).queryByRole('heading', { name: 'Обложки на паспорт' })).toBeNull(),
  );
  await waitFor(() =>
    expect(screen.queryByRole('link', { name: 'Обложки на паспорт' })).toBeNull(),
  );
  expect(calls.filter((call) => call.endpoint === '/shop/admin/categories/keychains')).toHaveLength(
    0,
  );
});

test('server deletion conflicts stay visible in the category dialog and keep its name', async () => {
  start('/admin/shop', { owner: true, failCategoryDelete: true });
  const button = await screen.findByRole('button', {
    name: 'Удалить категорию: Обложки на паспорт',
  });
  await waitFor(() => expect(button.disabled).toBe(false));
  fireEvent.click(button);
  const dialog = screen.getByRole('dialog', { name: 'Удалить категорию?' });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Удалить категорию' }));
  expect((await within(dialog).findByRole('alert')).textContent).toContain(
    'В категории есть изделия',
  );
  expect(within(dialog).getByText(/Пустая категория «Обложки на паспорт»/)).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Обложки на паспорт' })).toBeTruthy();
});

test('duplicate category errors preserve the typed name for correction', async () => {
  start('/admin/shop', { owner: true });
  const dialog = await openCategoryEditor();
  fireEvent.change(within(dialog).getByLabelText('Название категории'), {
    target: { value: 'брелоки' },
  });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Сохранить категорию' }));
  await within(dialog).findByText('Категория с таким названием уже существует.');
  expect(within(dialog).getByLabelText('Название категории').value).toBe('брелоки');
});

test('without categories the product form still defaults to no category and zero price', async () => {
  start('/admin/shop', { owner: true, emptyCategories: true });
  await screen.findByText('Категорий пока нет. Создайте первую подборку для своих изделий.');
  fireEvent.click(screen.getByRole('button', { name: 'Новое изделие' }));
  const dialog = screen.getByRole('dialog', { name: 'Новое изделие' });
  expect(within(dialog).getByLabelText('Категория').value).toBe('');
  expect(within(dialog).getByLabelText('Категория').required).toBe(false);
  expect(within(dialog).getByLabelText('Цена, ₽').value).toBe('0');
  expect(within(dialog).getByRole('option', { name: 'Без категории' })).toBeTruthy();
});

test('page scrollbar survives StrictMode, navigation and opening a store modal', async () => {
  const height = vi.spyOn(document.documentElement, 'scrollHeight', 'get');
  height.mockReturnValue(2400);
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  start('/products/quiet-garden', { strictMode: true });

  const scrollbar = await screen.findByRole('scrollbar', { name: 'Прокрутка страницы' });
  const login = screen.getByRole('button', { name: 'Войти в аккаунт' });
  await waitFor(() => expect(login.disabled).toBe(false));
  fireEvent.click(login);
  const dialog = await screen.findByRole('dialog');
  // Escape can dismiss the dialog even while its opening animation is running.
  fireEvent(dialog, new Event('cancel', { cancelable: true }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(document.body.style.position).toBe('');

  const menu = screen.getByRole('navigation', { name: 'Главное меню' });
  fireEvent.click(within(menu).getByRole('link', { name: 'Коллекция' }));
  height.mockReturnValue(window.innerHeight);
  fireEvent.resize(window);
  await waitFor(() => expect(scrollbar.getAttribute('aria-hidden')).toBe('true'));

  height.mockReturnValue(2400);
  fireEvent.resize(window);
  await waitFor(() => expect(scrollbar.getAttribute('aria-hidden')).toBe('false'));
  vi.spyOn(window, 'scrollY', 'get').mockReturnValue((2400 - window.innerHeight) / 2);
  fireEvent.scroll(window);
  await waitFor(() => expect(scrollbar.getAttribute('aria-valuenow')).toBe('50'));
});

test('product, cart and checkout keep guest data and retry the same request after server failure', async () => {
  const { calls } = start('/products/quiet-garden', { failOrder: true });
  fireEvent.click(await screen.findByRole('button', { name: 'Добавить в корзину' }));
  fireEvent.click(screen.getByRole('link', { name: 'Перейти в корзину →' }));
  await screen.findByRole('heading', { name: 'Корзина и заявка' });
  for (const [label, value] of [
    ['Ваше имя', 'Надежда'],
    ['Электронная почта', 'shopper@example.test'],
    ['Город', 'Заречный'],
  ])
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  fireEvent.click(screen.getByRole('checkbox', { name: /Принимаю условия/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Отправить заявку мастеру' }));
  await screen.findByText('Сервис временно недоступен');
  expect(screen.getByLabelText('Ваше имя').value).toBe('Надежда');
  expect(screen.getByLabelText('Город').value).toBe('Заречный');
  fireEvent.click(screen.getByRole('button', { name: 'Отправить заявку мастеру' }));
  await screen.findByRole('heading', { name: 'Заявка отправлена' });
  const attempts = calls.filter((c) => c.endpoint === '/shop/requests');
  expect(attempts).toHaveLength(2);
  expect(attempts[0].body).toEqual(attempts[1].body);
  expect(attempts[0].body.items[0].expectedPriceRub).toBe(1200);
  expect(attempts[0].headers.Authorization).toBeUndefined();
  expect(JSON.parse(localStorage.getItem('ss-cart-v1'))).toEqual([]);
});

test('registration sends two distinct document references and returns to the safe public route', async () => {
  const { calls, router } = start('/auth/registration');
  const dialog = await screen.findByRole('dialog');
  await waitFor(() =>
    expect(within(dialog).getByRole('button', { name: 'Получить код регистрации' }).disabled).toBe(
      false,
    ),
  );
  const checkboxes = within(dialog).getAllByRole('checkbox');
  expect(checkboxes).toHaveLength(2);
  expect(checkboxes.every((c) => !c.checked)).toBe(true);
  for (const [label, value] of [
    ['Как вас зовут', 'Надежда'],
    ['Электронная почта', 'shopper@example.test'],
    ['Пароль', 'a-safe-test-password'],
  ])
    fireEvent.change(within(dialog).getByLabelText(label, { exact: label === 'Пароль' }), {
      target: { value },
    });
  checkboxes.forEach((c) => fireEvent.click(c));
  fireEvent.click(within(dialog).getByRole('button', { name: 'Получить код регистрации' }));
  fireEvent.change(await screen.findByLabelText('Код из письма'), { target: { value: '123456' } });
  fireEvent.click(screen.getByRole('button', { name: 'Подтвердить код' }));
  await waitFor(() => expect(router.state.location.pathname).toBe('/'));
  expect(screen.getByRole('link', { name: 'Мой профиль' }).className).toBe('avatar');
  const request = calls.find((c) => c.endpoint === '/auth/registration/request').body;
  expect(request.name).toBe('Надежда');
  expect(request.documents.map((d) => d.id).sort()).toEqual(['account-terms', 'pd-account']);
  expect(request.documents.every((d) => d.version === 'draft-v1' && d.sha256.length === 64)).toBe(
    true,
  );
  expect(request.documents.some((d) => d.id === 'ads-email')).toBe(false);
});

test('login modal returns a visitor to the page from which it was opened', async () => {
  const { router } = start('/products/quiet-garden');
  fireEvent.click(await screen.findByRole('button', { name: 'Войти в аккаунт' }));
  const dialog = await screen.findByRole('dialog');
  fireEvent.change(within(dialog).getByLabelText('Электронная почта'), {
    target: { value: 'shopper@example.test' },
  });
  fireEvent.change(within(dialog).getByLabelText('Пароль'), {
    target: { value: 'a-safe-test-password' },
  });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Войти' }));

  await waitFor(() => expect(router.state.location.pathname).toBe('/products/quiet-garden'));
  expect(screen.getByRole('link', { name: 'Мой профиль' }).className).toBe('avatar');
});

test('administrator login creates a session only after the email code is confirmed', async () => {
  const { calls, router } = start('/auth/login');
  const dialog = await screen.findByRole('dialog');
  fireEvent.change(within(dialog).getByLabelText('Электронная почта'), {
    target: { value: 'owner@example.test' },
  });
  fireEvent.change(within(dialog).getByLabelText('Пароль'), {
    target: { value: 'a-safe-owner-password' },
  });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Войти' }));

  await screen.findByRole('heading', { name: 'Подтвердите вход владельца' });
  expect(calls.filter((call) => call.endpoint === '/auth/login/admin/confirm')).toHaveLength(0);
  fireEvent.change(screen.getByLabelText('Код из письма'), { target: { value: '123456' } });
  fireEvent.click(screen.getByRole('button', { name: 'Подтвердить код' }));

  await waitFor(() => expect(router.state.location.pathname).toBe('/'));
  expect(calls.filter((call) => call.endpoint === '/auth/login/admin/confirm')).toHaveLength(1);
});

test('opening and closing a legal document preserves registration fields and unchecked consents', async () => {
  start('/auth/registration');
  const dialog = await screen.findByRole('dialog');
  await waitFor(() =>
    expect(within(dialog).getByRole('button', { name: 'Получить код регистрации' }).disabled).toBe(
      false,
    ),
  );
  fireEvent.change(within(dialog).getByLabelText('Как вас зовут'), {
    target: { value: 'Надежда' },
  });
  fireEvent.click(within(dialog).getAllByRole('button', { name: 'Открыть документ' })[0]);
  const legal = await screen.findByRole('dialog', { name: 'pd-account' });
  fireEvent.click(within(legal).getByRole('button', { name: 'Закрыть документ' }));
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'pd-account' })).toBeNull());
  expect(within(dialog).getByLabelText('Как вас зовут').value).toBe('Надежда');
  expect(
    within(dialog)
      .getAllByRole('checkbox')
      .every((c) => !c.checked),
  ).toBe(true);
  expect(document.body.style.overflow).toBe('');
});
