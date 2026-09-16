import { isSessionInvalidStatus, shouldRefreshAfterResponse } from './auth-policy.mjs';
import { ApiError, getErrorMessage } from './api-error';
import { DEFAULT_TIMEOUT_MS, fetchWithTimeout } from './fetch-with-timeout';
import {
  clearAuthTokens,
  getAccessToken,
  isAccessTokenExpiringSoon,
  setAuthTokens,
  type AuthTokens,
} from './tokens';

export { getAttemptsRemaining, getRetryAfterSeconds, isVerificationLocked } from './api-error';
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5174/api';
const REFRESH_LOCK_NAME = 'auth-refresh-token';
type AuthMode = 'access' | 'none';

type ApiRequestOptions = Omit<RequestInit, 'headers'> & {
  auth?: AuthMode;
  headers?: Record<string, string>;
  retry?: boolean;
  timeoutMs?: number;
};

const parseResponseBody = async (response: Response): Promise<unknown> => {
  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) return response.json();
  const text = await response.text();
  return text || null;
};

let refreshPromise: Promise<AuthTokens> | null = null;

const performRefreshAuthTokens = async (): Promise<AuthTokens> => {
  const response = await fetchWithTimeout(`${API_URL}/auth/refresh-tokens`, {
    method: 'POST',
    credentials: 'include',
  });
  const payload = await parseResponseBody(response);

  if (!response.ok) {
    if (isSessionInvalidStatus(response.status)) clearAuthTokens();
    throw new ApiError(response.status, getErrorMessage(payload), payload);
  }

  const tokens = payload as AuthTokens;
  setAuthTokens(tokens);
  return tokens;
};

const performSerializedRefresh = (): Promise<AuthTokens> => {
  if (typeof navigator === 'undefined' || !navigator.locks) {
    return performRefreshAuthTokens();
  }

  return navigator.locks.request(REFRESH_LOCK_NAME, () => performRefreshAuthTokens());
};

export const refreshAuthTokens = (): Promise<AuthTokens> => {
  if (!refreshPromise) {
    refreshPromise = performSerializedRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

export const apiRequest = async <T>(path: string, options: ApiRequestOptions = {}): Promise<T> => {
  const {
    auth = 'access',
    retry = true,
    headers = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
    ...rest
  } = options;

  if (auth === 'access' && isAccessTokenExpiringSoon()) await refreshAuthTokens();

  const accessToken = getAccessToken();
  const response = await fetchWithTimeout(
    `${API_URL}${path}`,
    {
      ...rest,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...(auth === 'access' && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    },
    timeoutMs,
  );
  const payload = await parseResponseBody(response);

  if (shouldRefreshAfterResponse({ status: response.status, auth, retry })) {
    await refreshAuthTokens();
    return apiRequest<T>(path, { ...options, retry: false });
  }

  if (!response.ok) throw new ApiError(response.status, getErrorMessage(payload), payload);
  return payload as T;
};
