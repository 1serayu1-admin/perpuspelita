import { useState } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { mockUsers } from '@/data/mockData';
import { User } from '@/lib/types';
import { Plus, Edit, Trash2, Shield, UserCog, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const AdminManagement = () => {
  const [admins, setAdmins] = useState<User[]>(mockUsers.filter(u => u.role === 'admin'));
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<User | null>(null);

  const filtered = admins.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = form.get('name') as string;
    const email = form.get('email') as string;

    // Check duplicate email
    if (!editItem && admins.some(a => a.email === email)) {
      toast.error('Email sudah terdaftar');
      return;
    }

    const data: User = {
      id: editItem?.id || `u${Date.now()}`,
      name,
      email,
      role: 'admin',
    };

    if (editItem) {
      setAdmins(prev => prev.map(a => a.id === editItem.id ? data : a));
      toast.success('Data admin diperbarui');
    } else {
      setAdmins(prev => [...prev, data]);
      toast.success('Admin baru berhasil ditambahkan');
    }
    setDialogOpen(false);
    setEditItem(null);
  };

  const handleDelete = (id: string) => {
    setAdmins(prev => prev.filter(a => a.id !== id));
    toast.success('Admin berhasil dihapus');
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
              <h1 className="page-title">Kelola Admin</h1>
              <p className="text-sm text-muted-foreground">Tambah dan kelola petugas perpustakaan</p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditItem(null); }}>
            <DialogTrigger asChild>
              <Button size="sm" variant="gradient"><Plus className="w-4 h-4 mr-1" /> Tambah Admin</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editItem ? 'Edit Admin' : 'Tambah Admin Baru'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Nama Lengkap</label>
                  <Input name="name" defaultValue={editItem?.name} placeholder="Nama lengkap admin" required />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Email</label>
                  <Input name="email" type="email" defaultValue={editItem?.email} placeholder="email@sekolah.id" required />
                </div>
                <div className="rounded-lg border bg-accent/30 p-3">
                  <p className="text-xs text-accent-foreground font-medium mb-1">ℹ️ Informasi</p>
                  <p className="text-xs text-muted-foreground">
                    Admin yang ditambahkan akan memiliki akses sebagai petugas perpustakaan.
                    Password default: <span className="font-mono font-medium text-foreground">demo123</span>
                  </p>
                </div>
                <Button type="submit" variant="gradient" className="w-full">
                  {editItem ? 'Simpan Perubahan' : 'Tambah Admin'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="search-bar">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari admin..." className="pl-9" />
          </div>
        </div>

        {/* Admin cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(admin => (
            <div key={admin.id} className="stat-card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    {admin.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{admin.name}</h3>
                    <p className="text-xs text-muted-foreground">{admin.email}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { setEditItem(admin); setDialogOpen(true); }}>
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(admin.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                  <UserCog className="w-3 h-3 mr-1" /> Petugas Perpustakaan
                </Badge>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Belum ada admin terdaftar</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminManagement;
