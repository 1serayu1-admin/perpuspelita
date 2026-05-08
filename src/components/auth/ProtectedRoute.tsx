import { useAuth } from '@/contexts/AuthContext';
import type { AppRole } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { role, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-gray-500 font-medium">Memeriksa otorisasi...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Jika tidak ada allowedRoles, semua role yang terautentikasi boleh akses
  if (allowedRoles && allowedRoles.length > 0) {
    const isAllowed = role && allowedRoles.includes(role);

    if (!isAllowed) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold">!</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Akses Ditolak</h2>
            <p className="text-gray-500">
              Maaf, role Anda saat ini{' '}
              <strong className="text-gray-900 uppercase">({role || 'NONE'})</strong>{' '}
              tidak memiliki izin untuk mengakses halaman ini.
            </p>
            <button
              onClick={() => window.history.back()}
              className="mt-6 px-6 py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors"
            >
              Kembali
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
