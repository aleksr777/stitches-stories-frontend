import { useEffect, useState } from 'react';
import { useAuth } from '../features/auth/model/use-auth';
import { getCurrentUserRequest, type CurrentUser } from '../features/users/api/users-api';
import { apiRequest } from '../shared/api/api-client';
import type { ConsentEvent } from './profile-types';
import type { OrderRequest } from './types';

export const useProfileData = () => {
  const { logout, clearSession } = useAuth();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [orders, setOrders] = useState<OrderRequest[]>([]);
  const [marketing, setMarketing] = useState(false);
  const [events, setEvents] = useState<ConsentEvent[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      const nextUser = await getCurrentUserRequest();
      if (nextUser.role === 'admin') {
        if (active) {
          setUser(nextUser);
          setOrders([]);
          setMarketing(false);
          setEvents([]);
        }
        return;
      }
      const [nextOrders, consent, history] = await Promise.all([
        apiRequest<OrderRequest[]>('/shop/me/requests'),
        apiRequest<{ marketing: boolean }>('/shop/me/consents'),
        apiRequest<ConsentEvent[]>('/legal/me/events'),
      ]);
      if (active) {
        setUser(nextUser);
        setOrders(nextOrders);
        setMarketing(consent.marketing);
        setEvents(history);
      }
    };
    void loadProfile().catch((err) => {
      if (active) setError(err instanceof Error ? err.message : 'Не удалось загрузить профиль.');
    });
    return () => {
      active = false;
    };
  }, [revision]);

  const withdraw = async (purpose: string, password?: string) => {
    setBusy(true);
    setError('');
    try {
      const result = await apiRequest<{ accountClosed: boolean }>('/shop/me/consents/withdraw', {
        method: 'POST',
        body: JSON.stringify({ purpose, ...(password ? { password } : {}) }),
      });
      if (result.accountClosed) {
        clearSession();
      } else {
        setRevision((value) => value + 1);
        setDialog('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отозвать согласие.');
    } finally {
      setBusy(false);
    }
  };

  return {
    user,
    orders,
    marketing,
    events,
    error,
    busy,
    dialog,
    setDialog,
    currentPassword,
    setCurrentPassword,
    withdraw,
    logout,
    refresh: () => setRevision((value) => value + 1),
  };
};
