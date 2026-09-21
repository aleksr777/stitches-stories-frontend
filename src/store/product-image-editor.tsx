import { useState, type ChangeEvent } from 'react';
import ProductImagePreview, { type EditableProductImage } from './product-image-preview';
import './product-images.css';

export type { EditableProductImage } from './product-image-preview';

type Props = {
  images: EditableProductImage[];
  onChange: (images: EditableProductImage[]) => void;
  disabled: boolean;
  required?: boolean;
};

const ProductImageEditor = ({ images, onChange, disabled, required = false }: Props) => {
  const [error, setError] = useState('');
  const choose = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    setError('');
    if (images.length + files.length > 8) {
      setError('Можно добавить до 8 фотографий. Сначала уберите лишние.');
      return;
    }
    if (files.some((file) => !file.size || file.size > 8 * 1024 * 1024)) {
      setError('Каждая фотография должна быть непустой и не больше 8 МБ.');
      return;
    }
    const invalidType = files.some((file) =>
      file.type
        ? !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
        : !/\.(jpe?g|png|webp)$/i.test(file.name),
    );
    if (invalidType) {
      setError('Выберите фотографии JPEG, PNG или WebP.');
      return;
    }
    onChange([...images, ...files.map((file) => ({ key: crypto.randomUUID(), file }))]);
  };

  return (
    <section className="product-image-editor" aria-label="Фотографии изделия">
      <label>
        Добавить фотографии {required && <span aria-hidden="true">*</span>}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          multiple
          disabled={disabled}
          onChange={choose}
          aria-label="Добавить фотографии"
          aria-describedby="product-photo-help"
          aria-required={required}
        />
      </label>
      <p id="product-photo-help" className="muted">
        {required && 'Для нового изделия добавьте хотя бы одну фотографию. '}До 8 фотографий JPEG,
        PNG или WebP, до 8 МБ каждая. Первое фото — основное. Фотографии загрузятся при сохранении
        изделия.
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {images.length > 0 && (
        <ol className="product-image-list">
          {images.map((image, index) => (
            <li key={image.key}>
              <ProductImagePreview image={image} index={index} />
              <span className="product-image-caption">
                {image.file?.name ?? 'Фото ' + (index + 1)}
                {index === 0 ? ' · Основное' : ''}
              </span>
              <div className="product-image-actions">
                {index > 0 && (
                  <button
                    type="button"
                    className="text-link"
                    disabled={disabled}
                    aria-label={'Сделать фото ' + (index + 1) + ' основным'}
                    onClick={() =>
                      onChange([image, ...images.filter((item) => item.key !== image.key)])
                    }
                  >
                    Сделать основным
                  </button>
                )}
                <button
                  type="button"
                  className="text-link"
                  disabled={disabled}
                  aria-label={'Убрать фото ' + (index + 1)}
                  onClick={() => {
                    onChange(images.filter((item) => item.key !== image.key));
                    setError('');
                  }}
                >
                  Убрать
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};

export default ProductImageEditor;
