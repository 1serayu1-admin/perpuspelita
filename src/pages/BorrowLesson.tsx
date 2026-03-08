import { useState } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { useSchoolData } from '@/hooks/useSchoolData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus, Clock, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { logActivity } from '@/hooks/useActivityLog';

const BorrowLesson = () => {
  const { user } = useAuth();
  const { data: borrowings, loading, insert } = useSchoolData<any>('borrowings');
  const { data: books } = useSchoolData<any>('books');
  const { data: students } = useSchoolData<any>('students');
  const { data: teachers } = useSchoolData<any>('teachers');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [customDuration, setCustomDuration] = useState(false);
  const [saving, setSaving] = useState(false);

  const lessonBorrowings = borrowings.filter((b: any) => b.type === 'lesson');
  const filtered = lessonBorrowings.filter((t: any) =>
    t.borrower_name.toLowerCase().includes(search.toLowerCase()) ||
    t.book_title.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const studentId = form.get('studentId') as string;
    const bookId = form.get('bookId') as string;
    const teacherId = form.get('teacherId') as string;
    const duration = parseInt(form.get('duration') as string);

    const student = students.find((s: any) => s.id === studentId);
    const book = books.find((b: any) => b.id === bookId);
    const teacher = teachers.find((t: any) => t.id === teacherId);
    const now = new Date();
    const due = new Date(now.getTime() + duration * 60000);

    const { error } = await insert({
      type: 'lesson',
      borrower_name: student?.name || '',
      borrower_id: student?.user_id || user?.id,
      book_id: bookId,
      book_title: book?.title || '',
      borrow_date: now.toISOString().split('T')[0],
      due_date: due.toISOString(),
      status: 'borrowed',
      class_name: student?.class_name || '',
      subject: teacher?.subject || '',
      teacher_name: teacher?.name || '',
      duration,
    } as any);

    if (error) {
      toast.error('Gagal mencatat peminjaman: ' + error.message);
    } else {
      // Decrement book available count
      if (book && book.available > 0) {
        await (supabase as any)
          .from('books')
          .update({ available: book.available - 1 })
          .eq('id', bookId);
      }
      toast.success(`Peminjaman dicatat. Batas: ${duration} menit`);
      logActivity('Peminjaman Pelajaran', `${student?.name} meminjam "${book?.title}" selama ${duration} menit (guru: ${teacher?.name})`, user?.name || '', user?.schoolId);
    }
    setSaving(false);
    setDialogOpen(false);
  };

  const statusColor = (s: string) => {
    if (s === 'borrowed') return 'bg-warning/10 text-warning border-warning/20';
    if (s === 'returned') return 'bg-success/10 text-success border-success/20';
    return 'bg-destructive/10 text-destructive border-destructive/20';
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-4">
        <div className="page-header">
          <div>
            <h1 className="page-title">Peminjaman Jam Pelajaran</h1>
            <p className="text-sm text-muted-foreground">Peminjaman siswa selama jam pelajaran</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Buat Peminjaman</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Peminjaman Jam Pelajaran</DialogTitle></DialogHeader>
              <form onSubmit={handleSave} className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Siswa</label>
                  <select name="studentId" className="w-full h-9 rounded-md border bg-background px-3 text-sm" required>
                    <option value="">-- Pilih siswa --</option>
                    {students.filter((s: any) => s.is_active).map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name} - {s.nis}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Buku</label>
                  <select name="bookId" className="w-full h-9 rounded-md border bg-background px-3 text-sm" required>
                    <option value="">-- Pilih buku --</option>
                    {books.filter((b: any) => b.available > 0).map((b: any) => (
                      <option key={b.id} value={b.id}>{b.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Guru Pengampu</label>
                  <select name="teacherId" className="w-full h-9 rounded-md border bg-background px-3 text-sm" required>
                    <option value="">-- Pilih guru --</option>
                    {teachers.filter((t: any) => t.is_active).map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name} - {t.subject}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Durasi</label>
                  {!customDuration ? (
                    <div className="space-y-2">
                      <select name="duration" className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                        <option value="30">30 menit</option>
                        <option value="45">45 menit</option>
                        <option value="60">60 menit</option>
                      </select>
                      <button type="button" onClick={() => setCustomDuration(true)} className="text-xs text-primary hover:underline">Custom durasi</button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input name="duration" type="number" min={10} max={240} defaultValue={45} placeholder="Durasi (menit)" />
                      <button type="button" onClick={() => setCustomDuration(false)} className="text-xs text-primary hover:underline">Pilih preset</button>
                    </div>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  <Clock className="w-4 h-4 mr-1" /> Catat Peminjaman
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="search-bar">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari transaksi..." className="pl-9" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="data-table-wrapper">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-medium text-muted-foreground">Siswa</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Kelas</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Buku</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Guru</th>
                    <th className="text-center p-3 font-medium text-muted-foreground">Durasi</th>
                    <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t: any) => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-medium text-foreground">{t.borrower_name}</td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground">{t.class_name}</td>
                      <td className="p-3 text-foreground">{t.book_title}</td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground">{t.teacher_name}</td>
                      <td className="p-3 text-center text-muted-foreground">{t.duration} mnt</td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(t.status)}`}>
                          {t.status === 'borrowed' ? 'Dipinjam' : t.status === 'returned' ? 'Dikembalikan' : 'Terlambat'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">
                      <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Belum ada peminjaman pelajaran</p>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default BorrowLesson;
