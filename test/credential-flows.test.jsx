import { screen, waitFor } from '@testing-library/react';
import { expect, test } from 'vitest';
import { getAccessToken } from '../src/shared/api/tokens';
import { fill, startApp, submit } from './auth-flow-fixture';

test('registration confirms the code, signs in, and opens the protected profile', async () => {
  const { router, calls } = startApp('/auth/registration');
  await screen.findByLabelText('Email', { exact: true });
  fill('Email', 'user@example.com');
  fill('Password', 'password12345');
  fill('Repeat password', 'password12345');
  submit('Create account');
  await screen.findByLabelText('Confirmation code');
  fill('Confirmation code', '123456');
  submit('Confirm registration');

  await screen.findByRole('heading', { name: 'My profile' });
  expect(router.state.location.pathname).toBe('/users/me');
  expect(getAccessToken()).toBe('new-access-token');
  expect(calls.find((call) => call.endpoint === '/auth/registration/confirm').body).toEqual({
    code: '123456',
    email: 'user@example.com',
  });
});

test('the registration page also redirects an authenticated user to the profile', async () => {
  const { router } = startApp('/auth/registration', { signedIn: true });
  await screen.findByRole('heading', { name: 'My profile' });
  expect(router.state.location.pathname).toBe('/users/me');
});

test('password recovery installs the new credentials before opening the profile', async () => {
  const { router, calls } = startApp('/auth/password-reset');
  await screen.findByLabelText('Email', { exact: true });
  fill('Email', 'user@example.com');
  submit('Send reset code');
  await screen.findByLabelText('Reset code');
  fill('Reset code', '123456');
  fill('New password', 'new-password123');
  fill('Repeat new password', 'new-password123');
  submit('Reset password');

  await screen.findByRole('heading', { name: 'My profile' });
  expect(router.state.location.pathname).toBe('/users/me');
  expect(getAccessToken()).toBe('new-access-token');
  expect(calls.filter((call) => call.endpoint === '/auth/session')).toEqual([
    expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer new-access-token' }),
      credentials: 'include',
    }),
  ]);
});

test('a rejected recovery code does not authenticate or redirect the user', async () => {
  const { router } = startApp('/auth/password-reset', { rejectCode: true });
  await screen.findByLabelText('Email', { exact: true });
  fill('Email', 'user@example.com');
  submit('Send reset code');
  await screen.findByLabelText('Reset code');
  fill('Reset code', '654321');
  fill('New password', 'new-password123');
  fill('Repeat new password', 'new-password123');
  submit('Reset password');

  await screen.findByText('Invalid confirmation code');
  expect(router.state.location.pathname).toBe('/auth/password-reset');
  expect(getAccessToken()).toBeNull();
});

test.each([false, true])(
  'email change preserves auth, including invalid code: %s',
  async (rejectCode) => {
    const { router, calls } = startApp('/users/me/settings/email', { signedIn: true, rejectCode });
    await screen.findByLabelText('New email');
    fill('New email', 'new@example.com');
    fill('Current password', 'password12345');
    submit('Continue');
    await screen.findByLabelText('Confirmation code');
    fill('Confirmation code', '123456');
    submit('Change email');

    if (rejectCode) {
      await screen.findByText('Invalid confirmation code');
      expect(router.state.location.pathname).toBe('/users/me/settings/email');
    } else {
      await screen.findByRole('heading', { name: 'My profile' });
      await screen.findByText('Email: new@example.com');
      expect(router.state.location.pathname).toBe('/users/me');
    }
    await waitFor(() => expect(getAccessToken()).toBe('existing-access-token'));
    expect(calls.filter((call) => call.endpoint === '/auth/refresh-tokens')).toHaveLength(1);
  },
);
