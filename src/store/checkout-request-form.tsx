import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Acceptance, DocumentButton } from './legal';

type Props = {
  isOwner: boolean;
  busy: boolean;
  disabled: boolean;
  unavailable: boolean;
  loading: boolean;
  hasOffer: boolean;
  error: string;
  retry: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const CheckoutRequestForm = ({
  isOwner,
  busy,
  disabled,
  unavailable,
  loading,
  hasOffer,
  error,
  retry,
  onSubmit,
}: Props) => {
  if (isOwner)
    return (
      <aside className="form checkout-form">
        <h2>Покупательские заявки</h2>
        <p className="notice">
          Вы управляете магазином. Для владельца не требуются согласия покупателя, а заявки и
          избранное недоступны.
        </p>
        <Link className="button secondary full" to="/admin/shop">
          Перейти к управлению магазином
        </Link>
        <button className="button full" disabled>
          Отправить заявку мастеру
        </button>
      </aside>
    );

  return (
    <form className="form checkout-form" onSubmit={onSubmit}>
      <h2>Куда написать?</h2>
      <p>Можно отправить заявку без регистрации.</p>
      <label>
        Ваше имя
        <input name="name" autoComplete="name" required minLength={2} maxLength={200} />
      </label>
      <label>
        Электронная почта
        <input name="email" type="email" autoComplete="email" required maxLength={255} />
      </label>
      <label>
        Город
        <input
          name="city"
          autoComplete="address-level2"
          required
          minLength={2}
          maxLength={150}
        />
      </label>
      <label>
        Телефон <small>по желанию</small>
        <input
          name="phone"
          type="tel"
          autoComplete="tel"
          pattern="[+0-9 ()\-]{6,30}"
          maxLength={30}
        />
      </label>
      <label>
        Пожелания <small>по желанию</small>
        <textarea name="comment" rows={3} maxLength={1500} />
      </label>
      <Acceptance id="offer" label="Принимаю условия отправки заявки и покупки." />
      <p className="muted">
        Данные нужны для обработки вашей заявки.{' '}
        <DocumentButton id="privacy">Политика обработки данных</DocumentButton>
      </p>
      {unavailable && !loading && (
        <p className="error" role="alert">
          Некоторые изделия недоступны в выбранном количестве. Измените корзину.
        </p>
      )}
      {error && (
        <div role="alert" className="error">
          <p>{error}</p>
          <button type="button" className="text-link" onClick={retry}>
            Обновить цены и наличие
          </button>
        </div>
      )}
      <button className="button full" disabled={disabled || !hasOffer}>
        {busy ? 'Отправляем…' : 'Отправить заявку мастеру'}
      </button>
    </form>
  );
};

export default CheckoutRequestForm;
