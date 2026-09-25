import { type FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getCurrentUserRequest,
  updateCurrentUserRequest,
  type CurrentUser,
  type UpdateCurrentUserData,
} from '../../features/users/api/users-api';
import EditProfileForm from './edit-profile-form';
import YandexProfileDetails from './yandex-profile-details';
import styles from './account-settings.module.css';

const EditProfile = () => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const applyUser = (currentUser: CurrentUser) => {
    setUser(currentUser);
    setName(currentUser.name ?? '');
  };

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const currentUser = await getCurrentUserRequest();
        if (isMounted) applyUser(currentUser);
      } catch (err: unknown) {
        if (isMounted)
          setError(err instanceof Error ? err.message : 'Не удалось загрузить профиль');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    const nextName = name.trim();
    const patch: UpdateCurrentUserData = {};

    if (nextName !== (user.name ?? '')) {
      if (!nextName) return setError('Укажите имя');
      patch.name = nextName;
    }
    if (Object.keys(patch).length === 0) {
      setError(null);
      setMessage('No changes to save');
      return;
    }

    try {
      setError(null);
      setMessage(null);
      setIsSubmitting(true);
      applyUser(await updateCurrentUserRequest(patch));
      setMessage('Профиль обновлён');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось обновить профиль');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <p>Загружаем профиль…</p>;
  if (error && !user) return <p>{error}</p>;

  return (
    <section className={styles.wrapper}>
      <h2 className={styles.title}>Мои данные</h2>
      <EditProfileForm
        name={name}
        error={error}
        message={message}
        isSubmitting={isSubmitting}
        onNameChange={setName}
        onSubmit={handleSubmit}
      />
      <YandexProfileDetails user={user} />
      <Link className={styles.link} to="/users/me">
        Вернуться в профиль
      </Link>
    </section>
  );
};

export default EditProfile;
