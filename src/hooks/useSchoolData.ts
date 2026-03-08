import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useSchoolData<T extends Record<string, any>>(
  table: string,
  options?: {
    orderBy?: string;
    ascending?: boolean;
    select?: string;
  }
) {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const schoolId = user?.schoolId;

  const fetchData = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from(table)
      .select(options?.select || '*');

    if (schoolId) {
      query = query.eq('school_id', schoolId);
    }

    if (options?.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data: result, error } = await query;

    if (!error && result) {
      setData(result as T[]);
    }
    setLoading(false);
  }, [table, schoolId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const insert = async (record: Partial<T>) => {
    const payload = schoolId ? { ...record, school_id: schoolId } : record;
    const { error } = await supabase.from(table).insert(payload as any);
    if (!error) await fetchData();
    return { error };
  };

  const update = async (id: string, record: Partial<T>) => {
    const { error } = await supabase.from(table).update(record as any).eq('id', id);
    if (!error) await fetchData();
    return { error };
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) await fetchData();
    return { error };
  };

  return { data, loading, refetch: fetchData, insert, update, remove };
}
