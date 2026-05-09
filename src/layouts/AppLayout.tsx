import { ReactNode } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();
  const roleLabel = role?.replace(/_/g, ' ') || 'Pengguna';

  try {
    return (
      <div className="min-h-screen flex w-full bg-[#F8FAFC]">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          {/* Top Navbar */}
          <header className="h-16 sticky top-0 z-30 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md border-b border-gray-100/80 shadow-sm">
            {/* Search */}
            <div className="flex-1 max-w-sm">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Cari buku, siswa..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 focus:bg-white focus:border-primary/30 focus:ring-2 focus:ring-primary/10 rounded-xl text-sm transition-all outline-none"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 ml-4">
              <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>

              <div className="h-6 w-px bg-gray-200 mx-1" />

              <button
                onClick={() => navigate('/profil')}
                className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-blue-100 text-primary flex items-center justify-center font-bold text-xs border border-primary/10">
                  {initials}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-gray-800 leading-none capitalize">{displayName}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 capitalize">{roleLabel}</p>
                </div>
              </button>
            </div>
          </header>

          <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
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
