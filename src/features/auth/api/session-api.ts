import { apiRequest } from '../../../shared/api/api-client';

export type AuthSession = {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  last_used_at: string;
  expires_at: string;
  current: boolean;
};

type SessionsResponse = {
  sessions: AuthSession[];
};

export const getSessionsRequest = async (): Promise<AuthSession[]> => {
  const response = await apiRequest<SessionsResponse>('/auth/sessions', {
    auth: 'access',
  });

  return response.sessions;
};

export const revokeSessionRequest = async (sessionId: string): Promise<void> => {
  await apiRequest(`/auth/sessions/${sessionId}`, {
    method: 'DELETE',
    auth: 'access',
  });
};
