import { useCallback, useEffect, useState, type PropsWithChildren } from 'react';
import { apiRequest } from '../shared/api/api-client';
import { useAuth } from '../features/auth/model/use-auth';
import { StoreContext } from './context';
import { LegalDialog } from './legal';
import type { CartItem, LegalDocument, Product } from './types';
const readCart = (): CartItem[] => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem('ss-cart-v1') ?? '[]');
    if (!Array.isArray(value)) return [];
    return value
      .filter(
        (i): i is CartItem =>
          !!i &&
          typeof i === 'object' &&
          typeof i.productId === 'string' &&
          Number.isInteger(i.quantity) &&
          i.quantity > 0 &&
          i.quantity <= 10,
      )
      .slice(0, 30);
  } catch {
    return [];
  }
};
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
      .then(([p, d]) => {
        if (active) {
          setProducts(p);
          setDocuments(d);
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
  useEffect(() => {
    try {
      localStorage.setItem('ss-cart-v1', JSON.stringify(cart));
    } catch {
      /* Cart remains available in memory. */
    }
  }, [cart]);
  useEffect(() => {
    let active = true;
    setFavorites([]);
    if (isAuth && role === 'user')
      void apiRequest<string[]>('/shop/me/favorites')
        .then((v) => {
          if (active) setFavorites(v);
        })
        .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [isAuth, role]);
  const setQuantity = useCallback(
    (id: string, quantity: number) =>
      setCart((items) => {
        const filtered = items.filter((i) => i.productId !== id);
        return quantity > 0
          ? [
              ...filtered,
              { productId: id, quantity: Math.min(10, Math.max(1, Math.floor(quantity))) },
            ]
          : filtered;
      }),
    [],
  );
  const add = useCallback(
    (id: string) =>
      setCart((items) => {
        if (role === 'admin' || (isAuth && role === null)) return items;
        const p = products.find((v) => v.id === id);
        if (!p || p.stock < 1) return items;
        const existing = items.find((i) => i.productId === id);
        if (existing)
          return items.map((i) =>
            i.productId === id ? { ...i, quantity: Math.min(i.quantity + 1, p.stock, 10) } : i,
          );
        return [...items, { productId: id, quantity: 1 }];
      }),
    [isAuth, products, role],
  );
  const toggleFavorite = async (id: string) => {
    if (!isAuth) throw new Error('Войдите, чтобы сохранить избранное.');
    if (role === 'admin') throw new Error('Владелец магазина не может изменять избранное.');
    if (role === null) throw new Error('Проверяем возможности профиля. Попробуйте ещё раз.');
    const included = favorites.includes(id);
    await apiRequest('/shop/me/favorites/' + id, { method: included ? 'DELETE' : 'POST' });
    setFavorites((v) => (included ? v.filter((i) => i !== id) : [...v, id]));
  };
  const selected = documents.find((d) => d.id === documentId);
  return (
    <StoreContext.Provider
      value={{
        products,
        documents,
        cart,
        favorites,
        loading,
        error,
        retry: () => setRevision((v) => v + 1),
        setQuantity,
        add,
        clearCart: () => setCart([]),
        toggleFavorite,
        showDocument: setDocumentId,
      }}
    >
      {children}
      {selected && <LegalDialog document={selected} close={() => setDocumentId('')} />}
    </StoreContext.Provider>
  );
};
export default StoreProvider;
