import { AppLayout } from '@/layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSchoolData } from '@/hooks/useSchoolData';
import { BookOpen, BookCopy, Users, GraduationCap, RotateCcw, ArrowRight, TrendingUp, Send, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useCallback } from 'react';

const CHART_COLORS = ['hsl(199,100%,36%)', 'hsl(189,100%,42%)', 'hsl(152,60%,40%)', 'hsl(38,92%,50%)', 'hsl(0,72%,51%)'];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole(['super_admin', 'admin']);
  const isSiswaOrGuru = hasRole(['siswa', 'guru']);

  const { data: books, loading: booksLoading } = useSchoolData<any>('books');
  const { data: students } = useSchoolData<any>('students');
  const { data: teachers } = useSchoolData<any>('teachers');
  const { data: borrowings, loading: borrowingsLoading } = useSchoolData<any>('borrowings');
  const { data: categories } = useSchoolData<any>('categories');

  // Borrow requests - different queries for admin vs user
  const [requests, setRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    setRequestsLoading(true);

    let query = supabase.from('borrow_requests').select('*').order('created_at', { ascending: false });

    if (!isAdmin) {
      query = query.eq('requester_id', user.id);
    } else if (user.schoolId) {
      query = query.eq('school_id', user.schoolId);
    }

    // Fetch all pages to avoid 1000-row limit
    const allData: any[] = [];
    let from = 0;
    const PAGE = 1000;
    let hasMore = true;
    while (hasMore) {
      const { data } = await query.range(from, from + PAGE - 1);
      if (!data || data.length === 0) { hasMore = false; break; }
      allData.push(...data);
      if (data.length < PAGE) hasMore = false;
      else from += PAGE;
    }
    setRequests(allData);
    if (data) setRequests(data);
    setRequestsLoading(false);
  }, [user, isAdmin]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const loading = booksLoading || borrowingsLoading || requestsLoading;

  // Computed stats
  const totalBooks = useMemo(() => books.reduce((a: number, b: any) => a + (b.stock || 0), 0), [books]);
  const availableBooks = useMemo(() => books.reduce((a: number, b: any) => a + (b.available || 0), 0), [books]);
  const borrowedBooks = totalBooks - availableBooks;

  const today = new Date().toISOString().split('T')[0];
  const todayTransactions = useMemo(() => borrowings.filter((t: any) => t.borrow_date === today).length, [borrowings, today]);
  const activeBorrowings = useMemo(() => borrowings.filter((t: any) => t.status === 'borrowed').length, [borrowings]);

  const pendingCount = useMemo(() => requests.filter((r: any) => r.status === 'pending').length, [requests]);
  const myRequests = useMemo(() => {
    if (isAdmin) return requests;
    return requests.filter((r: any) => r.requester_id === user?.id);
  }, [requests, user, isAdmin]);
  const myPending = myRequests.filter((r: any) => r.status === 'pending').length;
  const myApproved = myRequests.filter((r: any) => r.status === 'approved').length;

  // Chart data from real borrowings
  const monthlyBorrowData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const counts = new Array(12).fill(0);
    borrowings.forEach((b: any) => {
      const d = new Date(b.borrow_date);
      if (d.getFullYear() === new Date().getFullYear()) {
        counts[d.getMonth()]++;
      }
    });
    return months.map((m, i) => ({ month: m, count: counts[i] }));
  }, [borrowings]);

  const categoryBorrowData = useMemo(() => {
    const catMap = new Map<string, number>();
    borrowings.forEach((b: any) => {
      const book = books.find((bk: any) => bk.id === b.book_id);
      const cat = book ? categories.find((c: any) => c.id === book.category_id) : null;
      const catName = cat?.name || 'Lainnya';
      catMap.set(catName, (catMap.get(catName) || 0) + 1);
    });
    return Array.from(catMap.entries()).map(([category, count]) => ({ category, count })).slice(0, 5);
  }, [borrowings, books, categories]);

  const dailyActivityData = useMemo(() => {
    const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    const pinjam = new Array(7).fill(0);
    const kembali = new Array(7).fill(0);
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);

    borrowings.forEach((b: any) => {
      const bd = new Date(b.borrow_date);
      if (bd >= weekStart && bd <= now) {
        const dayIdx = (bd.getDay() + 6) % 7;
        pinjam[dayIdx]++;
      }
      if (b.return_date) {
        const rd = new Date(b.return_date);
        if (rd >= weekStart && rd <= now) {
          const dayIdx = (rd.getDay() + 6) % 7;
          kembali[dayIdx]++;
        }
      }
    });
    return days.map((d, i) => ({ day: d, pinjam: pinjam[i], kembali: kembali[i] }));
  }, [borrowings]);

  // Admin stats
  const adminStats = [
    { label: 'Total Buku', value: totalBooks, icon: BookOpen, color: 'text-primary' },
    { label: 'Buku Tersedia', value: availableBooks, icon: BookCopy, color: 'text-success' },
    { label: 'Buku Dipinjam', value: activeBorrowings, icon: TrendingUp, color: 'text-warning' },
    { label: 'Jumlah Siswa', value: students.length, icon: GraduationCap, color: 'text-secondary' },
    { label: 'Jumlah Guru', value: teachers.length, icon: Users, color: 'text-info' },
    { label: 'Transaksi Hari Ini', value: todayTransactions, icon: RotateCcw, color: 'text-primary' },
  ];

  const userStats = [
    { label: 'Buku Tersedia', value: availableBooks, icon: BookOpen, color: 'text-primary' },
    { label: 'Pengajuan Saya', value: myRequests.length, icon: Send, color: 'text-secondary' },
    { label: 'Menunggu', value: myPending, icon: Clock, color: 'text-warning' },
    { label: 'Disetujui', value: myApproved, icon: CheckCircle, color: 'text-success' },
  ];

  const stats = isAdmin ? adminStats : userStats;

  const statusColor = (s: string) => {
    if (s === 'borrowed') return 'bg-warning/10 text-warning border-warning/20';
    if (s === 'returned') return 'bg-success/10 text-success border-success/20';
    return 'bg-destructive/10 text-destructive border-destructive/20';
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? 'Selamat datang di Sistem Manajemen Perpustakaan' : `Halo, ${user?.name}! Jelajahi dan pinjam buku.`}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {isAdmin ? (
              <>
                <Button size="sm" onClick={() => navigate('/books')}>
                  <BookOpen className="w-4 h-4 mr-1" /> Tambah Buku
                </Button>
                {pendingCount > 0 && (
                  <Button size="sm" variant="outline" onClick={() => navigate('/approval')} className="relative">
                    <CheckCircle className="w-4 h-4 mr-1" /> Persetujuan
                    <span className="ml-1 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                      {pendingCount}
                    </span>
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => navigate('/returns')}>
                  <RotateCcw className="w-4 h-4 mr-1" /> Pengembalian
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" onClick={() => navigate('/books')}>
                  <BookOpen className="w-4 h-4 mr-1" /> Katalog Buku
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate('/borrow-request')}>
                  <Send className="w-4 h-4 mr-1" /> Pengajuan Saya
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className={`grid gap-3 sm:gap-4 ${isAdmin ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6' : 'grid-cols-2 sm:grid-cols-4'}`}>
          {stats.map(s => (
            <div key={s.label} className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-lg sm:text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Charts - only for admin */}
        {isAdmin && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="stat-card md:col-span-2">
                <h3 className="text-sm font-semibold text-foreground mb-4">Peminjaman Buku per Bulan</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthlyBorrowData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,15%,90%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(199,100%,36%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="stat-card">
                <h3 className="text-sm font-semibold text-foreground mb-4">Kategori Populer</h3>
                {categoryBorrowData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={categoryBorrowData} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={({ category }) => category}>
                        {categoryBorrowData.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">Belum ada data</div>
                )}
              </div>
            </div>

            <div className="stat-card">
              <h3 className="text-sm font-semibold text-foreground mb-4">Aktivitas Harian (Minggu Ini)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dailyActivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,15%,90%)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="pinjam" stroke="hsl(199,100%,36%)" strokeWidth={2} name="Peminjaman" />
                  <Line type="monotone" dataKey="kembali" stroke="hsl(152,60%,40%)" strokeWidth={2} name="Pengembalian" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* Siswa/Guru: recent requests */}
        {isSiswaOrGuru && myRequests.length > 0 && (
          <div className="data-table-wrapper">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Pengajuan Terbaru</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/borrow-request')}>
                Lihat Semua <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Buku</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Tanggal</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                </tr></thead>
                <tbody>
                  {myRequests.slice(0, 5).map((r: any) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-medium text-foreground">{r.book_title}</td>
                      <td className="p-3 text-muted-foreground">{r.request_date}</td>
                      <td className="p-3 text-center">
                        <Badge className={`text-xs ${r.status === 'pending' ? 'bg-warning/10 text-warning border-warning/20' : r.status === 'approved' ? 'bg-success/10 text-success border-success/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                          {r.status === 'pending' ? 'Menunggu' : r.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Admin: Recent Borrowings */}
        {isAdmin && (
          <div className="data-table-wrapper">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Peminjaman Terbaru</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/borrow-regular')}>
                Lihat Semua <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Peminjam</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Judul Buku</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Jenis</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Tanggal</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                </tr></thead>
                <tbody>
                  {borrowings.slice(0, 10).map((t: any) => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-medium text-foreground">{t.borrower_name}</td>
                      <td className="p-3 text-foreground">{t.book_title}</td>
                      <td className="p-3"><Badge variant="outline" className="text-xs capitalize">{t.type === 'regular' ? 'Reguler' : 'Pelajaran'}</Badge></td>
                      <td className="p-3 text-muted-foreground">{t.borrow_date}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(t.status)}`}>
                          {t.status === 'borrowed' ? 'Dipinjam' : t.status === 'returned' ? 'Dikembalikan' : 'Terlambat'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {borrowings.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">Belum ada data peminjaman</td></tr>
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

export default Dashboard;
