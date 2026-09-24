import { useEffect, useState, type FormEvent } from 'react';
import { apiRequest } from '../shared/api/api-client';
import Modal from './modal';
import AdminPaymentForm from './admin-payment-form';
import AdminPaymentLink from './admin-payment-link';
import type { PaymentInvoice, PaymentSettings } from './payment-types';
import type { OrderRequest } from './types';
import './payments.css';

const AdminPaymentDialog = ({
  order,
  close,
  updated,
}: {
  order: OrderRequest;
  close: () => void;
  updated: () => void;
}) => {
  const [invoice, setInvoice] = useState<PaymentInvoice | null>(null);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setBusy(true);
    setError('');
    Promise.all([
      apiRequest<PaymentSettings>('/shop/admin/payments/config'),
      apiRequest<PaymentInvoice | null>('/shop/admin/requests/' + order.id + '/payment'),
    ])
      .then(([config, value]) => {
        if (active) {
          setSettings(config);
          setInvoice(value);
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Не удалось загрузить счёт.');
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [order.id, revision]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      const value = await apiRequest<PaymentInvoice>(
        '/shop/admin/requests/' + order.id + '/payment',
        {
          method: 'POST',
          body: JSON.stringify({
            deliveryRub: Number(form.get('deliveryRub')),
            fulfillment: String(form.get('fulfillment') ?? ''),
          }),
        },
      );
      setInvoice(value);
      updated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось выставить счёт.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={'Оплата заявки № ' + order.id.slice(0, 8).toUpperCase()} onClose={close}>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {busy && !settings && <p role="status">Загружаем настройки оплаты…</p>}
      {invoice ? (
        <AdminPaymentLink invoice={invoice} refresh={() => setRevision((value) => value + 1)} />
      ) : (
        settings && (
          <AdminPaymentForm
            order={order}
            settings={settings}
            busy={busy}
            submit={(event) => void submit(event)}
          />
        )
      )}
      {!settings && !busy && (
        <button className="text-link" onClick={() => setRevision((value) => value + 1)}>
          Повторить
        </button>
      )}
    </Modal>
  );
};
export default AdminPaymentDialog;
