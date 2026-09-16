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
      setError(err instanceof Error ? err.message : 'Failed to load users');
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
      <h2 className={styles.title}>User management</h2>

      <form className={styles.searchForm} onSubmit={handleSearch}>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by nickname, email or phone"
        />
        <button type="submit" disabled={isLoading}>
          Search
        </button>
      </form>

      {error && <p className={styles.error}>{error}</p>}
      {isLoading && <p>Loading users...</p>}
      {!isLoading && users.length === 0 && <p>No users found.</p>}

      <ul className={styles.userList}>
        {users.map((user) => (
          <UserManagementUser key={user.id} user={user} />
        ))}
      </ul>

      {!isLoading && total > 0 && (
        <div className={styles.pagination}>
          <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span>
            {firstResult}-{lastResult} of {total}
          </span>
          <button type="button" disabled={!hasNextPage} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </div>
      )}
    </section>
  );
};

export default UserManagement;
