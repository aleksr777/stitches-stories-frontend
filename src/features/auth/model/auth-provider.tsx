import { useCallback, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { refreshAuthTokens } from '../../../shared/api/api-client';
import { clearAuthTokens, subscribeAuthTokensCleared } from '../../../shared/api/tokens';
import {
  confirmAdminLoginRequest,
  isAdminLoginChallenge,
  isBlockedAccountInfo,
  loginRequest,
  logoutRequest,
  passwordResetConfirmRequest,
  passwordResetRequest,
  registrationConfirmRequest,
  registrationRequest,
  registrationResendRequest,
  resendAdminLoginRequest,
} from '../api/auth-api';
import { getCurrentUserRequest, type UserRole } from '../../users/api/users-api';
import { AuthContext, type AuthContextValue, type LoginOutcome } from './auth-context';

const AuthProvider = ({ children }: PropsWithChildren) => {
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

  useEffect(() => {
    if (isEndingSession && !isAuth && pathname === '/') {
      isEndingSessionRef.current = false;
      setIsEndingSession(false);
    }
  }, [isAuth, isEndingSession, pathname]);

  const endSession = useCallback(() => {
    if (isEndingSessionRef.current) return;
    isEndingSessionRef.current = true;
    setIsEndingSession(true);
    setUnauthenticated();
    clearAuthTokens();
    navigate('/', { replace: true });
  }, [navigate, setUnauthenticated]);

  useEffect(() => {
    return subscribeAuthTokensCleared(() => {
      if (isAuthenticatedRef.current) {
        endSession();
        return;
      }
      setUnauthenticated();
    });
  }, [endSession, setUnauthenticated]);

  useEffect(() => {
    const initializeAuth = async () => {
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

    void initializeAuth();
  }, [setAuthenticated, setUnauthenticated]);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginOutcome> => {
      const result = await loginRequest({ email, password });
      if (isBlockedAccountInfo(result)) {
        clearAuthTokens();
        setUnauthenticated();
        return { status: 'blocked', info: result };
      }
      if (isAdminLoginChallenge(result)) {
        clearAuthTokens();
        setUnauthenticated();
        return { status: 'admin-confirmation', challenge: result };
      }

      const user = await getCurrentUserRequest();
      setAuthenticated(user.role);
      return { status: 'authenticated' };
    },
    [setAuthenticated, setUnauthenticated],
  );

  const confirmAdminLogin = useCallback(
    async (challengeId: string, code: string) => {
      await confirmAdminLoginRequest(challengeId, code);
      const user = await getCurrentUserRequest();
      setAuthenticated(user.role);
    },
    [setAuthenticated],
  );

  const resendAdminLogin = useCallback((challengeId: string) => {
    return resendAdminLoginRequest(challengeId);
  }, []);

  const requestRegistration = useCallback(
    async (
      email: string,
      password: string,
      details?: { name: string; documents: { id: string; version: string; sha256: string }[] },
    ) => {
      return registrationRequest({ email, password, ...details });
    },
    [],
  );

  const resendRegistration = useCallback(async (email: string) => {
    return registrationResendRequest({ email });
  }, []);

  const confirmRegistration = useCallback(
    async (code: string, email: string) => {
      await registrationConfirmRequest({ code, email });
      const user = await getCurrentUserRequest();
      setAuthenticated(user.role);
    },
    [setAuthenticated],
  );

  const requestPasswordReset = useCallback(async (email: string) => {
    return passwordResetRequest({ email });
  }, []);

  const confirmPasswordReset = useCallback(
    async (code: string, newPassword: string, email: string) => {
      await passwordResetConfirmRequest({ code, email, new_password: newPassword });
      const user = await getCurrentUserRequest();
      setAuthenticated(user.role);
    },
    [setAuthenticated],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      endSession();
    }
  }, [endSession]);

  const value: AuthContextValue = {
    isAuth,
    isInitializing,
    isEndingSession,
    role,
    login,
    confirmAdminLogin,
    resendAdminLogin,
    requestRegistration,
    resendRegistration,
    confirmRegistration,
    requestPasswordReset,
    confirmPasswordReset,
    logout,
    endSession,
    clearSession: endSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
