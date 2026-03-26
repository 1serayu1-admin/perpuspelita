import { supabase } from '@/integrations/supabase/client';

export interface BatchImportProgress {
  current: number;
  total: number;
}

interface BatchImportOptions<T extends Record<string, any>> {
  table: string;
  rows: T[];
  batchSize?: number;
  onProgress?: (progress: BatchImportProgress) => void;
}

const waitForPaint = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

export async function batchInsertRecords<T extends Record<string, any>>({
  table,
  rows,
  batchSize = 50,
  onProgress,
}: BatchImportOptions<T>) {
  let success = 0;
  let failed = 0;
  const total = rows.length;

  onProgress?.({ current: 0, total });
  await waitForPaint();

  for (let i = 0; i < total; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await (supabase as any).from(table).insert(batch);

    if (error) {
      for (const row of batch) {
        const { error: singleError } = await (supabase as any).from(table).insert(row);
        if (singleError) failed++;
        else success++;
      }
    } else {
      success += batch.length;
    }

    onProgress?.({ current: Math.min(i + batchSize, total), total });
    await waitForPaint();
  }

  return { success, failed };
}