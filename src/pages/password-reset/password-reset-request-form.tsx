import { type FormEvent } from 'react';
import { formatCountdown } from '../../shared/model/countdown';
import styles from './password-reset.module.css';

type PasswordResetRequestFormProps = {
  error: string | null;
  isSubmitting: boolean;
  isLocked: boolean;
  lockoutSeconds: number;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const PasswordResetRequestForm = ({
  error,
  isSubmitting,
  isLocked,
  lockoutSeconds,
  onSubmit,
}: PasswordResetRequestFormProps) => {
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

      {isLocked && (
        <p className={styles.error}>
          Password reset is temporarily locked. Try again in {formatCountdown(lockoutSeconds)}.
        </p>
      )}
      {error && <p className={styles.error}>{error}</p>}

      <button className={styles.button} type="submit" disabled={isSubmitting || isLocked}>
        {isSubmitting ? 'Sending code...' : 'Send reset code'}
      </button>
    </form>
  );
};

export default PasswordResetRequestForm;
