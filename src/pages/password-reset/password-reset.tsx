import { Link, Navigate } from 'react-router-dom';
import PasswordResetConfirmForm from './password-reset-confirm-form';
import PasswordResetRequestForm from './password-reset-request-form';
import { usePasswordReset } from './use-password-reset';
import styles from './password-reset.module.css';

const PasswordReset = () => {
  const {
    isAuth,
    isInitializing,
    isCodeStep,
    error,
    isSubmitting,
    verification,
    handleRequest,
    handleConfirm,
    handleResend,
    handleUseAnotherEmail,
  } = usePasswordReset();

  if (isInitializing) return <p>Loading...</p>;
  if (isAuth) return <Navigate to="/users/me" replace />;

  return (
    <section className={styles.wrapper}>
      <h2 className={styles.title}>Password recovery</h2>
      {isCodeStep ? (
        <PasswordResetConfirmForm
          message={verification.message}
          error={error}
          isSubmitting={isSubmitting}
          resendSeconds={verification.resendSeconds}
          maxAttempts={verification.maxAttempts}
          attemptsRemaining={verification.attemptsRemaining}
          onSubmit={handleConfirm}
          onResend={() => void handleResend()}
          onUseAnotherEmail={handleUseAnotherEmail}
        />
      ) : (
        <PasswordResetRequestForm
          error={error}
          isSubmitting={isSubmitting}
          isLocked={verification.isLocked}
          lockoutSeconds={verification.lockoutSeconds}
          onSubmit={handleRequest}
        />
      )}
      <div className={styles.authLinks}>
        <Link to="/auth/login">Login</Link>
        <Link to="/auth/registration">Registration</Link>
      </div>
    </section>
  );
};

export default PasswordReset;
