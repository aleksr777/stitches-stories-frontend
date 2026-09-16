import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../features/auth/model/use-auth';
import { useStore } from './context';
import Icon from './icons';
import { money, type Product } from './types';
export const ProductImage = ({ product }: { product: Product }) =>
  product.images[0] ? (
    <img
      className="product-photo"
      src={import.meta.env.BASE_URL + product.images[0].replace(/^\//, '')}
      alt={product.name}
    />
  ) : (
    <div className={'photo-placeholder ' + product.category}>
      <Icon name="camera" />
      <span>Здесь будет фотография изделия</span>
    </div>
  );
export const ProductCard = ({ product }: { product: Product }) => {
  const { favorites, toggleFavorite } = useStore();
  const { isAuth } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const favorite = async () => {
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
          disabled={busy}
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
export const Catalog = ({ favoritesOnly = false }: { favoritesOnly?: boolean }) => {
  const { products, favorites, loading } = useStore();
  const [params, setParams] = useSearchParams();
  const [sort, setSort] = useState('default');
  const category = params.get('category') ?? '';
  const query = params.get('q') ?? '';
  const filtered = products
    .filter(
      (p) =>
        (!favoritesOnly || favorites.includes(p.id)) &&
        (!category || p.category === category) &&
        p.name.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === 'asc' ? a.priceRub - b.priceRub : sort === 'desc' ? b.priceRub - a.priceRub : 0,
    );
  return (
    <section className="page">
      <p className="eyebrow">Выбрано с теплом</p>
      <h1>{favoritesOnly ? 'Ваше избранное' : 'Найдите свою историю'}</h1>
      <p className="lead">Брелоки и обложки, в которых живёт немного тепла.</p>
      <div className="catalog-tools">
        <div className="tabs">
          {[
            ['', 'Все изделия'],
            ['keychains', 'Брелоки'],
            ['covers', 'Обложки'],
          ].map(([id, label]) => (
            <button
              key={id}
              className={category === id ? 'active' : ''}
              onClick={() => {
                const next = new URLSearchParams(params);
                if (id) next.set('category', id);
                else next.delete('category');
                setParams(next);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="search-field">
          <Icon name="search" />
          <input
            aria-label="Поиск изделия"
            placeholder="Найти что-то своё"
            value={query}
            onChange={(e) => {
              const next = new URLSearchParams(params);
              if (e.target.value) next.set('q', e.target.value);
              else next.delete('q');
              setParams(next, { replace: true });
            }}
          />
        </label>
        <select aria-label="Сортировка" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="default">Подборка мастерской</option>
          <option value="asc">Сначала дешевле</option>
          <option value="desc">Сначала дороже</option>
        </select>
      </div>
      {loading ? (
        <p role="status">Загружаем коллекцию…</p>
      ) : filtered.length ? (
        <div className="product-grid">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <h2>Пока ничего не найдено</h2>
          <p>Попробуйте изменить поиск или загляните в коллекцию.</p>
          <Link to="/catalog" className="text-link">
            Вся коллекция →
          </Link>
        </div>
      )}
    </section>
  );
};
export const ProductPage = () => {
  const { slug } = useParams();
  const { products, add, loading } = useStore();
  const [added, setAdded] = useState(false);
  const product = products.find((p) => p.slug === slug);
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
        <ProductImage product={product} />
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
            disabled={!product.stock}
            onClick={() => {
              add(product.id);
              setAdded(true);
            }}
          >
            {product.stock ? 'Добавить в корзину' : 'Сейчас недоступно'}
          </button>
          {added && (
            <p role="status">
              Добавлено.{' '}
              <Link className="text-link" to="/cart">
                Перейти в корзину →
              </Link>
            </p>
          )}
          <p className="muted">
            Сначала отправьте заявку. Мастер подтвердит детали, срок и доставку.
          </p>
        </div>
      </div>
    </section>
  );
};
