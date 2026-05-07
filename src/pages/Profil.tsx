import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabase } from '@/integrations/supabase/client';
import { User, LogOut, Shield, Mail } from 'lucide-react';
import { logoutUser } from '@/services/authService';

export default function Profil() {
  const { user, role } = useAuth();
  const [quota, setQuota] = useState<{ limit: number, used: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchQuota = async () => {
      const supabase = getSupabase();
      if (!supabase) return;

      const { data } = await supabase
        .from('ai_quotas')
        .select('daily_limit, questions_used, last_reset_date')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setQuota({ limit: data.daily_limit, used: data.questions_used });
      }
    };

    fetchQuota();
  }, [user]);

  const handleLogout = async () => {
    await logoutUser();
    window.location.href = '/login';
  };

  // P1-A Fix: No more navigate() render violation!
  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Profil Pengguna</h1>

      <div className="bg-card border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user.email}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Shield className="w-4 h-4" />
              <span className="capitalize">{role?.replace('_', ' ') || 'Siswa'}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-xl">
            <h3 className="text-sm font-medium mb-1 flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              Email
            </h3>
            <p className="text-sm">{user.email}</p>
          </div>

          <div className="p-4 bg-muted/50 rounded-xl">
            <h3 className="text-sm font-medium mb-2">Kuota AI Harian</h3>
            {quota ? (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Terpakai: {quota.used}</span>
                  <span className="font-bold">Sisa: {quota.limit - quota.used}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full ${quota.used >= quota.limit ? 'bg-destructive' : 'bg-primary'}`} 
                    style={{ width: `${Math.min((quota.used / quota.limit) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada penggunaan AI hari ini.</p>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10 px-4 py-3 rounded-xl transition-colors font-medium border border-destructive/20"
      >
        <LogOut className="w-5 h-5" />
        Keluar
      </button>
    </div>
  );
}
