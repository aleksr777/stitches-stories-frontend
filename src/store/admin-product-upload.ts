import type { EditableProductImage } from './product-image-editor';
import { productDefaults } from './admin-product-config';
import { newProductSlug } from './product-slug';
import type { Product } from './types';

export const buildProductUpload = (
  product: Product,
  formElement: HTMLFormElement,
  images: EditableProductImage[],
) => {
  const data = new FormData(formElement);
  const name = String(data.get('name') ?? '').trim();
  const priceRub = Number(data.get('priceRub'));
  const stock = Number(data.get('stock'));
  if (!Number.isInteger(priceRub) || priceRub < 1)
    throw new Error('Укажите цену изделия больше 0 ₽.');
  if (!product.id && !images.length) throw new Error('Добавьте хотя бы одну фотографию изделия.');

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
    slug: product.id ? product.slug : newProductSlug(name),
    name,
    category: String(data.get('category') ?? '') || null,
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
  upload.append('data', JSON.stringify(body));
  return upload;
};
