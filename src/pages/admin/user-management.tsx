import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { getAdminUsersRequest, type AdminUser } from '../../features/admin/api/admin-api';
import UserManagementUser from './user-management-user';
import styles from './user-management.module.css';

const PAGE_SIZE = 10;

const UserManagement = () => {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUsers = useCallback(async (currentQuery: string, currentPage: number) => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await getAdminUsersRequest(currentQuery, PAGE_SIZE, currentPage * PAGE_SIZE);
      setUsers(response.users);
      setTotal(response.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить список пользователей.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers(query, page);
  }, [loadUsers, page, query]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = search.trim();

    if (nextQuery === query && page === 0) {
      void loadUsers(nextQuery, 0);
      return;
    }

    setQuery(nextQuery);
    setPage(0);
  };

  const firstResult = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const lastResult = Math.min((page + 1) * PAGE_SIZE, total);
  const hasNextPage = (page + 1) * PAGE_SIZE < total;

  return (
    <section className={styles.wrapper}>
      <p className="eyebrow">Управление магазином</p>
      <h1 className={styles.title}>Пользователи</h1>

      <form className={styles.searchForm} onSubmit={handleSearch}>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Поиск пользователей"
          placeholder="Имя, почта или телефон"
        />
        <button className={styles.primaryButton} type="submit" disabled={isLoading}>
          Найти
        </button>
      </form>

      {error && <p className={styles.error}>{error}</p>}
      {isLoading && <p className={styles.notice}>Загружаем пользователей…</p>}
      {!isLoading && users.length === 0 && (
        <p className={styles.empty}>По этому запросу пользователей не нашлось.</p>
      )}

      <ul className={styles.userList}>
        {users.map((user) => (
          <UserManagementUser key={user.id} user={user} />
        ))}
      </ul>

      {!isLoading && total > 0 && (
        <div className={styles.pagination}>
          <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>
            Назад
          </button>
          <span>
            {firstResult}–{lastResult} из {total}
          </span>
          <button type="button" disabled={!hasNextPage} onClick={() => setPage(page + 1)}>
            Далее
          </button>
        </div>
      )}
    </section>
  );
};

export default UserManagement;
