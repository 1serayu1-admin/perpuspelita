import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { role } = useAuth();

  const isAllowed = allowedRoles?.includes(role);

  return (
    <div>
      {!isAllowed && (
        <div style={{ color: 'red', marginBottom: 10 }}>
          Access Denied — Role: {role || 'NONE'}
        </div>
      )}
      {isAllowed ? children : <div>Blocked Content</div>}
    </div>
  );
}
