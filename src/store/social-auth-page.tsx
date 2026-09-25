import Modal from './modal';
import SocialRegistrationFields from './social-registration-fields';
import { socialNames } from './social-auth-api';
import { useSocialAuth } from './use-social-auth';

const SocialAuthPage = () => {
  const {
    navigate,
    pending,
    linking,
    email,
    busy,
    error,
    verification,
    submit,
    resend,
    toggleLinking,
  } = useSocialAuth();
  return (
    <Modal
      title={pending ? 'Вход через ' + socialNames[pending.provider] : 'Вход в мастерскую'}
      onClose={() => navigate('/', { replace: true })}
    >
      {error && <p role="alert">{error}</p>}
      {!pending ? (
        <p className="muted">
          {error ? 'Вернитесь к выбору способа входа.' : 'Проверяем подтверждение…'}
        </p>
      ) : (
        <form className="form" onSubmit={(event) => void submit(event)}>
          {pending.registered ? (
            <p>Аккаунт подтверждён. Продолжите вход в магазин.</p>
          ) : email ? (
            <>
              <p>
                Если адрес подходит для регистрации, код отправлен на {email}. Если аккаунт уже
                существует, вернитесь и выберите привязку.
              </p>
              <label>
                Код из письма
                <input
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  required
                  maxLength={6}
                />
              </label>
              <button
                className="text-link"
                type="button"
                disabled={busy || verification.resendSeconds > 0 || verification.isLocked}
                onClick={() => void resend()}
              >
                Отправить код повторно
              </button>
            </>
          ) : (
            <SocialRegistrationFields linking={linking} provider={pending.provider} />
          )}
          <button className="button" disabled={busy || verification.isLocked} type="submit">
            {busy
              ? 'Подождите…'
              : pending.registered || email
                ? 'Войти'
                : linking
                  ? 'Привязать и войти'
                  : pending.provider === 'yandex'
                    ? 'Зарегистрироваться и войти'
                    : 'Продолжить регистрацию'}
          </button>
          {!pending.registered && (
            <button className="text-link" type="button" disabled={busy} onClick={toggleLinking}>
              {linking ? 'Создать новый аккаунт' : 'У меня уже есть аккаунт магазина'}
            </button>
          )}
        </form>
      )}
      <button
        className="text-link"
        type="button"
        onClick={() => navigate('/?auth=login', { replace: true })}
      >
        Другой способ входа
      </button>
    </Modal>
  );
};
export default SocialAuthPage;
