import { useState } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { mockStudents, mockClasses } from '@/data/mockData';
import { Student } from '@/lib/types';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const Students = () => {
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Student | null>(null);
  const perPage = 8;

  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.nis.includes(search));
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const classId = form.get('classId') as string;
    const cls = mockClasses.find(c => c.id === classId);
    const data: Student = {
      id: editItem?.id || `s${Date.now()}`,
      name: form.get('name') as string,
      nis: form.get('nis') as string,
      classId,
      className: cls?.name,
      major: cls?.major || '',
      email: form.get('email') as string,
      isActive: true,
    };
    if (editItem) {
      setStudents(prev => prev.map(s => s.id === editItem.id ? data : s));
      toast.success('Data siswa diperbarui');
    } else {
      setStudents(prev => [...prev, data]);
      toast.success('Siswa ditambahkan');
    }
    setDialogOpen(false);
    setEditItem(null);
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-4">
        <div className="page-header">
          <h1 className="page-title">Manajemen Siswa</h1>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditItem(null); }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Tambah Siswa</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editItem ? 'Edit Siswa' : 'Tambah Siswa'}</DialogTitle></DialogHeader>
              <form onSubmit={handleSave} className="space-y-3">
                <div><label className="text-sm font-medium">Nama</label><Input name="name" defaultValue={editItem?.name} required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-sm font-medium">NIS</label><Input name="nis" defaultValue={editItem?.nis} required /></div>
                  <div>
                    <label className="text-sm font-medium">Kelas</label>
                    <select name="classId" defaultValue={editItem?.classId || 'cl1'} className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                      {mockClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
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
            <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Cari siswa..." className="pl-9" />
          </div>
        </div>

        <div className="data-table-wrapper">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Nama</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">NIS</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Kelas</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Email</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(s => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-medium text-foreground">{s.name}</td>
                    <td className="p-3 text-muted-foreground font-mono text-xs">{s.nis}</td>
                    <td className="p-3 hidden md:table-cell"><Badge variant="outline" className="text-xs">{s.className}</Badge></td>
                    <td className="p-3 hidden lg:table-cell text-muted-foreground">{s.email}</td>
                    <td className="p-3 text-center">
                      <Badge variant={s.isActive ? 'default' : 'secondary'} className="text-xs">{s.isActive ? 'Aktif' : 'Nonaktif'}</Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditItem(s); setDialogOpen(true); }}><Edit className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => { setStudents(prev => prev.filter(x => x.id !== s.id)); toast.success('Siswa dihapus'); }} className="text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t">
              <p className="text-xs text-muted-foreground">{filtered.length} siswa</p>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => (
                  <Button key={i} variant={page === i + 1 ? 'default' : 'outline'} size="sm" className="w-8 h-8 p-0" onClick={() => setPage(i + 1)}>{i + 1}</Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Students;
