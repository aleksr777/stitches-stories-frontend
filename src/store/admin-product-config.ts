import type { Product } from './types';

export const productDefaults = {
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

export const blankProduct: Product = {
  id: '',
  slug: '',
  name: '',
  priceRub: 0,
  images: [],
  ...productDefaults,
};
