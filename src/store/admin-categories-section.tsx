import { useState } from 'react';
import AdminCategoryDialog from './admin-category-dialog';
import type { AdminCategory, Category } from './types';

type Props = {
  categories: AdminCategory[];
  busy: boolean;
  error: string;
  clearError: () => void;
  save: (category: Category | null, name: string) => Promise<boolean>;
  remove: (category: Category) => Promise<boolean>;
};
type Editing = { category: Category | null; removing: boolean };

const AdminCategoriesSection = ({ categories, busy, error, clearError, save, remove }: Props) => {
  const [editing, setEditing] = useState<Editing | null>(null);
  const open = (category: Category | null, removing = false) => {
    clearError();
    setEditing({ category, removing });
  };
  return (
    <section className="panel categories-panel" aria-labelledby="categories-title">
      <div className="section-heading">
        <h2 id="categories-title">Категории</h2>
        <button className="button" disabled={busy} onClick={() => open(null)}>
          Новая категория
        </button>
      </div>
      <p className="muted">Удалить можно только пустую категорию. Учитываются и скрытые изделия.</p>
      {categories.length ? (
        categories.map((category) => (
          <article className="admin-row category-row" key={category.id}>
            <div>
              <h3>{category.name}</h3>
              <p>Изделий: {category.productCount}</p>
            </div>
            <div className="admin-row-actions">
              <button
                className="text-link"
                disabled={busy}
                onClick={() => open(category)}
                aria-label={'Переименовать категорию: ' + category.name}
              >
                Переименовать
              </button>
              <button
                className="text-link danger-link"
                disabled={busy || category.productCount > 0}
                onClick={() => open(category, true)}
                aria-label={'Удалить категорию: ' + category.name}
              >
                Удалить
              </button>
            </div>
          </article>
        ))
      ) : (
        <p className="admin-empty">
          Категорий пока нет. Создайте первую подборку для своих изделий.
        </p>
      )}
      {editing && (
        <AdminCategoryDialog
          category={editing.category}
          removing={editing.removing}
          busy={busy}
          error={error}
          close={() => setEditing(null)}
          confirm={(name) =>
            editing.removing && editing.category
              ? remove(editing.category)
              : save(editing.category, name)
          }
        />
      )}
    </section>
  );
};

export default AdminCategoriesSection;
