import { useState, useRef } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { useSettings } from '@/contexts/SettingsContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings, Upload, ImageIcon, Save } from 'lucide-react';
import { toast } from 'sonner';

const SettingsPage = () => {
  const { settings, updateSettings } = useSettings();
  const [schoolName, setSchoolName] = useState(settings.schoolName);
  const [appName, setAppName] = useState(settings.appName);
  const [logoPreview, setLogoPreview] = useState(settings.logoUrl);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    updateSettings({ schoolName, appName, logoUrl: logoPreview });
    toast.success('Pengaturan berhasil disimpan');
  };

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
              <p className="text-sm text-muted-foreground">Kelola identitas sekolah dan aplikasi</p>
            </div>
          </div>
        </div>

        <div className="stat-card space-y-6">
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

          {/* School Name */}
          <div>
            <label className="text-sm font-semibold text-foreground block mb-1.5">Nama Sekolah</label>
            <Input
              value={schoolName}
              onChange={e => setSchoolName(e.target.value)}
              placeholder="Contoh: SMA Negeri 1 Jakarta"
              className="max-w-md"
            />
            <p className="text-xs text-muted-foreground mt-1">Ditampilkan di header dan laporan</p>
          </div>

          {/* App Name */}
          <div>
            <label className="text-sm font-semibold text-foreground block mb-1.5">Nama Aplikasi</label>
            <Input
              value={appName}
              onChange={e => setAppName(e.target.value)}
              placeholder="Contoh: Perpustakaan Digital"
              className="max-w-md"
            />
            <p className="text-xs text-muted-foreground mt-1">Ditampilkan di sidebar dan halaman login</p>
          </div>

          {/* Preview */}
          <div className="border rounded-xl p-4 bg-muted/20">
            <p className="text-xs font-medium text-muted-foreground mb-3">Pratinjau</p>
            <div className="flex items-center gap-3">
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
          </div>

          <Button onClick={handleSave} className="w-full sm:w-auto">
            <Save className="w-4 h-4 mr-1" /> Simpan Pengaturan
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
