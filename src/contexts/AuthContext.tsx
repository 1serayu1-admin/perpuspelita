import { createContext, useContext, useState, useMemo, useCallback, useEffect, ReactNode } from 'react';
import type { AppRole, User } from '@/lib/types';
import { toast } from 'sonner';

export type { AppRole };

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEMO_USERS = {
  admin: {
    password: 'admin123',
    role: 'admin',
    name: 'Demo Admin'
  },
  guru: {
    password: 'guru123',
    role: 'guru',
    name: 'Demo Guru'
  },
  siswa: {
    password: 'siswa123',
    role: 'siswa',
    name: 'Demo Siswa'
  },
  kepsek: {
    password: 'kepsek123',
    role: 'school_super_admin',
    name: 'Demo Kepala Sekolah'
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // APP STARTUP - Restore demo-auth from localStorage
  useEffect(() => {
    const storedAuth = localStorage.getItem('demo-auth');
    if (storedAuth) {
      try {
        const parsedUser = JSON.parse(storedAuth);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse stored auth:', error);
        localStorage.removeItem('demo-auth');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    console.log('Login attempt:', { username, password });
    
    // CHECK DEMO USERS (case insensitive)
    const normalizedUsername = username.toLowerCase();
    const demoUser = DEMO_USERS[normalizedUsername as keyof typeof DEMO_USERS];
    console.log('Demo user found:', demoUser);
    
    if (demoUser && demoUser.password === password) {
      // CREATE FAKE USER
      const fakeUser: User = {
        id: `demo-${normalizedUsername}`,
        email: `${normalizedUsername}@demo.local`,
        name: demoUser.name,
        role: demoUser.role as AppRole,
        appRole: demoUser.role as AppRole,
        schoolId: 'demo-school'
      };

      console.log('Setting user:', fakeUser);
      
      // SET USER AND STORE IN LOCALSTORAGE
      setUser(fakeUser);
      localStorage.setItem('demo-auth', JSON.stringify(fakeUser));
      
      console.log('Login success for role:', demoUser.role);
      toast.success(`Masuk sebagai ${demoUser.name}`);
      return { success: true };
    }

    console.log('Login failed: invalid credentials');
    // INVALID CREDENTIALS
    toast.error('Username atau password salah');
    return { success: false, message: 'Username atau password salah' };
  }, []);

  const logout = useCallback(async () => {
    // CLEAR LOCALSTORAGE AND USER
    localStorage.removeItem('demo-auth');
    setUser(null);
    toast.success('Berhasil keluar');
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    login,
    logout
  }), [user, loading, login, logout]);

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
