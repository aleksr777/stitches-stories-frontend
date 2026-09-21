import { useState } from 'react';
import type { AdminUser } from '../../features/admin/api/admin-api';
import UserManagementBlockConfirm from './user-management-block-confirm';
import UserManagementPasswordConfirm from './user-management-delete-confirm';
import styles from './user-management.module.css';

type UserManagementActionsProps = {
  user: AdminUser;
  isBusy: boolean;
  onBlock: (reason: string) => Promise<void>;
  onUnblock: () => Promise<void>;
  onDelete: (password: string) => Promise<void>;
};

const UserManagementActions = ({
  user,
  isBusy,
  onBlock,
  onUnblock,
  onDelete,
}: UserManagementActionsProps) => {
  const [isBlockConfirming, setIsBlockConfirming] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);

  if (user.role === 'admin') {
    return (
      <p className={styles.notice}>Учётную запись владельца нельзя заблокировать или удалить.</p>
    );
  }

  const handleConfirmBlock = async (reason: string) => {
    await onBlock(reason);
    setIsBlockConfirming(false);
  };

  const handleConfirmDelete = async (password: string) => {
    await onDelete(password);
    setIsDeleteConfirming(false);
  };

  return (
    <div className={styles.actionSection}>
      {user.is_blocked ? (
        <button
          type="button"
          className={styles.secondaryButton}
          disabled={isBusy || isDeleteConfirming}
          onClick={() => void onUnblock().catch(() => undefined)}
        >
          Разблокировать
        </button>
      ) : isBlockConfirming ? (
        <UserManagementBlockConfirm
          isBusy={isBusy}
          onConfirm={handleConfirmBlock}
          onCancel={() => setIsBlockConfirming(false)}
        />
      ) : (
        <button
          type="button"
          className={styles.secondaryButton}
          disabled={isBusy || isDeleteConfirming}
          onClick={() => setIsBlockConfirming(true)}
        >
          Заблокировать
        </button>
      )}

      {isDeleteConfirming ? (
        <UserManagementPasswordConfirm
          isBusy={isBusy}
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsDeleteConfirming(false)}
          prompt="Удалить учётную запись без возможности восстановления?"
          confirmLabel="Удалить учётную запись"
          failureMessage="Не удалось удалить учётную запись"
        />
      ) : (
        <button
          type="button"
          className={styles.dangerButton}
          disabled={isBusy || isBlockConfirming}
          onClick={() => setIsDeleteConfirming(true)}
        >
          Удалить
        </button>
      )}
    </div>
  );
};

export default UserManagementActions;
