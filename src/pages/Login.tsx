import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, KeyRound, Mail, Loader2, UserPlus, LogIn } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Email dan password wajib diisi');
      return;
    }

    setIsLoading(true);
    try {
      const { success, message } = await login(email, password);

      if (!success) throw new Error(message || 'Gagal login');
      
      toast.success('Login berhasil!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Gagal login');
    } finally {
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
    setEmail('1serayu1@gmail.com');
    setPassword('Serayu123!!');
    setIsLoading(true);
    try {
      const { success, message } = await login('1serayu1@gmail.com', 'Serayu123!!');
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
    <div className="min-h-screen w-full flex bg-white overflow-hidden">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 z-10 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3 hover:rotate-0 transition-all duration-300">
              <BookOpen className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {isSignUp ? 'Buat Akun Baru' : 'Selamat Datang'}
            </h1>
            <p className="text-gray-500 mt-2">
              {isSignUp ? 'Daftar untuk akses perpustakaan digital' : 'Masuk ke sistem Perpustakaan Digital SMK Pelita'}
            </p>
          </div>

          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-6 mt-8">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-gray-50 focus:bg-white outline-none"
                    placeholder="nama@sekolah.com"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-gray-50 focus:bg-white outline-none"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 active:scale-[0.98]"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isSignUp ? (
                  'Daftar Sekarang'
                ) : (
                  'Masuk'
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full flex items-center justify-center py-2 px-4 text-sm font-medium text-gray-600 hover:text-primary transition-colors"
              >
                {isSignUp ? (
                  <><LogIn className="w-4 h-4 mr-2" /> Sudah punya akun? Masuk</>
                ) : (
                  <><UserPlus className="w-4 h-4 mr-2" /> Belum punya akun? Daftar</>
                )}
              </button>
            </div>
          </form>

          {!isSignUp && (
            <div className="pt-6 border-t border-gray-100">
              <button
                onClick={fillDemo}
                className="w-full py-3 px-4 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200"
              >
                Gunakan Akun Demo (Superadmin)
              </button>
              <p className="text-[10px] text-center text-gray-400 mt-2 uppercase tracking-widest font-bold">
                Akses Penuh Untuk Pengujian
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Vibrant Visuals */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-50/50">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-primary/20 rounded-full blur-[80px] opacity-70 animate-pulse-ring"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-warning/20 rounded-full blur-[80px] opacity-60 animate-pulse-ring" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-success/10 rounded-full blur-[100px] opacity-60"></div>
        <div className="absolute top-20 left-20 w-64 h-64 bg-destructive/10 rounded-full blur-[60px] opacity-50"></div>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center z-10 backdrop-blur-[2px]">
          <div className="p-10 rounded-[2rem] bg-white/40 border border-white/60 shadow-2xl backdrop-blur-md max-w-lg transition-transform duration-500 hover:scale-[1.02]">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-success">
              Perpustakaan SMK Pelita
            </h2>
            <p className="text-gray-700 text-lg leading-relaxed font-medium">
              Eksplorasi ribuan buku, pinjam dengan mudah, dan manfaatkan asisten AI cerdas untuk menemani belajar Anda.
            </p>
            
            <div className="flex justify-center gap-4 mt-10">
              <span className="w-4 h-4 rounded-full bg-primary shadow-lg shadow-primary/40 animate-bounce"></span>
              <span className="w-4 h-4 rounded-full bg-warning shadow-lg shadow-warning/40 animate-bounce" style={{ animationDelay: '0.1s' }}></span>
              <span className="w-4 h-4 rounded-full bg-success shadow-lg shadow-success/40 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-4 h-4 rounded-full bg-destructive shadow-lg shadow-destructive/40 animate-bounce" style={{ animationDelay: '0.3s' }}></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
