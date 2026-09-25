import { apiRequest } from '../shared/api/api-client';

export type AddressDetails = {
  region: string | null;
  city: string;
  street: string;
  house: string;
  apartment: string | null;
  postalCode: string | null;
};

export type SavedAddress = AddressDetails & { id: string };

export const addressFromForm = (form: FormData, prefix: string): AddressDetails => {
  const value = (field: string) => String(form.get(prefix + field) ?? '').trim();
  return {
    region: value('Region') || null,
    city: value('City'),
    street: value('Street'),
    house: value('House'),
    apartment: value('Apartment') || null,
    postalCode: value('PostalCode') || null,
  };
};

export const addressText = (address: AddressDetails) =>
  [
    address.postalCode,
    address.region,
    address.city,
    `ул. ${address.street}, д. ${address.house}`,
    address.apartment ? `кв. ${address.apartment}` : null,
  ]
    .filter(Boolean)
    .join(', ');

const path = '/shop/me/addresses';
export const listAddresses = () => apiRequest<SavedAddress[]>(path);
export const createAddress = (address: AddressDetails) =>
  apiRequest<SavedAddress>(path, { method: 'POST', body: JSON.stringify(address) });
export const updateAddress = (id: string, address: AddressDetails) =>
  apiRequest<SavedAddress>(`${path}/${id}`, { method: 'PUT', body: JSON.stringify(address) });
export const deleteAddress = (id: string) => apiRequest(`${path}/${id}`, { method: 'DELETE' });
