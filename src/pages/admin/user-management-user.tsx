import { Link } from 'react-router-dom';
import type { AdminUser } from '../../features/admin/api/admin-api';
import UserManagementUserData from './user-management-user-data';
import styles from './user-management.module.css';

type UserManagementUserProps = {
  user: AdminUser;
};

const UserManagementUser = ({ user }: UserManagementUserProps) => {
  return (
    <li className={styles.userCard}>
      <UserManagementUserData user={user} />

      <Link className={styles.actionButton} to={`/admin/users/${user.id}`}>
        Manage user
      </Link>
    </li>
  );
};

export default UserManagementUser;
