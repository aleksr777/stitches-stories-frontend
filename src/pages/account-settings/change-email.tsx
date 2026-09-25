import { Link } from 'react-router-dom';
import { useChangeEmail } from './use-change-email';
import styles from './account-settings.module.css';

const ChangeEmail = ({ contact = false }: { contact?: boolean }) => {
  const {
    newEmail,
    currentContactEmail,
    error,
    isSubmitting,
    isLocked,
    maxAttempts,
    attemptsRemaining,
    lockoutMessage,
    handleRequest,
    handleConfirm,
    handleUseAnotherEmail,
    handleRemove,
  } = useChangeEmail(contact);

  return (
    <section className={styles.wrapper}>
      <h2 className={styles.title}>{contact ? 'Контактная почта' : 'Сменить почту для входа'}</h2>
      {newEmail === undefined ? (
        <form className={styles.form} onSubmit={handleRequest}>
          {contact && (
            <p className={styles.message}>
              Сейчас: {currentContactEmail ?? 'не указана'}. Код отправим на новый адрес.
            </p>
          )}
          <label className={styles.label}>
            {contact ? 'Новая контактная почта' : 'Новая почта'}
            <input
              className={styles.input}
              name="newEmail"
              type="email"
              autoComplete="email"
              disabled={isLocked}
              maxLength={255}
              required
            />
          </label>
          {!contact && (
            <label className={styles.label}>
              Текущий пароль
              <input
                className={styles.input}
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                disabled={isLocked}
                required
              />
            </label>
          )}
          {lockoutMessage && <p className={styles.error}>{lockoutMessage}</p>}
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.button} type="submit" disabled={isSubmitting || isLocked}>
            {isSubmitting ? 'Отправляем код…' : 'Продолжить'}
          </button>
          {contact && currentContactEmail && (
            <button
              className={styles.secondaryButton}
              type="button"
              disabled={isSubmitting || isLocked}
              onClick={handleRemove}
            >
              Удалить контактную почту по коду
            </button>
          )}
        </form>
      ) : (
        <form className={styles.form} onSubmit={handleConfirm}>
          <p className={styles.message}>
            Код отправлен на {newEmail ?? currentContactEmail}. До ввода кода почта не изменится.
          </p>
          <label className={styles.label}>
            Код подтверждения
            <input
              className={styles.input}
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              disabled={isLocked || attemptsRemaining === 0}
              required
            />
          </label>
          <p className={styles.message}>Допустимо ошибок: {maxAttempts}</p>
          <p className={styles.message}>Осталось попыток: {attemptsRemaining}.</p>
          {lockoutMessage && <p className={styles.error}>{lockoutMessage}</p>}
          {error && <p className={styles.error}>{error}</p>}
          <button
            className={styles.button}
            type="submit"
            disabled={isSubmitting || isLocked || attemptsRemaining === 0}
          >
            {isSubmitting ? 'Сохраняем…' : contact ? 'Подтвердить почту' : 'Сменить почту'}
          </button>
          <button
            className={styles.secondaryButton}
            type="button"
            disabled={isSubmitting}
            onClick={handleUseAnotherEmail}
          >
            Указать другую почту
          </button>
        </form>
      )}
      <Link className={styles.link} to={contact ? '/users/me/settings/profile' : '/users/me'}>
        {contact ? 'Вернуться к моим данным' : 'Вернуться в профиль'}
      </Link>
    </section>
  );
};

export default ChangeEmail;
