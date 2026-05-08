import { useState, useRef, useEffect, useCallback } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { useSettings, IpAccessMode } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Upload, ImageIcon, Save, Plus, Trash2, Globe, ShieldCheck, Wifi, Users, UserPlus, KeyRound, Search, Loader2, Eye, EyeOff, UserX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';
import type { AppRole } from '@/lib/types';

interface UserWithRole {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  schoolId: string | null;
  schoolName: string | null;
  roles: { id: string; role: AppRole; schoolId: string | null }[];
  isActive: boolean;
}

interface School {
  id: string;
  name: string;
}

const SettingsPage = () => {
  const { user } = useAuth();
  const { settings, updateSettings, loading } = useSettings();
  
  // Add safety checks for settings
  const safeSettings = settings || {
    schoolName: 'SMA Negeri 1',
    appName: 'Perpustakaan',
    logoUrl: '',
    motto: '',
    visi: '',
    ipAccessMode: 'open' as IpAccessMode,
    allowedIps: [],
  };
  
  const [schoolName, setSchoolName] = useState(safeSettings.schoolName);
  const [appName, setAppName] = useState(safeSettings.appName);
  const [logoPreview, setLogoPreview] = useState(safeSettings.logoUrl);
  const [motto, setMotto] = useState(safeSettings.motto);
  const [visi, setVisi] = useState(safeSettings.visi);
  const [ipAccessMode, setIpAccessMode] = useState<IpAccessMode>(safeSettings.ipAccessMode);
  const [allowedIps, setAllowedIps] = useState<string[]>(safeSettings.allowedIps);
  const [newIp, setNewIp] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'users'>('general');
  const fileRef = useRef<HTMLInputElement>(null);

  // User Management State
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'admin' as AppRole, schoolId: '', username: '' });
  const [newPassword, setNewPassword] = useState('');
  const [userSaving, setUserSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Only global_super_admin and school_super_admin can access settings
  if (!['global_super_admin', 'school_super_admin'].includes(user?.role || '')) {
    return <Navigate to="/dashboard" replace />;
  }

  const ROLE_LABELS: Record<AppRole, string> = {
    global_super_admin: 'Global Super Admin',
    school_super_admin: 'School Super Admin',
    admin: 'Admin / Petugas',
    guru: 'Guru',
    siswa: 'Siswa',
  };

  const getAvailableRoles = (): AppRole[] => {
    if (user?.role === 'global_super_admin') return ['global_super_admin', 'school_super_admin', 'admin', 'guru', 'siswa'];
    return ['school_super_admin', 'admin', 'guru', 'siswa'];
  };

  // Helper to fetch all rows with pagination
  const fetchAllRows = async (table: string, select: string, orderBy = 'created_at') => {
    const allRows: any[] = [];
    let from = 0;
    const PAGE = 1000;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await (supabase as any)
        .from(table)
        .select(select)
        .order(orderBy, { ascending: false })
        .range(from, from + PAGE - 1);
      if (error || !data || data.length === 0) { hasMore = false; break; }
      allRows.push(...data);
      if (data.length < PAGE) hasMore = false;
      else from += PAGE;
    }
    return allRows;
  };

  // Fetch users and schools
  const fetchUsers = useCallback(async () => {
    setUserLoading(true);
    try {
      // Fetch profiles
      const profiles = await fetchAllRows('profiles', 'user_id, name, email, avatar_url, school_id, is_active');
      
      // Fetch roles
      const roles = await fetchAllRows('user_roles', 'id, user_id, role, school_id');
      
      // Fetch schools
      const schoolsData = await fetchAllRows('schools', 'id, name');
      setSchools(schoolsData || []);
      
      // Combine data
      const schoolMap = new Map((schoolsData || []).map(s => [s.id, s.name]));
      
      const mapped: UserWithRole[] = (profiles || []).map(p => ({
        userId: p.user_id,
        name: p.name,
        email: p.email,
        avatarUrl: p.avatar_url,
        schoolId: p.school_id,
        schoolName: p.school_id ? schoolMap.get(p.school_id) || null : null,
        roles: roles.filter(r => r.user_id === p.user_id),
        isActive: p.is_active !== false
      }));
      
      setUsers(mapped);
    } catch (err) {
      console.error('Error loading users:', err);
      toast.error('Gagal memuat data users');
    } finally {
      setUserLoading(false);
    }
  }, []);

  // Load users when users tab is active
  useEffect(() => {
    if (activeTab === 'users' && user?.role === 'global_super_admin') {
      fetchUsers();
    }
  }, [activeTab, user?.role, fetchUsers]);

  // Create user
  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error('Nama, email, dan password wajib diisi');
      return;
    }

    setUserSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          name: newUser.name,
          role: newUser.role,
          school_id: newUser.schoolId || null,
          username: newUser.username || null,
        }),
      });
      
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || 'Gagal membuat pengguna');
      } else {
        toast.success(`Pengguna ${newUser.name} berhasil dibuat sebagai ${ROLE_LABELS[newUser.role]}`);
        setUserDialogOpen(false);
        setNewUser({ name: '', email: '', password: '', role: 'admin', schoolId: '', username: '' });
        await fetchUsers();
      }
    } catch (err: any) {
      toast.error('Terjadi kesalahan: ' + err.message);
    } finally {
      setUserSaving(false);
    }
  };

  // Reset password
  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return;
    if (newPassword.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    
    setUserSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          user_id: selectedUser.userId,
          new_password: newPassword,
        }),
      });
      
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || 'Gagal mereset password');
      } else {
        toast.success(`Password ${selectedUser.name} berhasil direset`);
        setResetDialogOpen(false);
        setNewPassword('');
      }
    } catch (err: any) {
      toast.error('Terjadi kesalahan: ' + err.message);
    } finally {
      setUserSaving(false);
    }
  };

  // Toggle user active status
  const handleToggleUserStatus = async (targetUser: UserWithRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !targetUser.isActive })
        .eq('user_id', targetUser.userId);
      
      if (error) throw error;
      
      toast.success(`Pengguna ${targetUser.name} ${targetUser.isActive ? 'dinonaktifkan' : 'diaktifkan'}`);
      await fetchUsers();
    } catch (err: any) {
      toast.error('Gagal mengubah status pengguna: ' + err.message);
    }
  };

  // Filter users by search term
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sync local state when settings load from DB
  useEffect(() => {
    if (!loading && settings) {
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
      <div className="page-header">
        <h1 className="page-title">Pengaturan</h1>
        <p className="text-gray-500">Kelola konfigurasi sistem perpustakaan</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-gray-100 p-1 mb-8">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'general'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Settings className="w-4 h-4" />
            Umum
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'security'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Keamanan
          </button>
          {user?.role === 'global_super_admin' && (
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'users' 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Users className="w-4 h-4" />
              Pengguna
            </button>
          )}
        </div>
      </div>

      {/* General Settings Tab */}
      {activeTab === 'general' && (
        <div className="space-y-8">
          {/* School Information */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Informasi Sekolah</h3>
                <p className="text-sm text-gray-500 mt-1">Atur identitas dan branding sekolah</p>
              </div>
              <Globe className="w-5 h-5 text-gray-400" />
            </div>

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
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Pengaturan Keamanan</h3>
              <p className="text-sm text-gray-500 mt-1">Kelola keamanan akses aplikasi</p>
            </div>
            <ShieldCheck className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="text-center py-12">
            <ShieldCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Pengaturan keamanan akan segera tersedia</p>
          </div>
        </div>
      )}

      {/* Users Tab - Only for global_super_admin */}
      {activeTab === 'users' && user?.role === 'global_super_admin' && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Manajemen Pengguna</h3>
              <p className="text-sm text-gray-500 mt-1">Buat dan kelola akun pengguna</p>
            </div>
            <Button onClick={() => setUserDialogOpen(true)}>
              <UserPlus className="w-4 h-4 mr-1" /> Tambah Pengguna
            </Button>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari pengguna berdasarkan nama atau email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Users List */}
          {userLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mr-2" />
              <span className="text-muted-foreground">Memuat data pengguna...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'Tidak ada pengguna yang cocok dengan pencarian' : 'Belum ada pengguna'}
              </p>
              {!searchTerm && (
                <p className="text-sm text-muted-foreground mt-2">
                  Klik "Tambah Pengguna" untuk membuat akun baru
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((userItem) => (
                <div key={userItem.userId} className="border rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-bold">
                          {userItem.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{userItem.name}</h4>
                        <p className="text-sm text-gray-500">{userItem.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {userItem.roles.map((role) => (
                        <Badge key={role.id} className="text-xs">
                          {ROLE_LABELS[role.role]}
                        </Badge>
                      ))}
                      <Badge variant={userItem.isActive ? "default" : "secondary"}>
                        {userItem.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                  </div>
                  
                  {userItem.schoolName && (
                    <div className="text-sm text-gray-500">
                      Sekolah: {userItem.schoolName}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(userItem);
                        setResetDialogOpen(true);
                      }}
                    >
                      <KeyRound className="w-3 h-3 mr-1" />
                      Reset Password
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleUserStatus(userItem)}
                    >
                      <UserX className="w-3 h-3 mr-1" />
                      {userItem.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create User Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Pengguna Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Masukkan nama lengkap"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                placeholder="nama@email.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Minimal 6 karakter"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={newUser.role} onValueChange={(value: AppRole) => setNewUser(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableRoles().map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(newUser.role === 'school_super_admin' || newUser.role === 'admin') && (
              <div>
                <Label htmlFor="school">Sekolah</Label>
                <Select value={newUser.schoolId} onValueChange={(value) => setNewUser(prev => ({ ...prev, schoolId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih sekolah" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setUserDialogOpen(false)} className="flex-1">
                Batal
              </Button>
              <Button onClick={handleCreateUser} disabled={userSaving} className="flex-1">
                {userSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Buat Pengguna
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Reset password untuk: <strong>{selectedUser?.name}</strong>
              </p>
              <Label htmlFor="newPassword">Password Baru</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setResetDialogOpen(false)} className="flex-1">
                Batal
              </Button>
              <Button onClick={handleResetPassword} disabled={userSaving} className="flex-1">
                {userSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Reset Password
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default SettingsPage;
