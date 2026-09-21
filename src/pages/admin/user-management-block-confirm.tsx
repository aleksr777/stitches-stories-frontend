import { useState } from 'react';
import styles from './user-management.module.css';

type UserManagementBlockConfirmProps = {
  isBusy: boolean;
  onConfirm: (reason: string) => Promise<void>;
  onCancel: () => void;
};

const UserManagementBlockConfirm = ({
  isBusy,
  onConfirm,
  onCancel,
}: UserManagementBlockConfirmProps) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    try {
      setError(null);
      await onConfirm(reason);
      setReason('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось заблокировать пользователя');
    }
  };

  return (
    <div className={styles.confirmPanel}>
      <label className={styles.reasonField}>
        Причина блокировки (необязательно)
        <input value={reason} maxLength={255} onChange={(event) => setReason(event.target.value)} />
      </label>
      <p>После блокировки все активные сеансы этого покупателя будут завершены.</p>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondaryButton}
          disabled={isBusy}
          onClick={() => void handleConfirm()}
        >
          Подтвердить блокировку
        </button>
        <button type="button" className={styles.textButton} disabled={isBusy} onClick={onCancel}>
          Отмена
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default UserManagementBlockConfirm;
