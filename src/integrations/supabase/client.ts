import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

let _supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabase() {
  if (_supabaseClient) return _supabaseClient;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn('Supabase env missing');
    return null;
  }

  try {
    _supabaseClient = createClient<Database>(url, key, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      }
    });
    return _supabaseClient;
  } catch (err) {
    console.error('Supabase init failed:', err);
    return null;
  }
}

// Legacy export for backward compatibility (lazy)
export const supabase = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(target, prop) {
    const client = getSupabase();
    if (!client) {
      throw new Error('Supabase not initialized - check env vars');
    }
    return (client as any)[prop];
  }
});