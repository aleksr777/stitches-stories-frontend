import { Link, NavLink, useLocation } from 'react-router-dom';
import { createAuthReturnState } from '../features/auth/model/auth-return-location';
import { useAuth } from '../features/auth/model/use-auth';
import { useStore } from './context';
import Icon from './icons';

type Props = {
  menu: boolean;
  setMenu: (open: boolean) => void;
  openAuth: () => void;
};

const StoreHeader = ({ menu, setMenu, openAuth }: Props) => {
  const { isAuth, isInitializing, role } = useAuth();
  const { cart } = useStore();
  const location = useLocation();
  const isCustomer = isAuth && role === 'user';
  const favoriteUnavailable = isAuth && role !== 'user';
  const cartUnavailable = isAuth && role !== 'user';
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
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
              state={isAuth ? undefined : createAuthReturnState(location)}
              aria-label="Избранное"
            >
              <Icon name="heart" />
            </Link>
          )}
          {cartUnavailable ? (
            <button type="button" className="icon-button bag" disabled aria-label="Корзина">
              <Icon name="bag" />
            </button>
          ) : (
            <Link
              className="icon-button bag"
              to={isAuth ? '/cart' : '?auth=login'}
              state={isAuth ? undefined : createAuthReturnState(location)}
              aria-label={isCustomer ? 'Корзина, изделий: ' + cartCount : 'Корзина'}
            >
              <Icon name="bag" />
              {isCustomer && cart.length > 0 && <span>{cartCount}</span>}
            </Link>
          )}
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
            onClick={() => setMenu(!menu)}
          >
            <Icon name="menu" />
          </button>
        </div>
      </header>
    </>
  );
};

export default StoreHeader;
