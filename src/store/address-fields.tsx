import type { AddressDetails } from './delivery-address';

type Props = { prefix: string; initial?: AddressDetails; disabled?: boolean };

const AddressFields = ({ prefix, initial, disabled = false }: Props) => (
  <div className="address-fields">
    <label>
      Область или край <small>по желанию</small>
      <input
        name={`${prefix}Region`}
        autoComplete="address-level1"
        maxLength={150}
        defaultValue={initial?.region ?? ''}
        disabled={disabled}
      />
    </label>
    <label>
      Город или населённый пункт
      <input
        name={`${prefix}City`}
        autoComplete="address-level2"
        required
        minLength={2}
        maxLength={150}
        defaultValue={initial?.city ?? ''}
        disabled={disabled}
      />
    </label>
    <label>
      Улица
      <input
        name={`${prefix}Street`}
        autoComplete="address-line1"
        required
        minLength={2}
        maxLength={200}
        defaultValue={initial?.street ?? ''}
        disabled={disabled}
      />
    </label>
    <div className="address-field-row">
      <label>
        Дом и корпус
        <input
          name={`${prefix}House`}
          required
          maxLength={40}
          defaultValue={initial?.house ?? ''}
          disabled={disabled}
        />
      </label>
      <label>
        Квартира <small>по желанию</small>
        <input
          name={`${prefix}Apartment`}
          autoComplete="address-line2"
          maxLength={40}
          defaultValue={initial?.apartment ?? ''}
          disabled={disabled}
        />
      </label>
    </div>
    <label>
      Почтовый индекс <small>по желанию</small>
      <input
        name={`${prefix}PostalCode`}
        autoComplete="postal-code"
        inputMode="numeric"
        pattern="[0-9]{6}"
        maxLength={6}
        defaultValue={initial?.postalCode ?? ''}
        disabled={disabled}
      />
    </label>
  </div>
);

export default AddressFields;
