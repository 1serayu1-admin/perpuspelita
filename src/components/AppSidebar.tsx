import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { AppRole } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  Library,
  Settings as SettingsIcon,
  LogOut,
  Sparkles,
  ShieldCheck,
  FileBarChart,
  School,
  Database,
  ClipboardCheck,
  BookMarked,
  RotateCcw,
  Tag,
  BookCopy,
} from 'lucide-react';

interface MenuItem {
  label: string;
  icon: React.ElementType;
  path: string;
  roles: AppRole[];
}

export function AppSidebar() {
  const location = useLocation();
  const { logout, user } = useAuth();

  const role = (user?.appRole || user?.role || 'siswa') as AppRole;

  const menuItems: MenuItem[] = [
    { label: 'Dashboard',      icon: LayoutDashboard, path: '/dashboard',       roles: ['global_super_admin', 'admin', 'school_super_admin', 'guru', 'siswa'] },
    { label: 'Katalog Buku',   icon: BookOpen,        path: '/books',           roles: ['global_super_admin', 'admin', 'school_super_admin', 'guru', 'siswa'] },
    { label: 'Tanya AI',       icon: Sparkles,        path: '/tanya-ai',        roles: ['global_super_admin', 'admin', 'school_super_admin', 'guru', 'siswa'] },
    { label: 'Kategori',       icon: Tag,             path: '/categories',      roles: ['global_super_admin', 'admin', 'guru'] },
    { label: 'Peminjaman',     icon: Library,         path: '/borrow-regular',  roles: ['global_super_admin', 'admin', 'guru'] },
    { label: 'Pinjam Pelajaran', icon: BookCopy,      path: '/borrow-lesson',   roles: ['global_super_admin', 'admin', 'guru'] },
    { label: 'Pengembalian',   icon: RotateCcw,       path: '/returns',         roles: ['global_super_admin', 'admin', 'guru'] },
    { label: 'Persetujuan',    icon: ClipboardCheck,  path: '/approval',        roles: ['global_super_admin', 'admin', 'guru'] },
    { label: 'Pinjam (Siswa)', icon: BookMarked,      path: '/borrow-request',  roles: ['global_super_admin', 'siswa', 'guru'] },
    { label: 'Data Siswa',     icon: GraduationCap,   path: '/students',        roles: ['global_super_admin', 'admin', 'school_super_admin'] },
    { label: 'Data Guru',      icon: Users,           path: '/teachers',        roles: ['global_super_admin', 'admin', 'school_super_admin'] },
    { label: 'Laporan',        icon: FileBarChart,    path: '/reports',         roles: ['global_super_admin', 'admin', 'school_super_admin'] },
    { label: 'Manajemen User', icon: ShieldCheck,     path: '/users',           roles: ['global_super_admin', 'admin'] },
    { label: 'Sekolah',        icon: School,          path: '/schools',         roles: ['global_super_admin', 'admin'] },
    { label: 'Database & Backup', icon: Database,     path: '/backup',          roles: ['global_super_admin', 'admin'] },
    { label: 'Pengaturan',     icon: SettingsIcon,    path: '/settings',        roles: ['global_super_admin', 'admin', 'school_super_admin', 'guru'] },
  ];

  const filteredMenu = menuItems.filter(item =>
    role && item.roles.includes(role)
  );

  const displayName = user?.name || user?.email?.split('@')[0] || 'Pengguna';
  const roleLabel = role?.replace(/_/g, ' ') || 'Pengguna';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 z-40 shadow-sm">
      {/* Brand Header */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-primary/30 flex-shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-extrabold text-gray-900 leading-none tracking-tight">PERPUS PELITA</h1>
            <p className="text-[9px] text-primary font-bold tracking-[0.15em] mt-0.5 uppercase">Bangunrejo · Digital</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {filteredMenu.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative",
                isActive
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/40 rounded-r-full" />
              )}
              <item.icon className={cn(
                "w-4 h-4 flex-shrink-0",
                isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"
              )} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-blue-100 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0 border border-primary/10">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-gray-800 truncate capitalize">{displayName}</p>
            <p className="text-[10px] text-gray-400 capitalize truncate">{roleLabel}</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Keluar Sistem
        </button>
      </div>
    </aside>
  );
}

export function MobileSidebarTrigger() {
  return null;
}
