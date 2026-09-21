import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/model/use-auth';
import { useStore } from './context';
import Icon from './icons';
import { ProductImage } from './product-media';
import { money, type Product } from './types';

const ProductCard = ({ product }: { product: Product }) => {
  const { favorites, toggleFavorite } = useStore();
  const { isAuth, role } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isOwner = role === 'admin';
  const roleIsLoading = isAuth && role === null;

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
        <Link to={'/products/' + product.slug} aria-label={product.name}>
          <ProductImage product={product} />
        </Link>
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
      <small>{product.category === 'covers' ? 'Обложка на паспорт' : 'Брелок с вышивкой'}</small>
      <h3>
        <Link to={'/products/' + product.slug}>{product.name}</Link>
      </h3>
      <p>{money(product.priceRub)}</p>
      {error && <p role="alert">{error}</p>}
    </article>
  );
};

export default ProductCard;
