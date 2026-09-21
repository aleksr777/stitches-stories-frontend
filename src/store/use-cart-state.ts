import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../features/auth/model/use-auth';
import { readCart, saveCart } from './cart-storage';
import type { Product } from './types';

export const useCartState = (products: Product[]) => {
  const { isAuth, role } = useAuth();
  const [cart, setCart] = useState(readCart);

  useEffect(() => saveCart(cart), [cart]);
  useEffect(() => {
    if (role === 'admin') setCart([]);
  }, [role]);

  const setQuantity = useCallback(
    (id: string, quantity: number) => {
      if (role === 'admin' || (isAuth && role === null)) return;
      setCart((items) => {
        const filtered = items.filter((item) => item.productId !== id);
        if (quantity <= 0) return filtered;
        return [
          ...filtered,
          { productId: id, quantity: Math.min(10, Math.max(1, Math.floor(quantity))) },
        ];
      });
    },
    [isAuth, role],
  );

  const add = useCallback(
    (id: string) => {
      setCart((items) => {
        if (role === 'admin' || (isAuth && role === null)) return items;
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
    [isAuth, products, role],
  );

  return {
    cart,
    setQuantity,
    add,
    clearCart: () => setCart([]),
  };
};
