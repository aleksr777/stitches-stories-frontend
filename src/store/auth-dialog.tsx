import { useLocation } from 'react-router-dom';
import { getAuthReturnTo } from '../features/auth/model/auth-return-location';
import AuthDialogForm from './auth-dialog-form';
import { type AuthMode, useAuthDialogState } from './auth-dialog-state';
import Modal from './modal';
import { useAuthDialogActions } from './use-auth-dialog-actions';

export type { AuthMode } from './auth-dialog-state';

const titles: Record<AuthMode, string> = {
  login: 'Рады видеть вас снова',
  registration: 'Давайте знакомиться',
  'password-reset': 'Восстановление пароля',
};

const AuthDialog = ({ mode: initialMode, close }: { mode: AuthMode; close: () => void }) => {
  const location = useLocation();
  const state = useAuthDialogState(initialMode);
  const actions = useAuthDialogActions(state, getAuthReturnTo(location.state));
  return (
    <Modal
      title={
        state.isAdminConfirmation
          ? 'Подтвердите вход владельца'
          : state.step
            ? 'Проверьте вашу почту'
            : titles[state.mode]
      }
      onClose={close}
    >
      <p className="muted">
        {state.isAdminConfirmation
          ? state.adminChallenge?.message
          : state.step
            ? 'Если адрес подходит для этой операции, мы отправили шестизначный код на ' +
              state.email +
              '.'
            : 'Ваши любимые истории будут всегда под рукой.'}
      </p>
      <AuthDialogForm state={state} submit={actions.submit} resend={actions.resend} />
    </Modal>
  );
};

export default AuthDialog;
