import { useState, useRef, useEffect } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { useSettings, IpAccessMode } from '@/contexts/SettingsContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Upload, ImageIcon, Save, Plus, Trash2, Globe, ShieldCheck, Wifi } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const SettingsPage = () => {
  const { settings, updateSettings, loading } = useSettings();
  const [schoolName, setSchoolName] = useState(settings.schoolName);
  const [appName, setAppName] = useState(settings.appName);
  const [logoPreview, setLogoPreview] = useState(settings.logoUrl);
  const [motto, setMotto] = useState(settings.motto);
  const [visi, setVisi] = useState(settings.visi);
  const [ipAccessMode, setIpAccessMode] = useState<IpAccessMode>(settings.ipAccessMode);
  const [allowedIps, setAllowedIps] = useState<string[]>(settings.allowedIps);
  const [newIp, setNewIp] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Sync local state when settings load from DB
  useEffect(() => {
    if (!loading) {
      setSchoolName(settings.schoolName);
      setAppName(settings.appName);
      setLogoPreview(settings.logoUrl);
      setMotto(settings.motto);
      setVisi(settings.visi);
      setIpAccessMode(settings.ipAccessMode);
      setAllowedIps(settings.allowedIps);
    }
  }, [loading, settings]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const addIp = () => {
    const ip = newIp.trim();
    if (!ip) return;
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    if (!ipRegex.test(ip)) {
      toast.error('Format IP tidak valid. Contoh: 192.168.1.1 atau 192.168.1.0/24');
      return;
    }
    if (allowedIps.includes(ip)) {
      toast.error('IP sudah ada dalam daftar');
      return;
    }
    setAllowedIps(prev => [...prev, ip]);
    setNewIp('');
    toast.success('IP berhasil ditambahkan');
  };

  const removeIp = (ip: string) => {
    setAllowedIps(prev => prev.filter(i => i !== ip));
  };

  const handleSave = async () => {
    setSaving(true);
    await updateSettings({
      schoolName,
      appName,
      logoUrl: logoPreview,
      motto,
      visi,
      ipAccessMode,
      allowedIps,
    });
    setSaving(false);
    toast.success('Pengaturan berhasil disimpan');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Memuat pengaturan...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6 max-w-2xl">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="page-title">Pengaturan Sekolah</h1>
              <p className="text-sm text-muted-foreground">Kelola identitas sekolah, visi misi, dan akses</p>
            </div>
          </div>
        </div>

        {/* Identitas Sekolah */}
        <div className="stat-card space-y-6">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" /> Identitas Sekolah
          </h3>

          {/* Logo */}
          <div>
            <label className="text-sm font-semibold text-foreground block mb-3">Logo Sekolah</label>
            <div className="flex items-center gap-5">
              <div
                onClick={() => fileRef.current?.click()}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all overflow-hidden"
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                    <span className="text-[10px] text-muted-foreground">Upload</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-1" /> Pilih Gambar
                </Button>
                {logoPreview && (
                  <Button variant="ghost" size="sm" onClick={() => setLogoPreview('')} className="text-destructive hover:text-destructive">
                    Hapus Logo
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">Format: PNG, JPG, SVG. Maks 2MB.</p>
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">Nama Sekolah</label>
              <Input value={schoolName} onChange={e => setSchoolName(e.target.value)} placeholder="SMA Negeri 1 Jakarta" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">Nama Aplikasi</label>
              <Input value={appName} onChange={e => setAppName(e.target.value)} placeholder="Perpustakaan Digital" />
            </div>
          </div>

          {/* Motto */}
          <div>
            <label className="text-sm font-semibold text-foreground block mb-1.5">Motto Sekolah</label>
            <Input
              value={motto}
              onChange={e => setMotto(e.target.value)}
              placeholder="Contoh: Cerdas, Berkarakter, dan Berprestasi"
            />
            <p className="text-xs text-muted-foreground mt-1">Ditampilkan di halaman login</p>
          </div>

          {/* Visi */}
          <div>
            <label className="text-sm font-semibold text-foreground block mb-1.5">Visi Sekolah</label>
            <Textarea
              value={visi}
              onChange={e => setVisi(e.target.value)}
              placeholder="Contoh: Mewujudkan generasi unggul yang berilmu..."
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">Ditampilkan di halaman login sebagai deskripsi</p>
          </div>

          {/* Preview */}
          <div className="border rounded-xl p-4 bg-muted/20">
            <p className="text-xs font-medium text-muted-foreground mb-3">Pratinjau</p>
            <div className="flex items-center gap-3 mb-3">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-10 h-10 rounded-lg object-contain" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                  {appName.charAt(0) || 'P'}
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-foreground">{appName || 'Perpustakaan'}</p>
                <p className="text-[10px] text-muted-foreground">{schoolName || 'Nama Sekolah'}</p>
              </div>
            </div>
            {motto && <p className="text-xs font-medium text-foreground italic">"{motto}"</p>}
            {visi && <p className="text-[11px] text-muted-foreground mt-1">{visi}</p>}
          </div>
        </div>

        {/* Pengaturan Akses IP */}
        <div className="stat-card space-y-5">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" /> Pengaturan Akses IP
          </h3>

          <p className="text-xs text-muted-foreground">
            Kontrol siapa yang bisa mengakses aplikasi berdasarkan alamat IP. Pilih mode akses di bawah ini.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setIpAccessMode('open')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                ipAccessMode === 'open'
                  ? 'border-primary bg-accent shadow-sm'
                  : 'border-border hover:border-primary/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Globe className={`w-5 h-5 ${ipAccessMode === 'open' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-sm font-semibold text-foreground">Akses Bebas</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Semua IP bisa mengakses aplikasi. Cocok untuk penggunaan umum.
              </p>
              {ipAccessMode === 'open' && (
                <Badge className="mt-2 text-xs bg-success/10 text-success border-success/20">Aktif</Badge>
              )}
            </button>

            <button
              onClick={() => setIpAccessMode('restricted')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                ipAccessMode === 'restricted'
                  ? 'border-primary bg-accent shadow-sm'
                  : 'border-border hover:border-primary/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className={`w-5 h-5 ${ipAccessMode === 'restricted' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-sm font-semibold text-foreground">IP Khusus</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Hanya IP tertentu yang bisa mengakses. Cocok untuk jaringan sekolah.
              </p>
              {ipAccessMode === 'restricted' && (
                <Badge className="mt-2 text-xs bg-warning/10 text-warning border-warning/20">Aktif</Badge>
              )}
            </button>
          </div>

          {ipAccessMode === 'restricted' && (
            <div className="space-y-3 animate-fade-in">
              <label className="text-sm font-semibold text-foreground block">Daftar IP yang Diizinkan</label>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Wifi className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={newIp}
                    onChange={e => setNewIp(e.target.value)}
                    placeholder="192.168.1.0/24"
                    className="pl-9"
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addIp(); } }}
                  />
                </div>
                <Button onClick={addIp} variant="gradient" size="default">
                  <Plus className="w-4 h-4 mr-1" /> Tambah
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Format: IP tunggal (192.168.1.1) atau range CIDR (192.168.1.0/24)
              </p>

              {allowedIps.length > 0 ? (
                <div className="space-y-2">
                  {allowedIps.map(ip => (
                    <div key={ip} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 border">
                      <div className="flex items-center gap-2">
                        <Wifi className="w-3.5 h-3.5 text-primary" />
                        <span className="text-sm font-mono text-foreground">{ip}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeIp(ip)} className="text-destructive hover:text-destructive h-7 w-7 p-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 rounded-lg border border-dashed">
                  <ShieldCheck className="w-6 h-6 text-muted-foreground mx-auto mb-2 opacity-40" />
                  <p className="text-xs text-muted-foreground">Belum ada IP yang ditambahkan</p>
                  <p className="text-[10px] text-muted-foreground">Tambahkan IP jaringan sekolah Anda</p>
                </div>
              )}

              <div className="rounded-xl border bg-warning/5 p-3">
                <p className="text-xs text-warning font-medium mb-1">⚠️ Perhatian</p>
                <p className="text-xs text-muted-foreground">
                  Pastikan IP perangkat Anda termasuk dalam daftar agar tidak terkunci dari sistem.
                </p>
              </div>
            </div>
          )}
        </div>

        <Button onClick={handleSave} variant="gradient" size="lg" className="w-full sm:w-auto" disabled={saving}>
          <Save className="w-4 h-4 mr-1" /> {saving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
        </Button>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
