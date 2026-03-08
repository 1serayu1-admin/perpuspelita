import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Search, UserCog, ChevronDown, Building2, Loader2, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { AppRole } from '@/lib/types';

interface UserWithRole {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  schoolId: string | null;
  schoolName: string | null;
  roles: { id: string; role: AppRole; schoolId: string | null }[];
}

interface School {
  id: string;
  name: string;
}

const ROLE_LABELS: Record<AppRole, string> = {
  global_super_admin: 'Global Super Admin',
  school_super_admin: 'School Super Admin',
  admin: 'Admin / Petugas',
  guru: 'Guru',
  siswa: 'Siswa',
};

const ROLE_COLORS: Record<AppRole, string> = {
  global_super_admin: 'bg-destructive/10 text-destructive border-destructive/20',
  school_super_admin: 'bg-primary/10 text-primary border-primary/20',
  admin: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  guru: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  siswa: 'bg-muted text-muted-foreground border-border',
};

const AdminManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleDialog, setRoleDialog] = useState<UserWithRole | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>('siswa');
  const [schoolDialog, setSchoolDialog] = useState<UserWithRole | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'admin' as AppRole, schoolId: '', username: '' });

  const isGlobalAdmin = user?.appRole === 'global_super_admin';

  const fetchUsers = useCallback(async () => {
    setLoading(true);

    // Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, name, email, avatar_url, school_id')
      .order('created_at', { ascending: false });

    if (profilesError) {
      toast.error('Gagal memuat data pengguna');
      setLoading(false);
      return;
    }

    // Fetch roles
    const { data: roles } = await supabase
      .from('user_roles')
      .select('id, user_id, role, school_id');

    // Fetch schools for name mapping
    const { data: schoolsData } = await supabase
      .from('schools')
      .select('id, name');

    if (schoolsData) setSchools(schoolsData);

    const schoolMap = new Map((schoolsData || []).map(s => [s.id, s.name]));

    const mapped: UserWithRole[] = (profiles || []).map(p => ({
      userId: p.user_id,
      name: p.name,
      email: p.email,
      avatarUrl: p.avatar_url,
      schoolId: p.school_id,
      schoolName: p.school_id ? schoolMap.get(p.school_id) || null : null,
      roles: (roles || [])
        .filter(r => r.user_id === p.user_id)
        .map(r => ({ id: r.id, role: r.role as AppRole, schoolId: r.school_id })),
    }));

    setUsers(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleChangeRole = async () => {
    if (!roleDialog) return;
    setSaving(true);

    const existingRole = roleDialog.roles[0];

    if (existingRole) {
      // Update existing role
      const { error } = await (supabase as any)
        .from('user_roles')
        .update({ role: selectedRole })
        .eq('id', existingRole.id);

      if (error) {
        toast.error('Gagal mengubah role: ' + error.message);
        setSaving(false);
        return;
      }
    } else {
      // Insert new role
      const { error } = await (supabase as any)
        .from('user_roles')
        .insert({
          user_id: roleDialog.userId,
          role: selectedRole,
          school_id: roleDialog.schoolId,
        });

      if (error) {
        toast.error('Gagal menambah role: ' + error.message);
        setSaving(false);
        return;
      }
    }

    toast.success(`Role ${roleDialog.name} diubah menjadi ${ROLE_LABELS[selectedRole]}`);
    setSaving(false);
    setRoleDialog(null);
    await fetchUsers();
  };

  const handleAssignSchool = async () => {
    if (!schoolDialog || !selectedSchool) return;
    setSaving(true);

    // Update profile school_id
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ school_id: selectedSchool })
      .eq('user_id', schoolDialog.userId);

    if (profileError) {
      toast.error('Gagal assign sekolah: ' + profileError.message);
      setSaving(false);
      return;
    }

    // Also update user_roles school_id
    if (schoolDialog.roles.length > 0) {
      await (supabase as any)
        .from('user_roles')
        .update({ school_id: selectedSchool })
        .eq('user_id', schoolDialog.userId);
    }

    toast.success(`${schoolDialog.name} berhasil di-assign ke sekolah`);
    setSaving(false);
    setSchoolDialog(null);
    await fetchUsers();
  };

  const handleAddUser = async () => {
    const isSuperAdminRole = newUser.role === 'global_super_admin';
    if (!newUser.name || !newUser.password) {
      toast.error('Nama dan password wajib diisi');
      return;
    }
    if (isSuperAdminRole && !newUser.email) {
      toast.error('Email wajib diisi untuk Super Admin');
      return;
    }
    if (!newUser.username && !isSuperAdminRole) {
      toast.error('Username wajib diisi');
      return;
    }
    if (newUser.password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    setSaving(true);
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
        setAddDialog(false);
        setNewUser({ name: '', email: '', password: '', role: 'admin', schoolId: '', username: '' });
        await fetchUsers();
      }
    } catch (err: any) {
      toast.error('Terjadi kesalahan: ' + err.message);
    }
    setSaving(false);
  };

  const getAvailableRoles = (): AppRole[] => {
    if (isGlobalAdmin) return ['global_super_admin', 'school_super_admin', 'admin', 'guru', 'siswa'];
    return ['school_super_admin', 'admin', 'guru', 'siswa'];
  };

  const getPrimaryRole = (u: UserWithRole): AppRole => {
    if (u.roles.length === 0) return 'siswa';
    const hierarchy: AppRole[] = ['global_super_admin', 'school_super_admin', 'admin', 'guru', 'siswa'];
    return hierarchy.find(r => u.roles.some(ur => ur.role === r)) || 'siswa';
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-4">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="page-title">Kelola Pengguna & Role</h1>
              <p className="text-sm text-muted-foreground">
                {isGlobalAdmin ? 'Kelola semua pengguna dan assign role & sekolah' : 'Kelola role pengguna di sekolah Anda'}
              </p>
            </div>
          </div>
        </div>

        <div className="search-bar">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari pengguna..." className="pl-9" />
          </div>
          <Badge variant="outline" className="text-xs">
            {filtered.length} pengguna
          </Badge>
          <Button variant="gradient" size="sm" onClick={() => setAddDialog(true)}>
            <UserPlus className="w-4 h-4 mr-1" /> Tambah Pengguna
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(u => {
              const primaryRole = getPrimaryRole(u);
              return (
                <div key={u.userId} className="stat-card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-sm">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground text-sm truncate">{u.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {/* Role badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`text-xs ${ROLE_COLORS[primaryRole]}`}>
                        <UserCog className="w-3 h-3 mr-1" />
                        {ROLE_LABELS[primaryRole]}
                      </Badge>
                    </div>

                    {/* School info */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building2 className="w-3.5 h-3.5" />
                      <span className="truncate">{u.schoolName || 'Belum di-assign ke sekolah'}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs h-8"
                        onClick={() => {
                          setSelectedRole(primaryRole);
                          setRoleDialog(u);
                        }}
                        disabled={u.userId === user?.id}
                      >
                        <ChevronDown className="w-3 h-3 mr-1" />
                        Ubah Role
                      </Button>
                      {isGlobalAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs h-8"
                          onClick={() => {
                            setSelectedSchool(u.schoolId || '');
                            setSchoolDialog(u);
                          }}
                        >
                          <Building2 className="w-3 h-3 mr-1" />
                          Assign Sekolah
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Tidak ada pengguna ditemukan</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Change Role Dialog */}
      <Dialog open={!!roleDialog} onOpenChange={o => !o && setRoleDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Role - {roleDialog?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">Pilih Role Baru</label>
              <Select value={selectedRole} onValueChange={v => setSelectedRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableRoles().map(role => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border bg-accent/30 p-3">
              <p className="text-xs text-muted-foreground">
                Mengubah role akan langsung mempengaruhi akses pengguna ke fitur aplikasi.
              </p>
            </div>
            <Button onClick={handleChangeRole} variant="gradient" className="w-full" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Simpan Perubahan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign School Dialog */}
      <Dialog open={!!schoolDialog} onOpenChange={o => !o && setSchoolDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Sekolah - {schoolDialog?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">Pilih Sekolah</label>
              <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih sekolah..." />
                </SelectTrigger>
                <SelectContent>
                  {schools.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAssignSchool} variant="gradient" className="w-full" disabled={saving || !selectedSchool}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Assign Sekolah
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={addDialog} onOpenChange={o => { if (!saving) setAddDialog(o); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" /> Tambah Pengguna Baru
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nama Lengkap</Label>
              <Input value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} placeholder="Masukkan nama..." />
            </div>
            <div>
              <Label>Username (untuk login)</Label>
              <Input value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value.toLowerCase().replace(/\s/g, '') }))} placeholder="contoh: ahmad.siswa" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} placeholder="email@contoh.com" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} placeholder="Minimal 6 karakter" />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={newUser.role} onValueChange={v => setNewUser(p => ({ ...p, role: v as AppRole }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {getAvailableRoles().map(role => (
                    <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {schools.length > 0 && (
              <div>
                <Label>Sekolah (opsional)</Label>
                <Select value={newUser.schoolId} onValueChange={v => setNewUser(p => ({ ...p, schoolId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Pilih sekolah..." /></SelectTrigger>
                  <SelectContent>
                    {schools.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={handleAddUser} variant="gradient" className="w-full" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Buat Pengguna
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default AdminManagement;
