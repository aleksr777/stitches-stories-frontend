import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  blockAdminUserRequest,
  deleteAdminUserRequest,
  getAdminUserRequest,
  type AdminUser,
  unblockAdminUserRequest,
} from '../../features/admin/api/admin-api';
import UserManagementActions from './user-management-actions';
import UserManagementUserData from './user-management-user-data';
import styles from './user-management.module.css';

const UserManagementDetails = () => {
  const navigate = useNavigate();
  const userId = Number(useParams().id);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);

  const loadUser = useCallback(async () => {
    if (!Number.isInteger(userId) || userId <= 0) {
      setError('Invalid user id');
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      setUser(await getAdminUserRequest(userId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const runConfirmedAction = async (action: () => Promise<unknown>, successMessage: string) => {
    setError(null);
    setMessage(null);
    setIsBusy(true);
    try {
      await action();
      setMessage(successMessage);
      await loadUser();
    } finally {
      setIsBusy(false);
    }
  };

  const handleBlock = (reason: string, password: string) =>
    runConfirmedAction(() => blockAdminUserRequest(userId, reason, password), 'User blocked');
  const handleUnblock = (password: string) =>
    runConfirmedAction(() => unblockAdminUserRequest(userId, password), 'User unblocked');

  const handleDelete = async (password: string) => {
    setError(null);
    setMessage(null);
    setIsBusy(true);
    try {
      await deleteAdminUserRequest(userId, password);
      navigate('/admin/users', { replace: true });
    } finally {
      setIsBusy(false);
    }
  };
  if (isLoading) return <p>Loading user...</p>;

  return (
    <section className={styles.wrapper}>
      <h2>User management</h2>

      {error && !user ? (
        <p className={styles.error}>{error}</p>
      ) : user ? (
        <>
          <div className={styles.userCard}>
            <UserManagementUserData user={user} />
            <Link className={styles.actionLink} to={`/admin/users/${user.id}/sessions`}>
              Active sessions
            </Link>
          </div>

          {error && <p className={styles.error}>{error}</p>}
          {message && <p>{message}</p>}

          <UserManagementActions
            user={user}
            isBusy={isBusy}
            onBlock={handleBlock}
            onUnblock={handleUnblock}
            onDelete={handleDelete}
          />
        </>
      ) : null}

      <Link className={styles.actionLink} to="/admin/users">
        Back to user management
      </Link>
    </section>
  );
};

export default UserManagementDetails;
