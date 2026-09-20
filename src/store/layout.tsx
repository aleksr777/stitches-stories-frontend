import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import CustomScrollbar from '../components/scrollbar/custom-scrollbar';
import { useAuth } from '../features/auth/model/use-auth';
import { useStore } from './context';
import AuthDialog, { type AuthMode } from './auth-dialog';
import Icon from './icons';
import Modal, { ModalDismissButton } from './modal';
import { DocumentButton } from './legal';
import { NewsletterDialog } from './newsletter';
const Layout = () => {
  const { isAuth, isInitializing, role } = useAuth();
  const { cart, error, retry } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const [dialog, setDialog] = useState('');
  const fromPath = location.pathname.startsWith('/auth/') ? location.pathname.split('/')[2] : null;
  const authParam = fromPath ?? new URLSearchParams(location.search).get('auth');
  const authMode =
    authParam && ['login', 'registration', 'password-reset'].includes(authParam)
      ? (authParam as AuthMode)
      : null;
  const favoriteUnavailable = isAuth && role !== 'user';
  const closeAuth = () => {
    if (fromPath) navigate('/', { replace: true });
    else {
      const params = new URLSearchParams(location.search);
      params.delete('auth');
      navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
    }
  };
  const openAuth = () => {
    const params = new URLSearchParams(location.search);
    params.set('auth', 'login');
    navigate({ pathname: location.pathname, search: params.toString() });
  };
  return (
    <>
      <CustomScrollbar />
      <a className="skip-link" href="#main">
        К содержимому
      </a>
      <div className="announcement">Вышивка с характером · Маленькие истории на каждый день</div>
      <header className="header container">
        <Link className="brand" to="/">
          Stitches &amp; Stories<small>Вышито с теплом</small>
        </Link>
        <nav aria-label="Главное меню" className={menu ? 'navigation open' : 'navigation'}>
          <NavLink onClick={() => setMenu(false)} to="/catalog">
            Коллекция
          </NavLink>
          <NavLink onClick={() => setMenu(false)} to="/about">
            О мастерской
          </NavLink>
          <NavLink onClick={() => setMenu(false)} to="/delivery">
            Доставка и оплата
          </NavLink>
        </nav>
        <div className="header-actions">
          <Link className="icon-button search-link" to="/catalog" aria-label="Поиск">
            <Icon name="search" />
          </Link>
          {favoriteUnavailable ? (
            <button type="button" className="icon-button" disabled aria-label="Избранное">
              <Icon name="heart" />
            </button>
          ) : (
            <Link
              className="icon-button"
              to={isAuth ? '/favorites' : '?auth=login'}
              aria-label="Избранное"
            >
              <Icon name="heart" />
            </Link>
          )}
          <Link
            className="icon-button bag"
            to="/cart"
            aria-label={'Корзина, изделий: ' + cart.reduce((s, i) => s + i.quantity, 0)}
          >
            <Icon name="bag" />
            {cart.length > 0 && <span>{cart.reduce((s, i) => s + i.quantity, 0)}</span>}
          </Link>
          {isAuth ? (
            <Link className="avatar" to="/users/me" aria-label="Мой профиль">
              Я
            </Link>
          ) : (
            <button
              className="icon-button"
              aria-label="Войти в аккаунт"
              disabled={isInitializing}
              onClick={openAuth}
            >
              <Icon name="user" />
            </button>
          )}
          <button
            className="icon-button menu-toggle"
            aria-label="Меню"
            aria-expanded={menu}
            onClick={() => setMenu((v) => !v)}
          >
            <Icon name="menu" />
          </button>
        </div>
      </header>
      {error && (
        <div className="store-error container" role="alert">
          {error}{' '}
          <button className="text-link" onClick={retry}>
            Повторить
          </button>
        </div>
      )}
      <main id="main">
        <Outlet />
      </main>
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
              <button className="text-link" onClick={() => setDialog('newsletter')}>
                Письма из мастерской
              </button>
            )}
          </div>
        </div>
        <div className="container footer-bottom">
          <small>© {new Date().getFullYear()} Stitches &amp; Stories</small>
          <div>
            <DocumentButton id="privacy">Конфиденциальность</DocumentButton>
            <button className="text-link" onClick={() => setDialog('cookies')}>
              Настройки данных
            </button>
          </div>
        </div>
      </footer>
      {authMode && !isAuth && <AuthDialog key={authMode} mode={authMode} close={closeAuth} />}
      {dialog === 'newsletter' && <NewsletterDialog close={() => setDialog('')} />}
      {dialog === 'cookies' && (
        <Modal title="Настройки данных" onClose={() => setDialog('')}>
          <p>
            Сайт использует cookie сеанса для входа и локальное хранение состава корзины. Аналитика
            и рекламные трекеры не подключены.
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
      )}
    </>
  );
};
export default Layout;
