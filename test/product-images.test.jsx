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
const start = (
  path = '/admin/shop',
  { images = [], products: initialProducts, failSave = false } = {},
) => {
  let products = initialProducts ?? [{ ...product, images }];
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
      if (endpoint === '/shop/admin/products/' + id && options.method === 'DELETE') {
        products = [];
        return response({ deleted: true });
      }
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
  expect(within(dialog).queryByLabelText('Адрес в каталоге')).toBeNull();
  expect(within(dialog).getByLabelText('Название').required).toBe(true);
  expect(within(dialog).getByLabelText('Цена, ₽').required).toBe(true);
  expect(within(dialog).getByLabelText('Описание').required).toBe(false);
  expect(within(dialog).getByLabelText('Цена, ₽').value).toBe('0');
  expect(within(dialog).getByLabelText('Добавить фотографии').getAttribute('aria-required')).toBe(
    'true',
  );
  fireEvent.change(within(dialog).getByLabelText('Название'), { target: { value: 'Летний сад' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Сохранить изделие' }));
  await within(dialog).findByText('Укажите цену изделия больше 0 ₽.');
  expect(saves).toHaveLength(0);
  fireEvent.change(within(dialog).getByLabelText('Цена, ₽'), { target: { value: '1200' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Сохранить изделие' }));
  await within(dialog).findByText('Добавьте хотя бы одну фотографию изделия.');
  expect(saves).toHaveLength(0);
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
      slug: expect.stringMatching(/^letniy-sad-[a-z0-9]{8}$/),
      name: 'Летний сад',
      priceRub: 1200,
      description: 'Описание изделия уточняется.',
      materials: 'Материалы уточняются.',
      dimensions: 'Размеры уточняются.',
      productionTime: 'По согласованию',
      stock: 1,
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

test('administrator confirms removal before deleting the product and refreshes the empty list', async () => {
  const { calls } = start();
  fireEvent.click(await screen.findByRole('button', { name: 'Удалить изделие: Тихий сад' }));
  const dialog = screen.getByRole('dialog', { name: 'Удалить изделие?' });
  expect(within(dialog).getByText(/будет удалено из магазина вместе с фотографиями/)).toBeTruthy();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Удалить изделие', exact: true }));
  await screen.findByText('Изделий пока нет. Создайте первую историю для витрины.');
  expect(
    calls.filter(
      (call) => call.endpoint === '/shop/admin/products/' + id && call.options.method === 'DELETE',
    ),
  ).toHaveLength(1);
});

test('catalog gently explains when the collection is empty', async () => {
  start('/catalog', { products: [] });
  expect(await screen.findByRole('heading', { name: 'Коллекция скоро появится' })).toBeTruthy();
  expect(screen.getByText(/Мы бережно готовим новые изделия с вышивкой/)).toBeTruthy();
  expect(screen.queryByLabelText('Поиск изделия')).toBeNull();
});

test('administrator does not use favorites or customer consent controls', async () => {
  const { calls } = start('/catalog');
  const favorite = await screen.findByRole('button', {
    name: 'Избранное недоступно владельцу: Тихий сад',
  });
  expect(favorite.disabled).toBe(true);
  expect(
    screen.getByRole('button', { name: 'Избранное недоступно владельцу магазина' }).disabled,
  ).toBe(true);
  fireEvent.click(screen.getByRole('link', { name: 'Мой профиль' }));
  await screen.findByRole('heading', { name: 'Здравствуйте, Мастер' });
  expect(screen.getByRole('heading', { name: 'Управление магазином' })).toBeTruthy();
  expect(screen.queryByRole('heading', { name: 'Мои согласия' })).toBeNull();
  expect(screen.queryByRole('link', { name: 'Избранное' })).toBeNull();
  expect(calls.some((call) => call.endpoint === '/shop/me/favorites')).toBe(false);
  expect(calls.some((call) => call.endpoint === '/shop/me/consents')).toBe(false);
  expect(calls.some((call) => call.endpoint === '/legal/me/events')).toBe(false);
});

test('administrator cannot add an item to the cart or send a purchase request', async () => {
  localStorage.setItem('ss-cart-v1', JSON.stringify([{ productId: id, quantity: 1 }]));
  const { calls } = start('/cart');
  const submit = await screen.findByRole('button', { name: 'Заявка недоступна владельцу' });
  expect(submit.disabled).toBe(true);
  expect(screen.queryByRole('checkbox', { name: /Принимаю условия/ })).toBeNull();
  expect(screen.getByText(/Для владельца не требуются согласия покупателя/)).toBeTruthy();
  fireEvent.click(submit);
  expect(calls.some((call) => call.endpoint === '/shop/requests')).toBe(false);
});

test('administrator sees the product purchase action as unavailable', async () => {
  start('/products/quiet-garden');
  const add = await screen.findByRole('button', { name: 'Недоступно владельцу' });
  expect(add.disabled).toBe(true);
  expect(
    screen.getByText(/покупательские заявки и избранное для этого профиля недоступны/),
  ).toBeTruthy();
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
