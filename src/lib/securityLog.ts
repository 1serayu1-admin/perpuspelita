import { supabase } from '@/integrations/supabase/client';
import { generateDeviceFingerprint } from './fingerprint';

export type SecurityAction = 
  | 'login_success' 
  | 'login_failure' 
  | 'blocked_ip' 
  | 'device_approval' 
  | 'emergency_access'
  | 'account_locked'
  | 'password_reset';

export async function logSecurityEvent(
  action: SecurityAction,
  status: 'success' | 'failure' | 'blocked',
  detail: string,
  userEmail?: string,
  schoolId?: string,
) {
  try {
    const fingerprint = generateDeviceFingerprint();
    await (supabase as any).from('security_logs').insert({
      user_email: userEmail || null,
      ip_address: 'client', // Real IP is logged server-side via check-ip
      device_fingerprint: fingerprint,
      action,
      status,
      detail,
      school_id: schoolId || null,
    });
  } catch {
    // Security logging should never block the main flow
  }
}
