import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest, apiUrl } from '../shared/api/api-client';
import { journalDate, type JournalPage, type JournalPost } from './journal-types';
import './journal.css';

export const JournalText = ({ text }: { text: string }) =>
  text.length > 700 ? (
    <div className="journal-text">
      <p>{text.slice(0, 700)}</p>
      <details>
        <summary>Читать дальше</summary>
        <p>{text.slice(700)}</p>
      </details>
    </div>
  ) : (
    <p className="journal-text">{text}</p>
  );

export const JournalCard = ({ post }: { post: JournalPost }) => (
  <article className="journal-card" id={'post-' + post.id}>
    <div className="journal-byline">
      <span>Stitches &amp; Stories</span>
      <time dateTime={post.sourcePublishedAt}>{journalDate(post.sourcePublishedAt)}</time>
    </div>
    <JournalText text={post.text} />
    {!!post.photos.length && (
      <div className="journal-gallery">
        {post.photos.map((photo, index) => (
          <img
            key={photo.id}
            src={apiUrl(`/journal/posts/${post.id}/photos/${photo.id}`)}
            width={photo.width}
            height={photo.height}
            alt={`Фотография ${index + 1} к публикации от ${journalDate(post.sourcePublishedAt)}`}
            loading="lazy"
          />
        ))}
      </div>
    )}
    {!!post.otherAttachments.length && (
      <p className="muted">Видео и другие вложения можно посмотреть в оригинале VK.</p>
    )}
    <a className="text-link" href={post.sourceUrl} target="_blank" rel="noreferrer">
      Оригинал в VK ↗
    </a>
  </article>
);

const Journal = () => {
  const [page, setPage] = useState<JournalPage | null>(null);
  const [offset, setOffset] = useState(0);
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    apiRequest<JournalPage>(`/journal/posts?offset=${offset}`, {
      auth: 'none',
      signal: controller.signal,
    })
      .then((result) => {
        if (!controller.signal.aborted)
          setPage((prior) => ({
            ...result,
            items: offset
              ? [
                  ...(prior?.items ?? []).filter(
                    (p) => !result.items.some((next) => next.id === p.id),
                  ),
                  ...result.items,
                ]
              : result.items,
          }));
      })
      .catch((err) => {
        if (!controller.signal.aborted)
          setError(err instanceof Error ? err.message : 'Не удалось загрузить журнал.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [offset, retry]);
  return (
    <section className="page journal-page">
      <p className="eyebrow">За каждым стежком — своя история</p>
      <h1>Журнал мастерской</h1>
      <p className="lead">
        Новые работы, маленькие открытия и жизнь мастерской — публикации, которыми хочется
        поделиться.
      </p>
      {page?.items.length === 0 && !loading && (
        <div className="panel journal-empty">
          <h2>Истории скоро появятся</h2>
          <p>А пока можно заглянуть в коллекцию и найти что-то близкое сердцу.</p>
          <Link className="text-link" to="/catalog">
            В коллекцию →
          </Link>
        </div>
      )}
      <div className="journal-wall">
        {page?.items.map((post) => <JournalCard key={post.id} post={post} />)}
      </div>
      {error && (
        <p role="alert" className="error">
          {error}{' '}
          <button className="text-link" onClick={() => setRetry((v) => v + 1)}>
            Повторить загрузку
          </button>
        </p>
      )}
      {loading && <p role="status">Загружаем истории…</p>}
      {page?.nextOffset !== null && page && !loading && !error && (
        <button
          className="button secondary journal-more"
          onClick={() => setOffset(page.nextOffset!)}
        >
          Ещё истории
        </button>
      )}
    </section>
  );
};
export default Journal;
