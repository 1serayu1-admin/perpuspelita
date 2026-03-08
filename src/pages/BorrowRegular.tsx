import { useState } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { mockBooks, mockTeachers, mockTransactions } from '@/data/mockData';
import { BorrowTransaction } from '@/lib/types';
import { Search, Plus, BookCopy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const BorrowRegular = () => {
  const [transactions, setTransactions] = useState<BorrowTransaction[]>(mockTransactions.filter(t => t.type === 'regular'));
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = transactions.filter(t => t.borrowerName.toLowerCase().includes(search.toLowerCase()) || t.bookTitle.toLowerCase().includes(search.toLowerCase()));

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const bookId = form.get('bookId') as string;
    const teacherId = form.get('teacherId') as string;
    const book = mockBooks.find(b => b.id === bookId);
    const teacher = mockTeachers.find(t => t.id === teacherId);
    const days = parseInt(form.get('days') as string);
    const borrowDate = new Date().toISOString().split('T')[0];
    const due = new Date();
    due.setDate(due.getDate() + days);

    const data: BorrowTransaction = {
      id: `tr${Date.now()}`,
      type: 'regular',
      borrowerName: teacher?.name || '',
      borrowerId: teacherId,
      bookId,
      bookTitle: book?.title || '',
      borrowDate,
      dueDate: due.toISOString().split('T')[0],
      status: 'borrowed',
    };
    setTransactions(prev => [...prev, data]);
    toast.success('Peminjaman berhasil dicatat');
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
                    {mockTeachers.filter(t => t.isActive).map(t => <option key={t.id} value={t.id}>{t.name} - {t.subject}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Buku</label>
                  <select name="bookId" className="w-full h-9 rounded-md border bg-background px-3 text-sm" required>
                    {mockBooks.filter(b => b.available > 0).map(b => <option key={b.id} value={b.id}>{b.title} (tersedia: {b.available})</option>)}
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
                <Button type="submit" className="w-full"><BookCopy className="w-4 h-4 mr-1" /> Catat Peminjaman</Button>
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
                  <th className="text-left p-3 font-medium text-muted-foreground">Guru</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Buku</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Tgl Pinjam</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Batas Kembali</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-medium text-foreground">{t.borrowerName}</td>
                    <td className="p-3 text-foreground">{t.bookTitle}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{t.borrowDate}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{t.dueDate}</td>
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

export default BorrowRegular;
