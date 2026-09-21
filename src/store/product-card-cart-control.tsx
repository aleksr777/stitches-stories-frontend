import type { Product } from './types';

type Props = {
  product: Product;
  quantity: number;
  disabled: boolean;
  add: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
};

const ProductCardCartControl = ({ product, quantity, disabled, add, setQuantity }: Props) => {
  const maxQuantity = Math.min(product.stock, 10);
  const unavailable = product.stock < 1;

  if (!quantity)
    return (
      <button
        type="button"
        className="product-card-add"
        disabled={disabled || unavailable}
        onClick={() => add(product.id)}
      >
        {unavailable ? 'Сейчас недоступно' : 'Добавить в корзину'}
      </button>
    );

  return (
    <div className="product-card-quantity" aria-label={'Количество: ' + product.name}>
      <button
        type="button"
        aria-label={'Уменьшить количество: ' + product.name}
        disabled={disabled}
        onClick={() => setQuantity(product.id, quantity - 1)}
      >
        −
      </button>
      <output aria-label={'Количество в корзине: ' + product.name}>{quantity}</output>
      <button
        type="button"
        aria-label={'Увеличить количество: ' + product.name}
        disabled={disabled || quantity >= maxQuantity}
        onClick={() => setQuantity(product.id, quantity + 1)}
      >
        +
      </button>
    </div>
  );
};

export default ProductCardCartControl;
