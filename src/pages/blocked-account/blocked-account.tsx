import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import type { BlockedAccountInfo } from '../../features/auth/api/auth-api';
import { useAuth } from '../../features/auth/model/use-auth';
import styles from './blocked-account.module.css';

type BlockedLocationState = {
  blockedInfo?: BlockedAccountInfo;
};

const BlockedAccount = () => {
  const { isAuth, isInitializing } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [blockedInfo] = useState<BlockedAccountInfo | null>(() => {
    const state = location.state as BlockedLocationState | null;
    return state?.blockedInfo ?? null;
  });

  useEffect(() => {
    if (blockedInfo) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [blockedInfo, location.pathname, navigate]);

  if (isInitializing) return <p>Loading...</p>;
  if (isAuth) return <Navigate to="/" replace />;
  if (!blockedInfo) return <Navigate to="/auth/login" replace />;

  return (
    <section className={styles.wrapper}>
      <h2 className={styles.title}>Account blocked</h2>
      <p>Your account has been blocked by an administrator.</p>
      <p>
        <strong>Reason:</strong> {blockedInfo.blocked_reason ?? 'No reason provided.'}
      </p>
      <p>
        Contact administrator:{' '}
        <a href={`mailto:${blockedInfo.contact_email}`}>{blockedInfo.contact_email}</a>
      </p>
      <Link to="/auth/login">Back to login</Link>
    </section>
  );
};

export default BlockedAccount;
