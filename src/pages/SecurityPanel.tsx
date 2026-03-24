import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Shield, ShieldAlert, Monitor, Activity, Search, Loader2,
  CheckCircle, XCircle, Ban, Smartphone, Trash2, Check
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface SecurityLog {
  id: string;
  user_email: string | null;
  ip_address: string;
  device_fingerprint: string | null;
  action: string;
  status: string;
  detail: string;
  created_at: string;
}

interface Device {
  id: string;
  device_name: string;
  fingerprint: string;
  owner_user_id: string;
  is_approved: boolean;
  last_used_at: string;
  created_at: string;
  owner_email?: string;
  owner_name?: string;
}

const STATUS_COLORS: Record<string, string> = {
  success: 'bg-success/10 text-success border-success/20',
  failure: 'bg-destructive/10 text-destructive border-destructive/20',
  blocked: 'bg-warning/10 text-warning border-warning/20',
};

const ACTION_LABELS: Record<string, string> = {
  login_success: 'Login Berhasil',
  login_failure: 'Login Gagal',
  blocked_ip: 'IP Diblokir',
  device_approval: 'Persetujuan Perangkat',
  emergency_access: 'Akses Darurat',
  account_locked: 'Akun Terkunci',
  password_reset: 'Reset Password',
};

const SecurityPanel = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('logs');

  const fetchLogs = useCallback(async () => {
    const { data } = await (supabase as any)
      .from('security_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    setLogs(data || []);
  }, []);

  const fetchDevices = useCallback(async () => {
    const { data: devicesData } = await (supabase as any)
      .from('authorized_devices')
      .select('*')
      .order('created_at', { ascending: false });

    if (devicesData) {
      // Enrich with profile names
      const userIds: string[] = [...new Set(devicesData.map((d: any) => d.owner_user_id as string))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .in('user_id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      setDevices(devicesData.map((d: any) => ({
        ...d,
        owner_name: profileMap.get(d.owner_user_id)?.name || 'Unknown',
        owner_email: profileMap.get(d.owner_user_id)?.email || '',
      })));
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchLogs(), fetchDevices()]);
      setLoading(false);
    };
    load();
  }, [fetchLogs, fetchDevices]);

  const handleApproveDevice = async (deviceId: string) => {
    const { error } = await (supabase as any)
      .from('authorized_devices')
      .update({ is_approved: true })
      .eq('id', deviceId);

    if (error) {
      toast.error('Gagal menyetujui perangkat');
      return;
    }
    toast.success('Perangkat berhasil disetujui');
    await fetchDevices();
  };

  const handleDeleteDevice = async (deviceId: string) => {
    const { error } = await (supabase as any)
      .from('authorized_devices')
      .delete()
      .eq('id', deviceId);

    if (error) {
      toast.error('Gagal menghapus perangkat');
      return;
    }
    toast.success('Perangkat berhasil dihapus');
    await fetchDevices();
  };

  const filteredLogs = logs.filter(l =>
    (l.user_email || '').toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.ip_address.toLowerCase().includes(search.toLowerCase()) ||
    l.detail.toLowerCase().includes(search.toLowerCase())
  );

  const filteredDevices = devices.filter(d =>
    d.device_name.toLowerCase().includes(search.toLowerCase()) ||
    (d.owner_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.owner_email || '').toLowerCase().includes(search.toLowerCase())
  );

  const pendingDevices = devices.filter(d => !d.is_approved).length;

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-4">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h1 className="page-title">Keamanan Sistem</h1>
              <p className="text-sm text-muted-foreground">Monitor keamanan, perangkat, dan log akses</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Log</span>
            </div>
            <p className="text-xl font-bold text-foreground">{logs.length}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-success" />
              <span className="text-xs text-muted-foreground">Login Sukses</span>
            </div>
            <p className="text-xl font-bold text-foreground">{logs.filter(l => l.action === 'login_success').length}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Login Gagal</span>
            </div>
            <p className="text-xl font-bold text-foreground">{logs.filter(l => l.action === 'login_failure').length}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-1">
              <Monitor className="w-4 h-4 text-warning" />
              <span className="text-xs text-muted-foreground">Perangkat Pending</span>
            </div>
            <p className="text-xl font-bold text-foreground">{pendingDevices}</p>
          </div>
        </div>

        {/* Search */}
        <div className="search-bar">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari log atau perangkat..." className="pl-9" />
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="logs" className="gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Log Keamanan
            </TabsTrigger>
            <TabsTrigger value="devices" className="gap-1.5">
              <Smartphone className="w-3.5 h-3.5" /> Perangkat
              {pendingDevices > 0 && (
                <span className="ml-1 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                  {pendingDevices}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="mt-4">
            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Belum ada log keamanan</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLogs.map(log => (
                  <div key={log.id} className="stat-card flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      log.status === 'success' ? 'bg-success/10' : log.status === 'blocked' ? 'bg-warning/10' : 'bg-destructive/10'
                    }`}>
                      {log.status === 'success' ? <CheckCircle className="w-4 h-4 text-success" /> :
                       log.status === 'blocked' ? <Ban className="w-4 h-4 text-warning" /> :
                       <XCircle className="w-4 h-4 text-destructive" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-[10px] ${STATUS_COLORS[log.status] || ''}`}>
                          {ACTION_LABELS[log.action] || log.action}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">{log.ip_address}</span>
                      </div>
                      <p className="text-xs text-foreground mt-0.5 truncate">{log.user_email || 'Anonim'}</p>
                      {log.detail && <p className="text-[11px] text-muted-foreground truncate">{log.detail}</p>}
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                      {new Date(log.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="devices" className="mt-4">
            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : filteredDevices.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Monitor className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Belum ada perangkat terdaftar</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredDevices.map(device => (
                  <div key={device.id} className="stat-card">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{device.device_name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{device.fingerprint}</p>
                        </div>
                      </div>
                      <Badge className={device.is_approved
                        ? 'bg-success/10 text-success border-success/20 text-[10px]'
                        : 'bg-warning/10 text-warning border-warning/20 text-[10px]'
                      }>
                        {device.is_approved ? 'Disetujui' : 'Pending'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{device.owner_name} ({device.owner_email})</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Terakhir digunakan: {new Date(device.last_used_at).toLocaleString('id-ID')}
                    </p>
                    <div className="flex gap-2 mt-3">
                      {!device.is_approved && (
                        <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={() => handleApproveDevice(device.id)}>
                          <Check className="w-3 h-3 mr-1" /> Setujui
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="flex-1 text-xs h-7 text-destructive hover:text-destructive" onClick={() => handleDeleteDevice(device.id)}>
                        <Trash2 className="w-3 h-3 mr-1" /> Hapus
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default SecurityPanel;
