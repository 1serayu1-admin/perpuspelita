import { getSupabase } from '@/integrations/supabase/client';

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
