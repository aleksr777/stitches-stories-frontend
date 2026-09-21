import type { Location } from 'react-router-dom';

type ReturnLocation = Pick<Location, 'pathname' | 'search' | 'hash'>;

type AuthRouteState = {
  from?: unknown;
  fromProtectedRoute?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isPublicReturnLocation = (value: unknown): value is ReturnLocation => {
  if (!isRecord(value) || typeof value.pathname !== 'string') return false;
  if (
    (value.search !== undefined && typeof value.search !== 'string') ||
    (value.hash !== undefined && typeof value.hash !== 'string')
  ) {
    return false;
  }
  return (
    value.pathname.startsWith('/') &&
    !value.pathname.startsWith('//') &&
    !value.pathname.startsWith('/auth/')
  );
};

const toPath = ({ pathname, search = '', hash = '' }: ReturnLocation): string => {
  return `${pathname}${search}${hash}`;
};

const readReturnLocation = (state: unknown): ReturnLocation | null => {
  if (!isRecord(state)) return null;
  const from = (state as AuthRouteState).from;
  if (!isPublicReturnLocation(from)) return null;
  const { pathname, search = '', hash = '' } = from;
  return { pathname, search, hash };
};

const isProtectedRouteReturn = (state: unknown): boolean => {
  return isRecord(state) && (state as AuthRouteState).fromProtectedRoute === true;
};

export const getAuthReturnTo = (state: unknown): string => {
  return toPath(readReturnLocation(state) ?? { pathname: '/', search: '', hash: '' });
};

export const getAuthModalCloseTo = (state: unknown): string => {
  return isProtectedRouteReturn(state) ? '/' : getAuthReturnTo(state);
};

export const createAuthReturnState = (
  location: Location,
): { from: ReturnLocation; fromProtectedRoute?: true } => {
  const from = readReturnLocation(location.state);
  if (from) {
    return {
      from,
      ...(isProtectedRouteReturn(location.state) ? { fromProtectedRoute: true } : {}),
    };
  }

  return {
    from: isPublicReturnLocation(location)
      ? { pathname: location.pathname, search: location.search, hash: location.hash }
      : { pathname: '/', search: '', hash: '' },
  };
};
