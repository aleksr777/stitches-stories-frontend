import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

vi.stubGlobal('BroadcastChannel', undefined);
const { clearAuthTokens } = await import('../src/shared/api/tokens');

afterEach(() => {
  cleanup();
  clearAuthTokens(false);
  vi.restoreAllMocks();
});
