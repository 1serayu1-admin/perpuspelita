import { createContext, useContext, useState, useMemo, useCallback, useEffect, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { loginWithEmail, logoutUser, getUserRole } from '@/services/authService';
import { getSupabase } from '@/integrations/supabase/client';
import type { AppRole } from '@/lib/types';

// Re-export untuk komponen yang import AppRole dari AuthContext
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
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Initial session load on component mount
    (async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data?.session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser) {
        const fetchedRole = await getUserRole(sessionUser.id);
        setRole((fetchedRole as AppRole) || 'siswa');
      }
      setLoading(false);
    })();

    // Auth state listener for login/logout events
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser) {
        const fetchedRole = await getUserRole(sessionUser.id);
        setRole((fetchedRole as AppRole) || 'siswa');
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await loginWithEmail(email, password);

      if (!error && data?.user) {
        setUser(data.user);
        return { success: true };
      }

      return { success: false, message: error?.message || 'Login gagal' };
    } catch {
      return { success: false, message: 'Terjadi kesalahan yang tidak diketahui' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
      setUser(null);
      setRole(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    role,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    hasRole: (roles: AppRole[]) => roles?.includes(role as AppRole) ?? false,
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
    // Fallback jika digunakan di luar AuthProvider (seharusnya tidak terjadi)
    return {
      user: null,
      role: null,
      loading: false,
      isAuthenticated: false,
      login: async () => ({ success: false }),
      logout: async () => {},
      hasRole: () => false,
    };
  }
  return ctx;
}
