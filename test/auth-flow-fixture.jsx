import { render, fireEvent, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { vi } from 'vitest';
import App from '../src/app';
import AuthProvider from '../src/features/auth/model/auth-provider';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const startApp = (path, { signedIn = false, rejectCode = false } = {}) => {
  let accessToken = 'existing-access-token';
  let email = 'user@example.com';
  const calls = [];
  const tokens = () => ({
    access_token: accessToken,
    access_token_expires: Math.floor(Date.now() / 1000) + 3600,
  });

  vi.stubGlobal(
    'fetch',
    vi.fn(async (url, options) => {
      const endpoint = new URL(url).pathname.replace(/^\/api/, '');
      const body = options.body ? JSON.parse(options.body) : null;
      calls.push({ endpoint, body, headers: options.headers, credentials: options.credentials });
      if (endpoint === '/auth/refresh-tokens') {
        return signedIn ? json(tokens()) : json({ message: 'No session' }, 401);
      }
      if (/^\/auth\/(registration|password-reset)\/request$/.test(endpoint)) {
        return json({ message: 'Code sent', retry_after: 60, max_attempts: 5 });
      }
      if (/^\/auth\/(registration|password-reset)\/confirm$/.test(endpoint)) {
        if (rejectCode) return json({ message: 'Invalid confirmation code' }, 401);
        signedIn = true;
        accessToken = 'new-access-token';
        return json(tokens());
      }
      if (!signedIn || options.headers?.Authorization !== `Bearer ${accessToken}`) {
        return json({ message: 'Invalid session' }, 401);
      }
      if (endpoint === '/auth/session') return new Response(null, { status: 204 });
      if (endpoint === '/users/me') {
        return json({ id: 7, email, nickname: 'tester', name: null, age: null, role: 'user' });
      }
      if (endpoint === '/users/me/email/update/status') {
        return json({ locked: false, retry_after: 0, max_attempts: 5, attempts_remaining: 5 });
      }
      if (endpoint === '/users/me/email/update/request') return json({ message: 'Code sent' });
      if (endpoint === '/users/me/email/update/confirm') {
        if (rejectCode) return json({ message: 'Invalid confirmation code' }, 401);
        email = 'new@example.com';
        return json({ message: 'Email changed successfully.' });
      }
      throw new Error(`Unexpected API request: ${endpoint}`);
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
  return { router, calls };
};

export const fill = (label, value) => {
  fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value } });
};

export const submit = (name) => {
  fireEvent.submit(screen.getByRole('button', { name, exact: true }).closest('form'));
};
