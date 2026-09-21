import type { AuthSession } from '../../features/auth/api/session-api';
import { formatSessionDate, getSessionDeviceLabel } from '../my-profile/session-device';
import styles from '../my-profile/active-sessions.module.css';

type Props = {
  session: AuthSession;
  busy: boolean;
  onRevoke: (id: string) => void;
};

const UserSessionCard = ({ session, busy, onRevoke }: Props) => (
  <article className={styles.card}>
    <div className={styles.cardHeader}>
      <strong>{getSessionDeviceLabel(session.user_agent)}</strong>
    </div>
    <span>IP: {session.ip_address ?? 'Неизвестно'}</span>
    <span>Вход: {formatSessionDate(session.created_at)}</span>
    <span>Последняя активность: {formatSessionDate(session.last_used_at)}</span>
    <span>Истекает: {formatSessionDate(session.expires_at)}</span>
    <button
      className={styles.terminateButton}
      type="button"
      onClick={() => onRevoke(session.id)}
      disabled={busy}
    >
      {busy ? 'Завершаем…' : 'Завершить сеанс'}
    </button>
  </article>
);

export default UserSessionCard;
