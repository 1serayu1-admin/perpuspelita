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
      {/* Left — Hero panel with logo showcase */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        <img
          src={loginBg}
          alt="Library"
          className="absolute inset-0 w-full h-full object-cover scale-105 transition-transform duration-[20s] hover:scale-110"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary/60 to-secondary/70" />

        {/* Animated decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating circles */}
          <div className="absolute top-20 right-20 w-32 h-32 rounded-full border border-primary-foreground/10 animate-spin-slow" />
          <div className="absolute bottom-32 left-16 w-24 h-24 rounded-full border border-primary-foreground/10 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '18s' }} />
          <div className="absolute top-1/2 right-10 w-16 h-16 rounded-full bg-primary-foreground/5 animate-float" />
          <div className="absolute bottom-20 right-32 w-8 h-8 rounded-full bg-secondary/30 animate-float" style={{ animationDelay: '1.5s' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          {/* Top bar */}
          <div className="flex items-center gap-3 animate-fade-in">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-9 h-9 rounded-lg object-contain" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-primary-foreground/15 backdrop-blur-sm flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <span className="text-primary-foreground/80 font-medium text-sm">
              {settings.schoolName || 'Sistem Perpustakaan'}
            </span>
          </div>

          {/* Center — Logo showcase */}
          <div className="flex flex-col items-center text-center max-w-lg mx-auto">
            {/* Logo with animated ring */}
            <div className="relative mb-8 animate-scale-in">
              {/* Pulsing ring */}
              <div className="absolute inset-0 rounded-3xl bg-primary-foreground/10 animate-pulse-ring" />
              <div className="absolute -inset-3 rounded-[2rem] border-2 border-primary-foreground/10 animate-spin-slow" style={{ animationDuration: '20s' }} />

              {settings.logoUrl ? (
                <div className="relative w-28 h-28 rounded-3xl overflow-hidden shadow-2xl border-2 border-primary-foreground/20 bg-primary-foreground/10 backdrop-blur-md p-3 animate-float">
                  <img
                    src={settings.logoUrl}
                    alt="Logo Sekolah"
                    className="w-full h-full object-contain drop-shadow-lg"
                  />
                </div>
              ) : (
                <div className="relative w-28 h-28 rounded-3xl shadow-2xl border-2 border-primary-foreground/20 bg-primary-foreground/10 backdrop-blur-md flex items-center justify-center animate-float">
                  <BookOpen className="w-14 h-14 text-primary-foreground drop-shadow-lg" />
                </div>
              )}
            </div>

            {/* School name + app name */}
            <h1 className="text-4xl font-extrabold text-primary-foreground leading-tight mb-2 animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
              {settings.appName || 'Perpustakaan'}
            </h1>
            <p className="text-primary-foreground/70 text-sm font-medium mb-5 animate-slide-up" style={{ animationDelay: '0.35s', animationFillMode: 'both' }}>
              {settings.schoolName || 'Sistem Manajemen Perpustakaan'}
            </p>

            {/* Motto */}
            {settings.motto && (
              <div className="animate-slide-up" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
                <div className="inline-block px-5 py-2.5 rounded-2xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/10">
                  <p className="text-primary-foreground font-semibold text-base italic">
                    "{settings.motto}"
                  </p>
                </div>
              </div>
            )}

            {/* Visi */}
            {settings.visi && (
              <p className="text-primary-foreground/60 text-sm leading-relaxed mt-4 max-w-sm animate-slide-up" style={{ animationDelay: '0.65s', animationFillMode: 'both' }}>
                {settings.visi}
              </p>
            )}
          </div>

          {/* Bottom stats */}
          <div className="flex items-center justify-center gap-6 text-primary-foreground/50 text-xs animate-fade-in" style={{ animationDelay: '0.8s', animationFillMode: 'both' }}>
            <span className="flex items-center gap-1.5">📚 132 Koleksi</span>
            <span className="w-1 h-1 rounded-full bg-primary-foreground/30" />
            <span className="flex items-center gap-1.5">👥 6 Pengguna</span>
            <span className="w-1 h-1 rounded-full bg-primary-foreground/30" />
            <span className="flex items-center gap-1.5">📖 24 Pinjaman</span>
          </div>
        </div>
      </div>

      {/* Right — Login form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-background px-6 py-10 relative">
        {/* Mobile logo — also animated */}
        <div className="lg:hidden text-center mb-8 animate-scale-in">
          <div className="relative inline-block mb-4">
            <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 animate-pulse-ring" />
            {settings.logoUrl ? (
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-lg border-2 border-primary/20 bg-card p-2 animate-float">
                <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg animate-float">
                <BookOpen className="w-9 h-9 text-primary-foreground" />
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold text-foreground">{settings.appName || 'Perpustakaan'}</h2>
          <p className="text-xs text-muted-foreground">{settings.schoolName}</p>
          {settings.motto && (
            <p className="text-xs text-primary font-medium italic mt-1">"{settings.motto}"</p>
          )}
        </div>

        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-8 hidden lg:block animate-fade-in">
            <h2 className="text-2xl font-bold text-foreground mb-1">Masuk</h2>
            <p className="text-sm text-muted-foreground">Pilih akun atau masukkan email Anda</p>
          </div>

          {/* Demo accounts */}
          <div className="space-y-2 mb-6">
            {demoAccounts.map((acc, idx) => {
              const Icon = acc.icon;
              const isSelected = selectedAccount === acc.email;
              return (
                <button
                  key={acc.email}
                  onClick={() => selectAccount(acc)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 text-left group animate-slide-up ${
                    isSelected
                      ? 'border-primary bg-accent shadow-sm scale-[1.02]'
                      : 'border-border bg-card hover:border-primary/40 hover:bg-accent/50 hover:scale-[1.01]'
                  }`}
                  style={{ animationDelay: `${idx * 0.08}s`, animationFillMode: 'both' }}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                    isSelected
                      ? 'bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-md'
                      : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${isSelected ? 'text-accent-foreground' : 'text-foreground'}`}>{acc.label}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{acc.desc}</p>
                  </div>
                  {isSelected && (
                    <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 animate-slide-in" />
                  )}
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

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
                className="pl-10 h-11 rounded-xl transition-shadow focus:shadow-md"
                required
              />
            </div>
            <div className="relative animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                className="pl-10 pr-10 h-11 rounded-xl transition-shadow focus:shadow-md"
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

            <Button type="submit" variant="gradient" size="lg" className="w-full rounded-xl text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98]">
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
