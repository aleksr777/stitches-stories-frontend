import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/model/use-auth';
import { useStore } from './context';
import Icon from './icons';
import ProductCardCartControl from './product-card-cart-control';
import { ProductImage } from './product-media';
import { money, type Product } from './types';
import './product-card.css';

const ProductCard = ({ product }: { product: Product }) => {
  const { cart, favorites, add, setQuantity, toggleFavorite } = useStore();
  const { isAuth, role } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isOwner = role === 'admin';
  const roleIsLoading = isAuth && role === null;
  const quantity = cart.find((item) => item.productId === product.id)?.quantity ?? 0;

  const favorite = async () => {
    if (isOwner || roleIsLoading) return;
    if (!isAuth) {
      navigate('?auth=login');
      return;
    }
    try {
      setBusy(true);
      await toggleFavorite(product.id);
    } catch {
      setError('Не удалось сохранить избранное.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="product-card">
      <div className="product-visual">
        <ProductImage product={product} />
        <button
          className={'favorite ' + (favorites.includes(product.id) ? 'selected' : '')}
          aria-label={'В избранное: ' + product.name}
          aria-pressed={favorites.includes(product.id)}
          onClick={() => void favorite()}
          disabled={busy || isOwner || roleIsLoading}
        >
          <Icon name="heart" />
        </button>
        {product.isDemo && <span className="demo-tag">Пример</span>}
      </div>
      <div className="product-card-content">
        <small>{product.category === 'covers' ? 'Обложка на паспорт' : 'Брелок с вышивкой'}</small>
        <h3>
          <Link className="product-card-link product-name" to={'/products/' + product.slug}>
            {product.name}
          </Link>
        </h3>
        <p className="product-card-price">{money(product.priceRub)}</p>
        <ProductCardCartControl
          product={product}
          quantity={quantity}
          disabled={isOwner || roleIsLoading}
          add={add}
          setQuantity={setQuantity}
        />
        {error && <p role="alert">{error}</p>}
      </div>
    </article>
  );
};

export default ProductCard;
