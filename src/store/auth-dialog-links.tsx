import type { useAuthDialogState } from './auth-dialog-state';

type DialogState = ReturnType<typeof useAuthDialogState>;

const AuthDialogLinks = ({
  state,
  resend,
}: {
  state: DialogState;
  resend: () => Promise<void>;
}) =>
  state.step ? (
    <div className="auth-links">
      <button
        className="text-link"
        disabled={state.busy || state.verification.resendSeconds > 0}
        onClick={() => void resend()}
      >
        Отправить код повторно
        {state.verification.resendSeconds > 0
          ? ' (' + state.verification.resendSeconds + ' с)'
          : ''}
      </button>
      <button className="text-link" onClick={state.resetStep}>
        Изменить данные
      </button>
    </div>
  ) : (
    <div className="auth-links">
      {state.mode === 'login' ? (
        <>
          <button className="text-link" onClick={() => state.changeMode('password-reset')}>
            Не помню пароль
          </button>
          <button className="text-link" onClick={() => state.changeMode('registration')}>
            Создать аккаунт
          </button>
        </>
      ) : (
        <button className="text-link" onClick={() => state.changeMode('login')}>
          Уже есть аккаунт? Войти
        </button>
      )}
    </div>
  );

export default AuthDialogLinks;
