import type { FormEvent } from 'react';
import { money, type OrderRequest } from './types';
import type { PaymentSettings } from './payment-types';

const AdminPaymentForm = ({
  order,
  settings,
  busy,
  submit,
}: {
  order: OrderRequest;
  settings: PaymentSettings;
  busy: boolean;
  submit: (event: FormEvent<HTMLFormElement>) => void;
}) => (
  <>
    {!settings.enabled || !settings.account ? (
      <p className="notice">
        Приём оплаты ещё не настроен. Подключите кабинет Robokassa в настройках сервера по
        инструкции docs/SBP.md.
      </p>
    ) : (
      <>
        <p>
          Продавец: {settings.account.sellerName} · ИНН {settings.account.sellerInn}
        </p>
        {settings.account.isTest && (
          <p className="notice">
            Тестовый режим. Настоящие деньги не списываются, остатки изделий не изменяются.
          </p>
        )}
        <p>
          Изделия: {money(order.subtotalRub)}. Согласуйте с покупателем доставку и сроки перед
          выставлением счёта.
        </p>
        <form className="form" onSubmit={submit}>
          <label>
            Доставка, ₽
            <input
              name="deliveryRub"
              type="number"
              min="0"
              max="100000"
              step="1"
              defaultValue="0"
              required
              disabled={busy}
            />
          </label>
          <label>
            Согласованные условия и сроки
            <textarea
              name="fulfillment"
              minLength={5}
              maxLength={1000}
              required
              rows={4}
              disabled={busy}
              placeholder="Способ получения, срок изготовления и доставки"
            />
          </label>
          <p className="tiny">
            Счёт действует 24 часа. Его сумма, продавец и условия фиксируются. При реальной оплате
            изделия резервируются до оплаты или окончания срока счёта.
          </p>
          <button className="button" disabled={busy || order.status !== 'agreed'}>
            {busy ? 'Готовим счёт…' : 'Выставить счёт СБП'}
          </button>
        </form>
      </>
    )}
  </>
);
export default AdminPaymentForm;
