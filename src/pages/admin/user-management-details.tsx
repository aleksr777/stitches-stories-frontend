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
      setError('Некорректный идентификатор пользователя.');
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      setUser(await getAdminUserRequest(userId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить данные пользователя.');
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось выполнить действие.');
      throw err;
    } finally {
      setIsBusy(false);
    }
  };

  const handleBlock = (reason: string) =>
    runConfirmedAction(() => blockAdminUserRequest(userId, reason), 'Пользователь заблокирован.');
  const handleUnblock = () =>
    runConfirmedAction(() => unblockAdminUserRequest(userId), 'Пользователь разблокирован.');

  const handleDelete = async (password: string) => {
    setError(null);
    setMessage(null);
    setIsBusy(true);
    try {
      await deleteAdminUserRequest(userId, password);
      navigate('/admin/users', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить учётную запись.');
      throw err;
    } finally {
      setIsBusy(false);
    }
  };
  if (isLoading) return <p className={styles.notice}>Загружаем данные пользователя…</p>;

  return (
    <section className={styles.wrapper}>
      <p className="eyebrow">Управление магазином</p>
      <h1 className={styles.title}>Карточка пользователя</h1>

      {error && !user ? (
        <p className={styles.error}>{error}</p>
      ) : user ? (
        <>
          <div className={styles.userCard}>
            <UserManagementUserData user={user} />
            <Link className={styles.actionLink} to={`/admin/users/${user.id}/sessions`}>
              Активные сеансы
            </Link>
          </div>

          {error && <p className={styles.error}>{error}</p>}
          {message && <p className={styles.message}>{message}</p>}

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
        Вернуться к списку пользователей
      </Link>
    </section>
  );
};

export default UserManagementDetails;
