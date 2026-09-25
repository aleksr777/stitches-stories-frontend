import { useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../features/auth/model/use-auth';
import { apiRequest } from '../shared/api/api-client';
import CheckoutCart from './checkout-cart';
import CheckoutRequestForm from './checkout-request-form';
import { CheckoutSuccess, EmptyCart, OwnerCartUnavailable } from './checkout-states';
import { useStore } from './context';
import { documentRef, type Receipt } from './types';
import { useCheckoutPrefill } from './use-checkout-prefill';

const Checkout = () => {
  const { cart, products, documents, setQuantity, clearCart, retry, loading } = useStore();
  const { isAuth, isInitializing, role } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const prefill = useCheckoutPrefill(isAuth, role);
  const attempt = useRef<{ payload: string; key: string } | null>(null);
  const selected = cart.map((item) => ({
    item,
    product: products.find((product) => product.id === item.productId),
  }));
  const total = selected.reduce(
    (sum, { item, product }) => sum + (product?.priceRub ?? 0) * item.quantity,
    0,
  );
  const unavailable = selected.some(
    ({ item, product }) => !product || product.stock < item.quantity,
  );
  const offer = documents.find((document) => document.id === 'offer');
  const isOwner = role === 'admin';
  const roleIsLoading = isAuth && role === null;

  if (roleIsLoading)
    return (
      <p className="page" role="status">
        Проверяем доступ к корзине…
      </p>
    );
  if (isOwner) return <OwnerCartUnavailable />;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAuth || busy || !offer || unavailable || isOwner || roleIsLoading) return;
    const form = new FormData(event.currentTarget);
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
        auth: 'access',
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

  if (receipt) return <CheckoutSuccess receipt={receipt} />;
  if (!cart.length) return <EmptyCart />;

  return (
    <section className="page">
      <p className="eyebrow">Совсем немного до вашей истории</p>
      <h1>Корзина и заявка</h1>
      <div className="checkout">
        <CheckoutCart selected={selected} total={total} busy={busy} setQuantity={setQuantity} />
        <CheckoutRequestForm
          prefill={prefill}
          isOwner={isOwner}
          busy={busy}
          disabled={busy || isInitializing || loading || unavailable || roleIsLoading}
          unavailable={unavailable}
          loading={loading}
          hasOffer={!!offer}
          error={error}
          retry={retry}
          onSubmit={(event) => void submit(event)}
        />
      </div>
    </section>
  );
};

export default Checkout;
