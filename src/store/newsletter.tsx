import { useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { apiRequest } from '../shared/api/api-client';
import { useStore } from './context';
import { documentRef } from './types';
import { Acceptance } from './legal';
import Modal from './modal';
export const NewsletterDialog = ({ close }: { close: () => void }) => {
  const { documents } = useStore();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const refs = documents
    .filter((d) => ['pd-marketing', 'ads-email'].includes(d.id))
    .map(documentRef);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (!f.get('pd-marketing') || !f.get('ads-email')) return;
    setBusy(true);
    setError('');
    try {
      const r = await apiRequest<{ message: string }>('/shop/newsletter/request', {
        auth: 'none',
        method: 'POST',
        body: JSON.stringify({ email: String(f.get('email')), documents: refs }),
      });
      setMessage(r.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить письмо.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="Письма из мастерской" onClose={close}>
      {message ? (
        <p role="status">{message}</p>
      ) : (
        <form className="form" onSubmit={(e) => void submit(e)}>
          <p>Новые истории, коллекции и новости. Подписка добровольна; её можно отменить.</p>
          <label>
            Электронная почта
            <input name="email" type="email" required maxLength={255} />
          </label>
          <Acceptance id="pd-marketing" label="Согласен на обработку данных для рассылки." />
          <Acceptance id="ads-email" label="Согласен получать рекламные письма." />
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <button className="button" disabled={busy || refs.length !== 2}>
            {busy ? 'Отправляем…' : 'Подтвердить почту'}
          </button>
        </form>
      )}
    </Modal>
  );
};
export const NewsletterAction = () => {
  const { pathname } = useLocation();
  const unsubscribe = pathname.endsWith('unsubscribe');
  const [token] = useState(
    () => new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '',
  );
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [unsubscribeToken, setUnsubscribeToken] = useState('');
  const act = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await apiRequest<{ unsubscribeToken?: string }>(
        '/shop/newsletter/' + (unsubscribe ? 'unsubscribe' : 'confirm'),
        { auth: 'none', method: 'POST', body: JSON.stringify({ token }) },
      );
      setUnsubscribeToken(result.unsubscribeToken ?? '');
      setMessage(unsubscribe ? 'Подписка отменена.' : 'Почта подтверждена. Подписка оформлена.');
      window.history.replaceState(null, '', window.location.pathname);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось выполнить запрос.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="page narrow">
      <h1>{unsubscribe ? 'Отмена подписки' : 'Подтверждение подписки'}</h1>
      {message ? (
        <>
          <p role="status">{message}</p>
          {unsubscribeToken && (
            <a
              className="text-link"
              href={import.meta.env.BASE_URL + 'newsletter/unsubscribe#token=' + unsubscribeToken}
            >
              Отменить эту подписку
            </a>
          )}
        </>
      ) : (
        <>
          <p>
            Нажмите кнопку, чтобы {unsubscribe ? 'отменить' : 'подтвердить'} подписку на письма
            Stitches &amp; Stories.
          </p>
          {error && <p role="alert">{error}</p>}
          <button
            className="button"
            disabled={busy || !/^[a-f0-9]{64}$/.test(token)}
            onClick={() => void act()}
          >
            {busy ? 'Подождите…' : unsubscribe ? 'Отменить подписку' : 'Подтвердить подписку'}
          </button>
          {!token && <p>Откройте ссылку из письма.</p>}
        </>
      )}
    </section>
  );
};
