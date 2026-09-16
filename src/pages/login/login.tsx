import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/model/use-auth';
import { CredentialsForm } from './login-forms';
import styles from './login.module.css';

type LocationState = {
  from?: {
    pathname?: string;
  };
  message?: string;
};

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const state = location.state as LocationState | null;
  const redirectTo = state?.from?.pathname ?? '/';

  const handleCredentials = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    if (!email || !password) return setError('Enter email and password');

    try {
      setError(null);
      setIsSubmitting(true);
      const outcome = await login(email, password);
      if (outcome.status === 'blocked') {
        navigate('/blocked', {
          replace: true,
          state: { blockedInfo: outcome.info },
        });
        return;
      }
      navigate(redirectTo, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.wrapper}>
      <h2 className={styles.title}>Login</h2>
      {state?.message && <p>{state.message}</p>}
      <CredentialsForm error={error} isSubmitting={isSubmitting} onSubmit={handleCredentials} />
      <Link className={styles.link} to="/auth/password-reset">
        Forgot password?
      </Link>
      <Link className={styles.link} to="/auth/registration">
        Registration
      </Link>
    </section>
  );
};

export default Login;
