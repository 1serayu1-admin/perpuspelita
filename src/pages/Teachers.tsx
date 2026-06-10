import { useState } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSchoolData } from '@/hooks/useSchoolData';
import { getSupabase } from '@/integrations/supabase/client';
import { Search, Plus, Edit, Trash2, CreditCard, CalendarDays, Upload, Download } from 'lucide-react';
import { teacherSchema } from '@/lib/validation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CsvImportDialog } from '@/components/CsvImportDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { BulkSelectionToolbar } from '@/components/BulkSelectionToolbar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { batchInsertRecords } from '@/lib/batchImport';
import { createUser } from '@/services/authService';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { toast } from 'sonner';
import { MemberCard } from '@/components/MemberCard';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

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
  const { user } = useAuth();
  const { data: teachers, loading, insert, update, remove, removeMany, refetch } = useSchoolData<DbTeacher>('teachers');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<DbTeacher | null>(null);
  const [cardTeacher, setCardTeacher] = useState<DbTeacher | null>(null);
  const [membershipDialogOpen, setMembershipDialogOpen] = useState(false);
  const [membershipTarget, setMembershipTarget] = useState<DbTeacher | null>(null);
  const [memberStart, setMemberStart] = useState<Date>();
  const [memberEnd, setMemberEnd] = useState<Date>();
  const [csvOpen, setCsvOpen] = useState(false);

  const [page, setPage] = useState(1);
  const perPage = 8;

  const filtered = teachers.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.nip.includes(search));
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const selection = useBulkSelection(paginated.map((teacher) => teacher.id));
  const toEmailLocalPart = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '') || 'guru';
  const parseActiveStatus = (value: string) => !['inactive', 'nonaktif', '0', 'false'].includes(value.trim().toLowerCase());

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get('name') as string,
      nip: form.get('nip') as string,
      subject: form.get('subject') as string,
      email: form.get('email') as string,
    };

    const result = teacherSchema.safeParse(payload);
    if (!result.success) {
      const firstError = result.error.errors[0]?.message || 'Data tidak valid';
      toast.error(firstError);
      return;
    }

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
    const newStatus = !t.is_active;
    
    const { error } = await update(t.id, { is_active: newStatus });
    
    if (error) {
      toast.error('Gagal mengubah status');
      refetch();
    } else {
      toast.success(newStatus ? 'Keanggotaan diaktifkan' : 'Keanggotaan dinonaktifkan');
    }
  };

  const handleExportCredentials = async () => {
    if (teachers.length === 0) {
      toast.error('Tidak ada data guru untuk diexport');
      return;
    }

    try {
      const credentials = teachers.map((teacher, index) => {
        const email = teacher.nip;
        const password = teacher.nip;

        return {
          No: index + 1,
          Nama: teacher.name,
          NIP: teacher.nip,
          Email: email,
          Password: password,
          Status: teacher.is_active ? 'Aktif' : 'Nonaktif'
        };
      });

      const ws = XLSX.utils.json_to_sheet(credentials);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Credentials');
      XLSX.writeFile(wb, `guru_credentials_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success(`Credentials ${credentials.length} guru berhasil diexport!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Gagal export credentials');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus guru ini? Tindakan ini tidak dapat dibatalkan.')) return;
    const { error } = await remove(id);
    if (error) toast.error('Gagal menghapus guru');
    else toast.success('Guru dihapus');
  };

  const handleBulkDelete = async () => {
    if (selection.selectedIds.length === 0) return;
    if (!window.confirm(`Hapus ${selection.selectedIds.length} guru terpilih?`)) return;

    const { error } = await removeMany(selection.selectedIds);
    if (error) toast.error('Gagal menghapus data guru terpilih');
    else {
      toast.success(`${selection.selectedIds.length} guru berhasil dihapus`);
      selection.clear();
    }
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

  // Check for duplicate NIP/name in database
  const checkDuplicates = async (names: string[]) => {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data: existing } = await supabase
      .from('teachers')
      .select('id, name, nip')
      .in('name', names);
    return existing || [];
  };

  // Delete teachers by name
  const deleteTeachersByName = async (names: string[]) => {
    const supabase = getSupabase();
    if (!supabase) {
      toast.error('Database connection failed');
      return false;
    }
    const { error } = await supabase
      .from('teachers')
      .delete()
      .in('name', names);
    if (error) {
      toast.error('Gagal menghapus data: ' + error.message);
      return false;
    }
    toast.success(`${names.length} data lama berhasil dihapus`);
    await refetch();
    return true;
  };

  const handleCsvImport = async (
    rows: Record<string, string>[],
    options?: { onProgress?: (progress: { current: number; total: number }) => void }
  ) => {
    let failed = 0;
    const namesList: string[] = [];

    const payloads = rows.reduce<Record<string, any>[]>((result, row) => {
      // Support multiple column name variations (termasuk format CSV 'data guru perpus.csv': No, Nama, NIK)
      const name = String(row['name'] || row['nama'] || row['Nama'] || row['NAMA'] || '').trim();
      const nip = String(row['nip'] || row['NIP'] || row['nik'] || row['NIK'] || row['No'] || row['NO'] || '').trim();
      const subject = String(row['subject'] || row['mata_pelajaran'] || row['mata pelajaran'] || row['Subject'] || row['SUBJECT'] || '-').trim();

      if (!name) {
        failed++;
        return result;
      }

      // Generate email from name if not provided
      const email = String(row['email'] || row['Email'] || '').trim() || `${toEmailLocalPart(nip || name)}@local.app`;

      result.push({
        name,
        nip: nip || '-', // Use '-' if no NIP
        subject: subject || '-', // Use '-' if no subject
        email,
        is_active: parseActiveStatus(String(row['status'] || 'active')),
        ...(user?.schoolId ? { school_id: user.schoolId } : {}),
      });
      
      namesList.push(name);
      return result;
    }, []);

    // Check for duplicates
    const duplicates = await checkDuplicates(namesList);
    if (duplicates.length > 0) {
      const duplicateNames = duplicates.map(d => d.name).join(', ');
      const confirmDelete = window.confirm(
        `Ditemukan ${duplicates.length} data dengan nama yang sama:\n${duplicateNames}\n\n` +
        `Apakah Anda ingin menghapus data lama dan mengganti dengan data baru?\n\n` +
        `Klik "OK" untuk hapus data lama dan import ulang.\n` +
        `Klik "Cancel" untuk membatalkan import.`
      );
      
      if (!confirmDelete) {
        toast.info('Import dibatalkan. Tidak ada data yang diubah.');
        return { success: 0, failed: payloads.length };
      }

      // Delete duplicates
      const deleted = await deleteTeachersByName(duplicates.map(d => d.name));
      if (!deleted) {
        return { success: 0, failed: payloads.length };
      }
    }

    const result = await batchInsertRecords({
      table: 'teachers',
      rows: payloads,
      onProgress: options?.onProgress,
    });

    // AUTO-CREATE USER ACCOUNTS for each imported teacher
    // Login: NIP/NIP (gunakan NIP sebagai username & password)
    let usersCreated = 0;
    for (const payload of payloads) {
      if (payload.nip && payload.nip !== '-') {
        try {
          // Check if user already exists
          const existingUsers = JSON.parse(localStorage.getItem('perpuspelita_dynamic_users') || '[]');
          const alreadyExists = existingUsers.find((u: any) => u.email === payload.nip);
          
          if (!alreadyExists) {
            createUser({
              email: payload.nip, // Use NIP as username/email
              password: payload.nip, // Use NIP as password too
              name: payload.name,
              role: 'guru',
              schoolId: null,
            });
            usersCreated++;
          }
        } catch (err) {
          console.error('Failed to create user for teacher:', payload.name, err);
        }
      }
    }

    console.log('Import result:', result);
    await refetch();
    console.log('Refetch completed');
    
    // Force refresh after short delay to ensure data displays
    setTimeout(() => {
      console.log('Forcing data refresh...');
      refetch();
    }, 1000);
    
    if (usersCreated > 0) {
      toast.success(`Import selesai! ${result.success} guru masuk database, ${usersCreated} akun login dibuat (NIP/NIP)`);
    } else {
      toast.success(`Import selesai: ${result.success} guru masuk database`);
    }
    
    return { success: result.success, failed: result.failed + failed };
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
            <Button size="sm" variant="outline" onClick={handleExportCredentials}>
              <Download className="w-4 h-4 mr-1" /> Export Credentials
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
            <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Cari guru..." className="pl-9" />
          </div>
        </div>

        <BulkSelectionToolbar
          selectedCount={selection.selectedIds.length}
          totalCount={paginated.length}
          allSelected={selection.allSelected}
          partiallySelected={selection.partiallySelected}
          onToggleAll={selection.toggleAll}
          onDelete={handleBulkDelete}
          selectionLabel="Pilih semua data guru di halaman ini"
        />

        {loading ? (
          <div className="text-center text-muted-foreground py-8">Memuat data...</div>
        ) : (
          <div className="data-table-wrapper">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="p-3 text-center font-medium text-muted-foreground">
                      <Checkbox
                        checked={selection.allSelected ? true : selection.partiallySelected ? 'indeterminate' : false}
                        onCheckedChange={(checked) => selection.toggleAll(checked === true)}
                        aria-label="Pilih semua guru"
                      />
                    </th>
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
                  {paginated.length === 0 ? (
                    <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Belum ada data guru.</td></tr>
                  ) : paginated.map(t => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="p-3 text-center">
                        <Checkbox checked={selection.isSelected(t.id)} onCheckedChange={() => selection.toggleOne(t.id)} aria-label={`Pilih ${t.name}`} />
                      </td>
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
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-3 border-t">
                <p className="text-xs text-muted-foreground">{filtered.length} guru</p>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => (
                    <Button key={i} variant={page === i + 1 ? 'default' : 'outline'} size="sm" className="w-8 h-8 p-0" onClick={() => setPage(i + 1)}>{i + 1}</Button>
                  ))}
                  {totalPages > 10 && <span className="text-xs text-muted-foreground self-center px-1">...</span>}
                </div>
              </div>
            )}
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
            { key: 'id', label: 'ID', sample: '1' },
            { key: 'nip', label: 'NIP/NIK', required: true, aliases: ['nik', 'NIK', 'No', 'NO'], sample: '2001' },
            { key: 'name', label: 'Name/Nama', required: true, aliases: ['nama', 'Nama', 'NAMA'], sample: 'Guru 1' },
            { key: 'subject', label: 'Subject', aliases: ['mata_pelajaran', 'mata pelajaran', 'Subject', 'SUBJECT'], sample: '-' },
            { key: 'status', label: 'Status', sample: 'active' },
            { key: 'email', label: 'Email', sample: 'guru2001@dummy.local' },
          ]}
          onImport={handleCsvImport}
          templateFilename="template-guru.csv"
        />
      </div>
    </AppLayout>
  );
};

export default Teachers;
