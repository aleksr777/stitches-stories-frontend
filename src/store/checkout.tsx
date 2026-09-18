import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/model/use-auth';
import { apiRequest } from '../shared/api/api-client';
import { useStore } from './context';
import { Acceptance, DocumentButton } from './legal';
import { ProductImage } from './products';
import { documentRef, money, type Receipt } from './types';
const Checkout = () => {
  const { cart, products, documents, setQuantity, clearCart, retry, loading } = useStore();
  const { isAuth, isInitializing, role } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const attempt = useRef<{ payload: string; key: string } | null>(null);
  const selected = cart.map((item) => ({
    item,
    product: products.find((p) => p.id === item.productId),
  }));
  const total = selected.reduce(
    (sum, { item, product }) => sum + (product?.priceRub ?? 0) * item.quantity,
    0,
  );
  const unavailable = selected.some(
    ({ item, product }) => !product || product.stock < item.quantity,
  );
  const offer = documents.find((d) => d.id === 'offer');
  const isOwner = role === 'admin';
  const roleIsLoading = isAuth && role === null;
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy || !offer || unavailable || isOwner || roleIsLoading) return;
    const form = new FormData(e.currentTarget);
    if (!form.get('offer')) return;
    const payload = {
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? ''),
      city: String(form.get('city') ?? ''),
      ...(form.get('phone') ? { phone: String(form.get('phone')) } : {}),
      comment: String(form.get('comment') ?? ''),
      items: selected.map(({ item, product }) => ({
        ...item,
        expectedPriceRub: product!.priceRub,
      })),
      document: documentRef(offer),
    };
    const serialized = JSON.stringify(payload);
    if (attempt.current?.payload !== serialized)
      attempt.current = { payload: serialized, key: crypto.randomUUID() };
    setBusy(true);
    setError('');
    try {
      const result = await apiRequest<Receipt>('/shop/requests', {
        method: 'POST',
        auth: isAuth ? 'access' : 'none',
        body: JSON.stringify({ ...payload, requestKey: attempt.current.key }),
      });
      setReceipt(result);
      clearCart();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Не удалось отправить заявку. Введённые данные сохранены.',
      );
    } finally {
      setBusy(false);
    }
  };
  if (receipt)
    return (
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
  if (!cart.length)
    return (
      <section className="page empty">
        <p className="eyebrow">Место для любимых вещей</p>
        <h1>Ваша корзина пока пуста</h1>
        <Link className="button" to="/catalog">
          Найти свою историю
        </Link>
      </section>
    );
  return (
    <section className="page">
      <p className="eyebrow">Совсем немного до вашей истории</p>
      <h1>Корзина и заявка</h1>
      <div className="checkout">
        <div>
          <div className="cart-items">
            {selected.map(({ item, product }) => (
              <article className="cart-row" key={item.productId}>
                {product ? (
                  <>
                    <Link to={'/products/' + product.slug}>
                      <ProductImage product={product} />
                    </Link>
                    <div>
                      <h3>{product.name}</h3>
                      <p>{money(product.priceRub)}</p>
                      <label>
                        Количество{' '}
                        <input
                          aria-label={'Количество: ' + product.name}
                          type="number"
                          min={1}
                          max={Math.min(product.stock, 10)}
                          value={item.quantity}
                          onChange={(e) => setQuantity(item.productId, Number(e.target.value) || 1)}
                        />
                      </label>
                    </div>
                  </>
                ) : (
                  <p>Изделие больше не доступно в каталоге.</p>
                )}
                <button
                  type="button"
                  className="text-link"
                  disabled={busy}
                  onClick={() => setQuantity(item.productId, 0)}
                >
                  Убрать
                </button>
              </article>
            ))}
          </div>
          <div className="totals">
            <span>Изделия</span>
            <strong>{money(total)}</strong>
          </div>
          <p className="muted">
            Стоимость доставки уточним отдельно. Отправка заявки не списывает деньги и не
            резервирует изделие.
          </p>
        </div>
        {isOwner ? (
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
        ) : (
          <form className="form checkout-form" onSubmit={(e) => void submit(e)}>
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
            <button
              className="button full"
              disabled={busy || isInitializing || loading || !offer || unavailable || roleIsLoading}
            >
              {busy ? 'Отправляем…' : 'Отправить заявку мастеру'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};
export default Checkout;
