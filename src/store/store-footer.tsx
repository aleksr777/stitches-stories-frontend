import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/model/use-auth';
import { DocumentButton } from './legal';
import { useStore } from './context';

const StoreFooter = ({ openDialog }: { openDialog: (name: string) => void }) => {
  const { role } = useAuth();
  const { categories } = useStore();
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Link className="brand" to="/">
            Stitches &amp; Stories
          </Link>
          <p>Маленькие вещи. Большие чувства.</p>
          <a
            className="contact-text"
            href="https://vk.ru/stitchs_and_stories"
            target="_blank"
            rel="noreferrer"
          >
            ВКонтакте →
          </a>
        </div>
        <div>
          <h3>Магазин</h3>
          <Link to="/catalog">Коллекция</Link>
          {categories.map((category) => (
            <Link key={category.id} to={'/catalog?category=' + encodeURIComponent(category.id)}>
              {category.name}
            </Link>
          ))}
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
