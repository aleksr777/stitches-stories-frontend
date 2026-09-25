import { type FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getCurrentUserRequest,
  updateCurrentUserRequest,
  type CurrentUser,
  type UpdateCurrentUserData,
} from '../../features/users/api/users-api';
import EditProfileForm from './edit-profile-form';
import styles from './account-settings.module.css';

const EditProfile = () => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sex, setSex] = useState<NonNullable<CurrentUser['sex']> | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const applyUser = (currentUser: CurrentUser) => {
    setUser(currentUser);
    setName(currentUser.name ?? '');
    setPhoneNumber(currentUser.phone_number ?? '');
    setSex(currentUser.sex ?? '');
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

    const nextName = name.trim() || null;
    const nextPhone = phoneNumber.trim() || null;
    const nextSex = sex || null;
    const patch: UpdateCurrentUserData = {};

    if (nextName !== user.name) patch.name = nextName;
    if (nextPhone !== user.phone_number) patch.phone_number = nextPhone;
    if (nextSex !== user.sex) patch.sex = nextSex;
    if (Object.keys(patch).length === 0) {
      setError(null);
      setMessage('Нет изменений для сохранения');
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
        contactEmail={user?.contact_email ?? null}
        phoneNumber={phoneNumber}
        sex={sex}
        loginEmail={user?.email ?? null}
        error={error}
        message={message}
        isSubmitting={isSubmitting}
        onNameChange={setName}
        onPhoneNumberChange={setPhoneNumber}
        onSexChange={setSex}
        onSubmit={handleSubmit}
      />
      <Link className={styles.link} to="/users/me">
        Вернуться в профиль
      </Link>
    </section>
  );
};

export default EditProfile;
