import { useEffect, useState, type FormEvent } from 'react';
import {
  addressFromForm,
  createAddress,
  deleteAddress,
  listAddresses,
  updateAddress,
  type SavedAddress,
} from './delivery-address';

export const useProfileAddresses = () => {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void listAddresses()
      .then((items) => {
        if (active) setAddresses(items);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Не удалось загрузить адреса.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing || busy) return;
    setBusy(true);
    setError('');
    try {
      const details = addressFromForm(new FormData(event.currentTarget), 'address');
      const saved =
        editing === 'new' ? await createAddress(details) : await updateAddress(editing, details);
      setAddresses((current) =>
        editing === 'new'
          ? [...current, saved]
          : current.map((address) => (address.id === saved.id ? saved : address)),
      );
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить адрес.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await deleteAddress(id);
      setAddresses((current) => current.filter((address) => address.id !== id));
      setDeleting(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить адрес.');
    } finally {
      setBusy(false);
    }
  };

  return {
    addresses,
    editing,
    deleting,
    busy,
    error,
    loading,
    setEditing,
    setDeleting,
    save,
    remove,
  };
};
