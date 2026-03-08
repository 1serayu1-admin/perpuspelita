import { useState, useEffect } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Navigate } from 'react-router-dom';
import { Download, Smartphone, Monitor, CheckCircle, Wifi, WifiOff, Shield, BookOpen, RefreshCw, QrCode, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallApp = () => {
  const { user, hasRole } = useAuth();
  const { settings } = useSettings();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const isSuperAdmin = hasRole(['super_admin']);

  useEffect(() => {
    if (!isSuperAdmin) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const installedHandler = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const onlineHandler = () => setIsOnline(true);
    const offlineHandler = () => setIsOnline(false);
    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
    };
  }, [isSuperAdmin]);

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast.info('Gunakan menu browser: Share → Add to Home Screen (iOS) atau Menu → Install App (Android/Desktop)');
      return;
    }
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      toast.success('Aplikasi berhasil diinstall!');
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    { icon: Smartphone, title: 'Akses Cepat', desc: 'Buka langsung dari home screen tanpa browser' },
    { icon: WifiOff, title: 'Mode Offline', desc: 'Tetap bisa diakses meski tanpa internet' },
    { icon: Monitor, title: 'Tampilan Fullscreen', desc: 'Pengalaman seperti aplikasi native' },
    { icon: RefreshCw, title: 'Auto Update', desc: 'Selalu mendapatkan versi terbaru otomatis' },
  ];

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6 max-w-2xl">
        {/* Header */}
        <div className="page-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="page-title">Install Aplikasi</h1>
              <p className="text-sm text-muted-foreground">Pasang aplikasi perpustakaan sebagai standalone app</p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="grid grid-cols-2 gap-3">
          <div className="stat-card flex items-center gap-3">
            {isOnline ? <Wifi className="w-5 h-5 text-success" /> : <WifiOff className="w-5 h-5 text-destructive" />}
            <div>
              <p className="text-sm font-medium text-foreground">{isOnline ? 'Online' : 'Offline'}</p>
              <p className="text-xs text-muted-foreground">Status koneksi</p>
            </div>
          </div>
          <div className="stat-card flex items-center gap-3">
            {isInstalled ? <CheckCircle className="w-5 h-5 text-success" /> : <Download className="w-5 h-5 text-warning" />}
            <div>
              <p className="text-sm font-medium text-foreground">{isInstalled ? 'Terinstall' : 'Belum Install'}</p>
              <p className="text-xs text-muted-foreground">Status aplikasi</p>
            </div>
          </div>
        </div>

        {/* App Preview Card */}
        <div className="stat-card overflow-hidden">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0 shadow-lg">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="App Icon" className="w-full h-full object-contain p-1" />
              ) : (
                <img src="/pwa-192.png" alt="App Icon" className="w-full h-full object-contain p-1" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{settings.appName || 'Perpustakaan Digital'}</h2>
              <p className="text-sm text-muted-foreground">{settings.schoolName || 'SMA Negeri 1'}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                  <Shield className="w-3 h-3 mr-1" /> Super Admin Only
                </Badge>
              </div>
            </div>
          </div>

          {isInstalled ? (
            <div className="rounded-xl border border-success/20 bg-success/5 p-4 text-center">
              <CheckCircle className="w-10 h-10 text-success mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">Aplikasi sudah terinstall!</p>
              <p className="text-xs text-muted-foreground mt-1">Anda dapat membuka aplikasi dari home screen atau desktop</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Button variant="gradient" size="lg" className="w-full" onClick={handleInstall}>
                <Download className="w-5 h-5 mr-2" />
                {deferredPrompt ? 'Install Aplikasi Sekarang' : 'Cara Install Aplikasi'}
              </Button>
              {!deferredPrompt && (
                <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                  <p className="text-xs font-semibold text-foreground">Panduan Install Manual:</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-[10px] mt-0.5 flex-shrink-0">iOS</Badge>
                      <p className="text-xs text-muted-foreground">Buka di Safari → Tap ikon Share (↑) → "Add to Home Screen"</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-[10px] mt-0.5 flex-shrink-0">Android</Badge>
                      <p className="text-xs text-muted-foreground">Buka di Chrome → Tap menu (⋮) → "Install App" atau "Add to Home Screen"</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-[10px] mt-0.5 flex-shrink-0">HarmonyOS</Badge>
                      <p className="text-xs text-muted-foreground">Buka di Huawei Browser → Tap menu (⋮) → "Tambahkan ke Layar Utama" atau gunakan Quick App Center</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-[10px] mt-0.5 flex-shrink-0">Desktop</Badge>
                      <p className="text-xs text-muted-foreground">Buka di Chrome/Edge → Klik ikon install (⊕) di address bar</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {features.map(f => (
            <div key={f.title} className="stat-card flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <f.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="rounded-xl border bg-muted/10 p-4">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">ℹ️ Catatan:</strong> Fitur install hanya tersedia untuk Super Admin. 
            Aplikasi yang terinstall akan berjalan dalam mode standalone tanpa address bar browser, 
            memberikan pengalaman pengguna seperti aplikasi native. Data tetap tersinkronisasi secara real-time.
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default InstallApp;
