export type AuthTokens = {
  access_token: string;
  access_token_expires: number | null;
};

type AuthTokensClearedListener = () => void;

type AuthBroadcastMessage = {
  type: 'session-cleared';
};

let accessToken: string | null = null;
let accessTokenExpires: number | null = null;
const clearedListeners = new Set<AuthTokensClearedListener>();
const authChannel =
  typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('auth-session');

const notifyCleared = (): void => {
  clearedListeners.forEach((listener) => listener());
};

const clearLocalTokens = (): void => {
  accessToken = null;
  accessTokenExpires = null;
  notifyCleared();
};

if (authChannel) {
  authChannel.onmessage = (event: MessageEvent<AuthBroadcastMessage>) => {
    if (event.data?.type === 'session-cleared') clearLocalTokens();
  };
}

export const setAuthTokens = (tokens: AuthTokens): void => {
  accessToken = tokens.access_token;
  accessTokenExpires = tokens.access_token_expires;
};

export const clearAuthTokens = (broadcast = true): void => {
  clearLocalTokens();
  if (broadcast) {
    authChannel?.postMessage({ type: 'session-cleared' } satisfies AuthBroadcastMessage);
  }
};

export const subscribeAuthTokensCleared = (listener: AuthTokensClearedListener): (() => void) => {
  clearedListeners.add(listener);
  return () => clearedListeners.delete(listener);
};

export const getAccessToken = (): string | null => accessToken;

export const isAccessTokenExpiringSoon = (thresholdSeconds = 30): boolean => {
  if (!accessToken || accessTokenExpires === null) return true;
  return accessTokenExpires <= Math.floor(Date.now() / 1000) + thresholdSeconds;
};
