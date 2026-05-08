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
  const { role, logout, user } = useAuth();

  const menuItems: MenuItem[] = [
    { label: 'Dashboard',      icon: LayoutDashboard, path: '/dashboard',       roles: ['admin', 'school_super_admin', 'guru', 'siswa'] },
    { label: 'Katalog Buku',   icon: BookOpen,        path: '/books',           roles: ['admin', 'school_super_admin', 'guru', 'siswa'] },
    { label: 'Tanya AI',       icon: Sparkles,        path: '/tanya-ai',        roles: ['admin', 'school_super_admin', 'guru', 'siswa'] },
    { label: 'Kategori',       icon: Tag,             path: '/categories',      roles: ['admin', 'school_super_admin', 'guru'] },
    { label: 'Peminjaman',     icon: Library,         path: '/borrow-regular',  roles: ['admin', 'school_super_admin', 'guru'] },
    { label: 'Pinjam Pelajaran', icon: BookCopy,      path: '/borrow-lesson',   roles: ['admin', 'school_super_admin', 'guru'] },
    { label: 'Pengembalian',   icon: RotateCcw,       path: '/returns',         roles: ['admin', 'school_super_admin', 'guru'] },
    { label: 'Persetujuan',    icon: ClipboardCheck,  path: '/approval',        roles: ['admin', 'school_super_admin', 'guru'] },
    { label: 'Pinjam (Siswa)', icon: BookMarked,      path: '/borrow-request',  roles: ['siswa', 'guru'] },
    { label: 'Data Siswa',     icon: GraduationCap,   path: '/students',        roles: ['admin', 'school_super_admin'] },
    { label: 'Data Guru',      icon: Users,           path: '/teachers',        roles: ['admin', 'school_super_admin'] },
    { label: 'Laporan',        icon: FileBarChart,    path: '/reports',         roles: ['admin', 'school_super_admin'] },
    { label: 'Manajemen User', icon: ShieldCheck,     path: '/users',           roles: ['admin'] },
    { label: 'Sekolah',        icon: School,          path: '/schools',         roles: ['admin'] },
    { label: 'Database & Backup', icon: Database,     path: '/backup',          roles: ['admin'] },
    { label: 'Pengaturan',     icon: SettingsIcon,    path: '/settings',        roles: ['admin', 'school_super_admin', 'guru'] },
  ];

  const filteredMenu = menuItems.filter(item =>
    role && item.roles.includes(role)
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 z-40">
      <div className="p-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-none">SERAYU</h1>
            <p className="text-[10px] text-primary font-bold tracking-widest mt-1">DIGITAL LIBRARY</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {filteredMenu.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-gray-500 hover:bg-gray-50 hover:text-primary"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5",
                isActive ? "text-white" : "text-gray-400 group-hover:text-primary"
              )} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100 space-y-4">
        <div className="px-4 py-3 bg-gray-50 rounded-2xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">{user?.email?.split('@')[0]}</p>
            <p className="text-[10px] text-gray-500 capitalize">{role?.replace(/_/g, ' ') || 'Pengguna'}</p>
          </div>
        </div>

        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Keluar Sistem
        </button>
      </div>
    </aside>
  );
}

export function MobileSidebarTrigger() {
  return null;
}
