import { Link } from 'react-router-dom';
import { useChangeEmail } from './use-change-email';
import styles from './account-settings.module.css';

const ChangeEmail = () => {
  const {
    newEmail,
    error,
    isSubmitting,
    isLocked,
    maxAttempts,
    attemptsRemaining,
    lockoutMessage,
    handleRequest,
    handleConfirm,
    handleUseAnotherEmail,
  } = useChangeEmail();

  return (
    <section className={styles.wrapper}>
      <h2 className={styles.title}>Сменить почту</h2>
      {!newEmail ? (
        <form className={styles.form} onSubmit={handleRequest}>
          <label className={styles.label}>
            Новая почта
            <input
              className={styles.input}
              name="newEmail"
              type="email"
              autoComplete="email"
              disabled={isLocked}
              required
            />
          </label>
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
          {lockoutMessage && <p className={styles.error}>{lockoutMessage}</p>}
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.button} type="submit" disabled={isSubmitting || isLocked}>
            {isSubmitting ? 'Отправляем код…' : 'Продолжить'}
          </button>
        </form>
      ) : (
        <form className={styles.form} onSubmit={handleConfirm}>
          <p className={styles.message}>Код отправлен на {newEmail}</p>
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
            {isSubmitting ? 'Сохраняем…' : 'Сменить почту'}
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
      <Link className={styles.link} to="/users/me">
        Вернуться в профиль
      </Link>
    </section>
  );
};

export default ChangeEmail;
