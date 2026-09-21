import { apiRequest } from '../../../shared/api/api-client';
import { setAuthTokens, type AuthTokens } from '../../../shared/api/tokens';
import {
  isAdminLoginChallenge,
  isBlockedAccountInfo,
  type AdminLoginChallenge,
  type LoginResult,
  type VerificationRequestResult,
} from './auth-api.models';
import type {
  LoginDto,
  PasswordResetConfirmDto,
  PasswordResetRequestDto,
  RegistrationConfirmDto,
  RegistrationRequestDto,
  RegistrationResendDto,
} from './auth-api.types';

export {
  isAdminLoginChallenge,
  isBlockedAccountInfo,
  type AdminLoginChallenge,
  type BlockedAccountInfo,
  type VerificationRequestResult,
} from './auth-api.models';

export const loginRequest = async (dto: LoginDto): Promise<LoginResult> => {
  const result = await apiRequest<LoginResult>('/auth/login', {
    method: 'POST',
    auth: 'none',
    body: JSON.stringify(dto),
  });
  if (!isBlockedAccountInfo(result) && !isAdminLoginChallenge(result)) setAuthTokens(result);
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

export const resendAdminLoginRequest = (challengeId: string): Promise<AdminLoginChallenge> =>
  apiRequest<AdminLoginChallenge>('/auth/login/admin/resend', {
    method: 'POST',
    auth: 'none',
    body: JSON.stringify({ challenge_id: challengeId }),
  });

export const validateSessionRequest = async (): Promise<void> => {
  await apiRequest<null>('/auth/session', { method: 'GET', auth: 'access' });
};

export const registrationRequest = (
  dto: RegistrationRequestDto,
): Promise<VerificationRequestResult> =>
  apiRequest<VerificationRequestResult>('/auth/registration/request', {
    method: 'POST',
    auth: 'none',
    body: JSON.stringify(dto),
  });

export const registrationResendRequest = (
  dto: RegistrationResendDto,
): Promise<VerificationRequestResult> =>
  apiRequest<VerificationRequestResult>('/auth/registration/resend', {
    method: 'POST',
    auth: 'none',
    body: JSON.stringify(dto),
  });

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

export const passwordResetRequest = (
  dto: PasswordResetRequestDto,
): Promise<VerificationRequestResult> =>
  apiRequest<VerificationRequestResult>('/auth/password-reset/request', {
    method: 'POST',
    auth: 'none',
    body: JSON.stringify(dto),
  });

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
