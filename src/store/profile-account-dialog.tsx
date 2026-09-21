import Modal, { ModalDismissButton } from './modal';

type Props = {
  busy: boolean;
  error: string;
  password: string;
  setPassword: (value: string) => void;
  close: () => void;
  withdraw: (password: string) => void;
};

const ProfileAccountDialog = ({
  busy,
  error,
  password,
  setPassword,
  close,
  withdraw,
}: Props) => (
  <Modal title="Закрыть личный кабинет?" onClose={close}>
    <p>
      Отзыв согласия закроет кабинет, удалит профиль и избранное, завершит сеансы. Заявки и записи,
      для хранения которых существует отдельное основание, рассматриваются отдельно. Независимую
      подписку на письма можно отменить выше.
    </p>
    {error && <p role="alert">{error}</p>}
    <label>
      Текущий пароль
      <input
        type="password"
        autoComplete="current-password"
        minLength={8}
        maxLength={100}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
    </label>
    <div className="actions">
      <ModalDismissButton className="button secondary" disabled={busy}>
        Оставить кабинет
      </ModalDismissButton>
      <button
        className="button"
        disabled={busy || password.length < 8}
        onClick={() => withdraw(password)}
      >
        Отозвать и закрыть
      </button>
    </div>
  </Modal>
);

export default ProfileAccountDialog;
