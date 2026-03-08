import { AppLayout } from '@/layouts/AppLayout';
import { BookOpen, BookCopy, Users, GraduationCap, RotateCcw, ArrowRight, TrendingUp } from 'lucide-react';
import { mockBooks, mockStudents, mockTeachers, mockTransactions, monthlyBorrowData, categoryBorrowData, dailyActivityData } from '@/data/mockData';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

const CHART_COLORS = ['hsl(199,100%,36%)', 'hsl(189,100%,42%)', 'hsl(152,60%,40%)', 'hsl(38,92%,50%)', 'hsl(0,72%,51%)'];

const Dashboard = () => {
  const navigate = useNavigate();
  const totalBooks = mockBooks.reduce((a, b) => a + b.stock, 0);
  const availableBooks = mockBooks.reduce((a, b) => a + b.available, 0);
  const borrowedBooks = totalBooks - availableBooks;
  const todayTransactions = mockTransactions.filter(t => t.borrowDate === '2024-03-08').length;

  const stats = [
    { label: 'Total Buku', value: totalBooks, icon: BookOpen, color: 'text-primary' },
    { label: 'Buku Tersedia', value: availableBooks, icon: BookCopy, color: 'text-success' },
    { label: 'Buku Dipinjam', value: borrowedBooks, icon: TrendingUp, color: 'text-warning' },
    { label: 'Jumlah Siswa', value: mockStudents.length, icon: GraduationCap, color: 'text-secondary' },
    { label: 'Jumlah Guru', value: mockTeachers.length, icon: Users, color: 'text-info' },
    { label: 'Transaksi Hari Ini', value: todayTransactions, icon: RotateCcw, color: 'text-primary' },
  ];

  const statusColor = (s: string) => {
    if (s === 'borrowed') return 'bg-warning/10 text-warning border-warning/20';
    if (s === 'returned') return 'bg-success/10 text-success border-success/20';
    return 'bg-destructive/10 text-destructive border-destructive/20';
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Selamat datang di Sistem Manajemen Perpustakaan</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={() => navigate('/books')}>
              <BookOpen className="w-4 h-4 mr-1" /> Tambah Buku
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/borrow-regular')}>
              <BookCopy className="w-4 h-4 mr-1" /> Peminjaman
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/returns')}>
              <RotateCcw className="w-4 h-4 mr-1" /> Pengembalian
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map(s => (
            <div key={s.label} className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="stat-card lg:col-span-2">
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
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categoryBorrowData} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={({ category }) => category}>
                  {categoryBorrowData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="stat-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Aktivitas Harian</h3>
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

        {/* Recent Activity Table */}
        <div className="data-table-wrapper">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Aktivitas Terbaru</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/activity-log')}>
              Lihat Semua <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Peminjam</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Judul Buku</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Jenis</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Tanggal</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {mockTransactions.map(t => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-medium text-foreground">{t.borrowerName}</td>
                    <td className="p-3 text-foreground">{t.bookTitle}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs capitalize">{t.type === 'regular' ? 'Reguler' : 'Pelajaran'}</Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{t.borrowDate}</td>
                    <td className="p-3">
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

export default Dashboard;
