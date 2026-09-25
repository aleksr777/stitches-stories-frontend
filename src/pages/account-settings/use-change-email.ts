import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUserRequest } from '../../features/users/api/users-api';
import {
  confirmContactEmailChange,
  confirmEmailChange,
  requestContactEmailChange,
  requestEmailChange,
} from '../../features/users/api/account-settings-api';
import { getAttemptsRemaining } from '../../shared/api/api-client';
import { formatCountdown } from '../../shared/model/countdown';
import { useEmailChangeLockout } from './use-email-change-lockout';

export const useChangeEmail = (contact = false) => {
  const navigate = useNavigate();
  const [newEmail, setNewEmail] = useState<string | null | undefined>(undefined);
  const [currentContactEmail, setCurrentContactEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isLocked, lockoutSeconds, maxAttempts, attemptsRemaining, syncError, resetAttempts } =
    useEmailChangeLockout(contact);

  useEffect(() => {
    if (!contact) return;
    let active = true;
    void getCurrentUserRequest()
      .then((user) => {
        if (active) setCurrentContactEmail(user.contact_email);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Не удалось загрузить профиль');
      });
    return () => {
      active = false;
    };
  }, [contact]);

  const requestChange = async (email: string | null, password?: string) => {
    try {
      setError(null);
      setIsSubmitting(true);
      if (contact) await requestContactEmailChange(email);
      else await requestEmailChange(email!, password!);
      resetAttempts();
      setNewEmail(email);
    } catch (err: unknown) {
      await syncError(err);
      setError(err instanceof Error ? err.message : 'Не удалось отправить код');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get('newEmail') ?? '').trim();
    const currentPassword = String(data.get('currentPassword') ?? '');

    if (!email) {
      setError('Enter a new email');
      return;
    }
    if (!contact && !currentPassword) {
      setError('Укажите текущий пароль');
      return;
    }
    await requestChange(email, currentPassword);
  };

  const handleRemove = () => {
    if (currentContactEmail && !isSubmitting && !isLocked) void requestChange(null);
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
      if (contact) await confirmContactEmailChange(code);
      else await confirmEmailChange(code);
      navigate(contact ? '/users/me/settings/profile' : '/users/me', { replace: true });
    } catch (err: unknown) {
      const remaining = getAttemptsRemaining(err);
      await syncError(err);
      setError(err instanceof Error ? err.message : 'Email change failed');
      if (remaining === 0) setNewEmail(undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseAnotherEmail = () => {
    setError(null);
    setNewEmail(undefined);
  };

  const lockoutMessage = isLocked
    ? `Email change is temporarily locked. Try again in ${formatCountdown(lockoutSeconds)}.`
    : null;

  return {
    newEmail,
    currentContactEmail,
    error,
    isSubmitting,
    isLocked,
    maxAttempts,
    attemptsRemaining,
    lockoutMessage,
    handleRequest,
    handleConfirm,
    handleUseAnotherEmail,
    handleRemove,
  };
};
