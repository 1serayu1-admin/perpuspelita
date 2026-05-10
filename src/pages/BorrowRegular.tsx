import { useState } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { useSchoolData } from '@/hooks/useSchoolData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus, BookCopy, Loader2, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CsvImportDialog } from '@/components/CsvImportDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { logActivity } from '@/hooks/useActivityLog';

const BorrowRegular = () => {
  const { user } = useAuth();
  const { data: borrowings, loading, insert, refetch } = useSchoolData<any>('borrowings');
  const { data: books, refetch: refetchBooks } = useSchoolData<any>('books');
  const { data: students } = useSchoolData<any>('students');
  const { data: teachers } = useSchoolData<any>('teachers');
  const { data: classes } = useSchoolData<any>('classes');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 20;

  const regularBorrowings = borrowings.filter((b: any) => b.type === 'regular');
  const filtered = regularBorrowings.filter((t: any) =>
    t.borrower_name.toLowerCase().includes(search.toLowerCase()) ||
    t.book_title.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const waitForPaint = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  const resolveBook = (rawBookId: string) => {
    const normalized = rawBookId.trim();
    return books.find((book: any) => book.isbn === `Sample ${normalized}` || String(book.title || '').includes(`#${normalized}`));
  };

  const resolveTeacher = (rawTeacherId: string) => {
    const parsed = Number.parseInt(rawTeacherId, 10);
    if (Number.isNaN(parsed)) return undefined;
    const nip = String(2000 + parsed);
    return teachers.find((teacher: any) => teacher.nip === nip || teacher.name.toLowerCase() === `guru ${parsed}`);
  };

  const resolveStudent = (rawStudentId: string) => {
    const parsed = Number.parseInt(rawStudentId, 10);
    if (Number.isNaN(parsed)) return undefined;
    const nis = String(1000 + parsed);
    return students.find((student: any) => student.nis === nis || student.name.toLowerCase() === `siswa ${parsed}`);
  };

  const resolveClassName = (student: any) => classes.find((classItem: any) => classItem.id === student?.class_id)?.name || '';

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const bookId = form.get('bookId') as string;
    const teacherId = form.get('teacherId') as string;
    const days = parseInt(form.get('days') as string);

    const book = books.find((b: any) => b.id === bookId);
    const teacher = teachers.find((t: any) => t.id === teacherId);

    if (!teacher) {
      toast.error('Guru tidak ditemukan.');
      setSaving(false);
      return;
    }
    if (!teacher.user_id) {
      toast.error(`Guru "${teacher.name}" belum memiliki akun sistem. Hubungi admin untuk membuat akun terlebih dahulu.`);
      setSaving(false);
      return;
    }

    // Atomic decrement - prevents race condition
    const { data: decremented } = await supabase.rpc('decrement_book_available', { _book_id: bookId });
    if (!decremented) {
      toast.error('Stok buku sudah habis');
      setSaving(false);
      return;
    }

    const borrowDate = new Date().toISOString().split('T')[0];
    const due = new Date();
    due.setDate(due.getDate() + days);

    const { error } = await insert({
      type: 'regular',
      borrower_name: teacher.name,
      borrower_id: teacher.user_id,
      book_id: bookId,
      book_title: book?.title || '',
      borrow_date: borrowDate,
      due_date: due.toISOString().split('T')[0],
      status: 'borrowed',
      duration: days,
    } as any);

    if (error) {
      toast.error('Gagal mencatat peminjaman: ' + error.message);
      // Rollback stock
      await supabase.rpc('increment_book_available', { _book_id: bookId });
    } else {
      toast.success('Peminjaman berhasil dicatat');
      logActivity('Peminjaman Reguler', `${teacher?.name} meminjam "${book?.title}" selama ${days} hari`, user?.name || '', user?.schoolId);
      await refetchBooks();
    }
    setSaving(false);
    setDialogOpen(false);
  };

  const statusColor = (s: string) => {
    if (s === 'borrowed') return 'bg-warning/10 text-warning border-warning/20';
    if (s === 'returned') return 'bg-success/10 text-success border-success/20';
    return 'bg-destructive/10 text-destructive border-destructive/20';
  };

  const handleCsvImport = async (
    rows: Record<string, string>[],
    options?: { onProgress?: (progress: { current: number; total: number }) => void }
  ) => {
    let success = 0;
    let failed = 0;
    const activeBorrowCounts = new Map<string, number>();
    const payloads = rows.reduce<any[]>((result, row) => {
      const userType = String(row['user_type'] || '').trim().toLowerCase();
      const rawUserId = String(row['user_id'] || '').trim();
      const rawBookId = String(row['book_id'] || '').trim();
      const borrowDate = String(row['borrow_date'] || '').trim();
      const rawReturnDate = String(row['return_date'] || '').trim();
      const status = String(row['status'] || 'borrowed').trim().toLowerCase() === 'returned' ? 'returned' : 'borrowed';
      const book = resolveBook(rawBookId);

      if (!book || !borrowDate) {
        failed++;
        return result;
      }

      if (userType === 'teacher') {
        const teacher = resolveTeacher(rawUserId);
        if (!teacher) {
          failed++;
          return result;
        }

        if (!teacher.user_id) {
          console.warn(`[BorrowRegular] Skipping teacher "${teacher.name}" - no user_id (FK violation risk)`);
          failed++;
          return result;
        }
        result.push({
          type: 'regular',
          borrower_name: teacher.name,
          borrower_id: teacher.user_id,
          book_id: book.id,
          book_title: book.title,
          borrow_date: borrowDate,
          due_date: rawReturnDate || borrowDate,
          return_date: status === 'returned' ? (rawReturnDate || borrowDate) : null,
          status,
          duration: null,
          ...(user?.schoolId ? { school_id: user.schoolId } : {}),
        });
        return result;
      }

      const student = resolveStudent(rawUserId);
      if (!student) {
        failed++;
        return result;
      }

      if (!student.user_id) {
        console.warn(`[BorrowRegular] Skipping student "${student.name}" - no user_id (FK violation risk)`);
        failed++;
        return result;
      }
      result.push({
        type: 'lesson',
        borrower_name: student.name,
        borrower_id: student.user_id,
        book_id: book.id,
        book_title: book.title,
        borrow_date: borrowDate,
        due_date: rawReturnDate || borrowDate,
        return_date: status === 'returned' ? (rawReturnDate || borrowDate) : null,
        status,
        class_name: resolveClassName(student),
        teacher_name: '',
        subject: '',
        duration: null,
        ...(user?.schoolId ? { school_id: user.schoolId } : {}),
      });

      return result;
    }, []);

    const total = payloads.length;
    options?.onProgress?.({ current: 0, total });
    await waitForPaint();

    for (let i = 0; i < total; i += 50) {
      const batch = payloads.slice(i, i + 50);
      const { error } = await (supabase as any).from('borrowings').insert(batch);

      if (error) {
        for (const item of batch) {
          const { error: singleError } = await (supabase as any).from('borrowings').insert(item);
          if (singleError) failed++;
          else {
            success++;
            if (item.status !== 'returned') {
              activeBorrowCounts.set(item.book_id, (activeBorrowCounts.get(item.book_id) || 0) + 1);
            }
          }
        }
      } else {
        success += batch.length;
        batch
          .filter((item) => item.status !== 'returned')
          .forEach((item) => activeBorrowCounts.set(item.book_id, (activeBorrowCounts.get(item.book_id) || 0) + 1));
      }

      options?.onProgress?.({ current: Math.min(i + 50, total), total });
      await waitForPaint();
    }

    for (const [bookId, count] of activeBorrowCounts.entries()) {
      const book = books.find((item: any) => item.id === bookId);
      if (!book) continue;
      await (supabase as any).from('books').update({ available: Math.max(0, Number(book.available || 0) - count) }).eq('id', bookId);
    }

    await refetch();
    await refetchBooks();
    return { success, failed };
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-4">
        <div className="page-header">
          <div>
            <h1 className="page-title">Peminjaman Reguler</h1>
            <p className="text-sm text-muted-foreground">Peminjaman untuk guru (7-14 hari)</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setCsvOpen(true)}>
              <Upload className="w-4 h-4 mr-1" /> Import CSV Dummy
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Buat Peminjaman</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Peminjaman Buku Reguler</DialogTitle></DialogHeader>
                <form onSubmit={handleSave} className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Guru</label>
                    <select name="teacherId" className="w-full h-9 rounded-md border bg-background px-3 text-sm" required>
                      <option value="">-- Pilih guru --</option>
                      {teachers.filter((t: any) => t.is_active).map((t: any) => (
                        <option key={t.id} value={t.id}>{t.name} - {t.subject}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Buku</label>
                    <select name="bookId" className="w-full h-9 rounded-md border bg-background px-3 text-sm" required>
                      <option value="">-- Pilih buku --</option>
                      {books.filter((b: any) => b.available > 0).map((b: any) => (
                        <option key={b.id} value={b.id}>{b.title} (tersedia: {b.available})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Durasi (hari)</label>
                    <select name="days" className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                      <option value="7">7 hari</option>
                      <option value="10">10 hari</option>
                      <option value="14">14 hari</option>
                    </select>
                  </div>
                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                    <BookCopy className="w-4 h-4 mr-1" /> Catat Peminjaman
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="search-bar">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Cari transaksi..." className="pl-9" />
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
                    <th className="text-left p-3 font-medium text-muted-foreground">Guru</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Buku</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Tgl Pinjam</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Batas Kembali</th>
                    <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((t: any) => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-medium text-foreground">{t.borrower_name}</td>
                      <td className="p-3 text-foreground">{t.book_title}</td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground">{t.borrow_date}</td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground">{t.due_date}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(t.status)}`}>
                          {t.status === 'borrowed' ? 'Dipinjam' : t.status === 'returned' ? 'Dikembalikan' : 'Terlambat'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {paginated.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">
                      <BookCopy className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Belum ada peminjaman reguler</p>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-3 border-t">
                <p className="text-xs text-muted-foreground">{filtered.length} transaksi</p>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => (
                    <Button key={i} variant={page === i + 1 ? 'default' : 'outline'} size="sm" className="w-8 h-8 p-0" onClick={() => setPage(i + 1)}>{i + 1}</Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <CsvImportDialog
          open={csvOpen}
          onOpenChange={setCsvOpen}
          title="Import Transaksi Peminjaman Dummy"
          columns={[
            { key: 'id', label: 'ID', sample: '1' },
            { key: 'user_type', label: 'User Type', required: true, sample: 'student' },
            { key: 'user_id', label: 'User ID', required: true, sample: '41' },
            { key: 'book_id', label: 'Book ID', required: true, sample: '433' },
            { key: 'borrow_date', label: 'Borrow Date', required: true, sample: '2026-03-07' },
            { key: 'return_date', label: 'Return Date', sample: '2026-03-13' },
            { key: 'status', label: 'Status', sample: 'borrowed' },
          ]}
          onImport={handleCsvImport}
          templateFilename="template-borrowings-dummy.csv"
        />
      </div>
    </AppLayout>
  );
};

export default BorrowRegular;
