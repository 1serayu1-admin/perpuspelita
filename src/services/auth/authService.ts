import { supabase } from '@/integrations/supabase/client';
import { 
  LoginCredentials, 
  LoginWithUsernameCredentials, 
  SignupCredentials, 
  AuthResult, 
  UserProfile 
} from './types';
import { AppRole, toLegacyRole } from '@/lib/types';
import { checkRateLimit, resetRateLimit } from '@/lib/validation';
import { logSecurityEvent } from '@/lib/securityLog';
import { generateDeviceFingerprint, getDeviceName } from '@/lib/fingerprint';

const roleHierarchy: AppRole[] = ['global_super_admin', 'school_super_admin', 'admin', 'guru', 'siswa'];

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (profileError || !profile) return null;

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

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

export async function loginWithEmail({ email, password }: LoginCredentials): Promise<AuthResult> {
  const rateCheck = checkRateLimit(email.toLowerCase());
  if (!rateCheck.allowed) {
    const secs = Math.ceil((rateCheck.remainingMs || 60000) / 1000);
    return { success: false, message: `Terlalu banyak percobaan login. Coba lagi dalam ${secs} detik.` };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    logSecurityEvent('login_failure', 'failure', error.message, email);
    return { success: false, message: error.message };
  }

  resetRateLimit(email.toLowerCase());
  await registerDevice(data.user.id);
  
  const profile = await fetchUserProfile(data.user.id);
  if (profile?.schoolId) {
    await updateDeviceSchoolId(data.user.id, profile.schoolId);
    const ipCheck = await checkIpRestriction(profile.schoolId);
    if (!ipCheck.allowed) {
      await supabase.auth.signOut();
      logSecurityEvent('blocked_ip', 'blocked', `IP ${ipCheck.ip} ditolak`, email, profile.schoolId);
      return { success: false, message: `Akses ditolak. IP Anda (${ipCheck.ip}) tidak diizinkan.` };
    }
  }

  logSecurityEvent('login_success', 'success', 'Login berhasil', email, profile?.schoolId);
  return { success: true };
}

export async function loginWithUsername({ username, password }: LoginWithUsernameCredentials): Promise<AuthResult> {
  const rateCheck = checkRateLimit(username.toLowerCase());
  if (!rateCheck.allowed) {
    const secs = Math.ceil((rateCheck.remainingMs || 60000) / 1000);
    return { success: false, message: `Terlalu banyak percobaan login. Coba lagi dalam ${secs} detik.` };
  }

  const { data: email, error: lookupError } = await supabase.rpc('get_email_by_username', { _username: username });
  if (lookupError || !email) {
    logSecurityEvent('login_failure', 'failure', 'Username tidak ditemukan', username);
    return { success: false, message: 'Username tidak ditemukan' };
  }

  return loginWithEmail({ email, password });
}

export async function signup({ email, password, name }: SignupCredentials): Promise<AuthResult> {
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
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getCurrentSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export function onAuthStateChange(callback: (user: UserProfile | null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (session?.user) {
        setTimeout(async () => {
          const profile = await fetchUserProfile(session.user.id);
          callback(profile);
        }, 0);
      } else {
        callback(null);
      }
    }
  );
  return subscription;
}

// Helper functions
async function registerDevice(userId: string): Promise<void> {
  const fingerprint = generateDeviceFingerprint();
  const deviceName = getDeviceName();
  try {
    await (supabase as any).from('authorized_devices').upsert({
      owner_user_id: userId,
      fingerprint,
      device_name: deviceName,
      last_used_at: new Date().toISOString(),
      school_id: null,
    }, { onConflict: 'owner_user_id,fingerprint' });
  } catch { /* non-blocking */ }
}

async function updateDeviceSchoolId(userId: string, schoolId: string): Promise<void> {
  const fingerprint = generateDeviceFingerprint();
  try {
    await (supabase as any).from('authorized_devices')
      .update({ school_id: schoolId })
      .eq('owner_user_id', userId)
      .eq('fingerprint', fingerprint);
  } catch { /* non-blocking */ }
}

async function checkIpRestriction(schoolId: string): Promise<{ allowed: boolean; ip?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-ip`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ school_id: schoolId }),
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    const result = await res.json();
    return { allowed: result.allowed, ip: result.ip };
  } catch {
    return { allowed: true }; // Fail-open for intranet
  }
}
