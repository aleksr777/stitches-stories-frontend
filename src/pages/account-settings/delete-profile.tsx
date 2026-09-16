import { type FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  deleteCurrentUserRequest,
  getCurrentUserRequest,
} from '../../features/users/api/users-api';
import styles from './account-settings.module.css';

const DeleteProfile = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadRole = async () => {
      try {
        const user = await getCurrentUserRequest();
        if (isMounted) setIsAdmin(user.role === 'admin');
      } catch (err: unknown) {
        if (isMounted) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load user');
        }
      }
    };

    void loadRole();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get('password') ?? '');

    try {
      setSubmitError(null);
      setIsSubmitting(true);
      await deleteCurrentUserRequest(password);
      window.location.replace('/');
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Profile deletion failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAdmin === null && !loadError) {
    return <p>Loading profile...</p>;
  }

  return (
    <section className={styles.wrapper}>
      <h2 className={styles.title}>Delete profile</h2>

      {isAdmin ? (
        <p className={styles.warning}>Administrator profile cannot be deleted.</p>
      ) : loadError ? (
        <p className={styles.error}>{loadError}</p>
      ) : (
        <>
          <p className={styles.warning}>This action is permanent and cannot be undone.</p>
          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.label}>
              Current password
              <input
                className={styles.input}
                name="password"
                type="password"
                autoComplete="current-password"
                minLength={8}
                maxLength={100}
                required
              />
            </label>

            {submitError && <p className={styles.error}>{submitError}</p>}

            <button className={styles.dangerButton} type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete profile'}
            </button>
          </form>
        </>
      )}

      <Link className={styles.link} to="/users/me">
        Back to profile
      </Link>
    </section>
  );
};

export default DeleteProfile;
