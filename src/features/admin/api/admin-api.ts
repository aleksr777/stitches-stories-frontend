import { apiRequest } from '../../../shared/api/api-client';
import type { AuthSession } from '../../auth/api/session-api';
import type { UserRole } from '../../users/api/users-api';

export type AdminUser = {
  id: number;
  email: string;
  nickname: string | null;
  name: string | null;
  age: number | null;
  role: UserRole;
  is_blocked: boolean;
  blocked_reason: string | null;
  last_activity_at: string | null;
};

type AdminUsersResponse = {
  users: AdminUser[];
  total: number;
};

type AdminUserSessionsResponse = {
  sessions: AuthSession[];
};

export const getAdminUsersRequest = async (
  search: string,
  limit: number,
  offset: number,
): Promise<AdminUsersResponse> => {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  const query = search.trim();
  if (query) params.set('search', query);

  return apiRequest<AdminUsersResponse>(`/admin/users/find?${params.toString()}`);
};

export const getAdminUserRequest = async (id: number): Promise<AdminUser> => {
  return apiRequest<AdminUser>(`/admin/users/${id}`);
};

export const getAdminUserSessionsRequest = async (id: number): Promise<AuthSession[]> => {
  const response = await apiRequest<AdminUserSessionsResponse>(`/admin/users/${id}/sessions`);
  return response.sessions;
};

export const revokeAdminUserSessionRequest = async (
  id: number,
  sessionId: string,
): Promise<void> => {
  await apiRequest(`/admin/users/${id}/sessions/${sessionId}`, {
    method: 'DELETE',
  });
};

export const revokeAllAdminUserSessionsRequest = async (id: number): Promise<void> => {
  await apiRequest(`/admin/users/${id}/sessions`, {
    method: 'DELETE',
  });
};

export const blockAdminUserRequest = async (
  id: number,
  blockedReason: string,
  password: string,
): Promise<void> => {
  await apiRequest(`/admin/users/block/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ blocked_reason: blockedReason.trim(), password }),
  });
};

export const unblockAdminUserRequest = async (id: number, password: string): Promise<void> => {
  await apiRequest(`/admin/users/unblock/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ password }),
  });
};

export const deleteAdminUserRequest = async (id: number, password: string): Promise<void> => {
  await apiRequest(`/admin/users/delete/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ password }),
  });
};
