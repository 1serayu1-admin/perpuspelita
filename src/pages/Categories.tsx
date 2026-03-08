import { useState } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { useSchoolData } from '@/hooks/useSchoolData';
import { Plus, Edit, Trash2, FolderTree } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface DbCategory {
  id: string;
  name: string;
  description: string | null;
  school_id: string | null;
}

const Categories = () => {
  const { data: categories, loading, insert, update, remove } = useSchoolData<DbCategory>('categories');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCat, setEditCat] = useState<DbCategory | null>(null);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get('name') as string,
      description: form.get('description') as string || null,
    };

    if (editCat) {
      const { error } = await update(editCat.id, payload);
      if (error) toast.error('Gagal memperbarui kategori');
      else toast.success('Kategori diperbarui');
    } else {
      const { error } = await insert(payload);
      if (error) toast.error('Gagal menambahkan kategori');
      else toast.success('Kategori ditambahkan');
    }
    setDialogOpen(false);
    setEditCat(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus kategori ini? Buku yang terkait akan kehilangan kategorinya.')) return;
    const { error } = await remove(id);
    if (error) toast.error('Gagal menghapus kategori');
    else toast.success('Kategori dihapus');
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-4">
        <div className="page-header">
          <h1 className="page-title">Kategori Buku</h1>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditCat(null); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Tambah Kategori</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editCat ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle></DialogHeader>
              <form onSubmit={handleSave} className="space-y-3">
                <div><label className="text-sm font-medium">Nama Kategori</label><Input name="name" defaultValue={editCat?.name} required /></div>
                <div><label className="text-sm font-medium">Deskripsi</label><Input name="description" defaultValue={editCat?.description || ''} /></div>
                <Button type="submit" className="w-full">Simpan</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-8">Memuat data...</div>
        ) : categories.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">Belum ada kategori. Klik "Tambah Kategori" untuk memulai.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(c => (
              <div key={c.id} className="stat-card flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FolderTree className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{c.name}</h3>
                    <p className="text-xs text-muted-foreground">{c.description || 'Tidak ada deskripsi'}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { setEditCat(c); setDialogOpen(true); }}><Edit className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Categories;
