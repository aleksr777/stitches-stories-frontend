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
    <strong>{user.nickname ?? 'Без псевдонима'}</strong>
    <span className="contact-text">Почта: {user.email}</span>
    <span>Имя: {user.name ?? '—'}</span>
    <span>Возраст: {user.age ?? '—'}</span>
    <span>Статус: {user.is_blocked ? 'Заблокирован' : 'Активен'}</span>
    <span>Последняя активность: {formatLastActivity(user.last_activity_at)}</span>
    {user.blocked_reason && <span>Причина блокировки: {user.blocked_reason}</span>}
  </div>
);

export default UserManagementUserData;
