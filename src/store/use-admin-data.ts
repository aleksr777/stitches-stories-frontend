import { useEffect, useState } from 'react';
import { apiRequest } from '../shared/api/api-client';
import { useStore } from './context';
import type { OrderRequest, Product } from './types';

export const useAdminData = () => {
  const { retry } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderRequest[]>([]);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiRequest<Product[]>('/shop/admin/products'),
      apiRequest<OrderRequest[]>('/shop/admin/requests'),
    ])
      .then(([nextProducts, nextOrders]) => {
        if (active) {
          setProducts(nextProducts);
          setOrders(nextOrders);
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Ошибка загрузки.');
      });
    return () => {
      active = false;
    };
  }, [revision]);

  const saveProduct = async (product: Product, upload: FormData) => {
    setBusy(true);
    setError('');
    try {
      await apiRequest('/shop/admin/products' + (product.id ? '/' + product.id : ''), {
        method: product.id ? 'PATCH' : 'POST',
        body: upload,
        timeoutMs: 120000,
      });
      setRevision((value) => value + 1);
      retry();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const removeProduct = async (product: Product) => {
    setBusy(true);
    setError('');
    try {
      await apiRequest('/shop/admin/products/' + product.id, { method: 'DELETE' });
      setRevision((value) => value + 1);
      retry();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить изделие.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const updateStatus = async (id: string, value: string) => {
    setBusy(true);
    try {
      await apiRequest('/shop/admin/requests/' + id, {
        method: 'PATCH',
        body: JSON.stringify({ status: value }),
      });
      setRevision((current) => current + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось обновить статус.');
    } finally {
      setBusy(false);
    }
  };

  return { products, orders, error, setError, busy, saveProduct, removeProduct, updateStatus };
};
