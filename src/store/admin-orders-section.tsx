import { money, statusNames, type OrderRequest } from './types';

const AdminOrdersSection = ({
  orders,
  busy,
  onStatus,
}: {
  orders: OrderRequest[];
  busy: boolean;
  onStatus: (id: string, value: string) => void;
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
        </article>
      ))
    ) : (
      <p>Заявок пока нет.</p>
    )}
  </section>
);

export default AdminOrdersSection;
