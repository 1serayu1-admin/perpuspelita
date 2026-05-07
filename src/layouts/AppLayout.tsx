import { ReactNode } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { Bell, Search, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  try {
    return (
      <div className="min-h-screen flex w-full bg-[#F8FAFC]">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          {/* Top Navbar Premium Glassmorphism */}
          <header className="h-[72px] sticky top-0 z-30 flex items-center justify-between px-6 bg-white/70 backdrop-blur-md border-b border-gray-100 shadow-sm">
            <div className="flex-1 max-w-xl">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Cari buku, siswa, atau pinjaman..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/10 rounded-xl text-sm transition-all outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 ml-4">
              <button className="relative p-2.5 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-destructive rounded-full border-2 border-white animate-pulse"></span>
              </button>
              
              <div className="h-8 w-[1px] bg-gray-200 mx-1"></div>
              
              <button 
                onClick={() => navigate('/profil')}
                className="flex items-center gap-3 p-1.5 pr-4 hover:bg-gray-50 rounded-full transition-colors border border-transparent hover:border-gray-100"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-gray-700 leading-none">{user?.email?.split('@')[0] || 'User'}</p>
                  <p className="text-xs text-gray-500 mt-1 capitalize">{role?.replace('_', ' ') || 'Siswa'}</p>
                </div>
              </button>
            </div>
          </header>

          <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    );
  } catch (err: any) {
    return (
      <div style={{ padding: 50 }}>
        <h1 style={{ color: 'red' }}>Layout Crashed</h1>
        <p>{err?.message || 'Unknown layout error'}</p>
        <div style={{ marginTop: 20, padding: 20, border: '1px solid #ccc' }}>
          {children}
        </div>
      </div>
    );
  }
}
