import { useState } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { mockCategories } from '@/data/mockData';
import { Category } from '@/lib/types';
import { Plus, Edit, Trash2, FolderTree } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data: Category = {
      id: editCat?.id || `c${Date.now()}`,
      name: form.get('name') as string,
      description: form.get('description') as string,
      bookCount: editCat?.bookCount || 0,
    };
    if (editCat) {
      setCategories(prev => prev.map(c => c.id === editCat.id ? data : c));
      toast.success('Kategori diperbarui');
    } else {
      setCategories(prev => [...prev, data]);
      toast.success('Kategori ditambahkan');
    }
    setDialogOpen(false);
    setEditCat(null);
  };

  const handleDelete = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    toast.success('Kategori dihapus');
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
                <div><label className="text-sm font-medium">Deskripsi</label><Input name="description" defaultValue={editCat?.description} /></div>
                <Button type="submit" className="w-full">Simpan</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(c => (
            <div key={c.id} className="stat-card flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FolderTree className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{c.name}</h3>
                  <p className="text-xs text-muted-foreground">{c.description}</p>
                  <p className="text-xs text-primary font-medium mt-1">{c.bookCount} buku</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => { setEditCat(c); setDialogOpen(true); }}><Edit className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Categories;
