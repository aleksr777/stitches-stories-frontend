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
  const [nickname, setNickname] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const applyUser = (currentUser: CurrentUser) => {
    setUser(currentUser);
    setNickname(currentUser.nickname ?? '');
    setName(currentUser.name ?? '');
    setAge(currentUser.age === null ? '' : String(currentUser.age));
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

    const nextNickname = nickname.trim();
    const nextName = name.trim();
    const nextAge = age.trim();
    const patch: UpdateCurrentUserData = {};

    if (nextNickname !== (user.nickname ?? '')) {
      if (!nextNickname) return setError('Укажите псевдоним');
      patch.nickname = nextNickname;
    }
    if (nextName !== (user.name ?? '')) {
      if (!nextName) return setError('Укажите имя');
      patch.name = nextName;
    }
    if (nextAge !== (user.age === null ? '' : String(user.age))) {
      if (!nextAge) return setError('Укажите возраст');
      const parsedAge = Number(nextAge);
      if (!Number.isInteger(parsedAge) || parsedAge < 0 || parsedAge > 200) {
        return setError('Укажите целый возраст от 0 до 200');
      }
      patch.age = parsedAge;
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
        nickname={nickname}
        name={name}
        age={age}
        error={error}
        message={message}
        isSubmitting={isSubmitting}
        onNicknameChange={setNickname}
        onNameChange={setName}
        onAgeChange={setAge}
        onSubmit={handleSubmit}
      />
      <Link className={styles.link} to="/users/me">
        Вернуться в профиль
      </Link>
    </section>
  );
};

export default EditProfile;
