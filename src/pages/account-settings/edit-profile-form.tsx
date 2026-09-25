import { type FormEvent } from 'react';
import styles from './account-settings.module.css';

type EditProfileFormProps = {
  name: string;
  error: string | null;
  message: string | null;
  isSubmitting: boolean;
  onNameChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const EditProfileForm = ({
  name,
  error,
  message,
  isSubmitting,
  onNameChange,
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

    {error && <p className={styles.error}>{error}</p>}
    {message && <p className={styles.message}>{message}</p>}

    <button className={styles.button} type="submit" disabled={isSubmitting}>
      {isSubmitting ? 'Сохраняем…' : 'Сохранить изменения'}
    </button>
  </form>
);

export default EditProfileForm;
