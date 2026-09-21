import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { refreshAuthTokens } from '../../../shared/api/api-client';
import { clearAuthTokens, subscribeAuthTokensCleared } from '../../../shared/api/tokens';
import { getCurrentUserRequest, type UserRole } from '../../users/api/users-api';

export const useAuthSession = () => {
  const [isAuth, setIsAuth] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const isAuthenticatedRef = useRef(false);
  const isEndingSessionRef = useRef(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const setAuthenticated = useCallback((nextRole: UserRole) => {
    isAuthenticatedRef.current = true;
    setRole(nextRole);
    setIsAuth(true);
  }, []);
  const setUnauthenticated = useCallback(() => {
    isAuthenticatedRef.current = false;
    setRole(null);
    setIsAuth(false);
  }, []);
  const endSession = useCallback(() => {
    if (isEndingSessionRef.current) return;
    isEndingSessionRef.current = true;
    setIsEndingSession(true);
    setUnauthenticated();
    clearAuthTokens();
    navigate('/', { replace: true });
  }, [navigate, setUnauthenticated]);

  useEffect(() => {
    if (isEndingSession && !isAuth && pathname === '/') {
      isEndingSessionRef.current = false;
      setIsEndingSession(false);
    }
  }, [isAuth, isEndingSession, pathname]);

  useEffect(
    () =>
      subscribeAuthTokensCleared(() => {
        if (isAuthenticatedRef.current) {
          endSession();
          return;
        }
        setUnauthenticated();
      }),
    [endSession, setUnauthenticated],
  );

  useEffect(() => {
    const initialize = async () => {
      try {
        await refreshAuthTokens();
        const user = await getCurrentUserRequest();
        setAuthenticated(user.role);
      } catch {
        clearAuthTokens(false);
        setUnauthenticated();
      } finally {
        setIsInitializing(false);
      }
    };
    void initialize();
  }, [setAuthenticated, setUnauthenticated]);

  return {
    isAuth,
    isInitializing,
    isEndingSession,
    role,
    setAuthenticated,
    setUnauthenticated,
    endSession,
  };
};
