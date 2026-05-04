import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { role } = useAuth();

  if (!allowedRoles?.includes(role)) {
    return <div style={{ padding: 50, textAlign: 'center' }}>Access Denied</div>;
  }

  return <>{children}</>;
}
