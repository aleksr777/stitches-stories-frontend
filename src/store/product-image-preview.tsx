import { useEffect, useState } from 'react';
import { apiRequest } from '../shared/api/api-client';
import { productImageUrl } from './product-image-url';

export type EditableProductImage =
  | { key: string; path: string; file?: never }
  | { key: string; path?: never; file: File };

const ProductImagePreview = ({ image, index }: { image: EditableProductImage; index: number }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = '';
    setUrl('');
    setError(false);
    if (image.file) {
      objectUrl = URL.createObjectURL(image.file);
      setUrl(objectUrl);
    } else if (image.path.startsWith('/shop/images/')) {
      apiRequest<Blob>(image.path.replace('/shop/images/', '/shop/admin/images/'), {
        responseType: 'blob',
        signal: controller.signal,
      })
        .then((blob) => {
          if (!controller.signal.aborted) {
            objectUrl = URL.createObjectURL(blob);
            setUrl(objectUrl);
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) setError(true);
        });
    } else {
      setUrl(productImageUrl(image.path));
    }
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [image.file, image.path, attempt]);

  if (error)
    return (
      <div className="product-photo-error">
        <p>Не удалось показать фото.</p>
        <button
          type="button"
          className="text-link"
          onClick={() => setAttempt((value) => value + 1)}
        >
          Повторить фото {index + 1}
        </button>
      </div>
    );

  return url ? (
    <img src={url} alt={'Предпросмотр фотографии ' + (index + 1)} onError={() => setError(true)} />
  ) : (
    <p role="status">Загружаем фото…</p>
  );
};

export default ProductImagePreview;
