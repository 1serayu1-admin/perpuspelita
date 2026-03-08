import { useState } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { mockClasses } from '@/data/mockData';
import { SchoolClass } from '@/lib/types';
import { Plus, Edit, Trash2, School, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const Classes = () => {
  const [classes, setClasses] = useState<SchoolClass[]>(mockClasses);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<SchoolClass | null>(null);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data: SchoolClass = {
      id: editItem?.id || `cl${Date.now()}`,
      name: form.get('name') as string,
      major: form.get('major') as string,
      homeroomTeacher: form.get('homeroomTeacher') as string,
      studentCount: editItem?.studentCount || 0,
    };
    if (editItem) {
      setClasses(prev => prev.map(c => c.id === editItem.id ? data : c));
      toast.success('Kelas diperbarui');
    } else {
      setClasses(prev => [...prev, data]);
      toast.success('Kelas ditambahkan');
    }
    setDialogOpen(false);
    setEditItem(null);
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-4">
        <div className="page-header">
          <h1 className="page-title">Manajemen Kelas</h1>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditItem(null); }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Tambah Kelas</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editItem ? 'Edit Kelas' : 'Tambah Kelas'}</DialogTitle></DialogHeader>
              <form onSubmit={handleSave} className="space-y-3">
                <div><label className="text-sm font-medium">Nama Kelas</label><Input name="name" defaultValue={editItem?.name} placeholder="X IPA 1" required /></div>
                <div><label className="text-sm font-medium">Jurusan</label><Input name="major" defaultValue={editItem?.major} placeholder="IPA / IPS" required /></div>
                <div><label className="text-sm font-medium">Wali Kelas</label><Input name="homeroomTeacher" defaultValue={editItem?.homeroomTeacher} required /></div>
                <Button type="submit" className="w-full">Simpan</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(c => (
            <div key={c.id} className="stat-card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <School className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{c.name}</h3>
                    <Badge variant="outline" className="text-xs">{c.major}</Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { setEditItem(c); setDialogOpen(true); }}><Edit className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => { setClasses(prev => prev.filter(x => x.id !== c.id)); toast.success('Kelas dihapus'); }} className="text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Wali: {c.homeroomTeacher}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {c.studentCount} siswa</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Classes;
