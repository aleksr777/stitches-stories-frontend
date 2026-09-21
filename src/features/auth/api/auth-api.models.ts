import type { AuthTokens } from '../../../shared/api/tokens';
import type { MessageResponse } from './auth-api.types';

export type VerificationRequestResult = MessageResponse & {
  retry_after: number;
  max_attempts: number;
};

export type BlockedAccountInfo = {
  blocked: true;
  blocked_reason: string | null;
  contact_email: string;
};

export type AdminLoginChallenge = VerificationRequestResult & {
  admin_confirmation_required: true;
  challenge_id: string;
  expires_in: number;
};

export type LoginResult = AuthTokens | BlockedAccountInfo | AdminLoginChallenge;

export const isBlockedAccountInfo = (value: LoginResult): value is BlockedAccountInfo => {
  return 'blocked' in value && value.blocked === true;
};

export const isAdminLoginChallenge = (value: LoginResult): value is AdminLoginChallenge => {
  return 'admin_confirmation_required' in value && value.admin_confirmation_required === true;
};
