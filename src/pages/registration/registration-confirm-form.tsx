import type { FormEventHandler } from 'react';
import { formatCountdown } from '../../shared/model/countdown';
import styles from './registration.module.css';

type RegistrationConfirmFormProps = {
  message: string | null;
  error: string | null;
  isSubmitting: boolean;
  resendSeconds: number;
  maxAttempts: number;
  attemptsRemaining: number | null;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onResend: () => void;
  onUseAnotherEmail: () => void;
};

const RegistrationConfirmForm = ({
  message,
  error,
  isSubmitting,
  resendSeconds,
  maxAttempts,
  attemptsRemaining,
  onSubmit,
  onResend,
  onUseAnotherEmail,
}: RegistrationConfirmFormProps) => {
  return (
    <form className={styles.form} onSubmit={onSubmit}>
      {message && <p className={styles.message}>{message}</p>}

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

      <p className={styles.message}>Maximum {maxAttempts} incorrect code attempts.</p>
      {attemptsRemaining !== null && (
        <p className={styles.message}>Attempts remaining: {attemptsRemaining}.</p>
      )}
      {resendSeconds > 0 && (
        <p className={styles.message}>
          You can request a new code in {formatCountdown(resendSeconds)}.
        </p>
      )}

      {error && <p className={styles.error}>{error}</p>}

      <button
        className={styles.button}
        type="submit"
        disabled={isSubmitting || attemptsRemaining === 0}
      >
        {isSubmitting ? 'Confirming...' : 'Confirm registration'}
      </button>

      <button
        className={styles.secondaryButton}
        type="button"
        disabled={isSubmitting || resendSeconds > 0}
        onClick={onResend}
      >
        Resend code
      </button>

      <button
        className={styles.secondaryButton}
        type="button"
        disabled={isSubmitting}
        onClick={onUseAnotherEmail}
      >
        Use another email
      </button>
    </form>
  );
};

export default RegistrationConfirmForm;
