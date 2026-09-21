import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getAdminUserRequest,
  getAdminUserSessionsRequest,
  revokeAdminUserSessionRequest,
  revokeAllAdminUserSessionsRequest,
  type AdminUser,
} from '../../features/admin/api/admin-api';
import type { AuthSession } from '../../features/auth/api/session-api';
import styles from '../my-profile/active-sessions.module.css';
import UserSessionCard from './user-session-card';

const UserManagementSessions = () => {
  const userId = Number(useParams().id);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [revokingIds, setRevokingIds] = useState<Set<string>>(new Set());
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  const loadSessions = useCallback(async () => {
    if (!Number.isInteger(userId) || userId <= 0) {
      setError('Некорректный идентификатор пользователя.');
      setIsLoading(false);
      return;
    }
    try {
      setError(null);
      setIsLoading(true);
      const [loadedUser, loadedSessions] = await Promise.all([
        getAdminUserRequest(userId),
        getAdminUserSessionsRequest(userId),
      ]);
      setUser(loadedUser);
      setSessions(loadedSessions);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить сеансы.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => void loadSessions(), [loadSessions]);

  const handleRevoke = async (sessionId: string) => {
    setRevokingIds((current) => new Set(current).add(sessionId));
    try {
      setError(null);
      await revokeAdminUserSessionRequest(userId, sessionId);
      setSessions((current) => current.filter((session) => session.id !== sessionId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось завершить сеанс.');
    } finally {
      setRevokingIds((current) => {
        const next = new Set(current);
        next.delete(sessionId);
        return next;
      });
    }
  };

  const handleRevokeAll = async () => {
    if (!sessions.length) return;
    try {
      setError(null);
      setIsRevokingAll(true);
      await revokeAllAdminUserSessionsRequest(userId);
      setSessions([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось завершить сеансы.');
      await loadSessions();
    } finally {
      setIsRevokingAll(false);
    }
  };

  if (isLoading) return <p className={styles.notice}>Загружаем сеансы…</p>;
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <p className="eyebrow">Безопасность</p>
          <h1 className={styles.title}>Активные сеансы</h1>
          {user && <p>Пользователь: {user.email}</p>}
        </div>
        <button
          className={styles.terminateAllButton}
          type="button"
          onClick={() => void handleRevokeAll()}
          disabled={isRevokingAll || revokingIds.size > 0 || sessions.length === 0}
        >
          {isRevokingAll ? 'Завершаем…' : 'Завершить все сеансы'}
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      {sessions.length ? (
        <div className={styles.list}>
          {sessions.map((session) => (
            <UserSessionCard
              key={session.id}
              session={session}
              busy={revokingIds.has(session.id) || isRevokingAll}
              onRevoke={(id) => void handleRevoke(id)}
            />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>Активных сеансов нет.</p>
      )}
      <Link className={styles.backLink} to={'/admin/users/' + userId}>
        Вернуться к карточке пользователя
      </Link>
    </section>
  );
};

export default UserManagementSessions;
