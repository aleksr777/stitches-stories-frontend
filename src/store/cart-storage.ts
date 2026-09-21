import type { CartItem } from './types';

const CART_KEY = 'ss-cart-v1';

export const readCart = (): CartItem[] => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(CART_KEY) ?? '[]');
    if (!Array.isArray(value)) return [];
    return value
      .filter(
        (item): item is CartItem =>
          !!item &&
          typeof item === 'object' &&
          typeof item.productId === 'string' &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0 &&
          item.quantity <= 10,
      )
      .slice(0, 30);
  } catch {
    return [];
  }
};

export const saveCart = (cart: CartItem[]) => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    /* Cart remains available in memory. */
  }
};
