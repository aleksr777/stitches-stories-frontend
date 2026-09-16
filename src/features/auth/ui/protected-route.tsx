import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ApiError } from '../../../shared/api/api-error';
import { isSessionInvalidStatus } from '../../../shared/api/auth-policy.mjs';
import { validateSessionRequest } from '../api/auth-api';
import { useAuth } from '../model/use-auth';

const SESSION_HEARTBEAT_MS = 60_000;

const ProtectedRoute = () => {
  const { isAuth, isInitializing, clearSession } = useAuth();
  const location = useLocation();
  const validationId = useRef(0);
  const [validatedLocationKey, setValidatedLocationKey] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateSession = useCallback(
    async (locationKey: string, blocking = true) => {
      const currentValidationId = ++validationId.current;
      if (blocking) {
        setValidatedLocationKey(null);
        setValidationError(null);
      }

      try {
        await validateSessionRequest();
        if (currentValidationId === validationId.current && blocking) {
          setValidatedLocationKey(locationKey);
        }
      } catch (err: unknown) {
        if (currentValidationId !== validationId.current) return;
        if (err instanceof ApiError && isSessionInvalidStatus(err.status)) {
          clearSession();
          return;
        }
        if (blocking) setValidationError('Unable to verify the session. Please try again.');
      }
    },
    [clearSession],
  );

  useEffect(() => {
    if (isInitializing || !isAuth) return;
    void validateSession(location.key);
  }, [isAuth, isInitializing, location.key, validateSession]);

  useEffect(() => {
    if (isInitializing || !isAuth || validatedLocationKey !== location.key) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void validateSession(location.key, false);
      }
    };
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void validateSession(location.key, false);
      }
    }, SESSION_HEARTBEAT_MS);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.clearInterval(interval);
    };
  }, [isAuth, isInitializing, location.key, validatedLocationKey, validateSession]);

  if (isInitializing) return <p>Loading...</p>;
  if (!isAuth) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (validatedLocationKey !== location.key) {
    if (validationError) {
      return (
        <div>
          <p>{validationError}</p>
          <button type="button" onClick={() => void validateSession(location.key)}>
            Retry
          </button>
        </div>
      );
    }
    return <p>Checking session...</p>;
  }

  return <Outlet />;
};

export default ProtectedRoute;
