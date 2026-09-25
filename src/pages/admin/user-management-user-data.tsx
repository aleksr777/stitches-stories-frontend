import type { AdminUser } from '../../features/admin/api/admin-api';
import styles from './user-management.module.css';

type UserManagementUserDataProps = {
  user: AdminUser;
};

const formatLastActivity = (value: string | null) => {
  return value ? new Date(value).toLocaleString('ru-RU') : 'Пока нет активности';
};

const UserManagementUserData = ({ user }: UserManagementUserDataProps) => (
  <div className={styles.userData}>
    <strong>{user.name?.trim() || `Пользователь №${user.id}`}</strong>
    <span className="contact-text">Почта: {user.email ?? user.contact_email ?? 'не указана'}</span>
    {user.phone_number && <span>Телефон: {user.phone_number}</span>}
    <span>Имя: {user.name ?? '—'}</span>
    <span>Статус: {user.is_blocked ? 'Заблокирован' : 'Активен'}</span>
    <span>Последняя активность: {formatLastActivity(user.last_activity_at)}</span>
    {user.blocked_reason && <span>Причина блокировки: {user.blocked_reason}</span>}
  </div>
);

export default UserManagementUserData;
