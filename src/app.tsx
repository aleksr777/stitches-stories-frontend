import { Routes, Route, Link } from 'react-router-dom';
import ProtectedRoute from './features/auth/ui/protected-route';
import AdminRoute from './features/auth/ui/admin-route';
import CustomerRoute from './features/auth/ui/customer-route';
import StoreProvider from './store/provider';
import Layout from './store/layout';
import Home, { About, Delivery } from './store/home';
import { Catalog, ProductPage } from './store/products';
import Checkout from './store/checkout';
import Profile from './store/profile';
import Admin from './store/admin';
import { DocumentsPage } from './store/legal';
import { NewsletterAction } from './store/newsletter';
import ActiveSessions from './pages/my-profile/active-sessions';
import EditProfile from './pages/account-settings/edit-profile';
import ChangePassword from './pages/account-settings/change-password';
import ChangeEmail from './pages/account-settings/change-email';
import UserManagement from './pages/admin/user-management';
import UserManagementDetails from './pages/admin/user-management-details';
import UserManagementSessions from './pages/admin/user-management-sessions';
import BlockedAccount from './pages/blocked-account/blocked-account';
import ForbiddenPage from './pages/forbidden/forbidden';
const App = () => (
  <StoreProvider>
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="products/:slug" element={<ProductPage />} />
        <Route path="cart" element={<Checkout />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="about" element={<About />} />
        <Route path="delivery" element={<Delivery />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="auth/:mode" element={<Home />} />
        <Route path="newsletter/:action" element={<NewsletterAction />} />
        <Route path="blocked" element={<BlockedAccount />} />
        <Route path="forbidden" element={<ForbiddenPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="users/me" element={<Profile />} />
          <Route element={<CustomerRoute />}>
            <Route path="favorites" element={<Catalog favoritesOnly />} />
          </Route>
          <Route
            path="users/me/sessions"
            element={
              <div className="page narrow">
                <ActiveSessions />
              </div>
            }
          />
          <Route
            path="users/me/settings/profile"
            element={
              <div className="page narrow">
                <EditProfile />
              </div>
            }
          />
          <Route
            path="users/me/settings/password"
            element={
              <div className="page narrow">
                <ChangePassword />
              </div>
            }
          />
          <Route
            path="users/me/settings/email"
            element={
              <div className="page narrow">
                <ChangeEmail />
              </div>
            }
          />
          <Route element={<AdminRoute />}>
            <Route path="admin/shop" element={<Admin />} />
            <Route
              path="admin/users"
              element={
                <div className="page">
                  <UserManagement />
                </div>
              }
            />
            <Route
              path="admin/users/:id"
              element={
                <div className="page">
                  <UserManagementDetails />
                </div>
              }
            />
            <Route
              path="admin/users/:id/sessions"
              element={
                <div className="page">
                  <UserManagementSessions />
                </div>
              }
            />
          </Route>
        </Route>
        <Route
          path="*"
          element={
            <section className="page empty">
              <h1>Эта история ещё не написана</h1>
              <p>Страница не найдена.</p>
              <Link className="button" to="/catalog">
                В коллекцию
              </Link>
            </section>
          }
        />
      </Route>
    </Routes>
  </StoreProvider>
);
export default App;
