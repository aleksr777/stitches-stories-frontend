import { render, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { StrictMode } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, expect, test, vi } from 'vitest';
import App from '../src/app';
import AuthProvider from '../src/features/auth/model/auth-provider';
import { startPaymentFlow, invoiceId } from './payment-fixture';

test('social buttons show only configured services and handle provider start failure', async () => {
  const { calls } = start('/?auth=login', { socialProviders: ['yandex'] });
  fireEvent.click(await screen.findByRole('button', { name: 'Яндекс ID', exact: true }));
  expect(await screen.findByText('Сервис временно недоступен')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'VK ID', exact: true })).toBeNull();
  expect(calls.find((call) => call.endpoint === '/auth/social/yandex/start')?.body).toEqual({});
});

test('VK registration requires separate documents and enters the account with provider profile', async () => {
  const { calls, router } = start('/auth/social', { socialProvider: 'vk' });
  const formButton = await screen.findByRole('button', { name: 'Зарегистрироваться и войти' });
  expect(screen.queryByLabelText('Ваше имя')).toBeNull();
  expect(screen.queryByLabelText('Электронная почта')).toBeNull();
  expect(screen.queryByLabelText('Код из письма')).toBeNull();
  fireEvent.submit(formButton.closest('form'));
  expect(await screen.findByText('Подтвердите каждый документ отдельно.')).toBeTruthy();
  expect(calls.some((call) => call.endpoint === '/auth/social/registration/vk')).toBe(false);
  const checks = within(formButton.closest('form')).getAllByRole('checkbox');
  expect(checks.every((check) => !check.checked)).toBe(true);
  checks.forEach((check) => fireEvent.click(check));
  fireEvent.submit(formButton.closest('form'));
  await waitFor(() => expect(router.state.location.pathname).toBe('/users/me'));
  const sent = calls.find((call) => call.endpoint === '/auth/social/registration/vk').body;
  expect(sent.documents.map((document) => document.id)).toEqual(['pd-account', 'account-terms']);
  expect(sent).not.toHaveProperty('email');
  expect(sent).not.toHaveProperty('name');
});

test('Yandex registration imports available profile data without asking for contact fields or an email code', async () => {
  const { calls, router } = start('/auth/social');
  const button = await screen.findByRole('button', { name: 'Зарегистрироваться и войти' });
  expect(screen.queryByLabelText('Ваше имя')).toBeNull();
  expect(screen.queryByLabelText('Электронная почта')).toBeNull();
  expect(screen.queryByLabelText('Код из письма')).toBeNull();
  fireEvent.submit(button.closest('form'));
  expect(await screen.findByText('Подтвердите каждый документ отдельно.')).toBeTruthy();
  within(button.closest('form'))
    .getAllByRole('checkbox')
    .forEach((check) => fireEvent.click(check));
  fireEvent.submit(button.closest('form'));
  await waitFor(() => expect(router.state.location.pathname).toBe('/users/me'));
  const body = calls.find((call) => call.endpoint === '/auth/social/registration/yandex')?.body;
  expect(body.documents.map((document) => document.id)).toEqual(['pd-account', 'account-terms']);
  expect(body).not.toHaveProperty('email');
  expect(body).not.toHaveProperty('name');
});

test('social linking requests the existing password without accepting new documents', async () => {
  const { calls } = start('/auth/social');
  fireEvent.click(await screen.findByRole('button', { name: 'У меня уже есть аккаунт магазина' }));
  const password = await screen.findByLabelText('Пароль аккаунта магазина');
  const form = password.closest('form');
  expect(within(form).queryAllByRole('checkbox')).toHaveLength(0);
  fireEvent.change(screen.getByLabelText('Электронная почта'), {
    target: { value: 'existing@example.test' },
  });
  fireEvent.change(password, { target: { value: 'synthetic-password' } });
  fireEvent.submit(form);
  expect(await screen.findByText('Неверный пароль аккаунта')).toBeTruthy();
  expect(calls.find((call) => call.endpoint === '/auth/social/link')?.body.email).toBe(
    'existing@example.test',
  );
});

test('cancelled social authorization leaves registration and sign-in unavailable until restarted', async () => {
  const { calls } = start('/auth/social?error=failed');
  expect(
    await screen.findByText('Вход не завершён. Попробуйте снова или войдите по паролю.'),
  ).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Продолжить регистрацию' })).toBeNull();
  expect(calls.some((call) => call.endpoint === '/auth/social/pending')).toBe(false);
});

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
    customer = false,
    failCategoryDelete = false,
    emptyCategories = false,
    socialProviders = [],
    socialRegistered = false,
    socialProvider = 'yandex',
    profile = {},
    savedAddresses = [],
  } = {},
) => {
  let authenticated = false;
  let failed = false;
  let currentProfile = profile;
  let addresses = [...savedAddresses];
  let pendingContactEmail;
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
      if (endpoint === '/auth/social/providers') return response(socialProviders);
      if (endpoint === '/auth/social/pending')
        return response({ provider: socialProvider, registered: socialRegistered });
      if (endpoint === '/auth/social/yandex/start')
        return response({ message: 'Сервис временно недоступен' }, 503);
      if (['/auth/social/registration/yandex', '/auth/social/registration/vk'].includes(endpoint)) {
        authenticated = true;
        return response(tokens);
      }
      if (endpoint === '/auth/social/link')
        return response({ message: 'Неверный пароль аккаунта' }, 401);
      if (endpoint === '/auth/refresh-tokens')
        return owner || customer ? response(tokens) : response({ message: 'No session' }, 401);
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
        return new Response(null, { status: authenticated || owner || customer ? 204 : 401 });
      if (endpoint === '/users/me/partial-data/update' && options.method === 'PATCH') {
        if ('contact_email' in body)
          return response({ message: 'Contact email requires a code' }, 400);
        currentProfile = { ...currentProfile, ...body };
        return response({
          id: 1,
          name: 'Надежда',
          email: 'shopper@example.test',
          role: owner ? 'admin' : 'user',
          contact_email: null,
          phone_number: null,
          sex: null,
          ...currentProfile,
        });
      }
      if (endpoint === '/users/me/contact-email/update/status')
        return response({ locked: false, retry_after: 0, max_attempts: 5, attempts_remaining: 5 });
      if (endpoint === '/users/me/contact-email/update/request') {
        pendingContactEmail = body.new_email;
        return response({ message: 'Code sent', retry_after: 60, max_attempts: 5 });
      }
      if (endpoint === '/users/me/contact-email/update/confirm') {
        if (body.code !== '123456')
          return response({ message: 'Неверный код', attempts_remaining: 4 }, 401);
        currentProfile = { ...currentProfile, contact_email: pendingContactEmail };
        pendingContactEmail = undefined;
        return response({ message: 'Email changed' });
      }
      if (endpoint === '/users/me')
        return response({
          id: 1,
          name: 'Надежда',
          email: 'shopper@example.test',
          role: owner ? 'admin' : 'user',
          contact_email: null,
          phone_number: null,
          sex: null,
          ...currentProfile,
        });
      if (endpoint === '/shop/me/addresses') {
        if (options.method === 'POST') {
          const address = { ...body, id: crypto.randomUUID() };
          addresses = [...addresses, address];
          return response(address, 201);
        }
        return response(addresses);
      }
      if (endpoint.startsWith('/shop/me/addresses/')) {
        const addressId = endpoint.split('/').at(-1);
        if (options.method === 'PUT') {
          addresses = addresses.map((address) =>
            address.id === addressId ? { ...body, id: addressId } : address,
          );
          return response(addresses.find((address) => address.id === addressId));
        }
        if (options.method === 'DELETE') {
          addresses = addresses.filter((address) => address.id !== addressId);
          return response({ deleted: true });
        }
      }
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
        if (body.deliveryAddress && body.saveAddress)
          addresses = [...addresses, { ...body.deliveryAddress, id: crypto.randomUUID() }];
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

test('customer reviews archived terms and pays the server amount through SBP, then sees verified status', async () => {
  const flow = startPaymentFlow({ failStart: true });
  await screen.findByText('Тестовая оплата. Настоящие деньги не списываются.');
  const checkbox = screen.getByRole('checkbox', { name: /Я принимаю условия покупки и оплаты/ });
  expect(checkbox.checked).toBe(false);
  expect(screen.getByRole('button', { name: 'Продолжить к оплате' }).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'payment' }));
  const dialog = await screen.findByRole('dialog', { name: 'payment' });
  expect(within(dialog).getByText('Условия именно этого счёта.')).toBeTruthy();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Закрыть документ' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  fireEvent.click(checkbox);
  fireEvent.click(screen.getByRole('button', { name: 'Продолжить к оплате' }));
  await screen.findByText('Попробуйте ещё раз');
  expect(checkbox.checked).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Продолжить к оплате' }));
  const button = await screen.findByRole('button', { name: 'Оплатить через СБП' });
  const form = button.closest('form');
  expect(form.action).toBe('https://auth.robokassa.ru/Merchant/Index.aspx');
  expect(form.method).toBe('post');
  expect(new FormData(form).get('OutSum')).toBe('1500.00');
  const start = flow.calls.find((call) => call.endpoint.endsWith('/start'));
  expect(start.body.documents).toHaveLength(4);
  expect(start.body).not.toHaveProperty('amountRub');
  expect(start.headers.Authorization).toBe('Bearer customer-token');
  flow.paid();
  fireEvent.click(screen.getByRole('button', { name: 'Проверить оплату' }));
  await screen.findByText('Тестовый платёж подтверждён.');
  expect(screen.queryByRole('button', { name: 'Оплатить через СБП' })).toBeNull();
});

test('owner cannot start payment or accept purchase terms', async () => {
  const flow = startPaymentFlow({ owner: true });
  await screen.findByRole('link', { name: 'К управлению магазином' });
  expect(screen.getByRole('button', { name: 'Оплатить через СБП' }).disabled).toBe(true);
  expect(screen.queryByRole('checkbox')).toBeNull();
  expect(flow.calls.some((call) => call.endpoint.startsWith('/shop/payments/'))).toBe(false);
});

test('owner issues an agreed invoice and receives an account-only customer link without signing documents', async () => {
  const flow = startPaymentFlow({ owner: true, path: '/admin/shop' });
  fireEvent.click(await screen.findByRole('button', { name: 'Подготовить оплату СБП' }));
  const dialog = await screen.findByRole('dialog', { name: /Оплата заявки/ });
  const conditions = await within(dialog).findByLabelText('Согласованные условия и сроки');
  expect(within(dialog).queryByRole('checkbox')).toBeNull();
  fireEvent.change(conditions, { target: { value: 'Изготовление 5 дней, доставка согласована.' } });
  fireEvent.change(within(dialog).getByLabelText('Доставка, ₽'), { target: { value: '300' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Выставить счёт СБП' }));
  const link = await within(dialog).findByLabelText('Ссылка на счёт');
  expect(link.value).toBe('https://shop.example.test/payment/' + invoiceId);
  const issue = flow.calls.find(
    (call) => call.endpoint.endsWith('/payment') && call.method === 'POST',
  );
  expect(issue.body).toEqual({
    deliveryRub: 300,
    fulfillment: 'Изготовление 5 дней, доставка согласована.',
  });
});

test('return URL alone never claims that a payment succeeded', async () => {
  const flow = startPaymentFlow({ path: '/payment/result?OutSum=1500&InvId=123&IsTest=0' });
  await screen.findByRole('heading', { name: 'Вернитесь к вашему заказу' });
  expect(screen.queryByText('Оплата получена')).toBeNull();
  expect(flow.calls.some((call) => call.endpoint.includes('/shop/payments/'))).toBe(false);
});

test('guest cannot open an invoice without signing in', async () => {
  const flow = startPaymentFlow({ customer: false });
  await screen.findByRole('dialog', { name: 'Рады видеть вас снова' });
  expect(flow.router.state.location.pathname).toBe('/auth/login');
  expect(flow.calls.some((call) => call.endpoint.startsWith('/shop/payments/'))).toBe(false);
});

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

test('customer cart and checkout retry the same authenticated request after server failure', async () => {
  const { calls } = start('/products/quiet-garden', { customer: true, failOrder: true });
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
  expect(attempts[0].headers.Authorization).toBe('Bearer test-token');
  expect(JSON.parse(localStorage.getItem('ss-cart-v1'))).toEqual([]);
});

test('checkout prepopulates Yandex contact details and asks only for missing order information', async () => {
  const { calls } = start('/products/quiet-garden', {
    customer: true,
    profile: {
      name: 'Надежда Петрова',
      email: null,
      contact_email: 'nadezhda@example.test',
      phone_number: '+79001234567',
      sex: 'female',
    },
  });
  fireEvent.click(await screen.findByRole('button', { name: 'Добавить в корзину' }));
  fireEvent.click(screen.getByRole('link', { name: 'Перейти в корзину →' }));
  await waitFor(() => expect(screen.getByLabelText('Ваше имя').value).toBe('Надежда Петрова'));
  expect(screen.getByLabelText('Электронная почта').value).toBe('nadezhda@example.test');
  expect(screen.getByLabelText(/Телефон/).value).toBe('+79001234567');
  expect(screen.queryByLabelText('Пол')).toBeNull();
  fireEvent.change(screen.getByLabelText('Город'), { target: { value: 'Заречный' } });
  fireEvent.click(screen.getByRole('checkbox', { name: /Принимаю условия/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Отправить заявку мастеру' }));
  await screen.findByRole('heading', { name: 'Заявка отправлена' });
  expect(calls.find((call) => call.endpoint === '/shop/requests').body).toMatchObject({
    name: 'Надежда Петрова',
    email: 'nadezhda@example.test',
    phone: '+79001234567',
  });
});

test('customer edits imported profile details and checkout uses the saved contact email', async () => {
  const { calls, router } = start('/users/me/settings/profile', {
    customer: true,
    profile: {
      name: 'Надежда Петрова',
      email: 'login@example.test',
      contact_email: 'old@example.test',
      phone_number: '+79001234567',
      sex: 'female',
    },
  });
  await screen.findByRole('heading', { name: 'Мои данные' });
  await screen.findByText('Контактная почта: old@example.test');
  expect(screen.getByText(/Почта для входа: login@example.test/)).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Имя'), { target: { value: 'Надежда Иванова' } });
  fireEvent.change(screen.getByLabelText('Телефон'), { target: { value: '' } });
  fireEvent.change(screen.getByLabelText('Пол'), { target: { value: '' } });
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить изменения' }));
  await screen.findByText('Профиль обновлён');
  expect(calls.find((call) => call.endpoint === '/users/me/partial-data/update').body).toEqual({
    name: 'Надежда Иванова',
    phone_number: null,
    sex: null,
  });

  fireEvent.click(screen.getByRole('link', { name: 'Изменить контактную почту по коду' }));
  await screen.findByRole('heading', { name: 'Контактная почта' });
  fireEvent.change(screen.getByLabelText('Новая контактная почта'), {
    target: { value: 'new@example.test' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
  await screen.findByText(/Код отправлен на new@example.test/);
  expect(
    calls.find((call) => call.endpoint === '/users/me/contact-email/update/request').body,
  ).toEqual({
    new_email: 'new@example.test',
  });
  expect(
    calls
      .filter((call) => call.endpoint === '/users/me/partial-data/update')
      .every((call) => !('contact_email' in call.body)),
  ).toBe(true);
  const code = screen.getByLabelText('Код подтверждения');
  fireEvent.change(code, { target: { value: '654321' } });
  fireEvent.click(screen.getByRole('button', { name: 'Подтвердить почту' }));
  await screen.findByText('Неверный код');
  fireEvent.change(code, { target: { value: '123456' } });
  fireEvent.click(screen.getByRole('button', { name: 'Подтвердить почту' }));
  await waitFor(() => expect(router.state.location.pathname).toBe('/users/me/settings/profile'));
  await screen.findByText('Контактная почта: new@example.test');

  await router.navigate('/products/quiet-garden');
  fireEvent.click(await screen.findByRole('button', { name: 'Добавить в корзину' }));
  fireEvent.click(screen.getByRole('link', { name: 'Перейти в корзину →' }));
  await waitFor(() => expect(screen.getByLabelText('Ваше имя').value).toBe('Надежда Иванова'));
  expect(screen.getByLabelText('Электронная почта').value).toBe('new@example.test');
  expect(screen.getByLabelText(/Телефон/).value).toBe('');
});

test('an account without Yandex contact data can enter required details at checkout', async () => {
  start('/products/quiet-garden', {
    customer: true,
    profile: { name: null, email: null, contact_email: null, phone_number: null },
  });
  fireEvent.click(await screen.findByRole('button', { name: 'Добавить в корзину' }));
  fireEvent.click(screen.getByRole('link', { name: 'Перейти в корзину →' }));
  await screen.findByRole('heading', { name: 'Корзина и заявка' });
  await waitFor(() => expect(screen.getByLabelText('Ваше имя').value).toBe(''));
  expect(screen.getByLabelText('Электронная почта').value).toBe('');
  expect(screen.getByLabelText('Ваше имя').required).toBe(true);
  expect(screen.getByLabelText('Электронная почта').required).toBe(true);
  expect(screen.getByLabelText(/Телефон/).required).toBe(false);
});

test('customer manages addresses in the profile and chooses one during checkout', async () => {
  const { calls, router } = start('/users/me', { customer: true });
  fireEvent.click(await screen.findByRole('button', { name: 'Добавить адрес' }));
  fireEvent.change(screen.getByLabelText('Город или населённый пункт'), {
    target: { value: 'Заречный' },
  });
  fireEvent.change(screen.getByLabelText('Улица'), { target: { value: 'Ленина' } });
  fireEvent.change(screen.getByLabelText('Дом и корпус'), { target: { value: '12' } });
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить адрес' }));
  await screen.findByText(/ул\. Ленина, д\. 12/);
  const created = calls.find((call) => call.endpoint === '/shop/me/addresses' && call.body);
  expect(created.body).toMatchObject({ city: 'Заречный', street: 'Ленина', house: '12' });

  fireEvent.click(screen.getByRole('button', { name: 'Изменить' }));
  fireEvent.change(screen.getByLabelText('Дом и корпус'), { target: { value: '14' } });
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить адрес' }));
  await screen.findByText(/ул\. Ленина, д\. 14/);
  expect(
    calls.some(
      (call) => call.endpoint.startsWith('/shop/me/addresses/') && call.body?.house === '14',
    ),
  ).toBe(true);

  await router.navigate('/products/quiet-garden');
  fireEvent.click(await screen.findByRole('button', { name: 'Добавить в корзину' }));
  fireEvent.click(screen.getByRole('link', { name: 'Перейти в корзину →' }));
  const select = await screen.findByRole('combobox', { name: 'Адрес доставки' });
  await waitFor(() => expect(within(select).getByText(/ул\. Ленина, д\. 14/)).toBeTruthy());
  fireEvent.change(select, {
    target: {
      value: select.querySelector('option[value]:not([value="later"]):not([value="new"])').value,
    },
  });
  fireEvent.change(screen.getByLabelText('Ваше имя'), { target: { value: 'Надежда' } });
  fireEvent.change(screen.getByLabelText('Электронная почта'), {
    target: { value: 'buyer@example.test' },
  });
  fireEvent.click(screen.getByRole('checkbox', { name: /Принимаю условия/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Отправить заявку мастеру' }));
  await screen.findByRole('heading', { name: 'Заявка отправлена' });
  const order = calls.find((call) => call.endpoint === '/shop/requests').body;
  expect(order.city).toBe('Заречный');
  expect(order.addressId).toBe(select.value);
  expect(order.deliveryAddress).toBeUndefined();
});

test('customer enters a new address at checkout and optionally saves it to the profile', async () => {
  const { calls, router } = start('/products/quiet-garden', { customer: true });
  fireEvent.click(await screen.findByRole('button', { name: 'Добавить в корзину' }));
  fireEvent.click(screen.getByRole('link', { name: 'Перейти в корзину →' }));
  fireEvent.change(await screen.findByRole('combobox', { name: 'Адрес доставки' }), {
    target: { value: 'new' },
  });
  fireEvent.change(screen.getByLabelText('Ваше имя'), { target: { value: 'Надежда' } });
  fireEvent.change(screen.getByLabelText('Электронная почта'), {
    target: { value: 'buyer@example.test' },
  });
  fireEvent.change(screen.getByLabelText('Город или населённый пункт'), {
    target: { value: 'Заречный' },
  });
  fireEvent.change(screen.getByLabelText('Улица'), { target: { value: 'Мира' } });
  fireEvent.change(screen.getByLabelText('Дом и корпус'), { target: { value: '7' } });
  fireEvent.click(screen.getByRole('checkbox', { name: /Сохранить адрес в профиле/ }));
  fireEvent.click(screen.getByRole('checkbox', { name: /Принимаю условия/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Отправить заявку мастеру' }));
  await screen.findByRole('heading', { name: 'Заявка отправлена' });
  const body = calls.find((call) => call.endpoint === '/shop/requests').body;
  expect(body.deliveryAddress).toMatchObject({ city: 'Заречный', street: 'Мира', house: '7' });
  expect(body.saveAddress).toBe(true);
  await router.navigate('/users/me');
  await screen.findByText(/ул\. Мира, д\. 7/);
  fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));
  fireEvent.click(screen.getByRole('button', { name: 'Да, удалить' }));
  await screen.findByText('Адресов пока нет.');
});

test('guest is asked to sign in before adding products, using favorites, or opening the cart', async () => {
  localStorage.setItem('ss-cart-v1', JSON.stringify([{ productId: id, quantity: 1 }]));
  const { calls, router } = start('/catalog');
  await screen.findByRole('heading', { name: product.name });
  await waitFor(() => expect(JSON.parse(localStorage.getItem('ss-cart-v1'))).toEqual([]));

  fireEvent.click(screen.getByRole('button', { name: 'Добавить в корзину' }));
  await screen.findByRole('dialog', { name: 'Рады видеть вас снова' });
  expect(router.state.location.pathname).toBe('/catalog');
  expect(router.state.location.search).toBe('?auth=login');
  expect(screen.queryByLabelText(/Количество в корзине/)).toBeNull();

  fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  fireEvent.click(screen.getByRole('button', { name: 'В избранное: ' + product.name }));
  await screen.findByRole('dialog', { name: 'Рады видеть вас снова' });
  expect(calls.some((call) => call.endpoint === '/shop/me/favorites')).toBe(false);
  expect(calls.some((call) => call.endpoint === '/shop/requests')).toBe(false);
});

test('guest is routed to sign in before the cart and cannot submit a request', async () => {
  const { calls, router } = start('/cart');
  await screen.findByRole('dialog', { name: 'Рады видеть вас снова' });
  expect(router.state.location.pathname).toBe('/auth/login');
  expect(screen.queryByRole('heading', { name: 'Корзина и заявка' })).toBeNull();
  expect(calls.some((call) => call.endpoint === '/shop/requests')).toBe(false);
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
