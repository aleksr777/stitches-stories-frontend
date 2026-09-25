import { type FormEvent } from 'react';
import styles from './account-settings.module.css';

type EditProfileFormProps = {
  name: string;
  age: string;
  error: string | null;
  message: string | null;
  isSubmitting: boolean;
  onNameChange: (value: string) => void;
  onAgeChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const EditProfileForm = ({
  name,
  age,
  error,
  message,
  isSubmitting,
  onNameChange,
  onAgeChange,
  onSubmit,
}: EditProfileFormProps) => (
  <form className={styles.form} onSubmit={onSubmit}>
    <label className={styles.label}>
      Имя
      <input
        className={styles.input}
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        minLength={2}
        maxLength={200}
      />
    </label>

    <label className={styles.label}>
      Возраст
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
      {isSubmitting ? 'Сохраняем…' : 'Сохранить изменения'}
    </button>
  </form>
);

export default EditProfileForm;
