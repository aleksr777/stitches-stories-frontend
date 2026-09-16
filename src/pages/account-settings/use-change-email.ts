import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  confirmEmailChange,
  requestEmailChange,
} from '../../features/users/api/account-settings-api';
import { getAttemptsRemaining } from '../../shared/api/api-client';
import { formatCountdown } from '../../shared/model/countdown';
import { useEmailChangeLockout } from './use-email-change-lockout';

export const useChangeEmail = () => {
  const navigate = useNavigate();
  const [newEmail, setNewEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isLocked, lockoutSeconds, maxAttempts, attemptsRemaining, syncError, resetAttempts } =
    useEmailChangeLockout();

  const handleRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get('newEmail') ?? '').trim();
    const currentPassword = String(data.get('currentPassword') ?? '');

    if (!email) {
      setError('Enter a new email');
      return;
    }
    if (!currentPassword) {
      setError('Enter your current password');
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      await requestEmailChange(email, currentPassword);
      resetAttempts();
      setNewEmail(email);
    } catch (err: unknown) {
      await syncError(err);
      setError(err instanceof Error ? err.message : 'Email change request failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get('code') ?? '').trim();

    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code');
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      await confirmEmailChange(code);
      navigate('/users/me', { replace: true });
    } catch (err: unknown) {
      const remaining = getAttemptsRemaining(err);
      await syncError(err);
      setError(err instanceof Error ? err.message : 'Email change failed');
      if (remaining === 0) setNewEmail(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseAnotherEmail = () => {
    setError(null);
    setNewEmail(null);
  };

  const lockoutMessage = isLocked
    ? `Email change is temporarily locked. Try again in ${formatCountdown(lockoutSeconds)}.`
    : null;

  return {
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
  };
};
