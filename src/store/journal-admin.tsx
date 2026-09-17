import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../shared/api/api-client';
import {
  journalDate,
  journalStatuses,
  type JournalConfig,
  type JournalImport,
  type JournalPage,
  type JournalPhoto,
  type JournalReviewPost,
  type JournalStatus,
} from './journal-types';
import Modal from './modal';
import './journal.css';

const PrivatePhoto = ({
  postId,
  photo,
  index,
}: {
  postId: string;
  photo: JournalPhoto;
  index: number;
}) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = '';
    setError('');
    setUrl('');
    apiRequest<Blob>(`/journal/admin/posts/${postId}/photos/${photo.id}`, {
      responseType: 'blob',
      signal: controller.signal,
      timeoutMs: 25000,
    })
      .then((blob) => {
        if (!controller.signal.aborted) {
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted)
          setError(err instanceof Error ? err.message : 'Не удалось загрузить фото.');
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [postId, photo.id, retry]);
  if (error)
    return (
      <p role="alert" className="error">
        {error}{' '}
        <button className="text-link" type="button" onClick={() => setRetry((v) => v + 1)}>
          Повторить фото {index + 1}
        </button>
      </p>
    );
  return url ? (
    <img
      src={url}
      width={photo.width}
      height={photo.height}
      alt={'Фотография ' + (index + 1) + ' для проверки'}
    />
  ) : (
    <p role="status">Загружаем фото {index + 1}…</p>
  );
};

const Review = ({
  post,
  close,
  changed,
}: {
  post: JournalReviewPost;
  close: () => void;
  changed: (message: string) => void;
}) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const act = async (action: JournalStatus | 'refresh') => {
    setBusy(true);
    setError('');
    try {
      await apiRequest(`/journal/admin/posts/${post.id}${action === 'refresh' ? '/refresh' : ''}`, {
        method: action === 'refresh' ? 'POST' : 'PATCH',
        body: JSON.stringify({
          revision: post.revision,
          ...(action === 'refresh' ? {} : { status: action }),
        }),
        timeoutMs: 180000,
      });
      changed(
        action === 'published'
          ? 'Публикация появилась на сайте.'
          : action === 'rejected'
            ? 'Публикация отклонена.'
            : action === 'refresh'
              ? 'Пост обновлён из VK. Проверьте его и одобрите заново.'
              : 'Пост снят с сайта и возвращён на проверку.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось изменить публикацию.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title="Проверка публикации"
      onClose={() => {
        if (!busy) close();
      }}
    >
      <p className="muted">
        {journalDate(post.sourcePublishedAt)} · {journalStatuses[post.status]}
      </p>
      <p className="journal-text">{post.text}</p>
      {!!post.photos.length && (
        <div className="journal-gallery">
          {post.photos.map((photo, index) => (
            <PrivatePhoto key={photo.id} postId={post.id} photo={photo} index={index} />
          ))}
        </div>
      )}
      {!!post.otherAttachments.length && (
        <p className="journal-notice">
          На сайт будут перенесены текст и фотографии. Видео, клипы и другие вложения останутся по
          ссылке на оригинал VK.
        </p>
      )}
      <p>
        <a className="text-link" href={post.sourceUrl} target="_blank" rel="noreferrer">
          Открыть оригинал в VK ↗
        </a>
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {busy && <p role="status">Сохраняем изменения и фотографии…</p>}
      <div className="actions">
        {post.status !== 'published' ? (
          <>
            <button className="button" disabled={busy} onClick={() => void act('published')}>
              Опубликовать на сайте
            </button>
            {post.status !== 'rejected' && (
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => void act('rejected')}
              >
                Отклонить
              </button>
            )}
            <button className="text-link" disabled={busy} onClick={() => void act('refresh')}>
              Обновить из VK
            </button>
          </>
        ) : (
          <button className="button secondary" disabled={busy} onClick={() => void act('pending')}>
            Снять с публикации
          </button>
        )}
        <button className="text-link" disabled={busy} onClick={close}>
          Закрыть проверку
        </button>
      </div>
    </Modal>
  );
};

const JournalAdmin = () => {
  const [config, setConfig] = useState<JournalConfig | null>(null);
  const [pageUrl, setPageUrl] = useState('');
  const [page, setPage] = useState<JournalPage<JournalReviewPost> | null>(null);
  const [status, setStatus] = useState<JournalStatus>('pending');
  const [offset, setOffset] = useState(0);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [importOffset, setImportOffset] = useState<number | null>(null);
  const [selected, setSelected] = useState<JournalReviewPost | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    Promise.all([
      apiRequest<JournalConfig>('/journal/admin/config', { signal: controller.signal }),
      apiRequest<JournalPage<JournalReviewPost>>(
        `/journal/admin/posts?status=${status}&offset=${offset}`,
        { signal: controller.signal },
      ),
    ])
      .then(([source, posts]) => {
        if (!controller.signal.aborted) {
          setConfig(source);
          setPageUrl(source.pageUrl);
          setPage(posts);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted)
          setError(err instanceof Error ? err.message : 'Не удалось загрузить очередь.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [status, offset, revision]);
  const save = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const updated = await apiRequest<JournalConfig>('/journal/admin/config', {
        method: 'PATCH',
        body: JSON.stringify({ pageUrl }),
      });
      setConfig(updated);
      setPageUrl(updated.pageUrl);
      setImportOffset(null);
      setMessage('Страница VK сохранена. Теперь можно получить посты.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить страницу.');
    } finally {
      setBusy(false);
    }
  };
  const importPosts = async (next: number) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await apiRequest<JournalImport>('/journal/admin/import', {
        method: 'POST',
        body: JSON.stringify({ offset: next }),
        timeoutMs: 25000,
      });
      setImportOffset(result.nextOffset);
      setOffset(0);
      setStatus('pending');
      setRevision((v) => v + 1);
      setMessage(
        `На проверку добавлено: ${result.added}. Уже в очереди или рассмотрены: ${result.existing}. Пропущено: ${result.skipped}. На сайте ничего не опубликовано.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось получить посты.');
    } finally {
      setBusy(false);
    }
  };
  const canImport =
    config?.tokenConfigured && config.pageUrl && pageUrl === config.pageUrl && !busy && !loading;
  return (
    <section className="page journal-admin">
      <p className="eyebrow">Мастерская · Публикации</p>
      <h1>Публикации из VK</h1>
      <p className="lead">
        Получите посты своей страницы, проверьте их и выберите, чем поделиться на сайте. Импорт
        добавляет записи только в очередь.
      </p>
      <p className="actions">
        <Link className="text-link" to="/admin/shop">
          Управление магазином
        </Link>
        <Link className="text-link" to="/journal">
          Посмотреть журнал →
        </Link>
      </p>
      <section className="panel">
        <h2>Страница VK</h2>
        <form onSubmit={(e) => void save(e)} className="journal-source">
          <label>
            Ссылка на вашу страницу или сообщество
            <input
              type="url"
              value={pageUrl}
              onChange={(e) => setPageUrl(e.target.value)}
              placeholder="https://vk.com/имя_страницы"
              maxLength={200}
              required
              disabled={busy || loading}
            />
          </label>
          <button className="button secondary" disabled={busy || loading}>
            Сохранить страницу
          </button>
        </form>
        {config && !config.tokenConfigured && (
          <p className="journal-notice">
            Для подключения добавьте VK_ACCESS_TOKEN в .env бэкенда и перезапустите сервер. Нужен
            пользовательский или сервисный токен с доступом к этой стене. Храните токен только на
            сервере.
          </p>
        )}
        <div className="actions">
          <button className="button" disabled={!canImport} onClick={() => void importPosts(0)}>
            {busy ? 'Выполняем…' : 'Получить новые посты'}
          </button>
          {importOffset !== null && (
            <button
              className="button secondary"
              disabled={!canImport}
              onClick={() => void importPosts(importOffset)}
            >
              Получить более ранние
            </button>
          )}
        </div>
        <p className="muted">
          За один запрос — до 20 записей. Переносятся открытые посты автора стены с текстом и
          фотографиями. Репосты и записи с ограниченным доступом пропускаются.
        </p>
      </section>
      {message && (
        <p role="status" className="journal-notice">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="error">
          {error}{' '}
          <button className="text-link" onClick={() => setRevision((v) => v + 1)}>
            Обновить список
          </button>
        </p>
      )}
      <div className="actions journal-tabs" role="group" aria-label="Статус публикаций">
        {(Object.keys(journalStatuses) as JournalStatus[]).map((value) => (
          <button
            key={value}
            className={'button' + (status === value ? '' : ' secondary')}
            aria-pressed={status === value}
            disabled={busy || !!selected}
            onClick={() => {
              setStatus(value);
              setOffset(0);
            }}
          >
            {journalStatuses[value]}
          </button>
        ))}
      </div>
      {loading ? (
        <p role="status">Загружаем публикации…</p>
      ) : (
        <>
          {page?.items.length === 0 && <p className="panel">Здесь пока нет публикаций.</p>}
          <div className="journal-wall">
            {page?.items.map((post) => (
              <article className="journal-card" key={post.id}>
                <div className="journal-byline">
                  <time dateTime={post.sourcePublishedAt}>
                    {journalDate(post.sourcePublishedAt)}
                  </time>
                  <span>{journalStatuses[post.status]}</span>
                </div>
                <p className="journal-text">
                  {post.text.slice(0, 400)}
                  {post.text.length > 400 ? '…' : ''}
                </p>
                <p className="muted">
                  Фотографий: {post.photos.length}
                  {post.otherAttachments.length ? ' · Есть вложения для просмотра в VK' : ''}
                </p>
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() => setSelected(post)}
                >
                  {post.status === 'published' ? 'Управлять публикацией' : 'Просмотреть и одобрить'}
                </button>
              </article>
            ))}
          </div>
          <div className="actions journal-more">
            {offset > 0 && (
              <button
                className="button secondary"
                onClick={() => setOffset(Math.max(0, offset - 12))}
                disabled={busy}
              >
                Предыдущие
              </button>
            )}
            {page?.nextOffset !== null && page && (
              <button
                className="button secondary"
                onClick={() => setOffset(page.nextOffset!)}
                disabled={busy}
              >
                Следующие
              </button>
            )}
          </div>
        </>
      )}
      {selected && (
        <Review
          key={selected.id + ':' + selected.revision}
          post={selected}
          close={() => setSelected(null)}
          changed={(notice) => {
            setSelected(null);
            setMessage(notice);
            setOffset(0);
            setRevision((v) => v + 1);
          }}
        />
      )}
    </section>
  );
};
export default JournalAdmin;
