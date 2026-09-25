import { DocumentButton } from './legal';
import { Link } from 'react-router-dom';
import { paymentStatusNames } from './payment-types';
import type { ConsentEvent } from './profile-types';
import { money, statusNames, type OrderRequest } from './types';
import { addressText } from './delivery-address';
import ProfileAddresses from './profile-addresses';

type Props = {
  orders: OrderRequest[];
  marketing: boolean;
  events: ConsentEvent[];
  busy: boolean;
  withdraw: (purpose: string) => Promise<void>;
  openDialog: (name: string) => void;
};

const ProfileCustomer = ({ orders, marketing, events, busy, withdraw, openDialog }: Props) => (
  <>
    <ProfileAddresses />
    <section className="panel">
      <h2>Мои заявки</h2>
      {orders.length ? (
        orders.map((order) => (
          <article className="request" key={order.id}>
            <div>
              <strong>№ {order.id.slice(0, 8).toUpperCase()}</strong>
              <span className="tag">{statusNames[order.status] ?? order.status}</span>
            </div>
            <p>{order.items.map((item) => item.name + ' × ' + item.quantity).join(', ')}</p>
            <p>
              {money(order.subtotalRub)} · {new Date(order.createdAt).toLocaleDateString('ru-RU')}
            </p>
            <p>
              Доставка:{' '}
              {order.deliveryAddress
                ? addressText(order.deliveryAddress)
                : `${order.city}, адрес уточняется`}
            </p>
            {order.payment && (
              <p>
                {order.payment.isTest && 'Тест · '}
                {paymentStatusNames[order.payment.status]} ·{' '}
                <Link className="text-link" to={'/payment/' + order.payment.id}>
                  Открыть счёт
                </Link>
              </p>
            )}
          </article>
        ))
      ) : (
        <p>Здесь появятся заявки, отправленные из вашего аккаунта.</p>
      )}
    </section>
    <section className="panel">
      <h2>Мои согласия</h2>
      <p>
        Рекламная рассылка: <strong>{marketing ? 'подключена' : 'выключена'}</strong>
      </p>
      {marketing ? (
        <button className="text-link" disabled={busy} onClick={() => void withdraw('marketing')}>
          Отозвать согласия на рассылку
        </button>
      ) : (
        <button className="text-link" onClick={() => openDialog('newsletter')}>
          Подписаться на письма
        </button>
      )}
      <p>Аналитика выключена. На сайте используются только функции, необходимые для его работы.</p>
      <DocumentButton id="privacy">Политика обработки данных</DocumentButton>
      <p>
        <button className="text-link" onClick={() => openDialog('account')}>
          Отозвать согласие на личный кабинет
        </button>
      </p>
      <details>
        <summary>История подтверждений</summary>
        {events.length ? (
          events.map((event) => (
            <p key={event.id}>
              {event.documentId} · {event.action === 'withdraw' ? 'отозвано' : 'подтверждено'}
              <br />
              <small>
                {new Date(event.createdAt).toLocaleString('ru-RU')} · {event.version}
              </small>
            </p>
          ))
        ) : (
          <p>
            Подтверждения не найдены. Учётные записи из шаблона могут не содержать историю согласий.
          </p>
        )}
      </details>
    </section>
  </>
);

export default ProfileCustomer;
