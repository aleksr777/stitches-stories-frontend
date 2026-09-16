import { useCallback, useState } from 'react';
import {
  getAttemptsRemaining,
  getRetryAfterSeconds,
  isVerificationLocked,
} from '../api/api-client';
import { useCountdown } from './countdown';

type VerificationRequestResult = {
  message: string;
  retry_after: number;
  max_attempts: number;
};

export const useVerificationRequestState = () => {
  const { seconds: resendSeconds, start: startResend } = useCountdown();
  const { seconds: lockoutSeconds, start: startLockout } = useCountdown();
  const [message, setMessage] = useState<string | null>(null);
  const [maxAttempts, setMaxAttempts] = useState(5);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  const applyResult = useCallback(
    (result: VerificationRequestResult) => {
      setMessage(result.message);
      setMaxAttempts(result.max_attempts);
      setAttemptsRemaining(null);
      startResend(result.retry_after);
      startLockout(0);
    },
    [startLockout, startResend],
  );

  const applyRetryError = useCallback(
    (error: unknown) => {
      const retryAfter = getRetryAfterSeconds(error);
      if (retryAfter === null) return false;

      if (isVerificationLocked(error)) {
        startLockout(retryAfter);
      } else {
        startResend(retryAfter);
      }
      return true;
    },
    [startLockout, startResend],
  );

  const applyAttemptError = useCallback(
    (error: unknown) => {
      const remaining = getAttemptsRemaining(error);
      if (remaining === null) return false;
      setAttemptsRemaining(remaining);

      if (remaining === 0) {
        const retryAfter = getRetryAfterSeconds(error);
        if (retryAfter !== null) startLockout(retryAfter);
      }
      return true;
    },
    [startLockout],
  );

  const reset = useCallback(() => {
    setMessage(null);
    setMaxAttempts(5);
    setAttemptsRemaining(null);
    startResend(0);
    startLockout(0);
  }, [startLockout, startResend]);

  return {
    resendSeconds,
    lockoutSeconds,
    isLocked: lockoutSeconds > 0,
    message,
    maxAttempts,
    attemptsRemaining,
    applyResult,
    applyRetryError,
    applyAttemptError,
    reset,
  };
};
