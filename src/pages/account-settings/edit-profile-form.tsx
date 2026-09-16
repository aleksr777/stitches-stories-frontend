import { type FormEvent } from 'react';
import styles from './account-settings.module.css';

type EditProfileFormProps = {
  nickname: string;
  name: string;
  age: string;
  error: string | null;
  message: string | null;
  isSubmitting: boolean;
  onNicknameChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onAgeChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const EditProfileForm = ({
  nickname,
  name,
  age,
  error,
  message,
  isSubmitting,
  onNicknameChange,
  onNameChange,
  onAgeChange,
  onSubmit,
}: EditProfileFormProps) => (
  <form className={styles.form} onSubmit={onSubmit}>
    <label className={styles.label}>
      Nickname
      <input
        className={styles.input}
        value={nickname}
        onChange={(event) => onNicknameChange(event.target.value)}
        minLength={2}
        maxLength={50}
      />
    </label>

    <label className={styles.label}>
      Name
      <input
        className={styles.input}
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        minLength={2}
        maxLength={200}
      />
    </label>

    <label className={styles.label}>
      Age
      <input
        className={styles.input}
        value={age}
        onChange={(event) => onAgeChange(event.target.value)}
        type="number"
        min={0}
        max={200}
        step={1}
      />
    </label>

    {error && <p className={styles.error}>{error}</p>}
    {message && <p className={styles.message}>{message}</p>}

    <button className={styles.button} type="submit" disabled={isSubmitting}>
      {isSubmitting ? 'Saving...' : 'Save changes'}
    </button>
  </form>
);

export default EditProfileForm;
