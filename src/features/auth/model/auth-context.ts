import { createContext } from 'react';
import type {
  AdminLoginChallenge,
  BlockedAccountInfo,
  VerificationRequestResult,
} from '../api/auth-api';
import type { UserRole } from '../../users/api/users-api';

export type LoginOutcome =
  | { status: 'authenticated' }
  | { status: 'admin-confirmation'; challenge: AdminLoginChallenge }
  | { status: 'blocked'; info: BlockedAccountInfo };

export type AuthContextValue = {
  isAuth: boolean;
  isInitializing: boolean;
  isEndingSession: boolean;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<LoginOutcome>;
  confirmAdminLogin: (challengeId: string, code: string) => Promise<void>;
  resendAdminLogin: (challengeId: string) => Promise<AdminLoginChallenge>;
  requestRegistration: (
    email: string,
    password: string,
    details?: { name: string; documents: { id: string; version: string; sha256: string }[] },
  ) => Promise<VerificationRequestResult>;
  resendRegistration: (email: string) => Promise<VerificationRequestResult>;
  confirmRegistration: (code: string, email: string) => Promise<void>;
  finishSocialSession: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<VerificationRequestResult>;
  confirmPasswordReset: (code: string, newPassword: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
  endSession: () => void;
  clearSession: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
