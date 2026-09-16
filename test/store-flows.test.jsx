import { render, fireEvent, screen, waitFor, within } from '@testing-library/react';
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
const start = (path, { failOrder = false } = {}) => {
  let authenticated = false;
  let failed = false;
  const calls = [];
  const tokens = {
    access_token: 'test-token',
    access_token_expires: Math.floor(Date.now() / 1000) + 3600,
  };
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url, options = {}) => {
      const endpoint = new URL(url).pathname.replace(/^\/api/, '');
      const body = options.body ? JSON.parse(options.body) : null;
      calls.push({ endpoint, body, headers: options.headers });
      if (endpoint === '/auth/refresh-tokens') return response({ message: 'No session' }, 401);
      if (endpoint === '/shop/products') return response([product]);
      if (endpoint === '/legal/documents') return response(documents);
      if (endpoint === '/auth/registration/request')
        return response({ message: 'Code sent', retry_after: 60, max_attempts: 5 });
      if (endpoint === '/auth/registration/confirm') {
        authenticated = true;
        return response(tokens);
      }
      if (endpoint === '/auth/session')
        return new Response(null, { status: authenticated ? 204 : 401 });
      if (endpoint === '/users/me')
        return response({ id: 1, name: 'Надежда', email: 'shopper@example.test', role: 'user' });
      if (endpoint === '/shop/me/consents') return response({ marketing: false });
      if (['/shop/me/requests', '/shop/me/favorites', '/legal/me/events'].includes(endpoint))
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
  render(<RouterProvider router={router} />);
  return { calls, router };
};
beforeEach(() => localStorage.clear());

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

test('registration sends two distinct document references and opens the authenticated profile', async () => {
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
  await screen.findByRole('heading', { name: 'Здравствуйте, Надежда' });
  expect(router.state.location.pathname).toBe('/users/me');
  expect(screen.getByRole('link', { name: 'Мой профиль' }).className).toBe('avatar');
  const request = calls.find((c) => c.endpoint === '/auth/registration/request').body;
  expect(request.name).toBe('Надежда');
  expect(request.documents.map((d) => d.id).sort()).toEqual(['account-terms', 'pd-account']);
  expect(request.documents.every((d) => d.version === 'draft-v1' && d.sha256.length === 64)).toBe(
    true,
  );
  expect(request.documents.some((d) => d.id === 'ads-email')).toBe(false);
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
  expect(within(dialog).getByLabelText('Как вас зовут').value).toBe('Надежда');
  expect(
    within(dialog)
      .getAllByRole('checkbox')
      .every((c) => !c.checked),
  ).toBe(true);
  expect(document.body.style.overflow).toBe('hidden');
});
