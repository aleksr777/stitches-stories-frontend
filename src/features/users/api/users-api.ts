import { apiRequest } from '../../../shared/api/api-client';

export type UserRole = 'user' | 'admin';

export type CurrentUser = {
  id: number;
  email: string | null;
  contact_email: string | null;
  phone_number: string | null;
  sex: 'male' | 'female' | null;
  name: string | null;
  role: UserRole;
  is_blocked?: boolean;
  blocked_reason?: string | null;
};

export type UpdateCurrentUserData = {
  name?: string;
};

export const getCurrentUserRequest = async (): Promise<CurrentUser> => {
  return apiRequest<CurrentUser>('/users/me');
};

export const updateCurrentUserRequest = async (
  data: UpdateCurrentUserData,
): Promise<CurrentUser> => {
  return apiRequest<CurrentUser>('/users/me/partial-data/update', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

export const deleteCurrentUserRequest = async (password: string): Promise<void> => {
  await apiRequest('/users/me/delete', {
    method: 'DELETE',
    body: JSON.stringify({ password }),
  });
};
