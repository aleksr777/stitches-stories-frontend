import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/model/use-auth';
import { getCurrentUserRequest, type CurrentUser } from '../features/users/api/users-api';
import { apiRequest } from '../shared/api/api-client';
import { money, statusNames, type OrderRequest } from './types';
import { DocumentButton } from './legal';
import { NewsletterDialog } from './newsletter';
import Modal, { ModalDismissButton } from './modal';
type ConsentEvent = {
  id: string;
  documentId: string;
  version: string;
  action: string;
  createdAt: string;
};
const Profile = () => {
  const { logout, clearSession } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [orders, setOrders] = useState<OrderRequest[]>([]);
  const [marketing, setMarketing] = useState(false);
  const [events, setEvents] = useState<ConsentEvent[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      const u = await getCurrentUserRequest();
      if (u.role === 'admin') {
        if (active) {
          setUser(u);
          setOrders([]);
          setMarketing(false);
          setEvents([]);
        }
        return;
      }
      const [o, c, h] = await Promise.all([
        apiRequest<OrderRequest[]>('/shop/me/requests'),
        apiRequest<{ marketing: boolean }>('/shop/me/consents'),
        apiRequest<ConsentEvent[]>('/legal/me/events'),
      ]);
      if (active) {
        setUser(u);
        setOrders(o);
        setMarketing(c.marketing);
        setEvents(h);
      }
    };
    void loadProfile().catch((err) => {
      if (active) setError(err instanceof Error ? err.message : 'Не удалось загрузить профиль.');
    });
    return () => {
      active = false;
    };
  }, [revision]);
  const withdraw = async (purpose: string) => {
    setBusy(true);
    setError('');
    try {
      const result = await apiRequest<{ accountClosed: boolean }>('/shop/me/consents/withdraw', {
        method: 'POST',
        body: JSON.stringify({ purpose }),
      });
      if (result.accountClosed) {
        clearSession();
        navigate('/');
      } else {
        setRevision((v) => v + 1);
        setDialog('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отозвать согласие.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="page">
      <p className="eyebrow">Ваш маленький уголок</p>
      <h1>{user ? 'Здравствуйте, ' + (user.name ?? user.nickname ?? 'друг') : 'Личный кабинет'}</h1>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {user && (
        <div className="profile-grid">
          <aside className="profile-menu">
            <span className="avatar large" aria-hidden="true">
              {(user.name ?? user.nickname ?? 'Я').slice(0, 1).toUpperCase()}
            </span>
            <p>{user.email}</p>
            {user.role !== 'admin' && <Link to="/favorites">Избранное</Link>}
            <Link to="/users/me/settings/profile">Мои данные</Link>
            <Link to="/users/me/settings/password">Сменить пароль</Link>
            <Link to="/users/me/settings/email">Сменить почту</Link>
            <Link to="/users/me/sessions">Активные сеансы</Link>
            {user.role === 'admin' && (
              <>
                <Link to="/admin/shop">Управление магазином</Link>
                <Link to="/admin/users">Пользователи</Link>
              </>
            )}
            <button
              className="text-link"
              onClick={() => {
                navigate('/', { replace: true });
                void logout().catch(() => undefined);
              }}
            >
              Выйти из аккаунта
            </button>
          </aside>
          <div>
            {user.role === 'admin' ? (
              <section className="panel">
                <h2>Управление магазином</h2>
                <p>
                  Вы владелец Stitches &amp; Stories. Для этого профиля не нужны согласия
                  покупателя, избранное и заявки на покупку.
                </p>
                <Link className="button secondary" to="/admin/shop">
                  Перейти к изделиям
                </Link>
              </section>
            ) : (
              <>
                <section className="panel">
                  <h2>Мои заявки</h2>
                  {orders.length ? (
                    orders.map((o) => (
                      <article className="request" key={o.id}>
                        <div>
                          <strong>№ {o.id.slice(0, 8).toUpperCase()}</strong>
                          <span className="tag">{statusNames[o.status] ?? o.status}</span>
                        </div>
                        <p>{o.items.map((i) => i.name + ' × ' + i.quantity).join(', ')}</p>
                        <p>
                          {money(o.subtotalRub)} ·{' '}
                          {new Date(o.createdAt).toLocaleDateString('ru-RU')}
                        </p>
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
                    <button
                      className="text-link"
                      disabled={busy}
                      onClick={() => void withdraw('marketing')}
                    >
                      Отозвать согласия на рассылку
                    </button>
                  ) : (
                    <button className="text-link" onClick={() => setDialog('newsletter')}>
                      Подписаться на письма
                    </button>
                  )}
                  <p>
                    Аналитика выключена. На сайте используются только функции, необходимые для его
                    работы.
                  </p>
                  <DocumentButton id="privacy">Политика обработки данных</DocumentButton>
                  <p>
                    <button className="text-link" onClick={() => setDialog('account')}>
                      Отозвать согласие на личный кабинет
                    </button>
                  </p>
                  <details>
                    <summary>История подтверждений</summary>
                    {events.length ? (
                      events.map((e) => (
                        <p key={e.id}>
                          {e.documentId} · {e.action === 'withdraw' ? 'отозвано' : 'подтверждено'}
                          <br />
                          <small>
                            {new Date(e.createdAt).toLocaleString('ru-RU')} · {e.version}
                          </small>
                        </p>
                      ))
                    ) : (
                      <p>
                        Подтверждения не найдены. Учётные записи из шаблона могут не содержать
                        историю согласий.
                      </p>
                    )}
                  </details>
                </section>
              </>
            )}
          </div>
        </div>
      )}
      {dialog === 'newsletter' && (
        <NewsletterDialog
          close={() => {
            setDialog('');
            setRevision((v) => v + 1);
          }}
        />
      )}
      {dialog === 'account' && (
        <Modal title="Закрыть личный кабинет?" onClose={() => setDialog('')}>
          <p>
            Отзыв согласия закроет кабинет, удалит профиль и избранное, завершит сеансы. Заявки и
            записи, для хранения которых существует отдельное основание, рассматриваются отдельно.
            Независимую подписку на письма можно отменить выше.
          </p>
          {error && <p role="alert">{error}</p>}
          <div className="actions">
            <ModalDismissButton className="button secondary" disabled={busy}>
              Оставить кабинет
            </ModalDismissButton>
            <button className="button" disabled={busy} onClick={() => void withdraw('account')}>
              Отозвать и закрыть
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
};
export default Profile;
