import { useState } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { mockTeachers } from '@/data/mockData';
import { Teacher } from '@/lib/types';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const Teachers = () => {
  const [teachers, setTeachers] = useState<Teacher[]>(mockTeachers);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Teacher | null>(null);

  const filtered = teachers.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.nip.includes(search));

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data: Teacher = {
      id: editItem?.id || `t${Date.now()}`,
      name: form.get('name') as string,
      nip: form.get('nip') as string,
      subject: form.get('subject') as string,
      email: form.get('email') as string,
      isActive: true,
    };
    if (editItem) {
      setTeachers(prev => prev.map(t => t.id === editItem.id ? data : t));
      toast.success('Data guru diperbarui');
    } else {
      setTeachers(prev => [...prev, data]);
      toast.success('Guru ditambahkan');
    }
    setDialogOpen(false);
    setEditItem(null);
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-4">
        <div className="page-header">
          <h1 className="page-title">Manajemen Guru</h1>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditItem(null); }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Tambah Guru</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editItem ? 'Edit Guru' : 'Tambah Guru'}</DialogTitle></DialogHeader>
              <form onSubmit={handleSave} className="space-y-3">
                <div><label className="text-sm font-medium">Nama</label><Input name="name" defaultValue={editItem?.name} required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-sm font-medium">NIP</label><Input name="nip" defaultValue={editItem?.nip} required /></div>
                  <div><label className="text-sm font-medium">Mata Pelajaran</label><Input name="subject" defaultValue={editItem?.subject} required /></div>
                </div>
                <div><label className="text-sm font-medium">Email</label><Input name="email" type="email" defaultValue={editItem?.email} required /></div>
                <Button type="submit" className="w-full">Simpan</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="search-bar">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari guru..." className="pl-9" />
          </div>
        </div>

        <div className="data-table-wrapper">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Nama</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">NIP</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Mata Pelajaran</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Email</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-medium text-foreground">{t.name}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground font-mono text-xs">{t.nip}</td>
                    <td className="p-3"><Badge variant="outline" className="text-xs">{t.subject}</Badge></td>
                    <td className="p-3 hidden lg:table-cell text-muted-foreground">{t.email}</td>
                    <td className="p-3 text-center"><Badge variant={t.isActive ? 'default' : 'secondary'} className="text-xs">{t.isActive ? 'Aktif' : 'Nonaktif'}</Badge></td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditItem(t); setDialogOpen(true); }}><Edit className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => { setTeachers(prev => prev.filter(x => x.id !== t.id)); toast.success('Guru dihapus'); }} className="text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Teachers;
