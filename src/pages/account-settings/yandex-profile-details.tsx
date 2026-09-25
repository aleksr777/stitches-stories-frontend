import type { CurrentUser } from '../../features/users/api/users-api';
import styles from './account-settings.module.css';

const YandexProfileDetails = ({ user }: { user: CurrentUser | null }) =>
  user && (user.contact_email || user.phone_number || user.sex) ? (
    <div className={styles.form}>
      <p>Сведения из Яндекс ID</p>
      {user.contact_email && <p>Контактная почта: {user.contact_email}</p>}
      {user.phone_number && <p>Телефон: {user.phone_number}</p>}
      {user.sex && <p>Пол: {user.sex === 'female' ? 'женский' : 'мужской'}</p>}
    </div>
  ) : null;

export default YandexProfileDetails;
