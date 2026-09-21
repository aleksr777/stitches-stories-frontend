import { apiRequest } from '../../../shared/api/api-client';
import { setAuthTokens, type AuthTokens } from '../../../shared/api/tokens';
import type {
  LoginDto,
  MessageResponse,
  PasswordResetConfirmDto,
  PasswordResetRequestDto,
  RegistrationConfirmDto,
  RegistrationRequestDto,
  RegistrationResendDto,
} from './auth-api.types';

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
type LoginResult = AuthTokens | BlockedAccountInfo | AdminLoginChallenge;

export const isBlockedAccountInfo = (value: LoginResult): value is BlockedAccountInfo => {
  return 'blocked' in value && value.blocked === true;
};

export const isAdminLoginChallenge = (value: LoginResult): value is AdminLoginChallenge => {
  return 'admin_confirmation_required' in value && value.admin_confirmation_required === true;
};

export const loginRequest = async (dto: LoginDto): Promise<LoginResult> => {
  const result = await apiRequest<LoginResult>('/auth/login', {
    method: 'POST',
    auth: 'none',
    body: JSON.stringify(dto),
  });

  if (!isBlockedAccountInfo(result) && !isAdminLoginChallenge(result)) {
    setAuthTokens(result);
  }
  return result;
};

export const confirmAdminLoginRequest = async (
  challengeId: string,
  code: string,
): Promise<void> => {
  const tokens = await apiRequest<AuthTokens>('/auth/login/admin/confirm', {
    method: 'POST',
    auth: 'none',
    body: JSON.stringify({ challenge_id: challengeId, code }),
  });
  setAuthTokens(tokens);
};

export const resendAdminLoginRequest = (challengeId: string): Promise<AdminLoginChallenge> => {
  return apiRequest<AdminLoginChallenge>('/auth/login/admin/resend', {
    method: 'POST',
    auth: 'none',
    body: JSON.stringify({ challenge_id: challengeId }),
  });
};

export const validateSessionRequest = async (): Promise<void> => {
  await apiRequest<null>('/auth/session', {
    method: 'GET',
    auth: 'access',
  });
};

export const registrationRequest = async (
  dto: RegistrationRequestDto,
): Promise<VerificationRequestResult> => {
  return apiRequest<VerificationRequestResult>('/auth/registration/request', {
    method: 'POST',
    auth: 'none',
    body: JSON.stringify(dto),
  });
};

export const registrationResendRequest = async (
  dto: RegistrationResendDto,
): Promise<VerificationRequestResult> => {
  return apiRequest<VerificationRequestResult>('/auth/registration/resend', {
    method: 'POST',
    auth: 'none',
    body: JSON.stringify(dto),
  });
};

export const registrationConfirmRequest = async (
  dto: RegistrationConfirmDto,
): Promise<AuthTokens> => {
  const tokens = await apiRequest<AuthTokens>('/auth/registration/confirm', {
    method: 'POST',
    auth: 'none',
    body: JSON.stringify(dto),
  });
  setAuthTokens(tokens);
  return tokens;
};

export const passwordResetRequest = async (
  dto: PasswordResetRequestDto,
): Promise<VerificationRequestResult> => {
  return apiRequest<VerificationRequestResult>('/auth/password-reset/request', {
    method: 'POST',
    auth: 'none',
    body: JSON.stringify(dto),
  });
};

export const passwordResetConfirmRequest = async (
  dto: PasswordResetConfirmDto,
): Promise<AuthTokens> => {
  const tokens = await apiRequest<AuthTokens>('/auth/password-reset/confirm', {
    method: 'POST',
    auth: 'none',
    body: JSON.stringify(dto),
  });
  setAuthTokens(tokens);
  return tokens;
};

export const logoutRequest = async (): Promise<void> => {
  await apiRequest<unknown>('/auth/logout', {
    method: 'POST',
    auth: 'access',
    retry: false,
  });
};
