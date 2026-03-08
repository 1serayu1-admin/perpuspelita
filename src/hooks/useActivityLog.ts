import { supabase } from '@/integrations/supabase/client';

export async function logActivity(action: string, detail: string, userName: string, schoolId?: string) {
  await (supabase as any).from('activity_logs').insert({
    action,
    detail,
    user_name: userName,
    school_id: schoolId || null,
  });
}
