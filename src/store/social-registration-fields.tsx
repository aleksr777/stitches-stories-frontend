import { Acceptance, DocumentButton } from './legal';
import type { SocialProvider } from './social-auth-api';

const SocialRegistrationFields = ({
  linking,
  provider,
}: {
  linking: boolean;
  provider: SocialProvider;
}) => (
  <>
    {!linking && provider !== 'yandex' && (
      <label>
        Ваше имя
        <input name="name" autoComplete="name" required minLength={2} maxLength={200} />
      </label>
    )}
    {(linking || provider !== 'yandex') && (
      <label>
        Электронная почта
        <input name="email" type="email" autoComplete="email" required maxLength={255} />
      </label>
    )}
    {linking ? (
      <label>
        Пароль аккаунта магазина
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={100}
        />
      </label>
    ) : (
      <>
        <p className="muted">
          {provider === 'yandex'
            ? 'Доступные имя, пол и контакты добавим из Яндекс ID. Недостающие сведения для связи спросим при оформлении заявки.'
            : 'Подтвердим почту кодом из письма. Она нужна для связи и восстановления доступа.'}
        </p>
        <Acceptance
          id="pd-account"
          label="Даю согласие на обработку данных для личного кабинета."
        />
        <Acceptance id="account-terms" label="Принимаю условия личного кабинета." />
        <DocumentButton id="privacy">Политика обработки данных</DocumentButton>
      </>
    )}
  </>
);
export default SocialRegistrationFields;
