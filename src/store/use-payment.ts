import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../features/auth/model/use-auth';
import { apiRequest } from '../shared/api/api-client';
import type { PaymentInvoice } from './payment-types';

export const usePayment = () => {
  const { id = '' } = useParams();
  const { isAuth, isInitializing, role } = useAuth();
  const [invoice, setInvoice] = useState<PaymentInvoice | null>(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    setInvoice(null);
    setError('');
  }, [id, isAuth, role]);

  useEffect(() => {
    if (isInitializing || !isAuth || role === 'admin' || role === null) return;
    let active = true;
    void apiRequest<PaymentInvoice>('/shop/payments/' + id + '/view', {
      method: 'POST',
      auth: 'access',
      body: JSON.stringify({}),
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
  }, [id, isAuth, isInitializing, role, revision]);

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

  return { id, role, isInitializing, invoice, error, refresh };
};
