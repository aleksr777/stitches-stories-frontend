import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../features/auth/model/use-auth';
import { readCart, saveCart } from './cart-storage';
import type { Product } from './types';

export const useCartState = (products: Product[]) => {
  const { isAuth, isInitializing, role } = useAuth();
  const [cart, setCart] = useState(readCart);
  const isCustomer = isAuth && role === 'user';

  useEffect(() => {
    if (!isInitializing && !isCustomer) setCart([]);
  }, [isCustomer, isInitializing]);
  useEffect(() => {
    if (!isInitializing) saveCart(isCustomer ? cart : []);
  }, [cart, isCustomer, isInitializing]);

  const setQuantity = useCallback(
    (id: string, quantity: number) => {
      if (!isCustomer) return;
      setCart((items) => {
        const filtered = items.filter((item) => item.productId !== id);
        if (quantity <= 0) return filtered;
        return [
          ...filtered,
          { productId: id, quantity: Math.min(10, Math.max(1, Math.floor(quantity))) },
        ];
      });
    },
    [isCustomer],
  );

  const add = useCallback(
    (id: string) => {
      if (!isCustomer) return;
      setCart((items) => {
        const product = products.find((value) => value.id === id);
        if (!product || product.stock < 1) return items;
        const existing = items.find((item) => item.productId === id);
        if (!existing) return [...items, { productId: id, quantity: 1 }];
        return items.map((item) =>
          item.productId === id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock, 10) }
            : item,
        );
      });
    },
    [isCustomer, products],
  );

  return {
    cart,
    setQuantity,
    add,
    clearCart: () => setCart([]),
  };
};
