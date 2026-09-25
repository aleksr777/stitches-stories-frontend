import { useEffect, useState } from 'react';
import { socialNames, socialRequest, type SocialProvider } from './social-auth-api';
import './social-auth.css';

const SocialAuthButtons = () => {
  const [providers, setProviders] = useState<SocialProvider[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    void socialRequest<SocialProvider[]>('providers')
      .then((result) => {
        if (active) setProviders(result.filter((value) => value === 'vk' || value === 'yandex'));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  const start = async (provider: SocialProvider) => {
    setBusy(true);
    setError('');
    try {
      const { url } = await socialRequest<{ url: string }>(provider + '/start', {});
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось начать вход. Попробуйте снова.');
      setBusy(false);
    }
  };
  if (!providers.length) return null;
  return (
    <section className="social-auth" aria-label="Вход через сервисы">
      <p className="muted">Или продолжить через</p>
      <div className="social-auth-buttons">
        {providers.map((provider) => (
          <button
            className="button secondary"
            key={provider}
            disabled={busy}
            type="button"
            onClick={() => void start(provider)}
          >
            {socialNames[provider]}
          </button>
        ))}
      </div>
      {error && <p role="alert">{error}</p>}
    </section>
  );
};
export default SocialAuthButtons;
