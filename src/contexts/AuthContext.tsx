import { createContext, useContext, useState, useMemo, useCallback, useEffect, ReactNode } from 'react';
import type { AppRole, User } from '@/lib/types';
import { toast } from 'sonner';
import { loginWithEmail, logoutUser, getCurrentSession, onAuthStateChange, getUserRole } from '@/services/authService';

// Super Admin hardcoded credentials (bypass database query)
const SUPER_ADMIN_EMAIL = 'superadmin@perpuspelita.id';
const SUPER_ADMIN_PASSWORD_HASH = 'SuperAdmin123!'; // Plain text for comparison (in production, use proper hashing)
const LOCAL_STORAGE_ROLE_KEY = 'perpuspelita_cached_role';

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

  // Helper to check Super Admin bypass
  const isSuperAdminBypass = useCallback((email: string, password: string) => {
    return email === SUPER_ADMIN_EMAIL && password === SUPER_ADMIN_PASSWORD_HASH;
  }, []);

  // Helper to create Super Admin user profile (bypass database)
  const createSuperAdminProfile = useCallback((userId: string): User => {
    const superAdminUser: User = {
      id: userId,
      email: SUPER_ADMIN_EMAIL,
      name: 'Super Admin Developer',
      role: 'global_super_admin' as AppRole,
      appRole: 'global_super_admin' as AppRole,
      schoolId: undefined, // Super admin has access to all schools
    };
    // Cache role in localStorage
    localStorage.setItem(LOCAL_STORAGE_ROLE_KEY, 'global_super_admin');
    return superAdminUser;
  }, []);

  // APP STARTUP - Restore session from Supabase
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await getCurrentSession();
        
        if (session?.user) {
          // Check if this is Super Admin from session email
          if (session.user.email === SUPER_ADMIN_EMAIL) {
            console.log('Super Admin session restored');
            setUser(createSuperAdminProfile(session.user.id));
            setLoading(false);
            return;
          }

          const { role, schoolId, error } = await getUserRole(session.user.id);
          
          // FIX: Don't default to "siswa" on error - use cached role or null
          let safeRole: string | null = role;
          if (error || !role) {
            // Try to get from cache
            const cachedRole = localStorage.getItem(LOCAL_STORAGE_ROLE_KEY);
            if (cachedRole) {
              console.warn('getUserRole error, using cached role:', cachedRole);
              safeRole = cachedRole;
            } else {
              console.warn('getUserRole error, no cached role, setting to null');
              safeRole = null;
            }
          } else {
            // Cache the successful role
            localStorage.setItem(LOCAL_STORAGE_ROLE_KEY, role);
          }
          
          const userProfile: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            role: safeRole as AppRole,
            appRole: safeRole as AppRole,
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
        // Check if this is Super Admin
        if (session.user.email === SUPER_ADMIN_EMAIL) {
          console.log('Super Admin signed in');
          setUser(createSuperAdminProfile(session.user.id));
          return;
        }

        const { role, schoolId, error } = await getUserRole(session.user.id);
        
        // FIX: Don't default to "siswa" on error
        let safeRole: string | null = role;
        if (error || !role) {
          const cachedRole = localStorage.getItem(LOCAL_STORAGE_ROLE_KEY);
          if (cachedRole) {
            console.warn('getUserRole error on auth change, using cached role:', cachedRole);
            safeRole = cachedRole;
          } else {
            console.warn('getUserRole error on auth change, no cached role');
            safeRole = null;
          }
        } else {
          localStorage.setItem(LOCAL_STORAGE_ROLE_KEY, role);
        }
        
        const userProfile: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          role: safeRole as AppRole,
          appRole: safeRole as AppRole,
          schoolId: schoolId || undefined,
        };
        setUser(userProfile);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem(LOCAL_STORAGE_ROLE_KEY);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [createSuperAdminProfile]);

  const login = useCallback(async (email: string, password: string) => {
    // Auto-convert username ke email @local.app
    const loginEmail = email.includes('@') ? email : `${email}@local.app`;
    console.log('Login attempt:', { original: email, converted: loginEmail });
    
    // SUPER ADMIN BYPASS: Check if this is Super Admin login
    if (isSuperAdminBypass(loginEmail, password)) {
      console.log('Super Admin bypass login');
      
      // Create a mock session for Super Admin
      const mockUserId = 'superadmin-local-id';
      const superAdminUser = createSuperAdminProfile(mockUserId);
      setUser(superAdminUser);
      
      toast.success('Login Super Admin berhasil!');
      return { success: true };
    }
    
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
  }, [isSuperAdminBypass, createSuperAdminProfile]);

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
