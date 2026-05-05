import { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { loginWithEmail, logoutUser, getUserRole } from '@/services/authService';
import { getSupabase } from '@/integrations/supabase/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    // Initial session load on component mount
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user || null;

      setUser(user);

      if (user) {
        const role = await getUserRole(user.id);
        setRole(role || 'siswa');
      }
    })();

    // Auth state listener for login/logout events
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user || null;

        setUser(user);

        if (user) {
          const role = await getUserRole(user.id);
          setRole(role || 'siswa');
        } else {
          setRole(null);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
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
    isAuthenticated: !!user,
    login,
    logout,
    hasRole: (roles) => roles?.includes(role),
  }), [user, role, login, logout]);

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
    isAuthenticated: false,
    login: async () => ({ success: false }),
    logout: () => {},
    hasRole: () => false,
  };
}
