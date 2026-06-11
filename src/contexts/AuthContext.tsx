import { createContext, useContext, useState, useMemo, useCallback, useEffect, ReactNode } from 'react';
import type { AppRole, User } from '@/lib/types';
import { toast } from 'sonner';
import { loginWithEmail, logoutUser, getCurrentSession, onAuthStateChange, getUserRole } from '@/services/authService';

// Super Admin hardcoded credentials (bypass database query)
const SUPER_ADMIN_EMAIL = 'superadmin@perpuspelita.id';
const SUPER_ADMIN_PASSWORD_HASH = 'SuperAdmin123!'; // Plain text for comparison (in production, use proper hashing)

// FIX: Cache per-user (not global) to prevent role mixup
const getUserCacheKey = (userId: string) => `perpuspelita_role_${userId}`;

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
    // FIX: Cache role per-user (not global)
    localStorage.setItem(getUserCacheKey(userId), 'global_super_admin');
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
          const userId = session.user.id;
          let safeRole: string | null = role;
          if (error || !role) {
            // Try to get from PER-USER cache (not global)
            const cachedRole = localStorage.getItem(getUserCacheKey(userId));
            if (cachedRole) {
              console.warn('getUserRole error, using cached role for user:', userId, cachedRole);
              safeRole = cachedRole;
            } else {
              console.warn('getUserRole error, no cached role for user:', userId, 'setting to null');
              safeRole = null;
            }
          } else {
            // FIX: Cache the successful role per-user
            localStorage.setItem(getUserCacheKey(userId), role);
            console.log('Role cached for user:', userId, role);
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
        const userId = session.user.id;
        let safeRole: string | null = role;
        if (error || !role) {
          // Try to get from PER-USER cache
          const cachedRole = localStorage.getItem(getUserCacheKey(userId));
          if (cachedRole) {
            console.warn('getUserRole error on auth change, using cached role for user:', userId, cachedRole);
            safeRole = cachedRole;
          } else {
            console.warn('getUserRole error on auth change, no cached role for user:', userId);
            safeRole = null;
          }
        } else {
          // FIX: Cache per-user
          localStorage.setItem(getUserCacheKey(userId), role);
          console.log('Role cached for user:', userId, role);
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
        // FIX: Clear only current user's cache (don't affect other users)
        if (user?.id) {
          localStorage.removeItem(getUserCacheKey(user.id));
          console.log('Cleared cache for user:', user.id);
        }
        setUser(null);
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

      // FIX: Immediately set user state after successful login (not waiting for onAuthStateChange)
      if (data?.session?.user) {
        const sessionUser = data.session.user;
        // Get full user details from localStorage
        const userStr = localStorage.getItem('perpuspelita_user');
        if (userStr) {
          const fullUser = JSON.parse(userStr);
          const userProfile: User = {
            id: fullUser.id,
            email: fullUser.email,
            name: fullUser.name,
            role: fullUser.role as AppRole,
            appRole: fullUser.role as AppRole,
            schoolId: fullUser.schoolId || undefined,
          };
          setUser(userProfile);
          console.log('User state set immediately after login (localStorage):', userProfile);
        } else {
          // User from Supabase Auth (no localStorage data yet)
          const userProfile: User = {
            id: sessionUser.id,
            email: sessionUser.email || '',
            name: sessionUser.user_metadata?.name || '',
            role: (sessionUser.user_metadata?.role as AppRole) || 'siswa',
            appRole: (sessionUser.user_metadata?.role as AppRole) || 'siswa',
            schoolId: undefined,
          };
          setUser(userProfile);
          console.log('User state set immediately after login (Supabase Auth):', userProfile);
        }
      }

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
