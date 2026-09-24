import { money } from './types';
import { paymentStatusNames, type PaymentInvoice } from './payment-types';

const PaymentDetails = ({ invoice }: { invoice: PaymentInvoice }) => (
  <>
    {invoice.isTest && <p className="notice">Тестовая оплата. Настоящие деньги не списываются.</p>}
    <p role="status" className="payment-status">
      {paymentStatusNames[invoice.status]}
    </p>
    <p>
      Продавец: {invoice.sellerName}
      <br />
      <span className="muted">ИНН {invoice.sellerInn}</span>
    </p>
    <ul className="payment-items">
      {invoice.items.map((item) => (
        <li key={item.productId}>
          <span>
            {item.name} × {item.quantity}
          </span>
          <strong>{money(item.priceRub * item.quantity)}</strong>
        </li>
      ))}
      <li>
        <span>Доставка</span>
        <strong>{invoice.deliveryRub ? money(invoice.deliveryRub) : 'Без доплаты'}</strong>
      </li>
    </ul>
    <p className="payment-total">
      <span>Итого</span>
      <strong>{money(invoice.amountRub)}</strong>
    </p>
    <h2>Условия вашего заказа</h2>
    <p className="payment-fulfillment">{invoice.fulfillment}</p>
    {!invoice.paidAt && (
      <p className="muted">Оплатить до {new Date(invoice.expiresAt).toLocaleString('ru-RU')}.</p>
    )}
    {invoice.status === 'expired' && (
      <p>
        Свяжитесь с мастерской, чтобы заново согласовать заказ. Если вы уже оплатили, дождитесь
        подтверждения или сообщите мастеру номер заказа.
      </p>
    )}
    {invoice.status === 'paid_review' && (
      <p>
        Платёж пришёл после окончания срока счёта. Мастер уточнит наличие изделий и согласует
        выполнение заказа или возврат.
      </p>
    )}
    {invoice.status === 'paid' && (
      <p>
        {invoice.isTest
          ? 'Тестовый платёж подтверждён.'
          : 'Спасибо! Мы получили оплату и подготовим ваш заказ на согласованных условиях.'}
      </p>
    )}
  </>
);
export default PaymentDetails;
