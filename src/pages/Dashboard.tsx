import { AppLayout } from '@/layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSchoolData } from '@/hooks/useSchoolData';
import { 
  BookOpen, 
  Users, 
  Library, 
  AlertCircle, 
  TrendingUp, 
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Star // Temporary replacement for Sparkles
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const chartData = [
  { name: 'Sen', value: 40 },
  { name: 'Sel', value: 30 },
  { name: 'Rab', value: 45 },
  { name: 'Kam', value: 50 },
  { name: 'Jum', value: 35 },
  { name: 'Sab', value: 60 },
  { name: 'Min', value: 40 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { data: books } = useSchoolData('books');
  const { data: students } = useSchoolData('students');
  const { data: borrowings } = useSchoolData('borrowings');
  const { data: logs } = useSchoolData('activity_logs');

  const stats = [
    { 
      label: 'Total Koleksi', 
      value: books.length, 
      icon: BookOpen, 
      color: 'bg-primary',
      trend: '+12% bln ini'
    },
    { 
      label: 'Siswa Aktif', 
      value: students.length, 
      icon: Users, 
      color: 'bg-success',
      trend: '+5% bln ini'
    },
    { 
      label: 'Dipinjam', 
      value: borrowings.filter((b: any) => b.status === 'borrowed').length, 
      icon: Library, 
      color: 'bg-warning',
      trend: '8 Aktif'
    },
    { 
      label: 'Terlambat', 
      value: borrowings.filter((b: any) => b.status === 'late').length, 
      icon: AlertCircle, 
      color: 'bg-destructive',
      trend: 'Perlu dicek'
    },
  ];

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 11) return 'Selamat pagi';
    if (h < 15) return 'Selamat siang';
    if (h < 18) return 'Selamat sore';
    return 'Selamat malam';
  })();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-400 font-medium">{greeting},</p>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight capitalize">{user?.name || user?.email?.split('@')[0]}</h1>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 bg-white border border-gray-100 shadow-sm px-4 py-2 rounded-xl">
            <Clock className="w-3.5 h-3.5" />
            Diperbarui baru saja
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-xl text-white shadow-sm`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                  <TrendingUp className="w-3 h-3" />
                  {stat.trend}
                </div>
              </div>
              <p className="text-xs font-medium text-gray-500 mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-gray-900">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-gray-900">Statistik Peminjaman</h3>
                <p className="text-xs text-gray-400 mt-0.5">Tren 7 hari terakhir</p>
              </div>
              <select className="bg-gray-50 border border-gray-100 text-xs font-semibold rounded-lg px-3 py-1.5 outline-none text-gray-600">
                <option>Minggu Ini</option>
                <option>Bulan Ini</option>
              </select>
            </div>

            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                  <Tooltip contentStyle={{borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12}} />
                  <Area type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2.5} fillOpacity={1} fill="url(#colorValue)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">Aktivitas Terakhir</h3>
              <button className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">Lihat Semua</button>
            </div>

            <div className="flex-1 space-y-4">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <CheckCircle2 className="w-8 h-8 text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">Belum ada aktivitas.</p>
                </div>
              ) : (
                logs.slice(0, 5).map((log: any, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 leading-tight truncate">{log.action}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{log.detail}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* AI Promo */}
            <div className="mt-5 p-4 bg-gradient-to-br from-primary to-blue-600 rounded-xl text-white relative overflow-hidden">
              <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Tips</p>
              <h4 className="text-sm font-bold mt-0.5">Gunakan Tanya AI</h4>
              <p className="text-[11px] mt-1 leading-relaxed opacity-85">Cari buku & buat laporan lebih cepat dengan AI!</p>
              <button className="mt-3 bg-white/20 hover:bg-white/30 border border-white/30 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors">Mulai →</button>
              <Star className="absolute -bottom-3 -right-3 w-16 h-16 opacity-10 rotate-12" />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
