import { useState } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useBorrowRequests } from '@/contexts/BorrowRequestContext';
import { mockBooks } from '@/data/mockData';
import { Search, Send, BookOpen, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const BorrowRequestPage = () => {
  const { user } = useAuth();
  const { requests, addRequest } = useBorrowRequests();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('7');

  const myRequests = requests.filter(r => r.requesterId === user?.id || 
    (user?.role === 'siswa' && r.requesterName === user?.name) ||
    (user?.role === 'guru' && r.requesterName === user?.name)
  );

  const filteredRequests = myRequests.filter(r =>
    r.bookTitle.toLowerCase().includes(search.toLowerCase())
  );

  const availableBooks = mockBooks.filter(b => b.available > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const book = mockBooks.find(b => b.id === selectedBookId);
    if (!book || !user) return;

    addRequest({
      requesterId: user.id,
      requesterName: user.name,
      requesterRole: user.role as 'siswa' | 'guru',
      bookId: book.id,
      bookTitle: book.title,
      reason,
      className: user.role === 'siswa' ? 'X IPA 1' : undefined,
      duration: user.role === 'guru' ? parseInt(duration) : undefined,
    });

    toast.success('Pengajuan peminjaman berhasil dikirim! Menunggu persetujuan admin.');
    setDialogOpen(false);
    setSelectedBookId('');
    setReason('');
  };

  const statusConfig = {
    pending: { label: 'Menunggu', icon: Clock, className: 'bg-warning/10 text-warning border-warning/20' },
    approved: { label: 'Disetujui', icon: CheckCircle, className: 'bg-success/10 text-success border-success/20' },
    rejected: { label: 'Ditolak', icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/20' },
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-4">
        <div className="page-header">
          <div>
            <h1 className="page-title">Pengajuan Peminjaman</h1>
            <p className="text-sm text-muted-foreground">Ajukan peminjaman buku dan tunggu persetujuan admin</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="gradient">
                <Send className="w-4 h-4 mr-1" /> Ajukan Pinjam
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Ajukan Peminjaman Buku
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5">Pilih Buku</label>
                  <select
                    value={selectedBookId}
                    onChange={e => setSelectedBookId(e.target.value)}
                    className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                    required
                  >
                    <option value="">-- Pilih buku --</option>
                    {availableBooks.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.title} (tersedia: {b.available})
                      </option>
                    ))}
                  </select>
                </div>
                {user?.role === 'guru' && (
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Durasi Pinjam (hari)</label>
                    <select
                      value={duration}
                      onChange={e => setDuration(e.target.value)}
                      className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                    >
                      <option value="7">7 hari</option>
                      <option value="10">10 hari</option>
                      <option value="14">14 hari</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium block mb-1.5">Alasan Peminjaman</label>
                  <Textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Tuliskan alasan peminjaman buku..."
                    rows={3}
                    className="resize-none"
                    required
                  />
                </div>
                <Button type="submit" variant="gradient" className="w-full">
                  <Send className="w-4 h-4 mr-1" /> Kirim Pengajuan
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {(['pending', 'approved', 'rejected'] as const).map(status => {
            const config = statusConfig[status];
            const count = myRequests.filter(r => r.status === status).length;
            return (
              <div key={status} className="stat-card flex items-center gap-3">
                <config.icon className={`w-5 h-5 ${status === 'pending' ? 'text-warning' : status === 'approved' ? 'text-success' : 'text-destructive'}`} />
                <div>
                  <p className="text-lg font-bold text-foreground">{count}</p>
                  <p className="text-xs text-muted-foreground">{config.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="search-bar">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari pengajuan..." className="pl-9" />
          </div>
        </div>

        <div className="data-table-wrapper">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Buku</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Alasan</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Tanggal</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Belum ada pengajuan</p>
                      <p className="text-xs">Klik "Ajukan Pinjam" untuk mulai</p>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map(r => {
                    const config = statusConfig[r.status];
                    return (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-medium text-foreground">{r.bookTitle}</span>
                          </div>
                        </td>
                        <td className="p-3 hidden md:table-cell text-muted-foreground text-xs max-w-[200px] truncate">{r.reason}</td>
                        <td className="p-3 hidden md:table-cell text-muted-foreground">{r.requestDate}</td>
                        <td className="p-3 text-center">
                          <Badge className={`text-xs ${config.className}`}>
                            {config.label}
                          </Badge>
                        </td>
                        <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground">
                          {r.status === 'approved' && r.reviewedBy && `Disetujui oleh ${r.reviewedBy}`}
                          {r.status === 'rejected' && r.rejectionReason}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default BorrowRequestPage;
