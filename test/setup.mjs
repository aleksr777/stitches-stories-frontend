import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

vi.stubGlobal('BroadcastChannel', undefined);
const { clearAuthTokens } = await import('../src/shared/api/tokens');

afterEach(() => {
  cleanup();
  clearAuthTokens(false);
  vi.restoreAllMocks();
});

HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute('open', '');
};
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute('open');
};
