import { Link, Navigate } from 'react-router-dom';
import RegistrationConfirmForm from './registration-confirm-form';
import RegistrationRequestForm from './registration-request-form';
import { useRegistration } from './use-registration';
import styles from './registration.module.css';

const Registration = () => {
  const {
    isAuth,
    isInitializing,
    isCodeStep,
    error,
    isSubmitting,
    verification,
    handleRegistrationRequest,
    handleRegistrationConfirm,
    handleResend,
    handleUseAnotherEmail,
  } = useRegistration();

  if (isInitializing) return <p>Loading...</p>;
  if (isAuth) return <Navigate to="/users/me" replace />;

  return (
    <section className={styles.wrapper}>
      <h2 className={styles.title}>Registration</h2>
      {isCodeStep ? (
        <RegistrationConfirmForm
          message={verification.message}
          error={error}
          isSubmitting={isSubmitting}
          resendSeconds={verification.resendSeconds}
          maxAttempts={verification.maxAttempts}
          attemptsRemaining={verification.attemptsRemaining}
          onSubmit={handleRegistrationConfirm}
          onResend={() => void handleResend()}
          onUseAnotherEmail={handleUseAnotherEmail}
        />
      ) : (
        <RegistrationRequestForm
          error={error}
          isSubmitting={isSubmitting}
          isLocked={verification.isLocked}
          lockoutSeconds={verification.lockoutSeconds}
          onSubmit={handleRegistrationRequest}
        />
      )}
      <Link className={styles.link} to="/auth/password-reset">
        Forgot password?
      </Link>
      <Link className={styles.link} to="/auth/login">
        Login
      </Link>
    </section>
  );
};

export default Registration;
