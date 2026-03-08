import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role, AppRole, toLegacyRole } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  loginWithUsername: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: Role[]) => boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchUserProfile(userId: string): Promise<User | null> {
  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (profileError || !profile) return null;

  // Fetch roles
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  // Determine primary role (highest privilege)
  const roleHierarchy: AppRole[] = ['global_super_admin', 'school_super_admin', 'admin', 'guru', 'siswa'];
  const userRoles = (roles || []).map(r => r.role as AppRole);
  const primaryRole: AppRole = roleHierarchy.find(r => userRoles.includes(r)) || 'siswa';

  return {
    id: profile.user_id,
    name: profile.name,
    email: profile.email,
    role: toLegacyRole(primaryRole),
    appRole: primaryRole,
    avatar: profile.avatar_url || undefined,
    schoolId: profile.school_id || undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Use setTimeout to avoid potential deadlock with Supabase client
          setTimeout(async () => {
            const profile = await fetchUserProfile(session.user.id);
            setUser(profile);
            setLoading(false);
          }, 0);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // THEN check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUser(profile);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, message: error.message };

    // After login, check IP restriction for user's school
    const profile = await fetchUserProfile(data.user.id);
    if (profile?.schoolId) {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-ip`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ school_id: profile.schoolId }),
          }
        );
        const result = await res.json();
        if (!result.allowed) {
          await supabase.auth.signOut();
          return {
            success: false,
            message: `Akses ditolak. IP Anda (${result.ip}) tidak diizinkan untuk mengakses sekolah ini.`,
          };
        }
      } catch {
        // If IP check fails, allow access (fail-open for safety)
      }
    }

    return { success: true };
  };

  const loginWithUsername = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    // Look up email from username
    const { data: email, error: lookupError } = await supabase.rpc('get_email_by_username', { _username: username });
    if (lookupError || !email) {
      return { success: false, message: 'Username tidak ditemukan' };
    }
    return login(email, password);
  };

  const signup = async (email: string, password: string, name: string): Promise<{ success: boolean; message: string }> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) return { success: false, message: error.message };
    return { success: true, message: 'Akun berhasil dibuat! Silakan cek email untuk verifikasi.' };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const hasRole = (roles: Role[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithUsername, signup, logout, isAuthenticated: !!user, hasRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
