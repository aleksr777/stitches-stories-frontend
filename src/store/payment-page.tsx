import { Link } from 'react-router-dom';
import PaymentActions from './payment-actions';
import PaymentDetails from './payment-details';
import PaymentTerms from './payment-terms';
import { usePayment } from './use-payment';
import './payments.css';

const PaymentPage = () => {
  const data = usePayment();
  return (
    <section className="page narrow payment-page">
      <p className="eyebrow">Ещё один шаг к вашей истории</p>
      <h1>Оплата заказа{data.invoice ? ' № ' + data.invoice.orderNumber : ''}</h1>
      {data.role === 'admin' ? (
        <>
          <button className="button" disabled>
            Оплатить через СБП
          </button>
          <p>
            <Link to="/admin/shop">К управлению магазином</Link>
          </p>
        </>
      ) : (
        <>
          {data.error && (
            <p className="error" role="alert">
              {data.error}{' '}
              <button className="text-link" onClick={data.refresh}>
                Повторить
              </button>
            </p>
          )}
          {!data.invoice && !data.error && <p role="status">Загружаем сведения об оплате…</p>}
          {data.invoice && (
            <div className="panel">
              <PaymentDetails invoice={data.invoice} />
              <PaymentTerms documents={data.invoice.documents} />
              <PaymentActions key={data.invoice.id} invoice={data.invoice} refresh={data.refresh} />
            </div>
          )}
        </>
      )}
    </section>
  );
};
export default PaymentPage;

export const PaymentReturn = () => (
  <section className="page narrow success">
    <p className="eyebrow">Stitches &amp; Stories</p>
    <h1>Вернитесь к вашему заказу</h1>
    <p>
      Результат оплаты появится на странице заказа после подтверждения платёжным сервисом. Вернитесь
      в исходную вкладку или откройте ссылку, полученную от мастера.
    </p>
    <p>Если вы оформляли заявку из аккаунта, она также доступна в профиле.</p>
    <Link className="button" to="/users/me">
      Открыть профиль
    </Link>
  </section>
);
