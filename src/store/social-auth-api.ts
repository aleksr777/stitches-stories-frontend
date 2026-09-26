import { apiRequest } from '../shared/api/api-client';
import { setAuthTokens, type AuthTokens } from '../shared/api/tokens';

export type SocialProvider = 'yandex' | 'vk';
export type SocialPending = { provider: SocialProvider; registered: boolean };
export const socialNames = { yandex: 'Яндекс ID', vk: 'VK ID' };
export const socialRequest = <T>(path: string, body?: unknown) =>
  apiRequest<T>('/auth/social/' + path, {
    auth: 'none',
    method: body === undefined ? 'GET' : 'POST',
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

export const finishSocialLogin = async (
  path: 'login' | 'link' | 'registration/yandex' | 'registration/vk',
  body: unknown,
) => {
  const tokens = await socialRequest<AuthTokens>(path, body);
  setAuthTokens(tokens);
};
