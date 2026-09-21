import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/model/use-auth';
import { getAttemptsRemaining } from '../shared/api/api-client';
import type { useAuthDialogState } from './auth-dialog-state';

type DialogState = ReturnType<typeof useAuthDialogState>;

export const useAuthDialogActions = (state: DialogState, returnTo: string) => {
  const auth = useAuth();
  const navigate = useNavigate();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state.busy) return;
    const data = new FormData(event.currentTarget);
    const address = String(data.get('email') ?? state.email)
      .trim()
      .toLowerCase();
    const password = String(data.get('password') ?? '');
    const code = String(data.get('code') ?? '');
    if (
      state.mode === 'registration' &&
      !state.step &&
      (state.refs.length !== 2 || !data.get('pd-account') || !data.get('account-terms'))
    ) {
      state.setError('Ознакомьтесь с документами и подтвердите каждый отдельно.');
      return;
    }

    state.setBusy(true);
    state.setError('');
    try {
      if (state.mode === 'login' && !state.step) {
        const outcome = await auth.login(address, password);
        if (outcome.status === 'blocked') {
          state.setError(
            'Аккаунт заблокирован. ' + (outcome.info.blocked_reason ?? 'Свяжитесь с мастерской.'),
          );
          return;
        }
        if (outcome.status === 'admin-confirmation') {
          state.setEmail(address);
          state.setAdminChallenge(outcome.challenge);
          state.verification.applyResult(outcome.challenge);
          state.setStep(true);
          return;
        }
        navigate(returnTo, { replace: true });
        return;
      }

      if (!state.step) {
        const result =
          state.mode === 'registration'
            ? await auth.requestRegistration(address, password, {
                name: String(data.get('name') ?? '').trim(),
                documents: state.refs,
              })
            : await auth.requestPasswordReset(address);
        state.verification.applyResult(result);
        state.setEmail(address);
        state.setStep(true);
        return;
      }

      if (state.isAdminConfirmation && state.adminChallenge) {
        await auth.confirmAdminLogin(state.adminChallenge.challenge_id, code);
      } else if (state.mode === 'registration') {
        await auth.confirmRegistration(code, state.email);
      } else {
        await auth.confirmPasswordReset(code, password, state.email);
      }
      navigate(returnTo, { replace: true });
    } catch (err) {
      state.verification.applyRetryError(err);
      state.verification.applyAttemptError(err);
      state.setError(
        err instanceof Error ? err.message : 'Не удалось выполнить запрос. Попробуйте ещё раз.',
      );
      if (getAttemptsRemaining(err) === 0) {
        state.setStep(false);
        state.setAdminChallenge(null);
      }
    } finally {
      state.setBusy(false);
    }
  };

  const resend = async () => {
    state.setBusy(true);
    state.setError('');
    try {
      if (state.isAdminConfirmation && state.adminChallenge) {
        const result = await auth.resendAdminLogin(state.adminChallenge.challenge_id);
        state.setAdminChallenge(result);
        state.verification.applyResult(result);
      } else {
        const result =
          state.mode === 'registration'
            ? await auth.resendRegistration(state.email)
            : await auth.requestPasswordReset(state.email);
        state.verification.applyResult(result);
      }
    } catch (err) {
      state.verification.applyRetryError(err);
      state.setError(err instanceof Error ? err.message : 'Не удалось отправить код.');
    } finally {
      state.setBusy(false);
    }
  };

  return { submit, resend };
};
