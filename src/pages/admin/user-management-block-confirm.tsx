import { useState } from 'react';
import styles from './user-management.module.css';

type UserManagementBlockConfirmProps = {
  isBusy: boolean;
  onConfirm: (reason: string, password: string) => Promise<void>;
  onCancel: () => void;
};

const UserManagementBlockConfirm = ({
  isBusy,
  onConfirm,
  onCancel,
}: UserManagementBlockConfirmProps) => {
  const [reason, setReason] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    try {
      setError(null);
      await onConfirm(reason, password);
      setReason('');
      setPassword('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to block user');
    }
  };

  return (
    <div className={styles.confirmPanel}>
      <label className={styles.reasonField}>
        Block reason (optional)
        <input value={reason} maxLength={255} onChange={(event) => setReason(event.target.value)} />
      </label>
      <label className={styles.reasonField}>
        Current administrator password
        <input
          type="password"
          value={password}
          autoComplete="current-password"
          minLength={8}
          maxLength={100}
          onChange={(event) => {
            setPassword(event.target.value);
            setError(null);
          }}
        />
      </label>
      <p>Confirm blocking this user?</p>
      <div className={styles.actions}>
        <button
          type="button"
          disabled={isBusy || password.length < 8 || password.length > 100}
          onClick={() => void handleConfirm()}
        >
          Confirm block
        </button>
        <button type="button" disabled={isBusy} onClick={onCancel}>
          Cancel
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default UserManagementBlockConfirm;
