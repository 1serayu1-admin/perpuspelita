import { getSupabase } from '@/integrations/supabase/client';
import type { AppRole } from '@/lib/types';

export async function loginWithEmail(email: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) return { error: { message: 'Supabase not ready' }, data: null };
  return supabase.auth.signInWithPassword({ email, password });
}

export async function logoutUser() {
  const supabase = getSupabase();
  if (!supabase) return;
  return supabase.auth.signOut();
}

export async function getCurrentSession() {
  const supabase = getSupabase();
  if (!supabase) return { data: { session: null } };
  return supabase.auth.getSession();
}

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  const supabase = getSupabase();
  if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
  return supabase.auth.onAuthStateChange(callback);
}

export async function getUserRole(userId: string) {
  const supabase = getSupabase();
  if (!supabase) return {
    role: "siswa" as AppRole,
    schoolId: null,
    profile: null
  };

  try {
    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // Get role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (roleError || !roleData) {
      return {
        role: "siswa" as AppRole,
        schoolId: profile?.school_id || null,
        profile: profile
      };
    }

    return {
      role: roleData.role as AppRole,
      schoolId: profile?.school_id || null,
      profile: profile
    };
  } catch (error) {
    console.error('getUserRole error:', error);
    return {
      role: "siswa" as AppRole,
      schoolId: null,
      profile: null
    };
  }
}

