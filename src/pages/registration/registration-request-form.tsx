import type { FormEventHandler } from 'react';
import { formatCountdown } from '../../shared/model/countdown';
import styles from './registration.module.css';

type RegistrationRequestFormProps = {
  error: string | null;
  isSubmitting: boolean;
  isLocked: boolean;
  lockoutSeconds: number;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

const RegistrationRequestForm = ({
  error,
  isSubmitting,
  isLocked,
  lockoutSeconds,
  onSubmit,
}: RegistrationRequestFormProps) => {
  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <label className={styles.label}>
        Email
        <input
          className={styles.input}
          name="email"
          type="email"
          autoComplete="email"
          disabled={isLocked}
          required
        />
      </label>

      <label className={styles.label}>
        Password
        <input
          className={styles.input}
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={100}
          disabled={isLocked}
          required
        />
      </label>

      <label className={styles.label}>
        Repeat password
        <input
          className={styles.input}
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={100}
          disabled={isLocked}
          required
        />
      </label>

      {isLocked && (
        <p className={styles.error}>
          Registration is temporarily locked. Try again in {formatCountdown(lockoutSeconds)}.
        </p>
      )}
      {error && <p className={styles.error}>{error}</p>}

      <button className={styles.button} type="submit" disabled={isSubmitting || isLocked}>
        {isSubmitting ? 'Sending code...' : 'Create account'}
      </button>
    </form>
  );
};

export default RegistrationRequestForm;
