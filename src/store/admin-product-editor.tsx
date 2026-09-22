import { useState, type FormEvent } from 'react';
import AdminProductFields from './admin-product-fields';
import { buildProductUpload } from './admin-product-upload';
import Modal from './modal';
import ProductImageEditor, { type EditableProductImage } from './product-image-editor';
import type { Category, Product } from './types';

type Props = {
  product: Product;
  categories: Category[];
  busy: boolean;
  error: string;
  close: () => void;
  save: (upload: FormData) => Promise<boolean>;
};

const AdminProductEditor = ({ product, categories, busy, error, close, save }: Props) => {
  const [images, setImages] = useState<EditableProductImage[]>(
    product.images.map((path) => ({ key: path, path })),
  );
  const [validationError, setValidationError] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError('');
    try {
      const upload = buildProductUpload(product, event.currentTarget, images);
      if (await save(upload)) close();
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Не удалось подготовить изделие.');
    }
  };

  return (
    <Modal
      title={product.id ? 'Редактирование изделия' : 'Новое изделие'}
      className="product-editor-modal"
      onClose={() => {
        if (!busy) close();
      }}
    >
      <form className="form product-editor-form" onSubmit={(event) => void submit(event)}>
        <fieldset className="product-editor-fields" disabled={busy}>
          <AdminProductFields product={product} categories={categories} />
          <ProductImageEditor
            images={images}
            onChange={setImages}
            disabled={busy}
            required={!product.id}
          />
          {(validationError || error) && <p role="alert">{validationError || error}</p>}
          <div className="product-editor-actions">
            <button className="button" disabled={busy}>
              {busy ? 'Сохраняем изделие и фотографии…' : 'Сохранить изделие'}
            </button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
};

export default AdminProductEditor;
