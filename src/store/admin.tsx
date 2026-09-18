import { useEffect, useState, type FormEvent } from 'react';
import { apiRequest } from '../shared/api/api-client';
import { useStore } from './context';
import { money, statusNames, type OrderRequest, type Product } from './types';
import Modal from './modal';
import ProductImageEditor, { type EditableProductImage } from './product-image-editor';
const productDefaults = {
  category: 'keychains' as const,
  description: 'Описание изделия уточняется.',
  materials: 'Материалы уточняются.',
  dimensions: 'Размеры уточняются.',
  productionTime: 'По согласованию',
  stock: 1,
  featured: false,
  active: false,
  isDemo: true,
};
const blank: Product = {
  id: '',
  slug: '',
  name: '',
  priceRub: 0,
  images: [],
  ...productDefaults,
};
const transliteration: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};
const newProductSlug = (name: string) => {
  const stem = [...name.toLowerCase()]
    .map((character) => transliteration[character] ?? character)
    .join('')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 88)
    .replace(/-+$/g, '');
  return (stem || 'item') + '-' + crypto.randomUUID().slice(0, 8);
};
const Admin = () => {
  const { retry } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderRequest[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [removing, setRemoving] = useState<Product | null>(null);
  const [images, setImages] = useState<EditableProductImage[]>([]);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const edit = (product: Product) => {
    setError('');
    setImages(product.images.map((path) => ({ key: path, path })));
    setEditing(product);
  };
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
    const name = String(data.get('name') ?? '').trim();
    const priceRub = Number(data.get('priceRub'));
    const stock = Number(data.get('stock'));
    setError('');
    if (!Number.isInteger(priceRub) || priceRub < 1) {
      setError('Укажите цену изделия больше 0 ₽.');
      return;
    }
    if (!editing.id && !images.length) {
      setError('Добавьте хотя бы одну фотографию изделия.');
      return;
    }
    const text = (field: string, fallback: string) =>
      String(data.get(field) ?? '').trim() || fallback;
    const upload = new FormData();
    let fileIndex = 0;
    const paths = images.map((image) => {
      if (!image.file) return image.path;
      upload.append('files', image.file);
      return 'upload:' + fileIndex++;
    });
    const body = {
      slug: editing.id ? editing.slug : newProductSlug(name),
      name,
      category: String(data.get('category')),
      priceRub,
      description: text('description', productDefaults.description),
      materials: text('materials', productDefaults.materials),
      dimensions: text('dimensions', productDefaults.dimensions),
      productionTime: text('productionTime', productDefaults.productionTime),
      images: paths,
      stock: Number.isInteger(stock) && stock >= 0 ? stock : productDefaults.stock,
      featured: !!data.get('featured'),
      active: !!data.get('active'),
      isDemo: !!data.get('isDemo'),
    };
    setBusy(true);
    setError('');
    try {
      upload.append('data', JSON.stringify(body));
      await apiRequest('/shop/admin/products' + (editing.id ? '/' + editing.id : ''), {
        method: editing.id ? 'PATCH' : 'POST',
        body: upload,
        timeoutMs: 120000,
      });
      setEditing(null);
      setImages([]);
      setRevision((v) => v + 1);
      retry();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить.');
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!removing) return;
    setBusy(true);
    setError('');
    try {
      await apiRequest('/shop/admin/products/' + removing.id, { method: 'DELETE' });
      setRemoving(null);
      setRevision((v) => v + 1);
      retry();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить изделие.');
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
          <button className="button" disabled={busy} onClick={() => edit({ ...blank })}>
            Новое изделие
          </button>
        </div>
        {products.length ? (
          products.map((p) => (
            <article className="admin-row" key={p.id}>
              <div>
                <h3>{p.name}</h3>
                <p>
                  {money(p.priceRub)} · {p.active ? 'В каталоге' : 'Скрыто'}
                  {p.isDemo ? ' · Демо' : ''}
                </p>
              </div>
              <div className="admin-row-actions">
                <button type="button" className="text-link" disabled={busy} onClick={() => edit(p)}>
                  Изменить
                </button>
                <button
                  type="button"
                  className="text-link danger-link"
                  aria-label={'Удалить изделие: ' + p.name}
                  disabled={busy}
                  onClick={() => {
                    setError('');
                    setRemoving(p);
                  }}
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
          className="product-editor-modal"
          onClose={() => {
            if (!busy) {
              setEditing(null);
              setImages([]);
            }
          }}
        >
          <form className="form product-editor-form" onSubmit={(e) => void save(e)}>
            <fieldset className="product-editor-fields" disabled={busy}>
              <div className="product-editor-details">
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
                    min={0}
                    step={1}
                    max={1000000}
                    defaultValue={editing.priceRub}
                    required
                  />
                </label>
                <label className="product-editor-wide">
                  Описание
                  <textarea
                    name="description"
                    defaultValue={editing.description}
                    minLength={10}
                    maxLength={6000}
                  />
                </label>
                {(['materials', 'dimensions', 'productionTime'] as const).map((key, i) => (
                  <label
                    className={key === 'productionTime' ? 'product-editor-wide' : undefined}
                    key={key}
                  >
                    {['Материалы', 'Размеры', 'Срок изготовления'][i]}
                    <input
                      name={key}
                      defaultValue={editing[key]}
                      minLength={2}
                      maxLength={key === 'materials' ? 250 : key === 'dimensions' ? 100 : 160}
                    />
                  </label>
                ))}
              </div>
              <ProductImageEditor
                images={images}
                onChange={setImages}
                disabled={busy}
                required={!editing.id}
              />
              <label className="product-editor-stock">
                Доступное количество
                <input
                  type="number"
                  name="stock"
                  min={0}
                  max={10000}
                  defaultValue={editing.stock}
                />
              </label>
              <div className="product-editor-options">
                {(['featured', 'active', 'isDemo'] as const).map((key, i) => (
                  <label className="check" key={key}>
                    <input name={key} type="checkbox" defaultChecked={editing[key]} />
                    <span>
                      {
                        [
                          'Показывать на главной',
                          'Показывать в каталоге',
                          'Демонстрационный товар',
                        ][i]
                      }
                    </span>
                  </label>
                ))}
              </div>
              {error && <p role="alert">{error}</p>}
              <div className="product-editor-actions">
                <button className="button" disabled={busy}>
                  {busy ? 'Сохраняем изделие и фотографии…' : 'Сохранить изделие'}
                </button>
              </div>
            </fieldset>
          </form>
        </Modal>
      )}
      {removing && (
        <Modal
          title="Удалить изделие?"
          className="product-remove-modal"
          onClose={() => {
            if (!busy) setRemoving(null);
          }}
        >
          <div className="product-remove-confirm">
            <p>
              Изделие «<strong>{removing.name}</strong>» будет удалено из магазина вместе с
              фотографиями.
            </p>
            <p className="muted">Сохранённые заявки останутся в истории без изменений.</p>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <div className="product-remove-actions">
              <button
                type="button"
                className="button button-secondary"
                disabled={busy}
                onClick={() => setRemoving(null)}
              >
                Отмена
              </button>
              <button
                type="button"
                className="button danger-button"
                disabled={busy}
                onClick={() => void remove()}
              >
                {busy ? 'Удаляем изделие…' : 'Удалить изделие'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
};
export default Admin;
