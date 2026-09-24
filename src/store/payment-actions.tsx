import { useState } from 'react';
import { apiRequest } from '../shared/api/api-client';
import { documentRef } from './types';
import type { PaymentInvoice, PaymentForm } from './payment-types';

type Props = {
  invoice: PaymentInvoice;
  refresh: () => void;
};
const PaymentActions = ({ invoice, refresh }: Props) => {
  const [accepted, setAccepted] = useState(false);
  const [form, setForm] = useState<PaymentForm | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const prepare = async () => {
    if (!accepted || busy || !invoice.canPay) return;
    setBusy(true);
    setError('');
    try {
      const result = await apiRequest<PaymentForm>('/shop/payments/' + invoice.id + '/start', {
        method: 'POST',
        auth: 'access',
        body: JSON.stringify({ documents: invoice.documents.map(documentRef) }),
      });
      if (result.action !== 'https://auth.robokassa.ru/Merchant/Index.aspx')
        throw new Error('Не удалось открыть оплату.');
      setForm(result);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось подготовить оплату.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="payment-actions">
      {invoice.canPay && (
        <>
          <label className="check">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => {
                setAccepted(event.target.checked);
                setForm(null);
              }}
            />
            <span>Я принимаю условия покупки и оплаты этого заказа, включая доставку и сроки.</span>
          </label>
          {form ? (
            <form action={form.action} method="POST" target="_blank" rel="noopener noreferrer">
              {Object.entries(form.fields).map(([name, value]) => (
                <input key={name} type="hidden" name={name} value={value} />
              ))}
              <button className="button" disabled={!accepted}>
                Оплатить через СБП
              </button>
              <p className="tiny">
                Оплата откроется в новой вкладке. Выберите банк или отсканируйте QR-код, затем
                вернитесь сюда для проверки.
              </p>
            </form>
          ) : (
            <button className="button" disabled={!accepted || busy} onClick={() => void prepare()}>
              {busy ? 'Готовим оплату…' : 'Продолжить к оплате'}
            </button>
          )}
        </>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="text-link" onClick={refresh}>
        Проверить оплату
      </button>
    </div>
  );
};
export default PaymentActions;
