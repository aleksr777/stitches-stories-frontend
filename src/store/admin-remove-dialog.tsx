import Modal, { ModalDismissButton } from './modal';
import type { Product } from './types';

type Props = {
  product: Product;
  busy: boolean;
  error: string;
  close: () => void;
  remove: () => void;
};

const AdminRemoveDialog = ({ product, busy, error, close, remove }: Props) => (
  <Modal
    title="Удалить изделие?"
    className="product-remove-modal"
    onClose={() => {
      if (!busy) close();
    }}
  >
    <div className="product-remove-confirm">
      <p>
        Изделие «<strong>{product.name}</strong>» будет удалено из магазина вместе с фотографиями.
      </p>
      <p className="muted">Сохранённые заявки останутся в истории без изменений.</p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="product-remove-actions">
        <ModalDismissButton className="button button-secondary" disabled={busy}>
          Отмена
        </ModalDismissButton>
        <button type="button" className="button danger-button" disabled={busy} onClick={remove}>
          {busy ? 'Удаляем изделие…' : 'Удалить изделие'}
        </button>
      </div>
    </div>
  </Modal>
);

export default AdminRemoveDialog;
