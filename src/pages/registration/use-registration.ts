import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/model/use-auth';
import { getAttemptsRemaining, isVerificationLocked } from '../../shared/api/api-client';
import { useVerificationRequestState } from '../../shared/model/verification-request';

export const useRegistration = () => {
  const { isAuth, isInitializing, requestRegistration, resendRegistration, confirmRegistration } =
    useAuth();
  const navigate = useNavigate();
  const verification = useVerificationRequestState();
  const [isCodeStep, setIsCodeStep] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegistrationRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '')
      .trim()
      .toLowerCase();
    const password = String(formData.get('password') ?? '');
    const passwordConfirm = String(formData.get('passwordConfirm') ?? '');

    if (!email || !password || !passwordConfirm) return setError('Fill in all fields');
    if (password.length < 12 || password.length > 100) {
      return setError('Password must contain from 12 to 100 characters');
    }
    if (password !== passwordConfirm) return setError('Passwords do not match');

    try {
      setError(null);
      setIsSubmitting(true);
      verification.applyResult(await requestRegistration(email, password));
      setPendingEmail(email);
      setIsCodeStep(true);
    } catch (err: unknown) {
      verification.applyRetryError(err);
      setPendingEmail(email);
      if (!isVerificationLocked(err)) setIsCodeStep(true);
      setError(err instanceof Error ? err.message : 'Registration request failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegistrationConfirm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get('code') ?? '').trim();
    if (!/^\d{6}$/.test(code)) return setError('Enter the 6-digit code');
    if (!pendingEmail) {
      setError('Request a new registration code');
      setIsCodeStep(false);
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      await confirmRegistration(code, pendingEmail);
      navigate('/users/me', { replace: true });
    } catch (err: unknown) {
      verification.applyAttemptError(err);
      verification.applyRetryError(err);
      const attemptsRemaining = getAttemptsRemaining(err);
      if (attemptsRemaining === 0 || isVerificationLocked(err)) setIsCodeStep(false);
      setError(err instanceof Error ? err.message : 'Registration confirmation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!pendingEmail) return;
    try {
      setError(null);
      setIsSubmitting(true);
      verification.applyResult(await resendRegistration(pendingEmail));
    } catch (err: unknown) {
      verification.applyRetryError(err);
      if (isVerificationLocked(err)) setIsCodeStep(false);
      setError(err instanceof Error ? err.message : 'Failed to resend registration code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseAnotherEmail = () => {
    setError(null);
    setPendingEmail('');
    verification.reset();
    setIsCodeStep(false);
  };

  return {
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
  };
};
