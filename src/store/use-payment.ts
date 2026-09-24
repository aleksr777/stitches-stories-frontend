import { useCallback, useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../features/auth/model/use-auth';
import { apiRequest } from '../shared/api/api-client';
import type { PaymentInvoice } from './payment-types';

export const usePayment = () => {
  const { id = '' } = useParams();
  const { hash } = useLocation();
  const { isAuth, isInitializing, role } = useAuth();
  const accessToken = new URLSearchParams(hash.slice(1)).get('token') ?? undefined;
  const [invoice, setInvoice] = useState<PaymentInvoice | null>(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const auth: 'access' | 'none' = isAuth ? 'access' : 'none';
  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    setInvoice(null);
    setError('');
  }, [id, accessToken, isAuth, role]);

  useEffect(() => {
    if (isInitializing || role === 'admin' || (isAuth && role === null)) return;
    let active = true;
    void apiRequest<PaymentInvoice>('/shop/payments/' + id + '/view', {
      method: 'POST',
      auth,
      body: JSON.stringify({ accessToken }),
    })
      .then((value) => {
        if (active) {
          setInvoice(value);
          setError('');
        }
      })
      .catch((err) => {
        if (active)
          setError(err instanceof Error ? err.message : 'Не удалось получить сведения об оплате.');
      });
    return () => {
      active = false;
    };
  }, [id, accessToken, auth, isAuth, isInitializing, role, revision]);

  useEffect(() => {
    if (!invoice || !['ready', 'pending'].includes(invoice.status)) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) refresh();
    }, 10000);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [invoice?.status, refresh]);

  return { id, accessToken, auth, role, isInitializing, invoice, error, refresh };
};
