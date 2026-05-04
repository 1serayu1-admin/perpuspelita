import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { loginWithEmail, logoutUser } from '@/services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  const login = useCallback(async (email, password) => {
    try {
      const { data, error } = await loginWithEmail(email, password);

      if (!error) {
        setUser(data.user);
        setRole('admin'); // temporary mock
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
