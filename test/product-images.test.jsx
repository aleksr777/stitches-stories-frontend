import { render, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, expect, test, vi } from 'vitest';
import App from '../src/app';
import AuthProvider from '../src/features/auth/model/auth-provider';

const id = '11111111-1111-4111-8111-111111111111';
const photo = '/shop/images/22222222-2222-4222-8222-222222222222';
const secondPhoto = '/shop/images/33333333-3333-4333-8333-333333333333';
const product = {
  id,
  slug: 'quiet-garden',
  name: 'Тихий сад',
  category: 'keychains',
  priceRub: 1200,
  description: 'Вышитый брелок из хлопка',
  materials: 'Хлопок',
  dimensions: '5 см',
  productionTime: 'По согласованию',
  images: [],
  stock: 1,
  featured: false,
  active: true,
  isDemo: false,
};
const response = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const start = (path = '/admin/shop', { images = [], failSave = false } = {}) => {
  let products = [{ ...product, images }];
  let failed = false;
  const saves = [];
  const calls = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url, options = {}) => {
      const endpoint = new URL(url).pathname.replace(/^\/api/, '');
      calls.push({ endpoint, options });
      if (endpoint === '/auth/refresh-tokens')
        return response({
          access_token: 'admin-test-token',
          access_token_expires: Math.floor(Date.now() / 1000) + 3600,
        });
      if (endpoint === '/auth/session') return new Response(null, { status: 204 });
      if (endpoint === '/users/me')
        return response({ id: 1, name: 'Мастер', email: 'admin@example.test', role: 'admin' });
      if (
        endpoint.startsWith('/shop/admin/products') &&
        ['POST', 'PATCH'].includes(options.method)
      ) {
        saves.push({
          body: options.body,
          headers: options.headers,
          endpoint,
          method: options.method,
        });
        if (failSave && !failed) {
          failed = true;
          return response({ message: 'Не удалось сохранить фотографии' }, 503);
        }
        const data = JSON.parse(options.body.get('data'));
        const saved = {
          ...data,
          id,
          images: data.images.map((p) => (p.startsWith('upload:') ? secondPhoto : p)),
        };
        products = [saved];
        return response(saved, options.method === 'POST' ? 201 : 200);
      }
      if (endpoint.startsWith('/shop/admin/images/'))
        return new Response(new Blob(['test-photo'], { type: 'image/png' }), {
          headers: { 'Content-Type': 'image/png' },
        });
      if (['/shop/products', '/shop/admin/products'].includes(endpoint)) return response(products);
      if (endpoint === '/shop/me/consents') return response({ marketing: false });
      if (
        [
          '/legal/documents',
          '/shop/admin/requests',
          '/shop/me/favorites',
          '/shop/me/requests',
          '/legal/me/events',
        ].includes(endpoint)
      )
        return response([]);
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
  return { saves, calls, router };
};
beforeEach(() => {
  localStorage.clear();
  let next = 0;
  vi.spyOn(URL, 'createObjectURL').mockImplementation(() => 'blob:test-photo-' + ++next);
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
});
const choose = (files) =>
  fireEvent.change(screen.getByLabelText('Добавить фотографии'), { target: { files } });
const file = (name = 'photo.png') => new File(['test-photo'], name, { type: 'image/png' });

test('administrator creates a product with previews, selects a cover and retries without losing files', async () => {
  const { saves } = start('/admin/shop', { failSave: true });
  fireEvent.click(await screen.findByRole('button', { name: 'Новое изделие' }));
  const dialog = screen.getByRole('dialog', { name: 'Новое изделие' });
  expect(dialog.className).toContain('product-editor-modal');
  expect(
    within(dialog).getByLabelText('Название').closest('.product-editor-details'),
  ).not.toBeNull();
  expect(
    within(dialog).getByLabelText('Показывать на главной').closest('.product-editor-options'),
  ).not.toBeNull();
  for (const [label, value] of [
    ['Название', 'Летний сад'],
    ['Адрес в каталоге', 'summer-garden'],
    ['Описание', 'Обложка с вышитым летним садом'],
    ['Материалы', 'Хлопок'],
    ['Размеры', '10 × 15 см'],
  ])
    fireEvent.change(within(dialog).getByLabelText(label), { target: { value } });
  const first = file('front.png');
  const second = file('detail.png');
  choose([first, second]);
  expect((await screen.findByAltText('Предпросмотр фотографии 1')).getAttribute('src')).toMatch(
    /^blob:/,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Сделать фото 2 основным' }));
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить изделие' }));
  await within(dialog).findByText('Не удалось сохранить фотографии');
  expect(within(dialog).getByLabelText('Название').value).toBe('Летний сад');
  expect(within(dialog).getAllByRole('img')).toHaveLength(2);
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить изделие' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(saves).toHaveLength(2);
  for (const save of saves) {
    expect(save.body).toBeInstanceOf(FormData);
    expect(save.body.getAll('files').map((f) => f.name)).toEqual(['detail.png', 'front.png']);
    expect(JSON.parse(save.body.get('data'))).toMatchObject({
      name: 'Летний сад',
      images: ['upload:0', 'upload:1'],
      active: false,
    });
    expect(save.headers['Content-Type']).toBeUndefined();
    expect(save.headers.Authorization).toBe('Bearer admin-test-token');
  }
  expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
});

test('editing previews stored images with authentication and only removes photos when saved', async () => {
  const { saves, calls } = start('/admin/shop', { images: [photo, secondPhoto] });
  fireEvent.click(await screen.findByRole('button', { name: 'Изменить' }));
  await screen.findByAltText('Предпросмотр фотографии 1');
  expect(
    calls.find((c) => c.endpoint === photo.replace('/images/', '/admin/images/')).options.headers
      .Authorization,
  ).toBe('Bearer admin-test-token');
  fireEvent.click(screen.getByRole('button', { name: 'Убрать фото 1' }));
  expect(saves).toHaveLength(0);
  choose([file('replacement.png')]);
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить изделие' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(saves[0].method).toBe('PATCH');
  expect(saves[0].endpoint).toBe('/shop/admin/products/' + id);
  expect(JSON.parse(saves[0].body.get('data')).images).toEqual([secondPhoto, 'upload:0']);
  expect(saves[0].body.getAll('files')).toHaveLength(1);
});

test('invalid selections stay out of the draft and closing a draft uploads nothing', async () => {
  const { saves } = start();
  fireEvent.click(await screen.findByRole('button', { name: 'Новое изделие' }));
  choose([new File(['<svg/>'], 'not-a-photo.svg', { type: 'image/svg+xml' })]);
  expect(screen.getByRole('alert').textContent).toContain('JPEG, PNG или WebP');
  choose([new File([new Uint8Array(8 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' })]);
  expect(screen.getByRole('alert').textContent).toContain('не больше 8 МБ');
  choose(Array.from({ length: 9 }, () => file()));
  expect(screen.getByRole('alert').textContent).toContain('до 8 фотографий');
  choose([file()]);
  await screen.findByAltText('Предпросмотр фотографии 1');
  fireEvent.click(screen.getByRole('button', { name: 'Закрыть окно' }));
  expect(saves).toHaveLength(0);
  expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
});

test('the product gallery loads server URLs, changes photos and handles unavailable images', async () => {
  start('/products/quiet-garden', { images: [photo, secondPhoto] });
  const main = await screen.findByRole('img', { name: product.name });
  expect(main.getAttribute('src')).toMatch(new RegExp('/api' + photo + '$'));
  fireEvent.click(screen.getByRole('button', { name: 'Показать фотографию 2' }));
  expect(main.getAttribute('src')).toMatch(new RegExp('/api' + secondPhoto + '$'));
  fireEvent.error(main);
  expect(screen.getByText('Фотография временно недоступна')).toBeTruthy();
});
