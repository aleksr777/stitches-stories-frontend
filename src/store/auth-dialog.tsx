import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/model/use-auth';
import { useVerificationRequestState } from '../shared/model/verification-request';
import { getAttemptsRemaining } from '../shared/api/api-client';
import { useStore } from './context';
import { Acceptance, DocumentButton } from './legal';
import { documentRef } from './types';
import Modal from './modal';
export type AuthMode = 'login' | 'registration' | 'password-reset';
const titles: Record<AuthMode, string> = {
  login: 'Рады видеть вас снова',
  registration: 'Давайте знакомиться',
  'password-reset': 'Восстановление пароля',
};
const AuthDialog = ({ mode: initialMode, close }: { mode: AuthMode; close: () => void }) => {
  const auth = useAuth();
  const { documents } = useStore();
  const navigate = useNavigate();
  const verification = useVerificationRequestState();
  const [mode, setMode] = useState(initialMode);
  const [step, setStep] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);
  const refs = documents
    .filter((d) => ['pd-account', 'account-terms'].includes(d.id))
    .map(documentRef);
  const changeMode = (value: AuthMode) => {
    setMode(value);
    setStep(false);
    setError('');
    verification.reset();
  };
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    const data = new FormData(e.currentTarget);
    const address = String(data.get('email') ?? email)
      .trim()
      .toLowerCase();
    const password = String(data.get('password') ?? '');
    const code = String(data.get('code') ?? '');
    if (
      mode === 'registration' &&
      !step &&
      (refs.length !== 2 || !data.get('pd-account') || !data.get('account-terms'))
    ) {
      setError('Ознакомьтесь с документами и подтвердите каждый отдельно.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (mode === 'login') {
        const outcome = await auth.login(address, password);
        if (outcome.status === 'blocked') {
          setError(
            'Аккаунт заблокирован. ' + (outcome.info.blocked_reason ?? 'Свяжитесь с мастерской.'),
          );
          return;
        }
      } else if (!step) {
        const result =
          mode === 'registration'
            ? await auth.requestRegistration(address, password, {
                name: String(data.get('name') ?? '').trim(),
                documents: refs,
              })
            : await auth.requestPasswordReset(address);
        verification.applyResult(result);
        setEmail(address);
        setStep(true);
        return;
      } else if (mode === 'registration') await auth.confirmRegistration(code, email);
      else await auth.confirmPasswordReset(code, password, email);
      close();
      navigate(mode === 'registration' ? '/catalog' : '/users/me', { replace: true });
    } catch (err) {
      verification.applyRetryError(err);
      verification.applyAttemptError(err);
      setError(
        err instanceof Error ? err.message : 'Не удалось выполнить запрос. Попробуйте ещё раз.',
      );
      if (getAttemptsRemaining(err) === 0) setStep(false);
    } finally {
      setBusy(false);
    }
  };
  const resend = async () => {
    setBusy(true);
    setError('');
    try {
      verification.applyResult(
        mode === 'registration'
          ? await auth.resendRegistration(email)
          : await auth.requestPasswordReset(email),
      );
    } catch (err) {
      verification.applyRetryError(err);
      setError(err instanceof Error ? err.message : 'Не удалось отправить код.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={step ? 'Проверьте вашу почту' : titles[mode]} onClose={close}>
      <p className="muted">
        {step
          ? 'Если адрес подходит для этой операции, мы отправили шестизначный код на ' + email + '.'
          : 'Ваши любимые истории будут всегда под рукой.'}
      </p>
      <form onSubmit={(e) => void submit(e)} className="form" key={mode + String(step)}>
        {!step && mode === 'registration' && (
          <label>
            Как вас зовут
            <input name="name" autoComplete="name" required minLength={2} maxLength={200} />
          </label>
        )}
        {!step && (
          <label>
            Электронная почта
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              maxLength={255}
              defaultValue={email}
            />
          </label>
        )}
        {step && (
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
        )}
        {(mode === 'login' ||
          (mode === 'registration' && !step) ||
          (mode === 'password-reset' && step)) && (
          <label>
            {mode === 'password-reset' ? 'Новый пароль' : 'Пароль'}
            <div className="password-field">
              <input
                name="password"
                aria-label={mode === 'password-reset' ? 'Новый пароль' : 'Пароль'}
                type={visible ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={mode === 'login' ? 1 : 12}
                maxLength={100}
              />
              <button
                type="button"
                aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
                onClick={() => setVisible((v) => !v)}
              >
                {visible ? 'Скрыть' : 'Показать'}
              </button>
            </div>
            {mode !== 'login' && <small>От 12 до 100 символов</small>}
          </label>
        )}
        {mode === 'registration' && !step && (
          <>
            <Acceptance
              id="pd-account"
              label="Даю согласие на обработку данных для личного кабинета."
            />
            <Acceptance id="account-terms" label="Принимаю условия личного кабинета." />
            <p className="muted">
              Регистрация необязательна для покупки.{' '}
              <DocumentButton id="privacy">Политика обработки данных</DocumentButton>
            </p>
          </>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button
          className="button full"
          disabled={
            busy ||
            verification.isLocked ||
            auth.isInitializing ||
            (mode === 'registration' && !step && refs.length !== 2)
          }
        >
          {busy
            ? 'Подождите…'
            : step
              ? 'Подтвердить код'
              : mode === 'login'
                ? 'Войти'
                : mode === 'registration'
                  ? 'Получить код регистрации'
                  : 'Получить код восстановления'}
        </button>
      </form>
      {step ? (
        <div className="auth-links">
          <button
            className="text-link"
            disabled={busy || verification.resendSeconds > 0}
            onClick={() => void resend()}
          >
            Отправить код повторно
            {verification.resendSeconds > 0 ? ' (' + verification.resendSeconds + ' с)' : ''}
          </button>
          <button className="text-link" onClick={() => setStep(false)}>
            Изменить данные
          </button>
        </div>
      ) : (
        <div className="auth-links">
          {mode === 'login' ? (
            <>
              <button className="text-link" onClick={() => changeMode('password-reset')}>
                Не помню пароль
              </button>
              <button className="text-link" onClick={() => changeMode('registration')}>
                Создать аккаунт
              </button>
            </>
          ) : (
            <button className="text-link" onClick={() => changeMode('login')}>
              Уже есть аккаунт? Войти
            </button>
          )}
        </div>
      )}
    </Modal>
  );
};
export default AuthDialog;
