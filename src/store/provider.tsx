import { useCallback, useEffect, useState, type PropsWithChildren } from 'react';
import { useAuth } from '../features/auth/model/use-auth';
import { apiRequest } from '../shared/api/api-client';
import { readCart, saveCart } from './cart-storage';
import { StoreContext } from './context';
import { LegalDialog } from './legal';
import type { LegalDocument, Product } from './types';

const StoreProvider = ({ children }: PropsWithChildren) => {
  const { isAuth, role } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [cart, setCart] = useState(readCart);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [documentId, setDocumentId] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([
      apiRequest<Product[]>('/shop/products', { auth: 'none' }),
      apiRequest<LegalDocument[]>('/legal/documents', { auth: 'none' }),
    ])
      .then(([nextProducts, nextDocuments]) => {
        if (active) {
          setProducts(nextProducts);
          setDocuments(nextDocuments);
        }
      })
      .catch(() => {
        if (active)
          setError('Не удалось загрузить магазин. Проверьте соединение и повторите попытку.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [revision]);

  useEffect(() => saveCart(cart), [cart]);
  useEffect(() => {
    let active = true;
    setFavorites([]);
    if (isAuth && role === 'user')
      void apiRequest<string[]>('/shop/me/favorites')
        .then((value) => {
          if (active) setFavorites(value);
        })
        .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [isAuth, role]);

  const setQuantity = useCallback((id: string, quantity: number) => {
    setCart((items) => {
      const filtered = items.filter((item) => item.productId !== id);
      if (quantity <= 0) return filtered;
      return [
        ...filtered,
        { productId: id, quantity: Math.min(10, Math.max(1, Math.floor(quantity))) },
      ];
    });
  }, []);

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

  const toggleFavorite = async (id: string) => {
    if (!isAuth) throw new Error('Войдите, чтобы сохранить избранное.');
    if (role === 'admin') throw new Error('Владелец магазина не может изменять избранное.');
    if (role === null) throw new Error('Проверяем возможности профиля. Попробуйте ещё раз.');
    const included = favorites.includes(id);
    await apiRequest('/shop/me/favorites/' + id, { method: included ? 'DELETE' : 'POST' });
    setFavorites((value) => (included ? value.filter((item) => item !== id) : [...value, id]));
  };

  const selected = documents.find((document) => document.id === documentId);
  return (
    <StoreContext.Provider
      value={{
        products, documents, cart, favorites, loading, error,
        retry: () => setRevision((value) => value + 1),
        setQuantity, add, clearCart: () => setCart([]), toggleFavorite,
        showDocument: setDocumentId,
      }}
    >
      {children}
      {selected && <LegalDialog document={selected} close={() => setDocumentId('')} />}
    </StoreContext.Provider>
  );
};

export default StoreProvider;
