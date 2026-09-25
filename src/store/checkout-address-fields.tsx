import { useState } from 'react';
import AddressFields from './address-fields';
import { addressText, type SavedAddress } from './delivery-address';

const CheckoutAddressFields = ({
  addresses,
  loadError,
}: {
  addresses: SavedAddress[];
  loadError: string;
}) => {
  const [choice, setChoice] = useState('later');
  const selected = addresses.find((address) => address.id === choice);
  return (
    <>
      <label>
        Адрес доставки
        <select
          name="addressChoice"
          value={choice}
          onChange={(event) => setChoice(event.target.value)}
        >
          <option value="later">Уточнить при согласовании</option>
          {addresses.map((address) => (
            <option value={address.id} key={address.id}>
              {addressText(address)}
            </option>
          ))}
          <option value="new">Указать новый адрес</option>
        </select>
      </label>
      {loadError && (
        <p className="error" role="alert">
          {loadError}
        </p>
      )}
      {selected && <p className="address-choice-preview">{addressText(selected)}</p>}
      {choice === 'later' && (
        <label>
          Город
          <input name="city" autoComplete="address-level2" required minLength={2} maxLength={150} />
        </label>
      )}
      {choice === 'new' && (
        <>
          <AddressFields prefix="delivery" />
          <label className="check">
            <input type="checkbox" name="saveAddress" />
            Сохранить адрес в профиле для следующих заявок
          </label>
        </>
      )}
    </>
  );
};

export default CheckoutAddressFields;
