import { AppLayout } from '@/layouts/AppLayout';
import { mockActivityLogs } from '@/data/mockData';
import { Activity } from 'lucide-react';

const ActivityLogPage = () => {
  return (
    <AppLayout>
      <div className="animate-fade-in space-y-4">
        <div className="page-header">
          <h1 className="page-title">Log Aktivitas</h1>
        </div>

        <div className="space-y-3">
          {mockActivityLogs.map(log => (
            <div key={log.id} className="stat-card flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Activity className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-foreground">{log.action}</span>
                  <span className="text-xs text-muted-foreground">oleh {log.user}</span>
                </div>
                <p className="text-sm text-muted-foreground">{log.detail}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">{log.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default ActivityLogPage;
