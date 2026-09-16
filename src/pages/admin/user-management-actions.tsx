import { useState } from 'react';
import type { AdminUser } from '../../features/admin/api/admin-api';
import UserManagementBlockConfirm from './user-management-block-confirm';
import UserManagementPasswordConfirm from './user-management-delete-confirm';
import styles from './user-management.module.css';

type UserManagementActionsProps = {
  user: AdminUser;
  isBusy: boolean;
  onBlock: (reason: string, password: string) => Promise<void>;
  onUnblock: (password: string) => Promise<void>;
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
  const [isUnblockConfirming, setIsUnblockConfirming] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);

  if (user.role === 'admin') {
    return <p>Administrator account cannot be blocked or deleted.</p>;
  }

  const handleConfirmBlock = async (reason: string, password: string) => {
    await onBlock(reason, password);
    setIsBlockConfirming(false);
  };

  const handleConfirmUnblock = async (password: string) => {
    await onUnblock(password);
    setIsUnblockConfirming(false);
  };

  const handleConfirmDelete = async (password: string) => {
    await onDelete(password);
    setIsDeleteConfirming(false);
  };

  return (
    <div className={styles.actionSection}>
      {user.is_blocked ? (
        isUnblockConfirming ? (
          <UserManagementPasswordConfirm
            isBusy={isBusy}
            onConfirm={handleConfirmUnblock}
            onCancel={() => setIsUnblockConfirming(false)}
            prompt="Unblock this user?"
            confirmLabel="Confirm unblock"
            failureMessage="Failed to unblock user"
          />
        ) : (
          <button
            type="button"
            disabled={isBusy || isDeleteConfirming}
            onClick={() => setIsUnblockConfirming(true)}
          >
            Unblock user
          </button>
        )
      ) : isBlockConfirming ? (
        <UserManagementBlockConfirm
          isBusy={isBusy}
          onConfirm={handleConfirmBlock}
          onCancel={() => setIsBlockConfirming(false)}
        />
      ) : (
        <button
          type="button"
          disabled={isBusy || isDeleteConfirming}
          onClick={() => setIsBlockConfirming(true)}
        >
          Block user
        </button>
      )}

      {isDeleteConfirming ? (
        <UserManagementPasswordConfirm
          isBusy={isBusy}
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsDeleteConfirming(false)}
        />
      ) : (
        <button
          type="button"
          disabled={isBusy || isBlockConfirming || isUnblockConfirming}
          onClick={() => setIsDeleteConfirming(true)}
        >
          Delete user
        </button>
      )}
    </div>
  );
};

export default UserManagementActions;
