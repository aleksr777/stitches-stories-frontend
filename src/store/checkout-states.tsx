import { Link } from 'react-router-dom';
import { money, type Receipt } from './types';

export const OwnerCartUnavailable = () => (
  <section className="page empty">
    <p className="eyebrow">Мастерская</p>
    <h1>Корзина недоступна</h1>
    <p>Владелец магазина не может добавлять изделия в корзину и оформлять заявки на покупку.</p>
    <Link className="button" to="/admin/shop">
      Перейти к управлению магазином
    </Link>
  </section>
);

export const CheckoutSuccess = ({ receipt }: { receipt: Receipt }) => (
  <section className="page narrow success">
    <p className="eyebrow">Спасибо за вашу историю</p>
    <h1>Заявка отправлена</h1>
    <p>
      Номер заявки: <strong>{receipt.number}</strong>
    </p>
    <p>
      Изделия на сумму {money(receipt.subtotalRub)}. Мастер свяжется с вами, чтобы подтвердить
      детали, доставку и итоговую стоимость.
    </p>
    <p>Оплата ещё не произведена. Наличие и сроки требуют подтверждения.</p>
    <Link className="button" to="/catalog">
      Вернуться в коллекцию
    </Link>
  </section>
);

export const EmptyCart = () => (
  <section className="page empty">
    <p className="eyebrow">Место для любимых вещей</p>
    <h1>Ваша корзина пока пуста</h1>
    <Link className="button" to="/catalog">
      Найти свою историю
    </Link>
  </section>
);
