import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export function RouteGuard({ children, requiredRole }: RouteGuardProps) {
  const { isAuthenticated, hasRole } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="p-8 text-center">
        <div className="text-[#A32D2D] text-lg font-semibold mb-2">Access Denied</div>
        <p className="text-[#5A6A7A]">You don't have permission to view this page.</p>
      </div>
    );
  }

  return <>{children}</>;
}
