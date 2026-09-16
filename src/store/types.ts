export type DocumentRef = { id: string; version: string; sha256: string };
export type LegalDocument = DocumentRef & {
  title: string;
  fullTitle?: string;
  type: string;
  status: string;
  notice: string;
  summary: string[][];
  sections: string[][];
};
export type Product = {
  id: string;
  slug: string;
  name: string;
  category: 'keychains' | 'covers';
  priceRub: number;
  description: string;
  materials: string;
  dimensions: string;
  productionTime: string;
  images: string[];
  stock: number;
  featured: boolean;
  active: boolean;
  isDemo: boolean;
};
export type CartItem = { productId: string; quantity: number };
export type Receipt = {
  id: string;
  number: string;
  subtotalRub: number;
  status: string;
  createdAt: string;
};
export type OrderRequest = Receipt & {
  name: string;
  email: string;
  city: string;
  phone: string | null;
  comment: string;
  items: { productId: string; name: string; priceRub: number; quantity: number }[];
};
export const money = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
export const documentRef = ({ id, version, sha256 }: DocumentRef): DocumentRef => ({
  id,
  version,
  sha256,
});
export const statusNames: Record<string, string> = {
  new: 'Отправлена мастеру',
  contacted: 'Обсуждаем детали',
  agreed: 'Согласована',
  closed: 'Закрыта',
};
