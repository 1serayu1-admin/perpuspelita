import { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { loginWithEmail, logoutUser, getUserRole } from '@/services/authService';
import { getSupabase } from '@/integrations/supabase/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    // DEBUG: Hard test query
    (async () => {
      const { data: session } = await supabase.auth.getSession();
      console.log('SESSION USER:', session?.session?.user);

      const userId = session?.session?.user?.id;
      if (userId) {
        const { data, error } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        console.log('RAW ROLE QUERY:', { userId, data, error: error?.message });
      }
    })();

    // Initial session load on component mount
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user ?? null;
      setUser(user);

      if (user) {
        const role = await getUserRole(user.id);
        setRole(role || 'siswa');
      }
      setLoading(false);
    })();

    // Auth state listener for login/logout events
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      const user = session?.user ?? null;
      setUser(user);

      if (user) {
        const role = await getUserRole(user.id);
        setRole(role || 'siswa');
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const { data, error } = await loginWithEmail(email, password);

      if (!error) {
        setUser(data.user);
        return { success: true };
      }

      return { success: false, message: error.message };
    } catch {
      return { success: false };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
      setUser(null);
      setRole(null);
    } catch {}
  }, []);

  const value = useMemo(() => ({
    user,
    role,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    hasRole: (roles) => roles?.includes(role),
  }), [user, role, loading, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext) || {
    user: null,
    role: null,
    loading: false,
    isAuthenticated: false,
    login: async () => ({ success: false }),
    logout: () => {},
    hasRole: () => false,
  };
}
