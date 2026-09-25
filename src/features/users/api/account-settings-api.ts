import { apiRequest } from '../../../shared/api/api-client';

type PasswordChangeRequestResponse = {
  code: string;
};

type MessageResponse = {
  message: string;
};

type EmailChangeStatus = {
  locked: boolean;
  retry_after: number;
  max_attempts: number;
  attempts_remaining: number;
};

export const requestPasswordChange = async (
  oldPassword: string,
): Promise<PasswordChangeRequestResponse> =>
  apiRequest<PasswordChangeRequestResponse>('/users/me/password/change/request', {
    method: 'POST',
    body: JSON.stringify({ old_password: oldPassword }),
  });

export const confirmPasswordChange = async (
  code: string,
  newPassword: string,
): Promise<MessageResponse> =>
  apiRequest<MessageResponse>('/users/me/password/change/confirm', {
    method: 'POST',
    retry: false,
    body: JSON.stringify({ code, new_password: newPassword }),
  });

export const requestCurrentUserPasswordReset = async (): Promise<void> => {
  await apiRequest('/users/me/password/reset/request', {
    method: 'POST',
  });
};

export const confirmCurrentUserPasswordReset = async (
  code: string,
  newPassword: string,
): Promise<MessageResponse> =>
  apiRequest<MessageResponse>('/users/me/password/reset/confirm', {
    method: 'POST',
    retry: false,
    body: JSON.stringify({ code, new_password: newPassword }),
  });

export const getEmailChangeStatus = async (contact = false): Promise<EmailChangeStatus> => {
  return apiRequest<EmailChangeStatus>(
    `/users/me/${contact ? 'contact-email' : 'email'}/update/status`,
  );
};

export const requestEmailChange = async (
  newEmail: string,
  currentPassword: string,
): Promise<void> => {
  await apiRequest('/users/me/email/update/request', {
    method: 'POST',
    body: JSON.stringify({
      new_email: newEmail,
      current_password: currentPassword,
    }),
  });
};

export const confirmEmailChange = async (code: string): Promise<MessageResponse> =>
  apiRequest<MessageResponse>('/users/me/email/update/confirm', {
    method: 'POST',
    retry: false,
    body: JSON.stringify({ code }),
  });

export const requestContactEmailChange = async (newEmail: string | null): Promise<void> => {
  await apiRequest('/users/me/contact-email/update/request', {
    method: 'POST',
    body: JSON.stringify({ new_email: newEmail }),
  });
};

export const confirmContactEmailChange = async (code: string): Promise<MessageResponse> =>
  apiRequest<MessageResponse>('/users/me/contact-email/update/confirm', {
    method: 'POST',
    retry: false,
    body: JSON.stringify({ code }),
  });
