import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

let _client: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> | null {
  if (_client) return _client;

  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    console.error('Supabase env missing — pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY sudah di-set di .env');
    return null;
  }

  try {
    _client = createClient<Database>(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
      },
    });
    return _client;
  } catch (e) {
    console.error('Supabase client init failed:', e);
    return null;
  }
}

export const supabase = getSupabase();