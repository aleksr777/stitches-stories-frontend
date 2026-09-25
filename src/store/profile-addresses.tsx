import AddressFields from './address-fields';
import { addressText } from './delivery-address';
import { useProfileAddresses } from './use-profile-addresses';

const ProfileAddresses = () => {
  const {
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
  } = useProfileAddresses();

  const currentAddress = addresses.find((address) => address.id === editing);
  return (
    <section className="panel" id="delivery-addresses">
      <h2>Адреса доставки</h2>
      <p>Выберите сохранённый адрес при оформлении заявки или укажите новый там же.</p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {loading ? <p>Загружаем адреса…</p> : !addresses.length ? <p>Адресов пока нет.</p> : null}
      <div className="saved-addresses">
        {addresses.map((address) => (
          <div className="saved-address" key={address.id}>
            <p>{addressText(address)}</p>
            {deleting === address.id ? (
              <div className="address-actions">
                <span>Удалить этот адрес?</span>
                <button
                  type="button"
                  className="text-link"
                  disabled={busy}
                  onClick={() => void remove(address.id)}
                >
                  Да, удалить
                </button>
                <button
                  type="button"
                  className="text-link"
                  disabled={busy}
                  onClick={() => setDeleting(null)}
                >
                  Отмена
                </button>
              </div>
            ) : (
              <div className="address-actions">
                <button
                  type="button"
                  className="text-link"
                  disabled={busy}
                  onClick={() => {
                    setEditing(address.id);
                    setDeleting(null);
                  }}
                >
                  Изменить
                </button>
                <button
                  type="button"
                  className="text-link"
                  disabled={busy}
                  onClick={() => {
                    setDeleting(address.id);
                    setEditing(null);
                  }}
                >
                  Удалить
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      {!editing && (
        <button
          type="button"
          className="button secondary"
          disabled={busy || loading || addresses.length >= 10}
          onClick={() => setEditing('new')}
        >
          Добавить адрес
        </button>
      )}
      {addresses.length >= 10 && <p>Можно сохранить не более 10 адресов.</p>}
      {editing && (
        <form className="form address-editor" key={editing} onSubmit={(event) => void save(event)}>
          <h3>{editing === 'new' ? 'Новый адрес' : 'Изменить адрес'}</h3>
          <AddressFields prefix="address" initial={currentAddress} disabled={busy} />
          <div className="address-actions">
            <button className="button" disabled={busy}>
              {busy ? 'Сохраняем…' : 'Сохранить адрес'}
            </button>
            <button
              type="button"
              className="button secondary"
              disabled={busy}
              onClick={() => setEditing(null)}
            >
              Отмена
            </button>
          </div>
        </form>
      )}
    </section>
  );
};

export default ProfileAddresses;
