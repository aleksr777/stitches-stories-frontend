import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/model/use-auth';
import { useStore } from './context';
import { documentRef } from './types';
import { finishSocialLogin, socialRequest, type SocialPending } from './social-auth-api';

export const useSocialAuth = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { documents } = useStore();
  const [pending, setPending] = useState<SocialPending | null>(null);
  const [linking, setLinking] = useState(false);
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
        await finishSocialLogin(`registration/${pending.provider}`, { documents: refs });
        await auth.finishSocialSession();
        navigate('/users/me', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось завершить вход.');
    } finally {
      setBusy(false);
    }
  };
  const toggleLinking = () => {
    setLinking(!linking);
    setError('');
  };
  return {
    navigate,
    pending,
    linking,
    busy,
    error,
    submit,
    toggleLinking,
  };
};
