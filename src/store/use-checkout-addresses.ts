import { useEffect, useState } from 'react';
import type { UserRole } from '../features/users/api/users-api';
import { listAddresses, type SavedAddress } from './delivery-address';

export const useCheckoutAddresses = (isAuth: boolean, role: UserRole | null) => {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!isAuth || role !== 'user') return;
    let active = true;
    void listAddresses()
      .then((items) => {
        if (active) setAddresses(items);
      })
      .catch(() => {
        if (active) setError('Не удалось загрузить сохранённые адреса. Можно указать новый.');
      });
    return () => {
      active = false;
    };
  }, [isAuth, role]);
  return { addresses, error };
};
