import type { useAuthDialogState } from './auth-dialog-state';
import { Acceptance, DocumentButton } from './legal';

type DialogState = ReturnType<typeof useAuthDialogState>;

const AuthDialogFields = ({ state }: { state: DialogState }) => (
  <>
    {!state.step && state.mode === 'registration' && (
      <label>
        Как вас зовут
        <input name="name" autoComplete="name" required minLength={2} maxLength={200} />
      </label>
    )}
    {!state.step && (
      <label>
        Электронная почта
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          maxLength={255}
          defaultValue={state.email}
        />
      </label>
    )}
    {state.step && (
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
    {((state.mode === 'login' && !state.step) ||
      (state.mode === 'registration' && !state.step) ||
      (state.mode === 'password-reset' && state.step)) && (
      <label>
        {state.mode === 'password-reset' ? 'Новый пароль' : 'Пароль'}
        <div className="password-field">
          <input
            name="password"
            aria-label={state.mode === 'password-reset' ? 'Новый пароль' : 'Пароль'}
            type={state.visible ? 'text' : 'password'}
            autoComplete={state.mode === 'login' ? 'current-password' : 'new-password'}
            required
            minLength={state.mode === 'login' ? 1 : 12}
            maxLength={100}
          />
          <button
            type="button"
            aria-label={state.visible ? 'Скрыть пароль' : 'Показать пароль'}
            onClick={() => state.setVisible(!state.visible)}
          >
            {state.visible ? 'Скрыть' : 'Показать'}
          </button>
        </div>
        {state.mode !== 'login' && <small>От 12 до 100 символов</small>}
      </label>
    )}
    {state.mode === 'registration' && !state.step && (
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
  </>
);

export default AuthDialogFields;
