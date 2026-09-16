import type { FormEventHandler } from 'react';
import styles from './account-settings.module.css';

type PasswordNewFormProps = {
  error: string | null;
  isSubmitting: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

const PasswordNewForm = ({ error, isSubmitting, onSubmit }: PasswordNewFormProps) => (
  <form className={styles.form} onSubmit={onSubmit}>
    <label className={styles.label}>
      New password
      <input
        className={styles.input}
        name="newPassword"
        type="password"
        autoComplete="new-password"
        minLength={12}
        maxLength={100}
        required
      />
    </label>

    <label className={styles.label}>
      Repeat new password
      <input
        className={styles.input}
        name="newPasswordConfirm"
        type="password"
        autoComplete="new-password"
        minLength={12}
        maxLength={100}
        required
      />
    </label>

    {error && <p className={styles.error}>{error}</p>}

    <button className={styles.button} type="submit" disabled={isSubmitting}>
      {isSubmitting ? 'Saving...' : 'Change password'}
    </button>
  </form>
);

export default PasswordNewForm;
