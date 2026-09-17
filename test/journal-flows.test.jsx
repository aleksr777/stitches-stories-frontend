import { render, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, expect, test, vi } from 'vitest';
import App from '../src/app';
import AuthProvider from '../src/features/auth/model/auth-provider';

const response = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const sample = () => ({
  id: '11111111-1111-4111-8111-111111111111',
  revision: 1,
  text: 'Новая вышивка из мастерской',
  sourceUrl: 'https://vk.com/wall-123_11',
  sourcePublishedAt: '2026-01-02T12:00:00Z',
  publishedAt: null,
  status: 'pending',
  photos: [{ id: '22222222-2222-4222-8222-222222222222', width: 600, height: 800 }],
  otherAttachments: ['video'],
});
const start = (
  path,
  { role = 'admin', tokenConfigured = true, existing = false, approvalFails = false } = {},
) => {
  let post = existing ? { ...sample(), status: 'published' } : null;
  const calls = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url, options = {}) => {
      const parsed = new URL(url);
      const endpoint = parsed.pathname.replace(/^\/api/, '');
      const body = options.body ? JSON.parse(options.body) : null;
      calls.push({ endpoint, method: options.method ?? 'GET', body, headers: options.headers });
      if (endpoint === '/auth/refresh-tokens')
        return role
          ? response({
              access_token: 'test-journal-access-token',
              access_token_expires: Math.floor(Date.now() / 1000) + 3600,
            })
          : response({}, 401);
      if (endpoint === '/auth/session') return new Response(null, { status: role ? 204 : 401 });
      if (endpoint === '/users/me') return response({ id: 42, role, email: 'owner@example.test' });
      if (['/shop/products', '/legal/documents', '/shop/me/favorites'].includes(endpoint))
        return response([]);
      if (endpoint === '/journal/admin/config')
        return response({ pageUrl: 'https://vk.com/craft_studio', tokenConfigured });
      if (endpoint === '/journal/admin/import') {
        post ??= sample();
        return response({ added: 1, existing: 0, skipped: 0, nextOffset: null });
      }
      if (endpoint === '/journal/admin/posts' || endpoint === '/journal/posts') {
        const status =
          endpoint === '/journal/posts' ? 'published' : parsed.searchParams.get('status');
        const items = post?.status === status ? [post] : [];
        return response({ items, total: items.length, nextOffset: null });
      }
      if (endpoint.includes('/photos/'))
        return new Response(new Uint8Array([255, 216, 255]), {
          headers: { 'Content-Type': 'image/jpeg' },
        });
      if (endpoint === '/journal/admin/posts/' + sample().id && options.method === 'PATCH') {
        if (approvalFails)
          return response({ message: 'Публикация уже изменена. Обновите список.' }, 409);
        post = { ...post, status: body.status, revision: post.revision + 1 };
        return response(post);
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
beforeEach(() => {
  localStorage.clear();
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-journal-photo');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
});

test('import stays in the review queue until the administrator explicitly publishes', async () => {
  const { calls } = start('/admin/journal');
  const importButton = await screen.findByRole('button', { name: 'Получить новые посты' });
  await waitFor(() => expect(importButton.disabled).toBe(false));
  fireEvent.click(importButton);
  await screen.findByText(/На сайте ничего не опубликовано/);
  expect(calls.filter((c) => c.method === 'PATCH')).toHaveLength(0);
  fireEvent.click(await screen.findByRole('button', { name: 'Просмотреть и одобрить' }));
  const dialog = await screen.findByRole('dialog', { name: 'Проверка публикации' });
  const photo = await within(dialog).findByRole('img', { name: 'Фотография 1 для проверки' });
  expect(photo.getAttribute('src')).toBe('blob:test-journal-photo');
  const photoCall = calls.find((c) => c.endpoint.includes('/photos/'));
  expect(photoCall.headers.Authorization).toBe('Bearer test-journal-access-token');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Опубликовать на сайте' }));
  await screen.findByText('Публикация появилась на сайте.');
  const change = calls.find((c) => c.method === 'PATCH');
  expect(change.body).toEqual({ revision: 1, status: 'published' });
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-journal-photo');
  fireEvent.click(screen.getByRole('button', { name: 'На сайте' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Управлять публикацией' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Снять с публикации' }));
  await screen.findByText('Пост снят с сайта и возвращён на проверку.');
  expect(calls.filter((c) => c.method === 'PATCH')[1].body).toEqual({
    revision: 2,
    status: 'pending',
  });
});

test('the public journal shows the copied content and links without embedding VK widgets', async () => {
  const { calls } = start('/journal', { role: null, existing: true });
  await screen.findByText('Новая вышивка из мастерской');
  const photo = screen.getByRole('img', { name: /Фотография 1 к публикации/ });
  expect(photo.getAttribute('src')).toContain('/api/journal/posts/');
  expect(screen.getByRole('link', { name: 'Оригинал в VK ↗' }).getAttribute('href')).toBe(
    'https://vk.com/wall-123_11',
  );
  expect(calls.some((c) => c.endpoint.startsWith('/journal/admin'))).toBe(false);
  expect(document.querySelectorAll('iframe')).toHaveLength(0);
});

test('ordinary users cannot open the moderation page', async () => {
  const { calls } = start('/admin/journal', { role: 'user' });
  await screen.findByRole('heading', { name: 'Доступ ограничен' });
  expect(calls.some((c) => c.endpoint.startsWith('/journal/admin'))).toBe(false);
});

test('a missing VK token disables import', async () => {
  start('/admin/journal', { tokenConfigured: false });
  await screen.findByText(/Для подключения добавьте VK_ACCESS_TOKEN/);
  expect(screen.getByRole('button', { name: 'Получить новые посты' }).disabled).toBe(true);
});

test('a stale approval keeps the post and error in the review dialog', async () => {
  start('/admin/journal', { approvalFails: true });
  const button = await screen.findByRole('button', { name: 'Получить новые посты' });
  await waitFor(() => expect(button.disabled).toBe(false));
  fireEvent.click(button);
  fireEvent.click(await screen.findByRole('button', { name: 'Просмотреть и одобрить' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Опубликовать на сайте' }));
  await screen.findByText('Публикация уже изменена. Обновите список.');
  expect(screen.getByRole('dialog', { name: 'Проверка публикации' })).toBeTruthy();
  expect(screen.queryByText('Публикация появилась на сайте.')).toBeNull();
});
