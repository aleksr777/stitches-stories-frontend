import { Acceptance, DocumentButton } from './legal';

const SocialRegistrationFields = ({ linking }: { linking: boolean }) => (
  <>
    {!linking && (
      <label>
        Ваше имя
        <input name="name" autoComplete="name" required minLength={2} maxLength={200} />
      </label>
    )}
    <label>
      Электронная почта
      <input name="email" type="email" autoComplete="email" required maxLength={255} />
    </label>
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
          Подтвердим почту кодом из письма. Она нужна для связи и восстановления доступа.
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
