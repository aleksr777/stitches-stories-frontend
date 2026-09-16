import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  confirmCurrentUserPasswordReset,
  confirmPasswordChange,
  requestCurrentUserPasswordReset,
  requestPasswordChange,
} from '../../features/users/api/account-settings-api';
import PasswordCurrentForm from './password-current-form';
import PasswordNewForm from './password-new-form';
import PasswordResetForm from './password-reset-form';
import { getNewPasswords, getPasswordValidationError } from './password-form-utils';
import styles from './account-settings.module.css';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState<string | null>(null);
  const [isReset, setIsReset] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validatePasswords = (password: string, confirm: string) => {
    const validationError = getPasswordValidationError(password, confirm);
    setError(validationError);
    return validationError === null;
  };

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const oldPassword = String(new FormData(event.currentTarget).get('oldPassword') ?? '');
    try {
      setError(null);
      setIsSubmitting(true);
      setCode((await requestPasswordChange(oldPassword)).code);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to verify password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      setError(null);
      setIsSubmitting(true);
      await requestCurrentUserPasswordReset();
      setIsReset(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send confirmation code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateToProfile = () => {
    navigate('/users/me', { replace: true });
  };

  const handleChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!code) return;
    const { newPassword, confirm } = getNewPasswords(event.currentTarget);
    if (!validatePasswords(newPassword, confirm)) return;
    try {
      setError(null);
      setIsSubmitting(true);
      await confirmPasswordChange(code, newPassword);
      navigateToProfile();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Password change failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const resetCode = String(data.get('code') ?? '').trim();
    const { newPassword, confirm } = getNewPasswords(event.currentTarget);
    if (!/^\d{6}$/.test(resetCode) || !validatePasswords(newPassword, confirm)) {
      if (!/^\d{6}$/.test(resetCode)) setError('Enter the 6-digit code');
      return;
    }
    try {
      setError(null);
      setIsSubmitting(true);
      await confirmCurrentUserPasswordReset(resetCode, newPassword);
      navigateToProfile();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Password reset failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.wrapper}>
      <h2 className={styles.title}>Change password</h2>
      {isReset ? (
        <PasswordResetForm error={error} isSubmitting={isSubmitting} onSubmit={handleReset} />
      ) : code ? (
        <PasswordNewForm error={error} isSubmitting={isSubmitting} onSubmit={handleChange} />
      ) : (
        <PasswordCurrentForm
          error={error}
          isSubmitting={isSubmitting}
          onSubmit={handleVerify}
          onForgotPassword={handleForgotPassword}
        />
      )}
      <Link className={styles.link} to="/users/me">
        Back to profile
      </Link>
    </section>
  );
};

export default ChangePassword;
