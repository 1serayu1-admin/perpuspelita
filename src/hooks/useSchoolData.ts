import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const PAGE_SIZE = 1000;

async function fetchAllRows(
  table: string,
  schoolId: string | undefined,
  isGlobalAdmin: boolean,
  options?: { orderBy?: string; ascending?: boolean; select?: string }
) {
  const allRows: any[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    let query = (supabase as any)
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

    query = query.range(from, from + PAGE_SIZE - 1);

    const { data, error } = await query;

    if (error) {
      console.warn(`[useSchoolData] Failed to fetch ${table} (range ${from}-${from + PAGE_SIZE - 1}):`, error.message);
      hasMore = false;
      break;
    }
    
    if (!data) {
      hasMore = false;
      break;
    }

    allRows.push(...data);

    if (data.length < PAGE_SIZE) {
      hasMore = false;
    } else {
      from += PAGE_SIZE;
    }
  }

  return allRows;
}

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
  const isGlobalAdmin = user?.appRole === 'global_super_admin';

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Users without a school (and not global admin) should see no data
    if (!schoolId && !isGlobalAdmin) {
      setData([]);
      setLoading(false);
      return;
    }

    const result = await fetchAllRows(table, schoolId, isGlobalAdmin, options);
    setData(result as T[]);
    setLoading(false);
  }, [table, schoolId, isGlobalAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const insert = async (record: Partial<T>) => {
    const payload = schoolId ? { ...record, school_id: schoolId } : record;
    const { error } = await (supabase as any).from(table).insert(payload);
    if (!error) await fetchData();
    return { error };
  };

  const update = async (id: string, record: Partial<T>) => {
    const { error } = await (supabase as any).from(table).update(record).eq('id', id);
    if (!error) await fetchData();
    return { error };
  };

  const remove = async (id: string) => {
    const { error } = await (supabase as any).from(table).delete().eq('id', id);
    if (!error) await fetchData();
    return { error };
  };

  const removeMany = async (ids: string[]) => {
    if (ids.length === 0) return { error: null };
    const { error } = await (supabase as any).from(table).delete().in('id', ids);
    if (!error) await fetchData();
    return { error };
  };

  return { data, loading, refetch: fetchData, insert, update, remove, removeMany };
}
