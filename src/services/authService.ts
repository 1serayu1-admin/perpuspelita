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

export async function getUserRole(userId: string, retryCount = 0): Promise<{ role: string; schoolId: string | null; profile: null }> {
  const supabase = getSupabase();

  if (!supabase) {
    return { role: "siswa", schoolId: null, profile: null };
  }

  try {
    // Query with longer timeout (5 seconds) and limit 1 for faster response
    const { data, error } = await Promise.race([
      supabase
        .from("user_roles")
        .select("role, school_id")
        .eq("user_id", userId)
        .limit(1)
        .single(),

      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 5000)
      )
    ]) as any;

    if (error) {
      // If timeout and haven't retried max times, retry
      if (error.message?.includes('timeout') && retryCount < 2) {
        console.warn(`getUserRole timeout, retrying... (${retryCount + 1}/3)`);
        await new Promise(resolve => setTimeout(resolve, 500));
        return getUserRole(userId, retryCount + 1);
      }
      return { role: "siswa", schoolId: null, profile: null };
    }

    return {
      role: data?.role || "siswa",
      schoolId: data?.school_id || null,
      profile: null
    };
  } catch (err: any) {
    // If timeout and haven't retried max times, retry
    if (err?.message?.includes('timeout') && retryCount < 2) {
      console.warn(`getUserRole timeout, retrying... (${retryCount + 1}/3)`);
      await new Promise(resolve => setTimeout(resolve, 500));
      return getUserRole(userId, retryCount + 1);
    }

    console.error("getUserRole fail:", err);
    return { role: "siswa", schoolId: null, profile: null };
  }
}

