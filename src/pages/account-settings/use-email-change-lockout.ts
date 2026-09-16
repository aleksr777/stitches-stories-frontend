import { useCallback, useEffect, useState } from 'react';
import { getEmailChangeStatus } from '../../features/users/api/account-settings-api';
import { getAttemptsRemaining, getRetryAfterSeconds } from '../../shared/api/api-client';
import { useCountdown } from '../../shared/model/countdown';

export const useEmailChangeLockout = () => {
  const { seconds: lockoutSeconds, start } = useCountdown();
  const [isLocked, setIsLocked] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState(5);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);

  const refresh = useCallback(async () => {
    const status = await getEmailChangeStatus();
    setIsLocked(status.locked);
    setMaxAttempts(status.max_attempts);
    setAttemptsRemaining(status.attempts_remaining);
    start(status.retry_after);
    return status;
  }, [start]);

  useEffect(() => {
    void refresh().catch(() => undefined);
  }, [refresh]);

  useEffect(() => {
    if (isLocked && lockoutSeconds === 0) {
      setIsLocked(false);
    }
  }, [isLocked, lockoutSeconds]);

  const syncError = useCallback(
    async (error: unknown) => {
      const remaining = getAttemptsRemaining(error);
      const retryAfter = getRetryAfterSeconds(error);
      if (remaining !== null) setAttemptsRemaining(remaining);
      if (retryAfter !== null) {
        setIsLocked(true);
        start(retryAfter);
      }
      if (remaining === 0) {
        await refresh().catch(() => undefined);
      }
    },
    [refresh, start],
  );

  const resetAttempts = useCallback(() => {
    setAttemptsRemaining(maxAttempts);
  }, [maxAttempts]);

  return {
    isLocked,
    lockoutSeconds,
    maxAttempts,
    attemptsRemaining,
    refresh,
    syncError,
    resetAttempts,
  };
};
