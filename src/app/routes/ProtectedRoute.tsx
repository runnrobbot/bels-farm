import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';
import { can, type Resource } from '@/features/auth/types';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { paths } from './paths';
import { Forbidden } from '@/pages/system/Forbidden';

interface ProtectedRouteProps {
  /** Optional resource gate — user must hold `resource:view`. */
  resource?: Resource;
}

/**
 * Gate for authenticated routes. Waits for the auth context to resolve (avoiding
 * a flash of the login page on refresh), then enforces session + permission.
 */
export function ProtectedRoute({ resource }: ProtectedRouteProps) {
  const { status, session, access } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullPageSpinner label="Preparing your workspace" />;

  if (status === 'unauthenticated' || !session) {
    return <Navigate to={paths.login} replace state={{ from: location.pathname }} />;
  }

  if (resource && !can(access, resource, 'view')) {
    return <Forbidden />;
  }

  return <Outlet />;
}
