import { useState } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { useSchoolData } from '@/hooks/useSchoolData';
import { Activity, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

const ActivityLogPage = () => {
  const { data: logs, loading } = useSchoolData<any>('activity_logs', { orderBy: 'created_at', ascending: false });
  const [search, setSearch] = useState('');

  const filtered = logs.filter((log: any) =>
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.user_name.toLowerCase().includes(search.toLowerCase()) ||
    (log.detail || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-4">
        <div className="page-header">
          <div>
            <h1 className="page-title">Log Aktivitas</h1>
            <p className="text-sm text-muted-foreground">{filtered.length} aktivitas tercatat</p>
          </div>
        </div>

        <div className="search-bar">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari aktivitas..." className="pl-9" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Belum ada log aktivitas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((log: any) => (
              <div key={log.id} className="stat-card flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Activity className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-foreground">{log.action}</span>
                    <span className="text-xs text-muted-foreground">oleh {log.user_name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{log.detail}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ActivityLogPage;
