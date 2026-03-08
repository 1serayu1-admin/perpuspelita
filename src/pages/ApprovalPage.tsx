import { useState } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSchoolData } from '@/hooks/useSchoolData';
import { supabase } from '@/integrations/supabase/client';
import { Search, CheckCircle, XCircle, Clock, Filter, BookOpen, GraduationCap, Users, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { logActivity } from '@/hooks/useActivityLog';

const ApprovalPage = () => {
  const { user } = useAuth();
  const { data: requests, loading, update } = useSchoolData<any>('borrow_requests');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const filtered = requests.filter((r: any) => {
    const matchSearch = r.requester_name.toLowerCase().includes(search.toLowerCase()) || r.book_title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = requests.filter((r: any) => r.status === 'pending').length;
  const approvedCount = requests.filter((r: any) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r: any) => r.status === 'rejected').length;

  const handleApprove = async (id: string) => {
    const { error } = await update(id, {
      status: 'approved',
      reviewed_by: user?.name || 'Admin',
      reviewed_at: new Date().toISOString(),
    } as any);
    if (error) toast.error('Gagal menyetujui: ' + error.message);
    else {
      toast.success('Pengajuan disetujui!');
      const req = requests.find((r: any) => r.id === id);
      logActivity('Persetujuan Peminjaman', `Pengajuan "${req?.book_title}" oleh ${req?.requester_name} disetujui`, user?.name || '', user?.schoolId);
    }
  };

  const openRejectDialog = (id: string) => {
    setSelectedReqId(id);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!selectedReqId) return;
    const { error } = await update(selectedReqId, {
      status: 'rejected',
      reviewed_by: user?.name || 'Admin',
      reviewed_at: new Date().toISOString(),
      rejection_reason: rejectionReason || 'Ditolak oleh admin',
    } as any);
    if (error) toast.error('Gagal menolak: ' + error.message);
    else {
      toast.success('Pengajuan ditolak');
      const req = requests.find((r: any) => r.id === selectedReqId);
      logActivity('Penolakan Peminjaman', `Pengajuan "${req?.book_title}" oleh ${req?.requester_name} ditolak`, user?.name || '', user?.schoolId);
    }
    setRejectDialogOpen(false);
    setSelectedReqId(null);
  };

  const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: 'Menunggu', className: 'bg-warning/10 text-warning border-warning/20' },
    approved: { label: 'Disetujui', className: 'bg-success/10 text-success border-success/20' },
    rejected: { label: 'Ditolak', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-4">
        <div className="page-header">
          <div>
            <h1 className="page-title">Persetujuan Peminjaman</h1>
            <p className="text-sm text-muted-foreground">Kelola pengajuan peminjaman dari siswa & guru</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="stat-card flex items-center gap-3">
            <Clock className="w-5 h-5 text-warning" />
            <div><p className="text-lg font-bold text-foreground">{pendingCount}</p><p className="text-xs text-muted-foreground">Menunggu</p></div>
          </div>
          <div className="stat-card flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-success" />
            <div><p className="text-lg font-bold text-foreground">{approvedCount}</p><p className="text-xs text-muted-foreground">Disetujui</p></div>
          </div>
          <div className="stat-card flex items-center gap-3">
            <XCircle className="w-5 h-5 text-destructive" />
            <div><p className="text-lg font-bold text-foreground">{rejectedCount}</p><p className="text-xs text-muted-foreground">Ditolak</p></div>
          </div>
        </div>

        <div className="search-bar">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari pengajuan..." className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="w-3.5 h-3.5 mr-1" /><SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="pending">Menunggu</SelectItem>
              <SelectItem value="approved">Disetujui</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="data-table-wrapper">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-medium text-muted-foreground">Pemohon</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Buku</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Alasan</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Tanggal</th>
                    <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success opacity-40" />
                      <p className="text-sm">Tidak ada pengajuan</p>
                    </td></tr>
                  ) : filtered.map((r: any) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${r.requester_role === 'siswa' ? 'bg-primary/10' : 'bg-accent'}`}>
                            {r.requester_role === 'siswa' ? <GraduationCap className="w-3.5 h-3.5 text-primary" /> : <Users className="w-3.5 h-3.5 text-foreground" />}
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">{r.requester_name}</p>
                            <p className="text-[10px] text-muted-foreground capitalize">
                              {r.requester_role}{r.class_name ? ` • ${r.class_name}` : ''}{r.duration ? ` • ${r.duration} hari` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <span className="text-foreground">{r.book_title}</span>
                        </div>
                      </td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground text-xs max-w-[200px] truncate">{r.reason}</td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground">{r.request_date}</td>
                      <td className="p-3 text-center">
                        <Badge className={`text-xs ${(statusConfig[r.status] || statusConfig.pending).className}`}>
                          {(statusConfig[r.status] || statusConfig.pending).label}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        {r.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="outline" className="text-success hover:text-success h-8" onClick={() => handleApprove(r.id)}>
                              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Setuju
                            </Button>
                            <Button size="sm" variant="outline" className="text-destructive hover:text-destructive h-8" onClick={() => openRejectDialog(r.id)}>
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Tolak
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">{r.reviewed_by && `oleh ${r.reviewed_by}`}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" /> Tolak Pengajuan
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium block mb-1.5">Alasan Penolakan</label>
              <Textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Tuliskan alasan penolakan..." rows={3} className="resize-none" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Batal</Button>
              <Button variant="destructive" onClick={handleReject}>
                <XCircle className="w-4 h-4 mr-1" /> Tolak Pengajuan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default ApprovalPage;
