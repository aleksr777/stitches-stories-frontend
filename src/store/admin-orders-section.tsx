import { money, statusNames, type OrderRequest } from './types';
import { paymentStatusNames } from './payment-types';
import { addressText } from './delivery-address';

const AdminOrdersSection = ({
  orders,
  busy,
  onStatus,
  onPayment,
}: {
  orders: OrderRequest[];
  busy: boolean;
  onStatus: (id: string, value: string) => void;
  onPayment: (order: OrderRequest) => void;
}) => (
  <section className="panel">
    <h2>Последние заявки</h2>
    {orders.length ? (
      orders.map((order) => (
        <article className="request" key={order.id}>
          <h3>
            № {order.id.slice(0, 8).toUpperCase()} · {order.name}
          </h3>
          <p className="contact-text">
            {order.email} · {order.phone ?? 'Телефон не указан'} · {order.city}
          </p>
          <p>
            Адрес доставки:{' '}
            {order.deliveryAddress
              ? addressText(order.deliveryAddress)
              : 'уточняется при согласовании'}
          </p>
          <p>
            {order.items.map((item, index) => (
              <span key={item.productId}>
                {index > 0 && ', '}
                <span className="product-name">{item.name}</span> × {item.quantity}
              </span>
            ))}{' '}
            — {money(order.subtotalRub)}
          </p>
          <p>{order.comment}</p>
          <label>
            Статус
            <select
              value={order.status}
              disabled={busy}
              onChange={(event) => onStatus(order.id, event.target.value)}
            >
              {Object.entries(statusNames).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {order.payment && (
            <p>
              {order.payment.isTest && 'Тест · '}
              {paymentStatusNames[order.payment.status]} · {money(order.payment.amountRub)}
            </p>
          )}
          <p>
            <button
              className="button secondary"
              disabled={busy || (order.status !== 'agreed' && !order.payment)}
              onClick={() => onPayment(order)}
            >
              {order.payment ? 'Открыть счёт СБП' : 'Подготовить оплату СБП'}
            </button>
          </p>
        </article>
      ))
    ) : (
      <p>Заявок пока нет.</p>
    )}
  </section>
);

export default AdminOrdersSection;
