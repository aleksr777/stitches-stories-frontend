import type { FormEvent } from 'react';
import type { useAuthDialogState } from './auth-dialog-state';
import AuthDialogFields from './auth-dialog-fields';
import AuthDialogLinks from './auth-dialog-links';

type DialogState = ReturnType<typeof useAuthDialogState>;

const AuthDialogForm = ({
  state,
  submit,
  resend,
}: {
  state: DialogState;
  submit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  resend: () => Promise<void>;
}) => (
  <>
    <form
      onSubmit={(event) => void submit(event)}
      className="form"
      key={state.mode + String(state.step) + (state.adminChallenge?.challenge_id ?? '')}
    >
      <AuthDialogFields state={state} />
      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      <button
        className="button full"
        disabled={
          state.busy ||
          state.verification.isLocked ||
          (state.mode === 'registration' && !state.step && state.refs.length !== 2)
        }
      >
        {state.busy
          ? 'Подождите…'
          : state.step
            ? 'Подтвердить код'
            : state.mode === 'login'
              ? 'Войти'
              : state.mode === 'registration'
                ? 'Получить код регистрации'
                : 'Получить код восстановления'}
      </button>
    </form>
    <AuthDialogLinks state={state} resend={resend} />
  </>
);

export default AuthDialogForm;
