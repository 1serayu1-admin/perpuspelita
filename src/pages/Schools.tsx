import { useState, useEffect } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Building2, Plus, Pencil, Trash2, Search, Globe, Users } from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface School {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  motto: string | null;
  vision: string | null;
  logo_url: string | null;
  primary_color: string | null;
  is_active: boolean;
  created_at: string;
}

const Schools = () => {
  const { user } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSchool, setEditSchool] = useState<School | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [motto, setMotto] = useState('');
  const [vision, setVision] = useState('');

  // Only global_super_admin can access
  if (user?.appRole !== 'global_super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const fetchSchools = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Gagal memuat data sekolah');
    } else {
      setSchools(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const openCreate = () => {
    setEditSchool(null);
    setName('');
    setAddress('');
    setPhone('');
    setEmail('');
    setMotto('');
    setVision('');
    setDialogOpen(true);
  };

  const openEdit = (school: School) => {
    setEditSchool(school);
    setName(school.name);
    setAddress(school.address || '');
    setPhone(school.phone || '');
    setEmail(school.email || '');
    setMotto(school.motto || '');
    setVision(school.vision || '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Nama sekolah wajib diisi');
      return;
    }

    const payload = {
      name: name.trim(),
      address: address.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      motto: motto.trim() || null,
      vision: vision.trim() || null,
    };

    if (editSchool) {
      const { error } = await supabase
        .from('schools')
        .update(payload)
        .eq('id', editSchool.id);

      if (error) {
        toast.error('Gagal mengubah sekolah');
      } else {
        toast.success('Sekolah berhasil diubah');
        setDialogOpen(false);
        fetchSchools();
      }
    } else {
      const { error } = await supabase
        .from('schools')
        .insert(payload);

      if (error) {
        toast.error('Gagal menambah sekolah');
      } else {
        toast.success('Sekolah berhasil ditambahkan');
        setDialogOpen(false);
        fetchSchools();
      }
    }
  };

  const toggleActive = async (school: School) => {
    const { error } = await supabase
      .from('schools')
      .update({ is_active: !school.is_active })
      .eq('id', school.id);

    if (error) {
      toast.error('Gagal mengubah status');
    } else {
      toast.success(school.is_active ? 'Sekolah dinonaktifkan' : 'Sekolah diaktifkan');
      fetchSchools();
    }
  };

  const filtered = schools.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.address || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="page-header">
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Globe className="w-6 h-6" /> Kelola Sekolah
            </h1>
            <p className="text-sm text-muted-foreground">
              Panel manajemen multi-sekolah — Global Super Admin
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" /> Tambah Sekolah
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari sekolah..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="stat-card">
            <Building2 className="w-5 h-5 text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">{schools.length}</p>
            <p className="text-xs text-muted-foreground">Total Sekolah</p>
          </div>
          <div className="stat-card">
            <Building2 className="w-5 h-5 text-success mb-2" />
            <p className="text-2xl font-bold text-foreground">{schools.filter(s => s.is_active).length}</p>
            <p className="text-xs text-muted-foreground">Aktif</p>
          </div>
          <div className="stat-card">
            <Users className="w-5 h-5 text-warning mb-2" />
            <p className="text-2xl font-bold text-foreground">{schools.filter(s => !s.is_active).length}</p>
            <p className="text-xs text-muted-foreground">Nonaktif</p>
          </div>
        </div>

        {/* Table */}
        <div className="data-table-wrapper">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Memuat data...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {schools.length === 0 ? 'Belum ada sekolah. Klik "Tambah Sekolah" untuk memulai.' : 'Tidak ditemukan.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-medium text-muted-foreground">Nama Sekolah</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Alamat</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                    <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-center p-3 font-medium text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(school => (
                    <tr key={school.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="p-3">
                        <div className="font-medium text-foreground">{school.name}</div>
                        {school.motto && <p className="text-xs text-muted-foreground italic">"{school.motto}"</p>}
                      </td>
                      <td className="p-3 text-muted-foreground hidden md:table-cell">{school.address || '-'}</td>
                      <td className="p-3 text-muted-foreground hidden md:table-cell">{school.email || '-'}</td>
                      <td className="p-3 text-center">
                        <Badge
                          className={`cursor-pointer text-xs ${school.is_active ? 'bg-success/10 text-success border-success/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}
                          onClick={() => toggleActive(school)}
                        >
                          {school.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(school)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editSchool ? 'Edit Sekolah' : 'Tambah Sekolah Baru'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground">Nama Sekolah *</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="SMA Negeri 1 ..." />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Alamat</label>
              <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Jl. ..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Telepon</label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="021-..." />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="info@..." />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Motto</label>
              <Input value={motto} onChange={e => setMotto(e.target.value)} placeholder="Cerdas, Berkarakter..." />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Visi</label>
              <Input value={vision} onChange={e => setVision(e.target.value)} placeholder="Mewujudkan generasi..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave}>{editSchool ? 'Simpan' : 'Tambah'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Schools;
