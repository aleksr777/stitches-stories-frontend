import { useEffect, useState } from 'react';
import { apiRequest } from '../shared/api/api-client';
import { useStore } from './context';
import type { AdminCategory, Category, OrderRequest, Product } from './types';

export const useAdminData = () => {
  const { retry } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderRequest[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      apiRequest<Product[]>('/shop/admin/products'),
      apiRequest<OrderRequest[]>('/shop/admin/requests'),
      apiRequest<AdminCategory[]>('/shop/admin/categories'),
    ])
      .then(([nextProducts, nextOrders, nextCategories]) => {
        if (active) {
          setProducts(nextProducts);
          setOrders(nextOrders);
          setCategories(nextCategories);
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Ошибка загрузки.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [revision]);

  const change = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await action();
      setRevision((value) => value + 1);
      retry();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить изменения.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const saveProduct = (product: Product, upload: FormData) =>
    change(() =>
      apiRequest('/shop/admin/products' + (product.id ? '/' + product.id : ''), {
        method: product.id ? 'PATCH' : 'POST',
        body: upload,
        timeoutMs: 120000,
      }),
    );

  const removeProduct = (product: Product) =>
    change(() => apiRequest('/shop/admin/products/' + product.id, { method: 'DELETE' }));

  const saveCategory = (category: Category | null, name: string) =>
    change(() =>
      apiRequest('/shop/admin/categories' + (category ? '/' + category.id : ''), {
        method: category ? 'PATCH' : 'POST',
        body: JSON.stringify({ name }),
      }),
    );

  const removeCategory = (category: Category) =>
    change(() => apiRequest('/shop/admin/categories/' + category.id, { method: 'DELETE' }));

  const updateStatus = (id: string, value: string) =>
    change(() =>
      apiRequest('/shop/admin/requests/' + id, {
        method: 'PATCH',
        body: JSON.stringify({ status: value }),
      }),
    );

  return {
    products,
    orders,
    categories,
    error,
    setError,
    busy,
    loading,
    saveProduct,
    removeProduct,
    updateStatus,
    saveCategory,
    removeCategory,
    reload: () => {
      setError('');
      setRevision((value) => value + 1);
    },
  };
};
