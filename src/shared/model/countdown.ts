import { useCallback, useEffect, useState } from 'react';

export const formatCountdown = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

export const useCountdown = () => {
  const [seconds, setSeconds] = useState(0);

  const start = useCallback((durationSeconds: number) => {
    setSeconds(Math.max(0, Math.ceil(durationSeconds)));
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;

    const timeoutId = window.setTimeout(() => {
      setSeconds((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [seconds]);

  return { seconds, start };
};
