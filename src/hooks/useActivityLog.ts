import { supabase } from '@/integrations/supabase/client';

const isValidUUID = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export async function logActivity(action: string, detail: string, userName: string, schoolId?: string) {
  const safeSchoolId = schoolId && isValidUUID(schoolId) ? schoolId : null;
  await (supabase as any).from('activity_logs').insert({
    action,
    detail,
    user_name: userName,
    school_id: safeSchoolId,
  });
}
