import { Link } from 'react-router-dom';
import { useChangeEmail } from './use-change-email';
import styles from './account-settings.module.css';

const ChangeEmail = () => {
  const {
    newEmail,
    error,
    isSubmitting,
    isLocked,
    maxAttempts,
    attemptsRemaining,
    lockoutMessage,
    handleRequest,
    handleConfirm,
    handleUseAnotherEmail,
  } = useChangeEmail();

  return (
    <section className={styles.wrapper}>
      <h2 className={styles.title}>Change email</h2>
      {!newEmail ? (
        <form className={styles.form} onSubmit={handleRequest}>
          <label className={styles.label}>
            New email
            <input
              className={styles.input}
              name="newEmail"
              type="email"
              autoComplete="email"
              disabled={isLocked}
              required
            />
          </label>
          <label className={styles.label}>
            Current password
            <input
              className={styles.input}
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              disabled={isLocked}
              required
            />
          </label>
          {lockoutMessage && <p className={styles.error}>{lockoutMessage}</p>}
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.button} type="submit" disabled={isSubmitting || isLocked}>
            {isSubmitting ? 'Sending code...' : 'Continue'}
          </button>
        </form>
      ) : (
        <form className={styles.form} onSubmit={handleConfirm}>
          <p className={styles.message}>Confirmation code sent to {newEmail}</p>
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
              disabled={isLocked || attemptsRemaining === 0}
              required
            />
          </label>
          <p className={styles.message}>Maximum {maxAttempts} incorrect code attempts.</p>
          <p className={styles.message}>Attempts remaining: {attemptsRemaining}.</p>
          {lockoutMessage && <p className={styles.error}>{lockoutMessage}</p>}
          {error && <p className={styles.error}>{error}</p>}
          <button
            className={styles.button}
            type="submit"
            disabled={isSubmitting || isLocked || attemptsRemaining === 0}
          >
            {isSubmitting ? 'Saving...' : 'Change email'}
          </button>
          <button
            className={styles.secondaryButton}
            type="button"
            disabled={isSubmitting}
            onClick={handleUseAnotherEmail}
          >
            Use another email
          </button>
        </form>
      )}
      <Link className={styles.link} to="/users/me">
        Back to profile
      </Link>
    </section>
  );
};

export default ChangeEmail;
