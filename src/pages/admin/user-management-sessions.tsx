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
import { formatSessionDate, getSessionDeviceLabel } from '../my-profile/session-device';
import styles from '../my-profile/active-sessions.module.css';

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
      setError('Invalid user id');
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
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const handleRevoke = async (sessionId: string) => {
    setRevokingIds((current) => new Set(current).add(sessionId));
    try {
      setError(null);
      await revokeAdminUserSessionRequest(userId, sessionId);
      setSessions((current) => current.filter((session) => session.id !== sessionId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to terminate session');
    } finally {
      setRevokingIds((current) => {
        const next = new Set(current);
        next.delete(sessionId);
        return next;
      });
    }
  };

  const handleRevokeAll = async () => {
    if (sessions.length === 0) return;

    try {
      setError(null);
      setIsRevokingAll(true);
      await revokeAllAdminUserSessionsRequest(userId);
      setSessions([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to terminate sessions');
      await loadSessions();
    } finally {
      setIsRevokingAll(false);
    }
  };

  if (isLoading) return <p>Loading sessions...</p>;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Active sessions</h2>
          {user && <p>User: {user.email}</p>}
        </div>
        <button
          className={styles.terminateAllButton}
          type="button"
          onClick={() => void handleRevokeAll()}
          disabled={isRevokingAll || revokingIds.size > 0 || sessions.length === 0}
        >
          {isRevokingAll ? 'Terminating...' : 'Terminate all sessions'}
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {sessions.length === 0 ? (
        <p>No active sessions found.</p>
      ) : (
        <div className={styles.list}>
          {sessions.map((session) => (
            <article className={styles.card} key={session.id}>
              <div className={styles.cardHeader}>
                <strong>{getSessionDeviceLabel(session.user_agent)}</strong>
              </div>
              <span>IP: {session.ip_address ?? 'Unknown'}</span>
              <span>Signed in: {formatSessionDate(session.created_at)}</span>
              <span>Last used: {formatSessionDate(session.last_used_at)}</span>
              <span>Expires: {formatSessionDate(session.expires_at)}</span>
              <button
                className={styles.terminateButton}
                type="button"
                onClick={() => void handleRevoke(session.id)}
                disabled={revokingIds.has(session.id) || isRevokingAll}
              >
                {revokingIds.has(session.id) ? 'Terminating...' : 'Terminate session'}
              </button>
            </article>
          ))}
        </div>
      )}

      <Link className={styles.backLink} to={`/admin/users/${userId}`}>
        Back to user profile
      </Link>
    </section>
  );
};

export default UserManagementSessions;
