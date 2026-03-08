import { useState } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { useSchoolData } from '@/hooks/useSchoolData';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Plus, BookCopy, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { logActivity } from '@/hooks/useActivityLog';

const BorrowRegular = () => {
  const { user } = useAuth();
  const { data: borrowings, loading, insert } = useSchoolData<any>('borrowings');
  const { data: books } = useSchoolData<any>('books');
  const { data: teachers } = useSchoolData<any>('teachers');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const regularBorrowings = borrowings.filter((b: any) => b.type === 'regular');
  const filtered = regularBorrowings.filter((t: any) =>
    t.borrower_name.toLowerCase().includes(search.toLowerCase()) ||
    t.book_title.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const bookId = form.get('bookId') as string;
    const teacherId = form.get('teacherId') as string;
    const days = parseInt(form.get('days') as string);

    const book = books.find((b: any) => b.id === bookId);
    const teacher = teachers.find((t: any) => t.id === teacherId);

    const borrowDate = new Date().toISOString().split('T')[0];
    const due = new Date();
    due.setDate(due.getDate() + days);

    const { error } = await insert({
      type: 'regular',
      borrower_name: teacher?.name || '',
      borrower_id: teacher?.user_id || user?.id,
      book_id: bookId,
      book_title: book?.title || '',
      borrow_date: borrowDate,
      due_date: due.toISOString().split('T')[0],
      status: 'borrowed',
      duration: days,
    } as any);

    if (error) toast.error('Gagal mencatat peminjaman: ' + error.message);
    else {
      toast.success('Peminjaman berhasil dicatat');
      logActivity('Peminjaman Reguler', `${teacher?.name} meminjam "${book?.title}" selama ${days} hari`, user?.name || '', user?.schoolId);
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
            <h1 className="page-title">Peminjaman Reguler</h1>
            <p className="text-sm text-muted-foreground">Peminjaman untuk guru (7-14 hari)</p>
          </div>
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
                    <th className="text-left p-3 font-medium text-muted-foreground">Guru</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Buku</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Tgl Pinjam</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Batas Kembali</th>
                    <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t: any) => (
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
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">
                      <BookCopy className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Belum ada peminjaman reguler</p>
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

export default BorrowRegular;
