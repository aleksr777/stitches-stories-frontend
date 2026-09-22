import { useEffect, useState, type PropsWithChildren } from 'react';
import { useAuth } from '../features/auth/model/use-auth';
import { apiRequest } from '../shared/api/api-client';
import { useCartState } from './use-cart-state';
import { StoreContext } from './context';
import { LegalDialog } from './legal';
import type { Category, LegalDocument, Product } from './types';
import './categories.css';

const StoreProvider = ({ children }: PropsWithChildren) => {
  const { isAuth, role } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const { cart, setQuantity, add, clearCart } = useCartState(products);
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
      apiRequest<Category[]>('/shop/categories', { auth: 'none' }),
    ])
      .then(([nextProducts, nextDocuments, nextCategories]) => {
        if (active) {
          setProducts(nextProducts);
          setDocuments(nextDocuments);
          setCategories(nextCategories);
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
        products,
        categories,
        documents,
        cart,
        favorites,
        loading,
        error,
        retry: () => setRevision((value) => value + 1),
        setQuantity,
        add,
        clearCart,
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
