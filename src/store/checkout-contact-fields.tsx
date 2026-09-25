import { useEffect, useState } from 'react';

export type CheckoutContact = { name: string; email: string; phone: string };

const CheckoutContactFields = ({ prefill }: { prefill: CheckoutContact | null }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  useEffect(() => {
    if (!prefill) return;
    setName((current) => current || prefill.name);
    setEmail((current) => current || prefill.email);
    setPhone((current) => current || prefill.phone);
  }, [prefill]);
  return (
    <>
      <label>
        Ваше имя
        <input
          name="name"
          autoComplete="name"
          required
          minLength={2}
          maxLength={200}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label>
        Электронная почта
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={255}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label>
        Телефон <small>по желанию</small>
        <input
          name="phone"
          type="tel"
          autoComplete="tel"
          pattern="[+0-9 ()\-]{6,30}"
          maxLength={30}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </label>
    </>
  );
};

export default CheckoutContactFields;
