import { useState, type FormEvent } from 'react';
import Modal, { ModalDismissButton } from './modal';
import type { Category } from './types';

type Props = {
  category: Category | null;
  removing: boolean;
  busy: boolean;
  error: string;
  close: () => void;
  confirm: (name: string) => Promise<boolean>;
};

const AdminCategoryDialog = ({ category, removing, busy, error, close, confirm }: Props) => {
  const [name, setName] = useState(category?.name ?? '');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (await confirm(name.trim())) close();
  };
  return (
    <Modal
      title={
        removing ? 'Удалить категорию?' : category ? 'Переименовать категорию' : 'Новая категория'
      }
      onClose={() => {
        if (!busy) close();
      }}
    >
      <form className="form category-form" onSubmit={(event) => void submit(event)}>
        <fieldset className="category-fields" disabled={busy}>
          {removing ? (
            <p>Пустая категория «{category?.name}» будет удалена из магазина.</p>
          ) : (
            <label>
              Название категории
              <input
                name="categoryName"
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={1}
                maxLength={100}
                required
              />
            </label>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="category-actions">
            <ModalDismissButton className="button button-secondary" disabled={busy}>
              Отмена
            </ModalDismissButton>
            <button className={'button' + (removing ? ' danger-button' : '')} disabled={busy}>
              {busy ? 'Сохраняем…' : removing ? 'Удалить категорию' : 'Сохранить категорию'}
            </button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
};

export default AdminCategoryDialog;
