import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../features/auth/model/use-auth';
import { useStore } from './context';
import { ProductGallery } from './product-media';
import { money } from './types';

export { default as Catalog } from './catalog';
export { default as ProductCard } from './product-card';
export { ProductImage } from './product-media';

export const ProductPage = () => {
  const { slug } = useParams();
  const { products, add, loading } = useStore();
  const { isAuth, role } = useAuth();
  const [added, setAdded] = useState(false);
  const isOwner = role === 'admin';
  const roleIsLoading = isAuth && role === null;
  const product = products.find((value) => value.slug === slug);

  if (loading)
    return (
      <p className="page" role="status">
        Загружаем изделие…
      </p>
    );
  if (!product)
    return (
      <section className="page">
        <h1>Изделие не найдено</h1>
        <Link to="/catalog">Вернуться к коллекции</Link>
      </section>
    );

  return (
    <section className="page">
      <Link className="breadcrumb" to="/catalog">
        ← К коллекции
      </Link>
      <div className="product-detail">
        <ProductGallery key={product.id} product={product} />
        <div>
          <p className="eyebrow">Вышито с теплом</p>
          <h1>{product.name}</h1>
          <p className="price">{money(product.priceRub)}</p>
          {product.isDemo && (
            <p className="notice">
              Демонстрационное изделие: фото, описание и цена будут уточнены перед открытием
              магазина.
            </p>
          )}
          <p>{product.description}</p>
          <dl>
            <dt>Материалы</dt>
            <dd>{product.materials}</dd>
            <dt>Размеры</dt>
            <dd>{product.dimensions}</dd>
            <dt>Срок изготовления</dt>
            <dd>{product.productionTime}</dd>
          </dl>
          <button
            className="button"
            disabled={!product.stock || isOwner || roleIsLoading}
            onClick={() => {
              if (isOwner || roleIsLoading) return;
              add(product.id);
              setAdded(true);
            }}
          >
            {product.stock ? 'Добавить в корзину' : 'Сейчас недоступно'}
          </button>
          {added && !isOwner && !roleIsLoading && (
            <p role="status">
              Добавлено.{' '}
              <Link className="text-link" to="/cart">
                Перейти в корзину →
              </Link>
            </p>
          )}
          {isOwner ? (
            <p className="notice">
              Вы владелец магазина: покупательские заявки и избранное для этого профиля недоступны.
            </p>
          ) : (
            <p className="muted">
              Сначала отправьте заявку. Мастер подтвердит детали, срок и доставку.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
