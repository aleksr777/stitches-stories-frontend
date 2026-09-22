import { Link } from 'react-router-dom';
import type { CurrentUser } from '../features/users/api/users-api';

const ProfileMenu = ({ user, logout }: { user: CurrentUser; logout: () => Promise<void> }) => (
  <aside className="profile-menu">
    <span className="avatar large" aria-hidden="true">
      {(user.name ?? user.nickname ?? 'Я').slice(0, 1).toUpperCase()}
    </span>
    <p className="contact-text">{user.email}</p>
    {user.role !== 'admin' && <Link to="/favorites">Избранное</Link>}
    <Link to="/users/me/settings/profile">Мои данные</Link>
    <Link to="/users/me/settings/password">Сменить пароль</Link>
    <Link to="/users/me/settings/email">Сменить почту</Link>
    <Link to="/users/me/sessions">Активные сеансы</Link>
    {user.role === 'admin' && (
      <>
        <Link to="/admin/shop">Управление магазином</Link>
        <Link to="/admin/users">Пользователи</Link>
      </>
    )}
    <button className="text-link" onClick={() => void logout().catch(() => undefined)}>
      Выйти из аккаунта
    </button>
  </aside>
);

export default ProfileMenu;
