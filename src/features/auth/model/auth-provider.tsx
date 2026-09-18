import { useCallback, useEffect, useState, type PropsWithChildren } from 'react';
import { refreshAuthTokens } from '../../../shared/api/api-client';
import { clearAuthTokens, subscribeAuthTokensCleared } from '../../../shared/api/tokens';
import {
  isBlockedAccountInfo,
  loginRequest,
  logoutRequest,
  passwordResetConfirmRequest,
  passwordResetRequest,
  registrationConfirmRequest,
  registrationRequest,
  registrationResendRequest,
} from '../api/auth-api';
import { getCurrentUserRequest, type UserRole } from '../../users/api/users-api';
import { AuthContext, type AuthContextValue, type LoginOutcome } from './auth-context';

const AuthProvider = ({ children }: PropsWithChildren) => {
  const [isAuth, setIsAuth] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    return subscribeAuthTokensCleared(() => {
      setIsAuth(false);
      setRole(null);
    });
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await refreshAuthTokens();
        const user = await getCurrentUserRequest();
        setRole(user.role);
        setIsAuth(true);
      } catch {
        clearAuthTokens(false);
        setIsAuth(false);
        setRole(null);
      } finally {
        setIsInitializing(false);
      }
    };

    void initializeAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginOutcome> => {
    const result = await loginRequest({ email, password });
    if (isBlockedAccountInfo(result)) {
      clearAuthTokens();
      setIsAuth(false);
      setRole(null);
      return { status: 'blocked', info: result };
    }

    const user = await getCurrentUserRequest();
    setRole(user.role);
    setIsAuth(true);
    return { status: 'authenticated' };
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

  const confirmRegistration = useCallback(async (code: string, email: string) => {
    await registrationConfirmRequest({ code, email });
    setRole('user');
    setIsAuth(true);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    return passwordResetRequest({ email });
  }, []);

  const confirmPasswordReset = useCallback(
    async (code: string, newPassword: string, email: string) => {
      await passwordResetConfirmRequest({ code, email, new_password: newPassword });
      const user = await getCurrentUserRequest();
      setRole(user.role);
      setIsAuth(true);
    },
    [],
  );

  const clearSession = useCallback(() => {
    clearAuthTokens();
    setIsAuth(false);
    setRole(null);
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setIsAuth(false);
    setRole(null);
  }, []);

  const value: AuthContextValue = {
    isAuth,
    isInitializing,
    role,
    login,
    requestRegistration,
    resendRegistration,
    confirmRegistration,
    requestPasswordReset,
    confirmPasswordReset,
    logout,
    clearSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
