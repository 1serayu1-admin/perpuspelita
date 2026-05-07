import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

let _client: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> | null {
  if (_client) return _client;

  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  // DEBUG: Env check - deep diagnostic
  const rawUrl = import.meta.env.VITE_SUPABASE_URL;
  const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  console.log('=== ENV DEEP DEBUG ===');
  console.log('URL raw:', rawUrl);
  console.log('URL trimmed:', rawUrl?.trim());
  console.log('URL length:', rawUrl?.length, 'vs trimmed:', rawUrl?.trim().length);

  console.log('Key raw first 50:', rawKey?.slice(0, 50));
  console.log('Key trimmed first 50:', rawKey?.trim().slice(0, 50));
  console.log('Key length:', rawKey?.length, 'vs trimmed:', rawKey?.trim().length);

  // Check for common issues
  console.log('Key starts with eyJ:', rawKey?.startsWith('eyJ'));
  console.log('Key contains spaces:', rawKey?.includes(' '));
  console.log('Key contains quotes:', rawKey?.includes('"') || rawKey?.includes("'"));

  // Try to parse JWT structure
  if (rawKey) {
    const parts = rawKey.trim().split('.');
    console.log('Key JWT parts count:', parts.length);
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(atob(parts[1]));
        console.log('Key JWT payload:', { iss: payload.iss, ref: payload.ref, role: payload.role });
      } catch { console.log('Key JWT parse failed'); }
    }
  }
  console.log('========================');

  // Guard env (jangan throw)
  if (!url || !key) {
    console.error('Supabase env missing', { url, keyLength: key?.length });
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
    console.log('SUPABASE INIT OK');
    return _client;
  } catch (e) {
    console.error('SUPABASE INIT FAILED', e);
    return null;
  }
}