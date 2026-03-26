import { useState } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSchoolData } from '@/hooks/useSchoolData';
import { Plus, Edit, Trash2, School, Users, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { BulkSelectionToolbar } from '@/components/BulkSelectionToolbar';
import { CsvImportDialog } from '@/components/CsvImportDialog';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { batchInsertRecords } from '@/lib/batchImport';
import { useBulkSelection } from '@/hooks/useBulkSelection';
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
  const { user } = useAuth();
  const { data: classes, loading, insert, update, remove, removeMany, refetch } = useSchoolData<DbClass>('classes');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<DbClass | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);
  const selection = useBulkSelection(classes.map((classItem) => classItem.id));

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

  const handleBulkDelete = async () => {
    if (selection.selectedIds.length === 0) return;
    if (!window.confirm(`Hapus ${selection.selectedIds.length} kelas terpilih?`)) return;

    const { error } = await removeMany(selection.selectedIds);
    if (error) toast.error('Gagal menghapus kelas terpilih');
    else {
      toast.success(`${selection.selectedIds.length} kelas berhasil dihapus`);
      selection.clear();
    }
  };

  const handleCsvImport = async (
    rows: Record<string, string>[],
    options?: { onProgress?: (progress: { current: number; total: number }) => void }
  ) => {
    let failed = 0;

    const payloads = rows.reduce<Record<string, any>[]>((result, row) => {
      const name = String(row['name'] || '').trim();
      const major = String(row['major'] || '').trim();
      const homeroomTeacher = String(row['homeroom_teacher'] || row['wali_kelas'] || row['homeroomTeacher'] || '').trim();

      if (!name || !major || !homeroomTeacher) {
        failed++;
        return result;
      }

      result.push({
        name,
        major,
        homeroom_teacher: homeroomTeacher,
        ...(user?.schoolId ? { school_id: user.schoolId } : {}),
      });

      return result;
    }, []);

    const result = await batchInsertRecords({
      table: 'classes',
      rows: payloads,
      onProgress: options?.onProgress,
    });

    await refetch();
    return { success: result.success, failed: result.failed + failed };
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-4">
        <div className="page-header">
          <h1 className="page-title">Manajemen Kelas</h1>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setCsvOpen(true)}>
              <Upload className="w-4 h-4 mr-1" /> Import CSV
            </Button>
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
        </div>

        <BulkSelectionToolbar
          selectedCount={selection.selectedIds.length}
          totalCount={classes.length}
          allSelected={selection.allSelected}
          partiallySelected={selection.partiallySelected}
          onToggleAll={selection.toggleAll}
          onDelete={handleBulkDelete}
          selectionLabel="Pilih semua data kelas"
        />

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
                  <div className="flex items-center gap-1">
                    <Checkbox checked={selection.isSelected(c.id)} onCheckedChange={() => selection.toggleOne(c.id)} aria-label={`Pilih ${c.name}`} />
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

        <CsvImportDialog
          open={csvOpen}
          onOpenChange={setCsvOpen}
          title="Import Kelas dari CSV"
          columns={[
            { key: 'id', label: 'ID', sample: '1' },
            { key: 'name', label: 'Name', required: true, sample: 'Kelas 1' },
            { key: 'major', label: 'Major', required: true, sample: 'IPA' },
            { key: 'homeroom_teacher', label: 'Homeroom Teacher', required: true, aliases: ['wali_kelas', 'homeroomTeacher'], sample: 'Guru 1' },
          ]}
          onImport={handleCsvImport}
          templateFilename="template-kelas-dummy.csv"
        />
      </div>
    </AppLayout>
  );
};

export default Classes;
