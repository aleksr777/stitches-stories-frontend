import AppLayout from '../src/components/app-layout/app-layout';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../src/features/auth/ui/protected-route';
import AdminRoute from '../src/features/auth/ui/admin-route';
import Home from '../src/pages/home/home';
import Login from '../src/pages/login/login';
import PasswordReset from '../src/pages/password-reset/password-reset';
import Registration from '../src/pages/registration/registration';
import BlockedAccount from '../src/pages/blocked-account/blocked-account';
import ProtectedPage from '../src/pages/protected-page/protected-page';
import UserManagement from '../src/pages/admin/user-management';
import UserManagementDetails from '../src/pages/admin/user-management-details';
import UserManagementSessions from '../src/pages/admin/user-management-sessions';
import MyProfile from '../src/pages/my-profile/my-profile';
import ActiveSessions from '../src/pages/my-profile/active-sessions';
import EditProfile from '../src/pages/account-settings/edit-profile';
import ChangePassword from '../src/pages/account-settings/change-password';
import ChangeEmail from '../src/pages/account-settings/change-email';
import DeleteProfile from '../src/pages/account-settings/delete-profile';
import Forbidden from '../src/pages/forbidden/forbidden';
import NotFound from '../src/pages/not-found/not-found';

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
