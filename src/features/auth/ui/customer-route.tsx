import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../model/use-auth';

const CustomerRoute = () => {
  const { isAuth, role } = useAuth();

  if (isAuth && role === null) return <p>Проверяем доступ…</p>;
  if (role === 'admin') return <Navigate to="/forbidden" replace />;

  return <Outlet />;
};

export default CustomerRoute;
