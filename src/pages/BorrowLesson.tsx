import { useState } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { mockBooks, mockStudents, mockTeachers, mockClasses, mockTransactions } from '@/data/mockData';
import { BorrowTransaction } from '@/lib/types';
import { Search, Plus, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const BorrowLesson = () => {
  const [transactions, setTransactions] = useState<BorrowTransaction[]>(mockTransactions.filter(t => t.type === 'lesson'));
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [customDuration, setCustomDuration] = useState(false);

  const filtered = transactions.filter(t => t.borrowerName.toLowerCase().includes(search.toLowerCase()) || t.bookTitle.toLowerCase().includes(search.toLowerCase()));

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const studentId = form.get('studentId') as string;
    const bookId = form.get('bookId') as string;
    const teacherId = form.get('teacherId') as string;
    const duration = parseInt(form.get('duration') as string);
    const student = mockStudents.find(s => s.id === studentId);
    const book = mockBooks.find(b => b.id === bookId);
    const teacher = mockTeachers.find(t => t.id === teacherId);
    const now = new Date();
    const due = new Date(now.getTime() + duration * 60000);

    const data: BorrowTransaction = {
      id: `tr${Date.now()}`,
      type: 'lesson',
      borrowerName: student?.name || '',
      borrowerId: studentId,
      bookId,
      bookTitle: book?.title || '',
      borrowDate: now.toISOString().split('T')[0],
      dueDate: due.toISOString(),
      status: 'borrowed',
      className: student?.className,
      subject: teacher?.subject,
      teacherName: teacher?.name,
      duration,
    };
    setTransactions(prev => [...prev, data]);
    toast.success(`Peminjaman dicatat. Batas: ${duration} menit`);
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
                    {mockStudents.filter(s => s.isActive).map(s => <option key={s.id} value={s.id}>{s.name} - {s.className}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Buku</label>
                  <select name="bookId" className="w-full h-9 rounded-md border bg-background px-3 text-sm" required>
                    {mockBooks.filter(b => b.available > 0).map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Guru Pengampu</label>
                  <select name="teacherId" className="w-full h-9 rounded-md border bg-background px-3 text-sm" required>
                    {mockTeachers.filter(t => t.isActive).map(t => <option key={t.id} value={t.id}>{t.name} - {t.subject}</option>)}
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
                <Button type="submit" className="w-full"><Clock className="w-4 h-4 mr-1" /> Catat Peminjaman</Button>
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
                {filtered.map(t => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-medium text-foreground">{t.borrowerName}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{t.className}</td>
                    <td className="p-3 text-foreground">{t.bookTitle}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{t.teacherName}</td>
                    <td className="p-3 text-center text-muted-foreground">{t.duration} mnt</td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(t.status)}`}>
                        {t.status === 'borrowed' ? 'Dipinjam' : t.status === 'returned' ? 'Dikembalikan' : 'Terlambat'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default BorrowLesson;
