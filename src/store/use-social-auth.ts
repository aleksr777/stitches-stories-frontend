import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/model/use-auth';
import type { VerificationRequestResult } from '../features/auth/api/auth-api';
import { useVerificationRequestState } from '../shared/model/verification-request';
import { useStore } from './context';
import { documentRef } from './types';
import { finishSocialLogin, socialRequest, type SocialPending } from './social-auth-api';

export const useSocialAuth = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { documents } = useStore();
  const verification = useVerificationRequestState();
  const [pending, setPending] = useState<SocialPending | null>(null);
  const [linking, setLinking] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    if (new URLSearchParams(location.search).has('error')) {
      setError('Вход не завершён. Попробуйте снова или войдите по паролю.');
      return;
    }
    void socialRequest<SocialPending>('pending')
      .then((result) => {
        if (active) setPending(result);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Начните вход заново.');
      });
    return () => {
      active = false;
    };
  }, [location.search]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || !pending) return;
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      if (pending.registered) {
        await finishSocialLogin('login', {});
        await auth.finishSocialSession();
        navigate('/users/me', { replace: true });
      } else if (pending.provider === 'yandex' && !linking) {
        const refs = documents
          .filter((d) => ['pd-account', 'account-terms'].includes(d.id))
          .map(documentRef);
        if (refs.length !== 2 || !data.get('pd-account') || !data.get('account-terms'))
          throw new Error('Подтвердите каждый документ отдельно.');
        await finishSocialLogin('registration/yandex', { documents: refs });
        await auth.finishSocialSession();
        navigate('/users/me', { replace: true });
      } else if (email) {
        await auth.confirmRegistration(String(data.get('code')), email);
        navigate('/users/me', { replace: true });
      } else if (linking) {
        await finishSocialLogin('link', {
          email: String(data.get('email')),
          password: String(data.get('password')),
        });
        await auth.finishSocialSession();
        navigate('/users/me', { replace: true });
      } else {
        const refs = documents
          .filter((d) => ['pd-account', 'account-terms'].includes(d.id))
          .map(documentRef);
        if (refs.length !== 2 || !data.get('pd-account') || !data.get('account-terms'))
          throw new Error('Подтвердите каждый документ отдельно.');
        const address = String(data.get('email')).trim().toLowerCase();
        const result = await socialRequest<VerificationRequestResult>('registration/request', {
          name: String(data.get('name')).trim(),
          email: address,
          documents: refs,
        });
        verification.applyResult(result);
        setEmail(address);
      }
    } catch (err) {
      verification.applyRetryError(err);
      verification.applyAttemptError(err);
      setError(err instanceof Error ? err.message : 'Не удалось завершить вход.');
    } finally {
      setBusy(false);
    }
  };
  const resend = async () => {
    setBusy(true);
    setError('');
    try {
      verification.applyResult(await auth.resendRegistration(email));
    } catch (err) {
      verification.applyRetryError(err);
      setError(err instanceof Error ? err.message : 'Не удалось отправить код.');
    } finally {
      setBusy(false);
    }
  };
  const toggleLinking = () => {
    setLinking(!linking);
    setEmail('');
    setError('');
    verification.reset();
  };
  return {
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
  };
};
