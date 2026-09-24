import { useAuth } from '../features/auth/model/use-auth';
import { DocumentButton } from './legal';
import Modal, { ModalDismissButton } from './modal';

const CookiesDialog = ({ close }: { close: () => void }) => {
  const { role } = useAuth();
  return (
    <Modal title="Настройки данных" onClose={close}>
      <p>
        Сайт использует cookie сеанса для входа и локальное хранение состава корзины после входа.
        Аналитика и рекламные трекеры не подключены.
      </p>
      <p>
        {role === 'admin'
          ? 'Владелец магазина не подтверждает согласия покупателя.'
          : 'Согласия на кабинет и рассылку можно отозвать в профиле.'}
      </p>
      <DocumentButton id="cookies-policy">Подробнее о cookie</DocumentButton>
      <p>
        <ModalDismissButton className="button">Понятно</ModalDismissButton>
      </p>
    </Modal>
  );
};

export default CookiesDialog;
