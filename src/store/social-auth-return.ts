import type { Location } from 'react-router-dom';
import {
  createAuthReturnState,
  getAuthReturnTo,
} from '../features/auth/model/auth-return-location';

const key = 'stitches-social-auth-return';

export const rememberSocialAuthReturn = (location: Location) => {
  const pathname = createAuthReturnState(location).from.pathname;
  try {
    sessionStorage.setItem(key, pathname);
  } catch {
    // The OAuth flow still works when browser storage is unavailable.
  }
};

export const clearSocialAuthReturn = () => {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // No stored destination to clear.
  }
};

export const takeSocialAuthReturn = () => {
  let pathname: string | null = null;
  try {
    pathname = sessionStorage.getItem(key);
  } catch {
    return '/users/me';
  }
  clearSocialAuthReturn();
  if (!pathname || pathname.includes('\\') || pathname.startsWith('//')) return '/users/me';
  const destination = getAuthReturnTo({ from: { pathname } });
  return destination === '/' && pathname !== '/' ? '/users/me' : destination;
};
