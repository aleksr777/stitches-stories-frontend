import { type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { CurrentUser } from '../../features/users/api/users-api';
import styles from './account-settings.module.css';

type EditProfileFormProps = {
  name: string;
  contactEmail: string | null;
  phoneNumber: string;
  sex: NonNullable<CurrentUser['sex']> | '';
  loginEmail: string | null;
  error: string | null;
  message: string | null;
  isSubmitting: boolean;
  onNameChange: (value: string) => void;
  onPhoneNumberChange: (value: string) => void;
  onSexChange: (value: NonNullable<CurrentUser['sex']> | '') => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const EditProfileForm = ({
  name,
  contactEmail,
  phoneNumber,
  sex,
  loginEmail,
  error,
  message,
  isSubmitting,
  onNameChange,
  onPhoneNumberChange,
  onSexChange,
  onSubmit,
}: EditProfileFormProps) => (
  <form className={styles.form} onSubmit={onSubmit}>
    <label className={styles.label}>
      Имя
      <input
        className={styles.input}
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        autoComplete="name"
        minLength={2}
        maxLength={200}
      />
    </label>

    <p className={styles.message}>Контактная почта: {contactEmail ?? 'не указана'}</p>
    <Link to="/users/me/settings/contact-email">Изменить контактную почту по коду</Link>
    <label className={styles.label}>
      Телефон
      <input
        className={styles.input}
        type="tel"
        autoComplete="tel"
        pattern="[+0-9 ()\-]{6,30}"
        maxLength={30}
        value={phoneNumber}
        onChange={(event) => onPhoneNumberChange(event.target.value)}
      />
    </label>
    <label className={styles.label}>
      Пол
      <select
        className={styles.input}
        value={sex}
        onChange={(event) =>
          onSexChange(event.target.value as NonNullable<CurrentUser['sex']> | '')
        }
      >
        <option value="">Не указывать</option>
        <option value="female">Женский</option>
        <option value="male">Мужской</option>
      </select>
    </label>
    <p className={styles.message}>
      Имя и контакты подставятся в заявку. Контактная почта не меняет почту для входа. Если данные
      получены из Яндекс ID или VK ID, изменения на этом сайте не изменят их в этих сервисах.
    </p>
    {loginEmail && (
      <p className={styles.message}>
        Почта для входа: {loginEmail}.{' '}
        <Link to="/users/me/settings/email">Сменить почту для входа</Link>
      </p>
    )}

    {error && (
      <p role="alert" className={styles.error}>
        {error}
      </p>
    )}
    {message && (
      <p role="status" className={styles.message}>
        {message}
      </p>
    )}

    <button className={styles.button} type="submit" disabled={isSubmitting}>
      {isSubmitting ? 'Сохраняем…' : 'Сохранить изменения'}
    </button>
  </form>
);

export default EditProfileForm;
