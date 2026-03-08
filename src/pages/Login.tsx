import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Eye, EyeOff, User, Lock, ArrowRight, Shield, UserCog, GraduationCap, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import loginBg from '@/assets/login-bg.jpg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const { login } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(email, password)) {
      toast.success('Login berhasil!');
      navigate('/dashboard');
    } else {
      toast.error('Email tidak ditemukan');
    }
  };

  const demoAccounts = [
    { label: 'Super Admin', email: 'superadmin@sekolah.id', icon: Shield, desc: 'Kelola seluruh sistem' },
    { label: 'Admin', email: 'sari@sekolah.id', icon: UserCog, desc: 'Petugas perpustakaan' },
    { label: 'Guru', email: 'budi@sekolah.id', icon: Users, desc: 'Akses peminjaman' },
    { label: 'Siswa', email: 'andi@sekolah.id', icon: GraduationCap, desc: 'Lihat katalog buku' },
  ];

  const selectAccount = (acc: typeof demoAccounts[0]) => {
    setEmail(acc.email);
    setPassword('demo123');
    setSelectedAccount(acc.email);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Background image panel */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        <img
          src={loginBg}
          alt="Library"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/50 to-secondary/60" />

        {/* Content on image */}
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          <div className="flex items-center gap-3">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-10 h-10 rounded-xl object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-card/20 backdrop-blur-sm flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
            <span className="text-primary-foreground font-semibold text-sm">
              {settings.appName || 'Perpustakaan'}
            </span>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-extrabold text-primary-foreground leading-tight mb-3">
              Selamat Datang di<br />
              <span className="text-secondary-foreground/90">{settings.appName || 'Perpustakaan'}</span>
            </h1>
            {settings.motto && (
              <p className="text-primary-foreground font-medium text-lg italic mb-3">
                "{settings.motto}"
              </p>
            )}
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              {settings.visi || 'Sistem Manajemen Perpustakaan Sekolah — Kelola buku, peminjaman, dan pengembalian dengan mudah.'}
            </p>
          </div>

          <div className="flex items-center gap-6 text-primary-foreground/60 text-xs">
            <span>📚 132 Koleksi Buku</span>
            <span>👥 6 Pengguna Aktif</span>
            <span>📖 24 Peminjaman</span>
          </div>
        </div>
      </div>

      {/* Right — Login form panel (Windows-style) */}
      <div className="flex-1 flex flex-col items-center justify-center bg-background px-6 py-10 relative">
        {/* Mobile logo */}
        <div className="lg:hidden text-center mb-8">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="w-14 h-14 rounded-2xl object-contain mx-auto mb-3" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-7 h-7 text-primary-foreground" />
            </div>
          )}
          <h2 className="text-xl font-bold text-foreground">{settings.appName || 'Perpustakaan'}</h2>
          <p className="text-xs text-muted-foreground">{settings.schoolName}</p>
        </div>

        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-8 hidden lg:block">
            <h2 className="text-2xl font-bold text-foreground mb-1">Masuk</h2>
            <p className="text-sm text-muted-foreground">Pilih akun atau masukkan email Anda</p>
          </div>

          {/* Demo account cards — Windows style */}
          <div className="space-y-2 mb-6">
            {demoAccounts.map(acc => {
              const Icon = acc.icon;
              const isSelected = selectedAccount === acc.email;
              return (
                <button
                  key={acc.email}
                  onClick={() => selectAccount(acc)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 text-left group ${
                    isSelected
                      ? 'border-primary bg-accent shadow-sm'
                      : 'border-border bg-card hover:border-primary/40 hover:bg-accent/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-gradient-to-br from-primary to-secondary text-primary-foreground'
                      : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${isSelected ? 'text-accent-foreground' : 'text-foreground'}`}>{acc.label}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{acc.desc}</p>
                  </div>
                  {isSelected && <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-xs text-muted-foreground">atau masuk manual</span>
            </div>
          </div>

          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
                className="pl-10 h-11 rounded-xl"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                className="pl-10 pr-10 h-11 rounded-xl"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button type="submit" variant="gradient" size="lg" className="w-full rounded-xl text-sm font-semibold">
              Masuk <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-[11px] text-muted-foreground mt-8">
            SERAYU IT SERVICE &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
