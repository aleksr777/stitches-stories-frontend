import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from './context';
import Icon from './icons';
import ProductCard from './product-card';

const Catalog = ({ favoritesOnly = false }: { favoritesOnly?: boolean }) => {
  const { products, favorites, loading } = useStore();
  const [params, setParams] = useSearchParams();
  const [sort, setSort] = useState('default');
  const category = params.get('category') ?? '';
  const query = params.get('q') ?? '';
  const filtered = products
    .filter(
      (product) =>
        (!favoritesOnly || favorites.includes(product.id)) &&
        (!category || product.category === category) &&
        product.name.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === 'asc' ? a.priceRub - b.priceRub : sort === 'desc' ? b.priceRub - a.priceRub : 0,
    );
  const catalogIsEmpty = !favoritesOnly && products.length === 0;

  return (
    <section className="page">
      <p className="eyebrow">Выбрано с теплом</p>
      <h1>{favoritesOnly ? 'Ваше избранное' : 'Найдите свою историю'}</h1>
      <p className="lead">Брелоки и обложки, в которых живёт немного тепла.</p>
      {!catalogIsEmpty && (
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
              onChange={(event) => {
                const next = new URLSearchParams(params);
                if (event.target.value) next.set('q', event.target.value);
                else next.delete('q');
                setParams(next, { replace: true });
              }}
            />
          </label>
          <select
            aria-label="Сортировка"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="default">Подборка мастерской</option>
            <option value="asc">Сначала дешевле</option>
            <option value="desc">Сначала дороже</option>
          </select>
        </div>
      )}
      {loading ? (
        <p role="status">Загружаем коллекцию…</p>
      ) : catalogIsEmpty ? (
        <div className="empty collection-empty catalog-empty">
          <p className="eyebrow">Скоро здесь будет тепло</p>
          <h2>Коллекция скоро появится</h2>
          <p>
            Мы бережно готовим новые изделия с вышивкой. Загляните чуть позже — здесь появятся новые
            истории.
          </p>
        </div>
      ) : filtered.length ? (
        <div className="product-grid">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
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

export default Catalog;
