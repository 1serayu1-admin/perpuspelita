import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, KeyRound, Loader2, UserPlus, LogIn, User, Eye, EyeOff, Library, Users, BookMarked, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  // Helper function to detect if input is email or username
  const isEmail = (input: string) => input.includes('@');

  // console.log("APP VERSION: BUILD-TEST-001"); // Suppressed for demo

  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Username dan password wajib diisi');
      return;
    }

    console.time("LOGIN_FLOW");
    setIsLoading(true);
    try {
      // Use the simplified login function from AuthContext
      const { success, message } = await login(email, password);

      if (!success) throw new Error(message || 'Gagal login');
      
      toast.success('Login berhasil!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Gagal login');
    } finally {
      console.timeEnd("LOGIN_FLOW");
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Email dan password wajib diisi');
      return;
    }

    setIsLoading(true);
    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error('Koneksi database terputus');

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: email.split('@')[0],
          }
        }
      });

      if (error) {
        toast.error('Gagal mendaftar: ' + error.message);
        return;
      }
      
      toast.success('Pendaftaran berhasil! Silakan login.');
      setIsSignUp(false);
    } catch (err: any) {
      toast.error(err.message || 'Gagal mendaftar');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = async () => {
    setEmail('admin');
    setPassword('admin123');
    setIsLoading(true);
    try {
      const { success, message } = await login('admin', 'admin123');
      if (success) {
        toast.success('Auto Login Berhasil!');
        navigate('/dashboard');
      } else {
        toast.error(message || 'Gagal login otomatis');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">

      {/* Left Side - Branding Panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-blue-700 flex-col items-center justify-center p-12">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/3 right-0 w-48 h-48 bg-blue-400/20 rounded-full translate-x-1/2" />

        <div className="relative z-10 text-center text-white max-w-sm">
          {/* Logo */}
          <div className="w-20 h-20 bg-white/15 border border-white/30 rounded-2xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm shadow-xl">
            <Library className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-3xl font-extrabold mb-3 leading-tight">
            Perpustakaan<br />
            <span className="text-blue-200">SMK Pelita</span>
          </h1>
          <p className="text-blue-100 text-sm leading-relaxed mb-10 opacity-90">
            Sistem manajemen perpustakaan digital yang terintegrasi untuk mendukung kegiatan belajar mengajar.
          </p>

          {/* Feature highlights */}
          <div className="space-y-3 text-left">
            {[
              { icon: BookMarked, label: 'Koleksi Buku Digital Lengkap' },
              { icon: Users, label: 'Manajemen Anggota & Peminjaman' },
              { icon: Sparkles, label: 'Asisten AI untuk Rekomendasi' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-3 backdrop-blur-sm">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-white/90">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Perpustakaan SMK Pelita</span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 sm:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                {isSignUp ? 'Buat Akun Baru' : 'Selamat Datang 👋'}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {isSignUp
                  ? 'Daftar untuk mengakses perpustakaan digital'
                  : 'Masuk ke akun Anda untuk melanjutkan'}
              </p>
            </div>

            <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-5">
              {/* Username field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-gray-50 focus:bg-white outline-none placeholder:text-gray-400"
                    placeholder="Masukkan username atau email"
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-gray-50 focus:bg-white outline-none placeholder:text-gray-400"
                    placeholder="••••••••"
                    disabled={isLoading}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 active:scale-[0.98] shadow-md shadow-primary/20 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                ) : isSignUp ? (
                  <><UserPlus className="w-4 h-4" /> Daftar Sekarang</>
                ) : (
                  <><LogIn className="w-4 h-4" /> Masuk</>
                )}
              </button>
            </form>

            {/* Toggle sign up */}
            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-gray-500 hover:text-primary transition-colors font-medium"
              >
                {isSignUp
                  ? 'Sudah punya akun? Masuk'
                  : 'Belum punya akun? Daftar'}
              </button>
            </div>

            {/* Demo button */}
            {!isSignUp && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <button
                  onClick={fillDemo}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ⚡ Coba Demo Admin — Login Otomatis
                </button>
                <p className="text-[10px] text-center text-gray-400 mt-2 uppercase tracking-widest">
                  Akses penuh untuk pengujian
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-6">
            © {new Date().getFullYear()} Perpustakaan SMK Pelita · Sistem Digital Terintegrasi
          </p>
        </div>
      </div>
    </div>
  );
}
