import { money, type Product } from './types';

type Props = {
  products: Product[];
  busy: boolean;
  onCreate: () => void;
  onEdit: (product: Product) => void;
  onRemove: (product: Product) => void;
};

const AdminProductsSection = ({ products, busy, onCreate, onEdit, onRemove }: Props) => (
  <section className="panel">
    <div className="section-heading">
      <h2>Изделия</h2>
      <button className="button" disabled={busy} onClick={onCreate}>
        Новое изделие
      </button>
    </div>
    {products.length ? (
      products.map((product) => (
        <article className="admin-row" key={product.id}>
          <div>
            <h3 className="product-name">{product.name}</h3>
            <p>
              {money(product.priceRub)} · {product.active ? 'В каталоге' : 'Скрыто'}
              {product.isDemo ? ' · Демо' : ''}
            </p>
          </div>
          <div className="admin-row-actions">
            <button
              type="button"
              className="text-link"
              disabled={busy}
              onClick={() => onEdit(product)}
            >
              Изменить
            </button>
            <button
              type="button"
              className="text-link danger-link"
              aria-label={'Удалить изделие: ' + product.name}
              disabled={busy}
              onClick={() => onRemove(product)}
            >
              Удалить
            </button>
          </div>
        </article>
      ))
    ) : (
      <p className="admin-empty">Изделий пока нет. Создайте первую историю для витрины.</p>
    )}
  </section>
);

export default AdminProductsSection;
