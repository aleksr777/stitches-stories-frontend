import { useEffect, useState } from 'react';
import { getCurrentUserRequest, type UserRole } from '../features/users/api/users-api';
import type { CheckoutContact } from './checkout-contact-fields';

export const useCheckoutPrefill = (isAuth: boolean, role: UserRole | null) => {
  const [prefill, setPrefill] = useState<CheckoutContact | null>(null);
  useEffect(() => {
    if (!isAuth || role !== 'user') return;
    let active = true;
    void getCurrentUserRequest()
      .then((user) => {
        if (active)
          setPrefill({
            name: user.name ?? '',
            email: user.email ?? user.contact_email ?? '',
            phone: user.phone_number ?? '',
          });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [isAuth, role]);
  return prefill;
};
