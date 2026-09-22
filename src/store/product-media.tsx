import { useState } from 'react';
import Icon from './icons';
import { productImageUrl } from './product-image-url';
import type { Product } from './types';
import './product-images.css';

export const ProductImage = ({
  product,
  path = product.images[0],
}: {
  product: Product;
  path?: string;
}) => {
  const [failed, setFailed] = useState('');
  const url = path ? productImageUrl(path) : '';
  return url && failed !== url ? (
    <img
      className="product-photo"
      src={url}
      alt={product.name}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(url)}
    />
  ) : (
    <div className={'photo-placeholder ' + (product.category ?? '')}>
      <Icon name="camera" />
      <span>{url ? 'Фотография временно недоступна' : 'Здесь будет фотография изделия'}</span>
    </div>
  );
};

export const ProductGallery = ({ product }: { product: Product }) => {
  const [selected, setSelected] = useState(0);
  return (
    <div className="product-gallery">
      <ProductImage product={product} path={product.images[selected] ?? product.images[0]} />
      {product.images.length > 1 && (
        <div className="product-thumbnails" role="group" aria-label="Фотографии изделия">
          {product.images.map((path, index) => (
            <button
              type="button"
              key={path}
              aria-label={'Показать фотографию ' + (index + 1)}
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
            >
              <img src={productImageUrl(path)} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
