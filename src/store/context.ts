import { createContext, useContext } from 'react';
import type { CartItem, Category, LegalDocument, Product } from './types';
export type StoreState = {
  products: Product[];
  categories: Category[];
  documents: LegalDocument[];
  cart: CartItem[];
  favorites: string[];
  loading: boolean;
  error: string;
  retry: () => void;
  setQuantity: (id: string, quantity: number) => void;
  add: (id: string) => void;
  clearCart: () => void;
  toggleFavorite: (id: string) => Promise<void>;
  showDocument: (id: string) => void;
};
export const StoreContext = createContext<StoreState | null>(null);
export const useStore = () => {
  const value = useContext(StoreContext);
  if (!value) throw new Error('StoreProvider is required');
  return value;
};
