import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getCurrentUserRequest } from '../../users/api/users-api';

const AdminRoute = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const verifyRole = async () => {
      try {
        const user = await getCurrentUserRequest();
        if (isMounted) setIsAdmin(user.role === 'admin');
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to verify access');
        }
      }
    };

    void verifyRole();

    return () => {
      isMounted = false;
    };
  }, []);

  if (error) return <p>{error}</p>;
  if (isAdmin === null) return <p>Checking access...</p>;
  if (!isAdmin) return <Navigate to="/forbidden" replace />;

  return <Outlet />;
};

export default AdminRoute;
