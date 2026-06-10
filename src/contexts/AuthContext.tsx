import { createContext, useContext, useState, useMemo, useCallback, useEffect, ReactNode } from 'react';
import type { AppRole, User } from '@/lib/types';
import { toast } from 'sonner';
import { loginWithEmail, logoutUser, getCurrentSession, onAuthStateChange, getUserRole } from '@/services/authService';

export type { AppRole };

interface AuthContextValue {
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // APP STARTUP - Restore session from Supabase
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await getCurrentSession();
        
        if (session?.user) {
          const { role, schoolId } = await getUserRole(session.user.id);
          const userProfile: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            role: role as AppRole,
            appRole: role as AppRole,
            schoolId: schoolId || undefined,
          };
          setUser(userProfile);
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN' && session?.user) {
        const { role, schoolId } = await getUserRole(session.user.id);
        const userProfile: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          role: role as AppRole,
          appRole: role as AppRole,
          schoolId: schoolId || undefined,
        };
        setUser(userProfile);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // Auto-convert username ke email @local.app
    const loginEmail = email.includes('@') ? email : `${email}@local.app`;
    console.log('Login attempt:', { original: email, converted: loginEmail });
    
    try {
      const { data, error } = await loginWithEmail(loginEmail, password);
      
      if (error) {
        console.error('Login error:', error);
        toast.error(error.message || 'Gagal login');
        return { success: false, message: error.message };
      }

      // Session will be restored by onAuthStateChange
      toast.success('Login berhasil!');
      return { success: true };
    } catch (err: any) {
      console.error('Login failed:', err);
      toast.error(err.message || 'Gagal login');
      return { success: false, message: err.message || 'Gagal login' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
      setUser(null);
      toast.success('Berhasil keluar');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Gagal keluar');
    }
  }, []);

  const role = useMemo<AppRole | null>(() => user?.appRole ?? user?.role ?? null, [user]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    role,
    loading,
    login,
    logout
  }), [user, role, loading, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
