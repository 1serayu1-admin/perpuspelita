import { createContext, useContext, useState, useMemo, useCallback, useEffect, ReactNode } from 'react';
import { loginWithEmail, logoutUser, getUserRole } from '@/services/authService';
import { getSupabase } from '@/integrations/supabase/client';
import type { AppRole, User } from '@/lib/types';
import { toast } from 'sonner';

export type { AppRole };

interface AuthContextValue {
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  hasRole: (roles: AppRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const role = user?.appRole || null;

  const initSession = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    // Handle Demo Bypass from LocalStorage
    const isDemo = localStorage.getItem('serayu_demo_mode') === 'true';
    if (isDemo && !session) {
      setUser({
        id: 'demo-super-admin-id',
        email: '1serayu1@gmail.com',
        name: 'Demo Super Admin',
        role: 'global_super_admin',
        appRole: 'global_super_admin',
        schoolId: undefined
      });
      setLoading(false);
      return;
    }

    if (session) {
      const { role: fetchedRole, schoolId, profile } = await getUserRole(session.user.id);
      setUser({
        id: session.user.id,
        email: session.user.email ?? '',
        name: profile?.name || session.user.email?.split('@')[0] || 'User',
        role: (fetchedRole as AppRole) || 'siswa',
        appRole: (fetchedRole as AppRole) || 'siswa',
        schoolId: schoolId || undefined,
      });
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    initSession();

    const supabase = getSupabase();
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        localStorage.removeItem('serayu_demo_mode');
        const { role: fetchedRole, schoolId, profile } = await getUserRole(session.user.id);
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          name: profile?.name || session.user.email?.split('@')[0] || 'User',
          role: (fetchedRole as AppRole) || 'siswa',
          appRole: (fetchedRole as AppRole) || 'siswa',
          schoolId: schoolId || undefined,
        });
      } else {
        if (localStorage.getItem('serayu_demo_mode') !== 'true') {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [initSession]);

  const login = useCallback(async (email: string, password: string) => {
    // Special bypass for Demo Email
    if (email === '1serayu1@gmail.com' && password === 'Serayu123!!') {
      localStorage.setItem('serayu_demo_mode', 'true');
      setUser({
        id: 'demo-super-admin-id',
        email: '1serayu1@gmail.com',
        name: 'Demo Super Admin',
        role: 'global_super_admin',
        appRole: 'global_super_admin',
        schoolId: undefined
      });
      toast.success('Masuk sebagai Demo Super Admin');
      return { success: true };
    }

    try {
      const { data, error } = await loginWithEmail(email, password);
      if (!error && data?.user) {
        return { success: true };
      }
      return { success: false, message: error?.message || 'Login gagal' };
    } catch {
      return { success: false, message: 'Terjadi kesalahan yang tidak diketahui' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      localStorage.removeItem('serayu_demo_mode');
      await logoutUser();
      setUser(null);
      toast.success('Berhasil keluar');
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  const hasRole = useCallback((roles: AppRole[]) => {
    return roles.includes(role as AppRole);
  }, [role]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    role,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    hasRole,
  }), [user, role, loading, login, logout, hasRole]);

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
