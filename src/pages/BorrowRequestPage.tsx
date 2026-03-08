import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useSchoolData } from '@/hooks/useSchoolData';
import { Search, Send, BookOpen, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { borrowRequestSchema } from '@/lib/validation';

const BorrowRequestPage = () => {
  const { user } = useAuth();
  const { data: books } = useSchoolData<any>('books');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('7');
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 20;

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Fetch all pages to avoid 1000-row limit
    const allData: any[] = [];
    let from = 0;
    const PAGE = 1000;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await supabase
        .from('borrow_requests')
        .select('*')
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, from + PAGE - 1);

      if (error || !data || data.length === 0) { hasMore = false; break; }
      allData.push(...data);
      if (data.length < PAGE) hasMore = false;
      else from += PAGE;
    }
    setRequests(allData);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const filteredRequests = requests.filter((r: any) =>
    r.book_title.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredRequests.length / perPage);
  const paginatedRequests = filteredRequests.slice((page - 1) * perPage, page * perPage);

  const availableBooks = books.filter((b: any) => b.available > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const book = books.find((b: any) => b.id === selectedBookId);
    if (!book) { setSaving(false); return; }

    // Validate reason
    const validation = borrowRequestSchema.safeParse({ reason, duration: user?.appRole === 'guru' ? parseInt(duration) : null });
    if (!validation.success) {
      toast.error(validation.error.errors[0]?.message || 'Data tidak valid');
      setSaving(false);
      return;
    }

    const requesterRole = user.appRole === 'global_super_admin' || user.appRole === 'school_super_admin' ? 'guru' : user.appRole;

    const { error } = await supabase.from('borrow_requests').insert({
      requester_id: user.id,
      requester_name: user.name,
      requester_role: requesterRole,
      book_id: book.id,
      book_title: book.title,
      reason,
      duration: user.appRole === 'guru' ? parseInt(duration) : null,
      school_id: user.schoolId || null,
    } as any);

    if (error) toast.error('Gagal mengirim pengajuan: ' + error.message);
    else {
      toast.success('Pengajuan peminjaman berhasil dikirim!');
      await fetchRequests();
    }
    setSaving(false);
    setDialogOpen(false);
    setSelectedBookId('');
    setReason('');
  };

  const statusConfig = {
    pending: { label: 'Menunggu', icon: Clock, className: 'bg-warning/10 text-warning border-warning/20' },
    approved: { label: 'Disetujui', icon: CheckCircle, className: 'bg-success/10 text-success border-success/20' },
    rejected: { label: 'Ditolak', icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/20' },
  } as const;

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
              <Button size="sm" variant="gradient"><Send className="w-4 h-4 mr-1" /> Ajukan Pinjam</Button>
            </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" /> Ajukan Peminjaman Buku
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5">Pilih Buku</label>
                  <select value={selectedBookId} onChange={e => setSelectedBookId(e.target.value)} className="w-full h-9 rounded-md border bg-background px-3 text-sm" required>
                    <option value="">-- Pilih buku --</option>
                    {availableBooks.map((b: any) => (
                      <option key={b.id} value={b.id}>{b.title} (tersedia: {b.available})</option>
                    ))}
                  </select>
                </div>
                {user?.appRole === 'guru' && (
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Durasi Pinjam (hari)</label>
                    <select value={duration} onChange={e => setDuration(e.target.value)} className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                      <option value="7">7 hari</option>
                      <option value="10">10 hari</option>
                      <option value="14">14 hari</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium block mb-1.5">Alasan Peminjaman</label>
                  <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Tuliskan alasan peminjaman buku..." rows={3} className="resize-none" required />
                </div>
                <Button type="submit" variant="gradient" className="w-full" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
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
            const count = requests.filter((r: any) => r.status === status).length;
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

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
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
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Belum ada pengajuan</p>
                      <p className="text-xs">Klik "Ajukan Pinjam" untuk mulai</p>
                    </td></tr>
                  ) : filteredRequests.map((r: any) => {
                    const config = statusConfig[r.status as keyof typeof statusConfig] || statusConfig.pending;
                    return (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-medium text-foreground">{r.book_title}</span>
                          </div>
                        </td>
                        <td className="p-3 hidden md:table-cell text-muted-foreground text-xs max-w-[200px] truncate">{r.reason}</td>
                        <td className="p-3 hidden md:table-cell text-muted-foreground">{r.request_date}</td>
                        <td className="p-3 text-center">
                          <Badge className={`text-xs ${config.className}`}>{config.label}</Badge>
                        </td>
                        <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground">
                          {r.status === 'approved' && r.reviewed_by && `Disetujui oleh ${r.reviewed_by}`}
                          {r.status === 'rejected' && r.rejection_reason}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default BorrowRequestPage;
