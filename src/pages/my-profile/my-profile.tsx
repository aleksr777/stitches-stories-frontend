import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/model/use-auth';
import { getCurrentUserRequest, type CurrentUser } from '../../features/users/api/users-api';
import styles from './my-profile.module.css';

const MyProfile = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const currentUser = await getCurrentUserRequest();
        if (isMounted) setUser(currentUser);
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load user');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      setIsLogoutLoading(true);
      await logout();
      navigate('/', { replace: true });
    } catch {
      navigate('/', { replace: true });
    }
  };

  if (isLoading) return <p>Loading profile...</p>;
  if (error) return <p>{error}</p>;
  if (!user) return <p>User not found</p>;

  return (
    <section className={styles.wrapper}>
      <h2 className={styles.title}>My profile</h2>

      <div className={styles.info}>
        <span>Nickname: {user.nickname ?? 'No nickname'}</span>
        <span>Email: {user.email}</span>
        <span>Name: {user.name ?? '—'}</span>
        <span>Age: {user.age ?? '—'}</span>
      </div>

      <Link className={styles.settingsLink} to="/users/me/settings/profile">
        Edit profile
      </Link>
      <Link className={styles.settingsLink} to="/users/me/settings/password">
        Change password
      </Link>
      <Link className={styles.settingsLink} to="/users/me/settings/email">
        Change email
      </Link>
      <Link className={styles.settingsLink} to="/users/me/sessions">
        Active sessions
      </Link>

      {user.role !== 'admin' && (
        <Link className={styles.dangerLink} to="/users/me/settings/delete">
          Delete profile
        </Link>
      )}

      <button
        className={styles.logoutButton}
        type="button"
        onClick={handleLogout}
        disabled={isLogoutLoading}
      >
        {isLogoutLoading ? 'Signing out...' : 'Logout'}
      </button>
    </section>
  );
};

export default MyProfile;
