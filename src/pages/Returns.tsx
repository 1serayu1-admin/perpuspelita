import { useState } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { useSchoolData } from '@/hooks/useSchoolData';
import { Search, RotateCcw, CheckCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { logActivity } from '@/hooks/useActivityLog';
import { useAuth } from '@/contexts/AuthContext';

const Returns = () => {
  const { data: borrowings, loading, update } = useSchoolData<any>('borrowings');
  const [search, setSearch] = useState('');

  const borrowed = borrowings.filter((t: any) => t.status === 'borrowed' || t.status === 'late');
  const filtered = borrowed.filter((t: any) =>
    t.borrower_name.toLowerCase().includes(search.toLowerCase()) ||
    t.book_title.toLowerCase().includes(search.toLowerCase())
  );

  const handleReturn = async (id: string, dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const isLate = now > due;

    const { error } = await update(id, {
      return_date: now.toISOString().split('T')[0],
      status: isLate ? 'late' : 'returned',
    } as any);

    if (error) toast.error('Gagal memproses pengembalian: ' + error.message);
    else toast.success('Buku berhasil dikembalikan');
  };

  const statusColor = (s: string) => {
    if (s === 'borrowed') return 'bg-warning/10 text-warning border-warning/20';
    return 'bg-destructive/10 text-destructive border-destructive/20';
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-4">
        <div className="page-header">
          <div>
            <h1 className="page-title">Pengembalian Buku</h1>
            <p className="text-sm text-muted-foreground">{filtered.length} buku belum dikembalikan</p>
          </div>
        </div>

        <div className="search-bar">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari peminjam atau buku..." className="pl-9" />
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
                    <th className="text-left p-3 font-medium text-muted-foreground">Peminjam</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Buku</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Jenis</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Tgl Pinjam</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Batas</th>
                    <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success" />
                      Semua buku telah dikembalikan
                    </td></tr>
                  ) : filtered.map((t: any) => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-medium text-foreground">{t.borrower_name}</td>
                      <td className="p-3 text-foreground">{t.book_title}</td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground capitalize">{t.type === 'regular' ? 'Reguler' : 'Pelajaran'}</td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground">{t.borrow_date}</td>
                      <td className="p-3 text-muted-foreground">{(t.due_date || '').split('T')[0]}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(t.status)}`}>
                          {t.status === 'borrowed' ? 'Dipinjam' : 'Terlambat'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <Button size="sm" variant="outline" onClick={() => handleReturn(t.id, t.due_date)}>
                          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Kembalikan
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Returns;
