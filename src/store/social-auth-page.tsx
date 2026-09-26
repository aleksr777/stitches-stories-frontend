import Modal from './modal';
import SocialRegistrationFields from './social-registration-fields';
import { socialNames } from './social-auth-api';
import { useSocialAuth } from './use-social-auth';

const SocialAuthPage = () => {
  const { navigate, pending, linking, busy, error, submit, toggleLinking } = useSocialAuth();
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
          ) : (
            <SocialRegistrationFields linking={linking} provider={pending.provider} />
          )}
          <button className="button" disabled={busy} type="submit">
            {busy
              ? 'Подождите…'
              : pending.registered
                ? 'Войти'
                : linking
                  ? 'Привязать и войти'
                  : 'Зарегистрироваться и войти'}
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
