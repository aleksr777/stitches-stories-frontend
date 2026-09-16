import type { FormEventHandler } from 'react';
import styles from './account-settings.module.css';

type PasswordResetFormProps = {
  error: string | null;
  isSubmitting: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

const PasswordResetForm = ({ error, isSubmitting, onSubmit }: PasswordResetFormProps) => (
  <form className={styles.form} onSubmit={onSubmit}>
    <p className={styles.message}>Confirmation code sent to your account email.</p>

    <label className={styles.label}>
      Confirmation code
      <input
        className={styles.input}
        name="code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        required
      />
    </label>

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

export default PasswordResetForm;
