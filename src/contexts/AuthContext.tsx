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

  useEffect(() => {
    console.log("AuthProvider MOUNT");
    return () => console.log("AuthProvider UNMOUNT");
  }, []);

  useEffect(() => {
    console.log("AUTH STATE", { loading, user });
  }, [loading, user]);

  const initSession = useCallback(async () => {
    console.log("AUTH STEP", { loading, user: null, role: null, isAuthenticated: false });
    setLoading(true);

    try {
      const supabase = getSupabase();

      if (!supabase) {
        setUser(null);
        setLoading(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const isDemo =
        localStorage.getItem("serayu_demo_mode") === "true";

      if (isDemo && !session) {
        setUser({
          id: "demo-super-admin-id",
          email: "1serayu1@gmail.com",
          name: "Demo Super Admin",
          role: "global_super_admin",
          appRole: "global_super_admin",
          schoolId: undefined,
        });
        setLoading(false);
        return;
      }

      if (!session) {
        setUser(null);
        setLoading(false);
        return;
      }

      // IMMEDIATE FALLBACK - tidak tunggu getUserRole()
      setUser({
        id: session.user.id,
        email: session.user.email ?? "",
        name: session.user.email?.split("@")[0] || "User",
        role: "siswa" as AppRole,
        appRole: "siswa" as AppRole,
        schoolId: undefined,
      });

      // Async role fetch di background
      try {
        const roleData = await Promise.race([
          getUserRole(session.user.id),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 2000)
          ),
        ]) as any;

        if (roleData?.role) {
          setUser(prev => prev ? {
            ...prev,
            role: roleData.role,
            appRole: roleData.role,
            schoolId: roleData.schoolId || undefined,
          } : prev);
        }
      } catch (e) {
        console.error("Background role fetch failed:", e);
      }

    } catch (err) {
      console.error("initSession error:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initSession();

    const supabase = getSupabase();
    if (!supabase) return;

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(async (_event, session) => {
        setLoading(true);
        try {
          if (session) {
            localStorage.removeItem("serayu_demo_mode");

            let fetchedRole = "siswa" as AppRole;
            let schoolId;
            let profile = null;

            try {
              const roleData = await Promise.race([
                getUserRole(session.user.id),
                new Promise((_, reject) =>
                  setTimeout(() => reject(new Error("timeout")), 4000)
                ),
              ]) as any;

              fetchedRole = roleData?.role || ("siswa" as AppRole);
              schoolId = roleData?.schoolId;
              profile = roleData?.profile;
            } catch (err) {
              console.error("getUserRole gagal:", err);
            }

            setUser({
              id: session.user.id,
              email: session.user.email ?? "",
              name:
                profile?.name ||
                session.user.email?.split("@")[0] ||
                "User",
              role: fetchedRole,
              appRole: fetchedRole,
              schoolId: schoolId || undefined,
            });
          } else {
            if (localStorage.getItem("serayu_demo_mode") !== "true") {
              setUser(null);
            }
          }
        } catch (err) {
          console.error("Auth listener error:", err);
          setUser(null);
        } finally {
          console.log("AUTH LOADING FIX", { loading, user });
          setLoading(false);
        }
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
