import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/model/use-auth';
import { DocumentButton } from './legal';

const StoreFooter = ({ openDialog }: { openDialog: (name: string) => void }) => {
  const { role } = useAuth();
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Link className="brand" to="/">
            Stitches &amp; Stories
          </Link>
          <p>Маленькие вещи. Большие чувства.</p>
          <a href="https://vk.ru/stitchs_and_stories" target="_blank" rel="noreferrer">
            ВКонтакте →
          </a>
        </div>
        <div>
          <h3>Магазин</h3>
          <Link to="/catalog">Коллекция</Link>
          <Link to="/catalog?category=keychains">Брелоки</Link>
          <Link to="/catalog?category=covers">Обложки на паспорт</Link>
        </div>
        <div>
          <h3>Покупателям</h3>
          <Link to="/delivery">Доставка и оплата</Link>
          <DocumentButton id="returns">Возвраты и обращения</DocumentButton>
          <Link to="/documents">Документы магазина</Link>
          {role !== 'admin' && (
            <button className="text-link" onClick={() => openDialog('newsletter')}>
              Письма из мастерской
            </button>
          )}
        </div>
      </div>
      <div className="container footer-bottom">
        <small>© {new Date().getFullYear()} Stitches &amp; Stories</small>
        <div>
          <DocumentButton id="privacy">Конфиденциальность</DocumentButton>
          <button className="text-link" onClick={() => openDialog('cookies')}>
            Настройки данных
          </button>
        </div>
      </div>
    </footer>
  );
};

export default StoreFooter;
