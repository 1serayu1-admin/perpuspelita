import { useState } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSchoolData } from '@/hooks/useSchoolData';
import { Search, Plus, Edit, Trash2, CreditCard, CalendarDays, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CsvImportDialog } from '@/components/CsvImportDialog';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { MemberCard } from '@/components/MemberCard';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DbStudent {
  id: string;
  name: string;
  nis: string;
  class_id: string | null;
  major: string;
  email: string;
  is_active: boolean;
  membership_start: string | null;
  membership_end: string | null;
  school_id: string | null;
}

interface DbClass {
  id: string;
  name: string;
  major: string;
}

const Students = () => {
  const { data: students, loading, insert, update, remove } = useSchoolData<DbStudent>('students');
  const { data: classes } = useSchoolData<DbClass>('classes');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<DbStudent | null>(null);
  const [cardStudent, setCardStudent] = useState<DbStudent | null>(null);
  const [membershipDialogOpen, setMembershipDialogOpen] = useState(false);
  const [membershipTarget, setMembershipTarget] = useState<DbStudent | null>(null);
  const [memberStart, setMemberStart] = useState<Date>();
  const [memberEnd, setMemberEnd] = useState<Date>();
  const perPage = 8;

  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.nis.includes(search));
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const getClassName = (classId: string | null) => classes.find(c => c.id === classId)?.name || '-';
  const getClassMajor = (classId: string | null) => classes.find(c => c.id === classId)?.major || '';

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const classId = form.get('classId') as string;
    const cls = classes.find(c => c.id === classId);
    const payload = {
      name: form.get('name') as string,
      nis: form.get('nis') as string,
      class_id: classId || null,
      major: cls?.major || '',
      email: form.get('email') as string,
    };

    if (editItem) {
      const { error } = await update(editItem.id, payload);
      if (error) toast.error('Gagal memperbarui siswa');
      else toast.success('Data siswa diperbarui');
    } else {
      const { error } = await insert(payload);
      if (error) toast.error('Gagal menambahkan siswa');
      else toast.success('Siswa ditambahkan');
    }
    setDialogOpen(false);
    setEditItem(null);
  };

  const toggleActive = async (s: DbStudent) => {
    const { error } = await update(s.id, { is_active: !s.is_active });
    if (error) toast.error('Gagal mengubah status');
    else toast.success(s.is_active ? 'Keanggotaan dinonaktifkan' : 'Keanggotaan diaktifkan');
  };

  const handleDelete = async (id: string) => {
    const { error } = await remove(id);
    if (error) toast.error('Gagal menghapus siswa');
    else toast.success('Siswa dihapus');
  };

  const openMembershipDialog = (s: DbStudent) => {
    setMembershipTarget(s);
    setMemberStart(s.membership_start ? new Date(s.membership_start) : undefined);
    setMemberEnd(s.membership_end ? new Date(s.membership_end) : undefined);
    setMembershipDialogOpen(true);
  };

  const saveMembership = async () => {
    if (!membershipTarget) return;
    const { error } = await update(membershipTarget.id, {
      membership_start: memberStart ? format(memberStart, 'yyyy-MM-dd') : null,
      membership_end: memberEnd ? format(memberEnd, 'yyyy-MM-dd') : null,
      is_active: true,
    });
    if (error) toast.error('Gagal menyimpan');
    else toast.success('Periode keanggotaan diperbarui');
    setMembershipDialogOpen(false);
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-4">
        <div className="page-header">
          <h1 className="page-title">Manajemen Siswa</h1>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditItem(null); }}>
            <DialogTrigger asChild><Button size="sm" variant="gradient"><Plus className="w-4 h-4 mr-1" /> Tambah Siswa</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editItem ? 'Edit Siswa' : 'Tambah Siswa'}</DialogTitle></DialogHeader>
              <form onSubmit={handleSave} className="space-y-3">
                <div><label className="text-sm font-medium">Nama</label><Input name="name" defaultValue={editItem?.name} required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-sm font-medium">NIS</label><Input name="nis" defaultValue={editItem?.nis} required /></div>
                  <div>
                    <label className="text-sm font-medium">Kelas</label>
                    <select name="classId" defaultValue={editItem?.class_id || ''} className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                      <option value="">Pilih Kelas</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div><label className="text-sm font-medium">Email</label><Input name="email" type="email" defaultValue={editItem?.email} required /></div>
                <Button type="submit" variant="gradient" className="w-full">Simpan</Button>
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

        {loading ? (
          <div className="text-center text-muted-foreground py-8">Memuat data...</div>
        ) : (
          <div className="data-table-wrapper">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-medium text-muted-foreground">Nama</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">NIS</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Kelas</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Email</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Periode</th>
                    <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Belum ada data siswa.</td></tr>
                  ) : paginated.map(s => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-medium text-foreground">{s.name}</td>
                      <td className="p-3 text-muted-foreground font-mono text-xs">{s.nis}</td>
                      <td className="p-3 hidden md:table-cell"><Badge variant="outline" className="text-xs">{getClassName(s.class_id)}</Badge></td>
                      <td className="p-3 hidden lg:table-cell text-muted-foreground">{s.email}</td>
                      <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground">
                        {s.membership_start && s.membership_end ? (
                          <span>{s.membership_start} — {s.membership_end}</span>
                        ) : (
                          <span className="text-muted-foreground/50">Belum diatur</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch checked={s.is_active} onCheckedChange={() => toggleActive(s)} />
                          <span className={`text-xs font-medium ${s.is_active ? 'text-success' : 'text-muted-foreground'}`}>
                            {s.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setCardStudent(s)} title="Cetak Kartu">
                            <CreditCard className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openMembershipDialog(s)} title="Atur Keanggotaan">
                            <CalendarDays className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setEditItem(s); setDialogOpen(true); }}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
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
        )}

        {/* Member Card Dialog */}
        {cardStudent && (
          <MemberCard
            open={!!cardStudent}
            onOpenChange={(o) => { if (!o) setCardStudent(null); }}
            name={cardStudent.name}
            id={cardStudent.nis}
            role="Siswa"
            detail={getClassName(cardStudent.class_id)}
            email={cardStudent.email}
            membershipStart={cardStudent.membership_start || undefined}
            membershipEnd={cardStudent.membership_end || undefined}
            isActive={cardStudent.is_active}
          />
        )}

        {/* Membership Period Dialog */}
        <Dialog open={membershipDialogOpen} onOpenChange={setMembershipDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                Atur Keanggotaan — {membershipTarget?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">Tanggal Mulai</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !memberStart && "text-muted-foreground")}>
                      <CalendarDays className="w-4 h-4 mr-2" />
                      {memberStart ? format(memberStart, 'dd MMMM yyyy') : 'Pilih tanggal mulai'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={memberStart} onSelect={setMemberStart} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Tanggal Berakhir</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !memberEnd && "text-muted-foreground")}>
                      <CalendarDays className="w-4 h-4 mr-2" />
                      {memberEnd ? format(memberEnd, 'dd MMMM yyyy') : 'Pilih tanggal berakhir'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={memberEnd} onSelect={setMemberEnd} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
              <Button variant="gradient" onClick={saveMembership} className="w-full">
                Simpan Periode Keanggotaan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Students;
