import { useState } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
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

interface DbTeacher {
  id: string;
  name: string;
  nip: string;
  subject: string;
  email: string;
  is_active: boolean;
  membership_start: string | null;
  membership_end: string | null;
  school_id: string | null;
}

const Teachers = () => {
  const { data: teachers, loading, insert, update, remove } = useSchoolData<DbTeacher>('teachers');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<DbTeacher | null>(null);
  const [cardTeacher, setCardTeacher] = useState<DbTeacher | null>(null);
  const [membershipDialogOpen, setMembershipDialogOpen] = useState(false);
  const [membershipTarget, setMembershipTarget] = useState<DbTeacher | null>(null);
  const [memberStart, setMemberStart] = useState<Date>();
  const [memberEnd, setMemberEnd] = useState<Date>();
  const [csvOpen, setCsvOpen] = useState(false);

  const filtered = teachers.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.nip.includes(search));

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get('name') as string,
      nip: form.get('nip') as string,
      subject: form.get('subject') as string,
      email: form.get('email') as string,
    };

    if (editItem) {
      const { error } = await update(editItem.id, payload);
      if (error) toast.error('Gagal memperbarui guru');
      else toast.success('Data guru diperbarui');
    } else {
      const { error } = await insert(payload);
      if (error) toast.error('Gagal menambahkan guru');
      else toast.success('Guru ditambahkan');
    }
    setDialogOpen(false);
    setEditItem(null);
  };

  const toggleActive = async (t: DbTeacher) => {
    const { error } = await update(t.id, { is_active: !t.is_active });
    if (error) toast.error('Gagal mengubah status');
    else toast.success(t.is_active ? 'Keanggotaan dinonaktifkan' : 'Keanggotaan diaktifkan');
  };

  const handleDelete = async (id: string) => {
    const { error } = await remove(id);
    if (error) toast.error('Gagal menghapus guru');
    else toast.success('Guru dihapus');
  };

  const openMembershipDialog = (t: DbTeacher) => {
    setMembershipTarget(t);
    setMemberStart(t.membership_start ? new Date(t.membership_start) : undefined);
    setMemberEnd(t.membership_end ? new Date(t.membership_end) : undefined);
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

  const handleCsvImport = async (rows: Record<string, string>[]) => {
    let success = 0, failed = 0;
    for (const row of rows) {
      const name = row['nama'] || row['name'] || '';
      const nip = row['nip'] || '';
      const subject = row['mata pelajaran'] || row['subject'] || '';
      const email = row['email'] || '';
      if (!name) { failed++; continue; }
      const { error } = await insert({ name, nip, subject, email });
      if (error) failed++; else success++;
    }
    return { success, failed };
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-4">
        <div className="page-header">
          <h1 className="page-title">Manajemen Guru</h1>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setCsvOpen(true)}>
              <Upload className="w-4 h-4 mr-1" /> Import CSV
            </Button>
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditItem(null); }}>
              <DialogTrigger asChild><Button size="sm" variant="gradient"><Plus className="w-4 h-4 mr-1" /> Tambah Guru</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editItem ? 'Edit Guru' : 'Tambah Guru'}</DialogTitle></DialogHeader>
              <form onSubmit={handleSave} className="space-y-3">
                <div><label className="text-sm font-medium">Nama</label><Input name="name" defaultValue={editItem?.name} required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-sm font-medium">NIP</label><Input name="nip" defaultValue={editItem?.nip} required /></div>
                  <div><label className="text-sm font-medium">Mata Pelajaran</label><Input name="subject" defaultValue={editItem?.subject} required /></div>
                </div>
                <div><label className="text-sm font-medium">Email</label><Input name="email" type="email" defaultValue={editItem?.email} required /></div>
                <Button type="submit" variant="gradient" className="w-full">Simpan</Button>
              </form>
            </DialogContent>
           </Dialog>
          </div>
        </div>

        <div className="search-bar">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari guru..." className="pl-9" />
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
                    <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">NIP</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Mata Pelajaran</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Email</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Periode</th>
                    <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Belum ada data guru.</td></tr>
                  ) : filtered.map(t => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-medium text-foreground">{t.name}</td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground font-mono text-xs">{t.nip}</td>
                      <td className="p-3"><Badge variant="outline" className="text-xs">{t.subject}</Badge></td>
                      <td className="p-3 hidden lg:table-cell text-muted-foreground">{t.email}</td>
                      <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground">
                        {t.membership_start && t.membership_end ? (
                          <span>{t.membership_start} — {t.membership_end}</span>
                        ) : (
                          <span className="text-muted-foreground/50">Belum diatur</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch checked={t.is_active} onCheckedChange={() => toggleActive(t)} />
                          <span className={`text-xs font-medium ${t.is_active ? 'text-success' : 'text-muted-foreground'}`}>
                            {t.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setCardTeacher(t)} title="Cetak Kartu">
                            <CreditCard className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openMembershipDialog(t)} title="Atur Keanggotaan">
                            <CalendarDays className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setEditItem(t); setDialogOpen(true); }}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Member Card Dialog */}
        {cardTeacher && (
          <MemberCard
            open={!!cardTeacher}
            onOpenChange={(o) => { if (!o) setCardTeacher(null); }}
            name={cardTeacher.name}
            id={cardTeacher.nip}
            role="Guru"
            detail={cardTeacher.subject}
            email={cardTeacher.email}
            membershipStart={cardTeacher.membership_start || undefined}
            membershipEnd={cardTeacher.membership_end || undefined}
            isActive={cardTeacher.is_active}
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

        <CsvImportDialog
          open={csvOpen}
          onOpenChange={setCsvOpen}
          title="Import Guru dari CSV"
          columns={[
            { key: 'nama', label: 'Nama', required: true },
            { key: 'nip', label: 'NIP' },
            { key: 'mata pelajaran', label: 'Mata Pelajaran' },
            { key: 'email', label: 'Email' },
          ]}
          onImport={handleCsvImport}
          templateFilename="template-guru.csv"
        />
      </div>
    </AppLayout>
  );
};

export default Teachers;
