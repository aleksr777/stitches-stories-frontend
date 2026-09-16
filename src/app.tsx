import AppLayout from './components/app-layout/app-layout';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './features/auth/ui/protected-route';
import AdminRoute from './features/auth/ui/admin-route';
import Home from './pages/home/home';
import Login from './pages/login/login';
import PasswordReset from './pages/password-reset/password-reset';
import Registration from './pages/registration/registration';
import BlockedAccount from './pages/blocked-account/blocked-account';
import ProtectedPage from './pages/protected-page/protected-page';
import UserManagement from './pages/admin/user-management';
import UserManagementDetails from './pages/admin/user-management-details';
import UserManagementSessions from './pages/admin/user-management-sessions';
import MyProfile from './pages/my-profile/my-profile';
import ActiveSessions from './pages/my-profile/active-sessions';
import EditProfile from './pages/account-settings/edit-profile';
import ChangePassword from './pages/account-settings/change-password';
import ChangeEmail from './pages/account-settings/change-email';
import DeleteProfile from './pages/account-settings/delete-profile';
import Forbidden from './pages/forbidden/forbidden';
import NotFound from './pages/not-found/not-found';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="auth/login" element={<Login />} />
        <Route path="auth/registration" element={<Registration />} />
        <Route path="auth/password-reset" element={<PasswordReset />} />
        <Route path="blocked" element={<BlockedAccount />} />
        <Route path="forbidden" element={<Forbidden />} />
        <Route element={<ProtectedRoute />}>
          <Route path="protected-page" element={<ProtectedPage />} />
          <Route path="users/me" element={<MyProfile />} />
          <Route path="users/me/sessions" element={<ActiveSessions />} />
          <Route path="users/me/settings/profile" element={<EditProfile />} />
          <Route path="users/me/settings/password" element={<ChangePassword />} />
          <Route path="users/me/settings/email" element={<ChangeEmail />} />
          <Route path="users/me/settings/delete" element={<DeleteProfile />} />
          <Route element={<AdminRoute />}>
            <Route path="admin/users" element={<UserManagement />} />
            <Route path="admin/users/:id" element={<UserManagementDetails />} />
            <Route path="admin/users/:id/sessions" element={<UserManagementSessions />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default App;
