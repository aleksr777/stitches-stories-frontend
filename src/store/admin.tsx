import { useEffect, useState, type FormEvent } from 'react';
import { apiRequest } from '../shared/api/api-client';
import { useStore } from './context';
import { money, statusNames, type OrderRequest, type Product } from './types';
import Modal from './modal';
const blank: Product = {
  id: '',
  slug: '',
  name: '',
  category: 'keychains',
  priceRub: 1200,
  description: '',
  materials: '',
  dimensions: '',
  productionTime: 'По согласованию',
  images: [],
  stock: 1,
  featured: false,
  active: false,
  isDemo: true,
};
const Admin = () => {
  const { retry } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderRequest[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all([
      apiRequest<Product[]>('/shop/admin/products'),
      apiRequest<OrderRequest[]>('/shop/admin/requests'),
    ])
      .then(([p, o]) => {
        if (active) {
          setProducts(p);
          setOrders(o);
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Ошибка загрузки.');
      });
    return () => {
      active = false;
    };
  }, [revision]);
  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    const data = new FormData(e.currentTarget);
    const body = {
      slug: String(data.get('slug')),
      name: String(data.get('name')),
      category: String(data.get('category')),
      priceRub: Number(data.get('priceRub')),
      description: String(data.get('description')),
      materials: String(data.get('materials')),
      dimensions: String(data.get('dimensions')),
      productionTime: String(data.get('productionTime')),
      images: String(data.get('images') ?? '')
        .split('\n')
        .map((v) => v.trim())
        .filter(Boolean),
      stock: Number(data.get('stock')),
      featured: !!data.get('featured'),
      active: !!data.get('active'),
      isDemo: !!data.get('isDemo'),
    };
    setBusy(true);
    setError('');
    try {
      await apiRequest('/shop/admin/products' + (editing.id ? '/' + editing.id : ''), {
        method: editing.id ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      });
      setEditing(null);
      setRevision((v) => v + 1);
      retry();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить.');
    } finally {
      setBusy(false);
    }
  };
  const status = async (id: string, value: string) => {
    setBusy(true);
    try {
      await apiRequest('/shop/admin/requests/' + id, {
        method: 'PATCH',
        body: JSON.stringify({ status: value }),
      });
      setRevision((v) => v + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось обновить статус.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="page">
      <p className="eyebrow">Мастерская</p>
      <h1>Управление магазином</h1>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <section className="panel">
        <div className="section-heading">
          <h2>Изделия</h2>
          <button className="button" onClick={() => setEditing({ ...blank })}>
            Новое изделие
          </button>
        </div>
        {products.map((p) => (
          <article className="admin-row" key={p.id}>
            <div>
              <h3>{p.name}</h3>
              <p>
                {money(p.priceRub)} · {p.active ? 'В каталоге' : 'Скрыто'}
                {p.isDemo ? ' · Демо' : ''}
              </p>
            </div>
            <button className="text-link" onClick={() => setEditing(p)}>
              Изменить
            </button>
          </article>
        ))}
      </section>
      <section className="panel">
        <h2>Последние заявки</h2>
        {orders.length ? (
          orders.map((o) => (
            <article className="request" key={o.id}>
              <h3>
                № {o.id.slice(0, 8).toUpperCase()} · {o.name}
              </h3>
              <p>
                {o.email} · {o.phone ?? 'Телефон не указан'} · {o.city}
              </p>
              <p>
                {o.items.map((i) => i.name + ' × ' + i.quantity).join(', ')} —{' '}
                {money(o.subtotalRub)}
              </p>
              <p>{o.comment}</p>
              <label>
                Статус
                <select
                  value={o.status}
                  disabled={busy}
                  onChange={(e) => void status(o.id, e.target.value)}
                >
                  {Object.entries(statusNames).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </article>
          ))
        ) : (
          <p>Заявок пока нет.</p>
        )}
      </section>
      {editing && (
        <Modal
          title={editing.id ? 'Редактирование изделия' : 'Новое изделие'}
          onClose={() => setEditing(null)}
        >
          <form className="form" onSubmit={(e) => void save(e)}>
            <label>
              Название
              <input
                name="name"
                defaultValue={editing.name}
                minLength={2}
                maxLength={200}
                required
              />
            </label>
            <label>
              Адрес в каталоге
              <input
                name="slug"
                defaultValue={editing.slug}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                maxLength={100}
                required
              />
            </label>
            <label>
              Категория
              <select name="category" defaultValue={editing.category}>
                <option value="keychains">Брелок</option>
                <option value="covers">Обложка</option>
              </select>
            </label>
            <label>
              Цена, ₽
              <input
                name="priceRub"
                type="number"
                min={1}
                max={1000000}
                defaultValue={editing.priceRub}
                required
              />
            </label>
            <label>
              Описание
              <textarea
                name="description"
                defaultValue={editing.description}
                minLength={10}
                maxLength={6000}
                required
              />
            </label>
            {(['materials', 'dimensions', 'productionTime'] as const).map((key, i) => (
              <label key={key}>
                {['Материалы', 'Размеры', 'Срок изготовления'][i]}
                <input
                  name={key}
                  defaultValue={editing[key]}
                  minLength={2}
                  maxLength={key === 'materials' ? 250 : key === 'dimensions' ? 100 : 160}
                  required
                />
              </label>
            ))}
            <label>
              Фотографии: по одному пути /images/имя.jpg в строке
              <textarea
                name="images"
                defaultValue={editing.images.join('\n')}
                placeholder="/images/quiet-garden.jpg"
              />
            </label>
            <p className="muted">
              Оригиналы размещаются в папке public/images фронтенда. Внешние ссылки не принимаются.
            </p>
            <label>
              Доступное количество
              <input
                type="number"
                name="stock"
                min={0}
                max={10000}
                defaultValue={editing.stock}
                required
              />
            </label>
            {(['featured', 'active', 'isDemo'] as const).map((key, i) => (
              <label className="check" key={key}>
                <input name={key} type="checkbox" defaultChecked={editing[key]} />
                <span>
                  {['Показывать на главной', 'Показывать в каталоге', 'Демонстрационный товар'][i]}
                </span>
              </label>
            ))}
            {error && <p role="alert">{error}</p>}
            <button className="button" disabled={busy}>
              {busy ? 'Сохраняем…' : 'Сохранить изделие'}
            </button>
          </form>
        </Modal>
      )}
    </section>
  );
};
export default Admin;
