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

  if (!supabase) {
    return {
      role: "siswa",
      schoolId: null,
      profile: null
    };
  }

  try {
    // Ambil role saja dulu (cepat)
    const { data, error } = await Promise.race([
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle(),

      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 2500)
      )
    ]) as any;

    if (error || !data) {
      return {
        role: "siswa",
        schoolId: null,
        profile: null
      };
    }

    return {
      role: data.role || "siswa",
      schoolId: null,
      profile: null
    };
  } catch (err) {
    console.error("getUserRole fail:", err);

    return {
      role: "siswa",
      schoolId: null,
      profile: null
    };
  }
}

