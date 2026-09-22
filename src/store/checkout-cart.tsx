import { Link } from 'react-router-dom';
import { ProductImage } from './products';
import { money, type CartItem, type Product } from './types';

export type SelectedCartItem = {
  item: CartItem;
  product: Product | undefined;
};

type Props = {
  selected: SelectedCartItem[];
  total: number;
  busy: boolean;
  setQuantity: (id: string, quantity: number) => void;
};

const CheckoutCart = ({ selected, total, busy, setQuantity }: Props) => (
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
                <h3 className="product-name">{product.name}</h3>
                <p>{money(product.priceRub)}</p>
                <label>
                  Количество{' '}
                  <input
                    aria-label={'Количество: ' + product.name}
                    type="number"
                    min={1}
                    max={Math.min(product.stock, 10)}
                    value={item.quantity}
                    onChange={(event) =>
                      setQuantity(item.productId, Number(event.target.value) || 1)
                    }
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
      Стоимость доставки уточним отдельно. Отправка заявки не списывает деньги и не резервирует
      изделие.
    </p>
  </div>
);

export default CheckoutCart;
