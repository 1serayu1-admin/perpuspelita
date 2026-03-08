import { useState } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { useSchoolData } from '@/hooks/useSchoolData';
import { Plus, Edit, Trash2, School, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface DbClass {
  id: string;
  name: string;
  major: string;
  homeroom_teacher: string;
  student_count: number;
  school_id: string | null;
}

const Classes = () => {
  const { data: classes, loading, insert, update, remove } = useSchoolData<DbClass>('classes');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<DbClass | null>(null);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get('name') as string,
      major: form.get('major') as string,
      homeroom_teacher: form.get('homeroomTeacher') as string,
    };

    if (editItem) {
      const { error } = await update(editItem.id, payload);
      if (error) toast.error('Gagal memperbarui kelas');
      else toast.success('Kelas diperbarui');
    } else {
      const { error } = await insert(payload);
      if (error) toast.error('Gagal menambahkan kelas');
      else toast.success('Kelas ditambahkan');
    }
    setDialogOpen(false);
    setEditItem(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus kelas ini? Tindakan ini tidak dapat dibatalkan.')) return;
    const { error } = await remove(id);
    if (error) toast.error('Gagal menghapus kelas');
    else toast.success('Kelas dihapus');
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
                <div><label className="text-sm font-medium">Wali Kelas</label><Input name="homeroomTeacher" defaultValue={editItem?.homeroom_teacher} required /></div>
                <Button type="submit" className="w-full">Simpan</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-8">Memuat data...</div>
        ) : classes.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">Belum ada kelas.</div>
        ) : (
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
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Wali: {c.homeroom_teacher}</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {c.student_count} siswa</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Classes;
