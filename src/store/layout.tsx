import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import CustomScrollbar from '../components/scrollbar/custom-scrollbar';
import {
  createAuthReturnState,
  getAuthModalCloseTo,
} from '../features/auth/model/auth-return-location';
import { useAuth } from '../features/auth/model/use-auth';
import AuthDialog, { type AuthMode } from './auth-dialog';
import { useStore } from './context';
import CookiesDialog from './cookies-dialog';
import CurrentPageLinkGuard from './current-page-link-guard';
import { NewsletterDialog } from './newsletter';
import StoreFooter from './store-footer';
import StoreHeader from './store-header';

const Layout = () => {
  const { isAuth } = useAuth();
  const { error, retry } = useStore();
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

  const closeAuth = () => {
    if (!fromPath) {
      const params = new URLSearchParams(location.search);
      params.delete('auth');
      const closeTo = getAuthModalCloseTo(location.state);
      if (closeTo !== location.pathname + location.search + location.hash) {
        navigate(closeTo, { replace: true });
        return;
      }
      navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
      return;
    }
    navigate(getAuthModalCloseTo(location.state), { replace: true });
  };
  const openAuth = () => {
    const params = new URLSearchParams(location.search);
    params.set('auth', 'login');
    navigate(
      { pathname: location.pathname, search: params.toString() },
      { state: createAuthReturnState(location) },
    );
  };

  return (
    <>
      <CurrentPageLinkGuard />
      <CustomScrollbar />
      <StoreHeader menu={menu} setMenu={setMenu} openAuth={openAuth} />
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
      <StoreFooter openDialog={setDialog} />
      {authMode && !isAuth && <AuthDialog key={authMode} mode={authMode} close={closeAuth} />}
      {dialog === 'newsletter' && <NewsletterDialog close={() => setDialog('')} />}
      {dialog === 'cookies' && <CookiesDialog close={() => setDialog('')} />}
    </>
  );
};

export default Layout;
