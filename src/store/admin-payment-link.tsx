import { useRef, useState } from 'react';
import { money } from './types';
import { paymentStatusNames, type PaymentInvoice } from './payment-types';

const AdminPaymentLink = ({
  invoice,
  refresh,
}: {
  invoice: PaymentInvoice;
  refresh: () => void;
}) => {
  const input = useRef<HTMLTextAreaElement>(null);
  const [notice, setNotice] = useState('');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(invoice.paymentUrl ?? '');
      setNotice('Ссылка скопирована.');
    } catch {
      input.current?.focus();
      input.current?.select();
      setNotice('Скопируйте выделенную ссылку.');
    }
  };
  return (
    <>
      {invoice.isTest && <p className="notice">Тестовый счёт — без списания денег.</p>}
      <p role="status">
        {paymentStatusNames[invoice.status]} · {money(invoice.amountRub)}
      </p>
      <p>
        Получатель: {invoice.sellerName} · ИНН {invoice.sellerInn}
      </p>
      <p className="payment-fulfillment">{invoice.fulfillment}</p>
      <p>Действует до {new Date(invoice.expiresAt).toLocaleString('ru-RU')}.</p>
      <label>
        Ссылка на счёт
        <textarea ref={input} className="payment-link" readOnly value={invoice.paymentUrl ?? ''} />
      </label>
      <p className="tiny">
        Покупатель откроет счёт после входа в свой аккаунт. Сведения доступны только владельцу
        заявки.
      </p>
      <div className="payment-actions">
        <button className="button" onClick={() => void copy()}>
          Скопировать ссылку
        </button>
        <button className="text-link" onClick={refresh}>
          Обновить статус
        </button>
      </div>
      {notice && <p role="status">{notice}</p>}
      {invoice.status === 'paid_review' && (
        <p className="notice">
          Оплата получена после окончания резерва. Проверьте наличие и согласуйте выполнение заказа
          или возврат в кабинете Robokassa.
        </p>
      )}
      {invoice.status === 'expired' && (
        <p>
          Этот счёт закрыт для новых оплат. Для повторной оплаты покупателю потребуется новая
          согласованная заявка.
        </p>
      )}
    </>
  );
};
export default AdminPaymentLink;
