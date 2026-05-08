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
  CheckCircle2
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

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
            <p className="text-gray-500 mt-1">Selamat datang kembali, <span className="font-semibold text-primary">{user?.name}</span>. Berikut ringkasan perpustakaan Anda.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
            <Clock className="w-3.5 h-3.5" />
            Terakhir Update: Baru saja
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="group relative bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className={`${stat.color} p-4 rounded-2xl text-white shadow-lg shadow-${stat.color.split('-')[1]}/30 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-success bg-success/10 px-2 py-1 rounded-full">
                  <TrendingUp className="w-3 h-3" />
                  {stat.trend}
                </div>
              </div>
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <h3 className="text-4xl font-black text-gray-900 mt-1">{stat.value}</h3>
              </div>
              <div className="absolute top-4 right-4 text-gray-100 group-hover:text-gray-200 transition-colors pointer-events-none">
                <ArrowUpRight className="w-12 h-12" />
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Statistik Peminjaman</h3>
                <p className="text-sm text-gray-500 mt-1">Tren peminjaman buku dalam 7 hari terakhir</p>
              </div>
              <select className="bg-gray-50 border-none text-xs font-bold rounded-xl px-3 py-2 outline-none">
                <option>Minggu Ini</option>
                <option>Bulan Ini</option>
              </select>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0369a1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0369a1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#0369a1" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity Section */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-gray-900">Aktivitas Terakhir</h3>
              <button className="text-xs font-bold text-primary hover:underline">Lihat Semua</button>
            </div>
            
            <div className="space-y-6">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-gray-200" />
                  </div>
                  <p className="text-sm text-gray-400">Belum ada aktivitas tercatat.</p>
                </div>
              ) : (
                logs.slice(0, 5).map((log: any, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <CheckCircle2 className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors" />
                      </div>
                      {i !== Math.min(logs.length, 5) - 1 && (
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-gray-50"></div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 leading-tight">{log.action}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{log.detail}</p>
                      <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase tracking-tighter">
                        {new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-10 p-5 bg-gradient-to-br from-primary to-blue-700 rounded-3xl text-white relative overflow-hidden shadow-xl shadow-primary/20">
              <div className="relative z-10">
                <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Upgrade Tips</p>
                <h4 className="text-lg font-bold mt-1">Gunakan Tanya AI</h4>
                <p className="text-[11px] mt-2 leading-relaxed opacity-90">Tanya AI dapat membantu Anda mencari buku atau membuat laporan perpustakaan lebih cepat!</p>
                <button className="mt-4 bg-white text-primary text-[11px] font-bold px-4 py-2 rounded-xl hover:bg-opacity-90 transition-all">Mulai Tanya AI</button>
              </div>
              <Sparkles className="absolute bottom-[-10px] right-[-10px] w-24 h-24 opacity-10 rotate-12" />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
