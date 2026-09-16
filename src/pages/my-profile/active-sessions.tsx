import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getSessionsRequest,
  revokeSessionRequest,
  type AuthSession,
} from '../../features/auth/api/session-api';
import { formatSessionDate, getSessionDeviceLabel } from './session-device';
import styles from './active-sessions.module.css';
const ActiveSessions = () => {
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [revokingIds, setRevokingIds] = useState<Set<string>>(new Set());
  const [isRevokingOthers, setIsRevokingOthers] = useState(false);
  const orderedSessions = useMemo(
    () => [...sessions].sort((a, b) => Number(b.current) - Number(a.current)),
    [sessions],
  );
  const loadSessions = useCallback(async () => {
    try {
      setError(null);
      setSessions(await getSessionsRequest());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить сеансы');
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);
  const handleRevoke = async (sessionId: string) => {
    setRevokingIds((current) => new Set(current).add(sessionId));
    try {
      setError(null);
      await revokeSessionRequest(sessionId);
      setSessions((current) => current.filter((session) => session.id !== sessionId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось завершить сеанс');
    } finally {
      setRevokingIds((current) => {
        const next = new Set(current);
        next.delete(sessionId);
        return next;
      });
    }
  };
  const handleRevokeOthers = async () => {
    const otherSessions = sessions.filter((session) => !session.current);
    if (otherSessions.length === 0) return;
    try {
      setError(null);
      setIsRevokingOthers(true);
      await Promise.all(otherSessions.map((session) => revokeSessionRequest(session.id)));
      setSessions((current) => current.filter((session) => session.current));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось завершить остальные сеансы');
      await loadSessions();
    } finally {
      setIsRevokingOthers(false);
    }
  };
  if (isLoading) return <p>Загружаем сеансы…</p>;
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Активные сеансы</h2>
        <button
          className={styles.terminateAllButton}
          type="button"
          onClick={() => void handleRevokeOthers()}
          disabled={
            isRevokingOthers ||
            revokingIds.size > 0 ||
            !sessions.some((session) => !session.current)
          }
        >
          {isRevokingOthers ? 'Завершаем…' : 'Завершить остальные сеансы'}
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      {orderedSessions.length === 0 ? (
        <p>Активных сеансов нет.</p>
      ) : (
        <div className={styles.list}>
          {orderedSessions.map((session) => (
            <article className={styles.card} key={session.id}>
              <div className={styles.cardHeader}>
                <strong>{getSessionDeviceLabel(session.user_agent)}</strong>
                {session.current && <span className={styles.current}>Текущий сеанс</span>}
              </div>
              <span>IP: {session.ip_address ?? 'Неизвестно'}</span>
              <span>Вход: {formatSessionDate(session.created_at)}</span>
              <span>Последняя активность: {formatSessionDate(session.last_used_at)}</span>
              <span>Истекает: {formatSessionDate(session.expires_at)}</span>
              {!session.current && (
                <button
                  className={styles.terminateButton}
                  type="button"
                  onClick={() => void handleRevoke(session.id)}
                  disabled={revokingIds.has(session.id) || isRevokingOthers}
                >
                  {revokingIds.has(session.id) ? 'Завершаем…' : 'Завершить сеанс'}
                </button>
              )}
            </article>
          ))}
        </div>
      )}
      <Link className={styles.backLink} to="/users/me">
        Вернуться в профиль
      </Link>
    </section>
  );
};

export default ActiveSessions;
