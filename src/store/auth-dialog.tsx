import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { AdminLoginChallenge } from '../features/auth/api/auth-api';
import { getAuthReturnTo } from '../features/auth/model/auth-return-location';
import { useAuth } from '../features/auth/model/use-auth';
import { getAttemptsRemaining } from '../shared/api/api-client';
import { useVerificationRequestState } from '../shared/model/verification-request';
import { useStore } from './context';
import { Acceptance, DocumentButton } from './legal';
import Modal from './modal';
import { documentRef } from './types';

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
  const location = useLocation();
  const verification = useVerificationRequestState();
  const [mode, setMode] = useState(initialMode);
  const [step, setStep] = useState(false);
  const [email, setEmail] = useState('');
  const [adminChallenge, setAdminChallenge] = useState<AdminLoginChallenge | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);
  const refs = documents
    .filter((document) => ['pd-account', 'account-terms'].includes(document.id))
    .map(documentRef);
  const isAdminConfirmation = mode === 'login' && step && adminChallenge !== null;
  const returnTo = getAuthReturnTo(location.state);

  const changeMode = (value: AuthMode) => {
    setMode(value);
    setStep(false);
    setAdminChallenge(null);
    setError('');
    verification.reset();
  };

  const returnAfterAuthentication = () => {
    navigate(returnTo, { replace: true });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    const data = new FormData(event.currentTarget);
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
      if (mode === 'login' && !step) {
        const outcome = await auth.login(address, password);
        if (outcome.status === 'blocked') {
          setError(
            'Аккаунт заблокирован. ' + (outcome.info.blocked_reason ?? 'Свяжитесь с мастерской.'),
          );
          return;
        }
        if (outcome.status === 'admin-confirmation') {
          setEmail(address);
          setAdminChallenge(outcome.challenge);
          verification.applyResult(outcome.challenge);
          setStep(true);
          return;
        }
        returnAfterAuthentication();
        return;
      }

      if (!step) {
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
      }

      if (isAdminConfirmation) {
        await auth.confirmAdminLogin(adminChallenge.challenge_id, code);
      } else if (mode === 'registration') {
        await auth.confirmRegistration(code, email);
      } else {
        await auth.confirmPasswordReset(code, password, email);
      }
      returnAfterAuthentication();
    } catch (err) {
      verification.applyRetryError(err);
      verification.applyAttemptError(err);
      setError(
        err instanceof Error ? err.message : 'Не удалось выполнить запрос. Попробуйте ещё раз.',
      );
      if (getAttemptsRemaining(err) === 0) {
        setStep(false);
        setAdminChallenge(null);
      }
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setBusy(true);
    setError('');
    try {
      if (isAdminConfirmation) {
        const result = await auth.resendAdminLogin(adminChallenge.challenge_id);
        setAdminChallenge(result);
        verification.applyResult(result);
      } else {
        const result =
          mode === 'registration'
            ? await auth.resendRegistration(email)
            : await auth.requestPasswordReset(email);
        verification.applyResult(result);
      }
    } catch (err) {
      verification.applyRetryError(err);
      setError(err instanceof Error ? err.message : 'Не удалось отправить код.');
    } finally {
      setBusy(false);
    }
  };

  const resetStep = () => {
    setStep(false);
    setAdminChallenge(null);
    setError('');
    verification.reset();
  };

  return (
    <Modal
      title={
        isAdminConfirmation
          ? 'Подтвердите вход владельца'
          : step
            ? 'Проверьте вашу почту'
            : titles[mode]
      }
      onClose={close}
    >
      <p className="muted">
        {isAdminConfirmation
          ? adminChallenge.message
          : step
            ? 'Если адрес подходит для этой операции, мы отправили шестизначный код на ' +
              email +
              '.'
            : 'Ваши любимые истории будут всегда под рукой.'}
      </p>
      <form
        onSubmit={(event) => void submit(event)}
        className="form"
        key={mode + String(step) + (adminChallenge?.challenge_id ?? '')}
      >
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
        {((mode === 'login' && !step) ||
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
                onClick={() => setVisible((value) => !value)}
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
          <button className="text-link" onClick={resetStep}>
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
