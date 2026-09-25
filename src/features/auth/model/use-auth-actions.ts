import { useCallback } from 'react';
import { clearAuthTokens } from '../../../shared/api/tokens';
import { getCurrentUserRequest, type UserRole } from '../../users/api/users-api';
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
import type { LoginOutcome } from './auth-context';

type Params = {
  setAuthenticated: (role: UserRole) => void;
  setUnauthenticated: () => void;
  endSession: () => void;
};

export const useAuthActions = ({ setAuthenticated, setUnauthenticated, endSession }: Params) => {
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
  const resendAdminLogin = useCallback(
    (challengeId: string) => resendAdminLoginRequest(challengeId),
    [],
  );
  const requestRegistration = useCallback(
    (
      email: string,
      password: string,
      details?: { name: string; documents: { id: string; version: string; sha256: string }[] },
    ) => registrationRequest({ email, password, ...details }),
    [],
  );
  const resendRegistration = useCallback(
    (email: string) => registrationResendRequest({ email }),
    [],
  );
  const confirmRegistration = useCallback(
    async (code: string, email: string) => {
      await registrationConfirmRequest({ code, email });
      const user = await getCurrentUserRequest();
      setAuthenticated(user.role);
    },
    [setAuthenticated],
  );
  const finishSocialSession = useCallback(async () => {
    const user = await getCurrentUserRequest();
    setAuthenticated(user.role);
  }, [setAuthenticated]);
  const requestPasswordReset = useCallback((email: string) => passwordResetRequest({ email }), []);
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

  return {
    login,
    confirmAdminLogin,
    resendAdminLogin,
    requestRegistration,
    resendRegistration,
    confirmRegistration,
    finishSocialSession,
    requestPasswordReset,
    confirmPasswordReset,
    logout,
  };
};
