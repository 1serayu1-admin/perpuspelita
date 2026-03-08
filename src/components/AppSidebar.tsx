import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, LayoutDashboard, Library, Users, GraduationCap, School, BookCopy, RotateCcw, FileBarChart, Activity, FolderTree, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const menuItems = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['super_admin', 'admin', 'guru', 'siswa'] },
  { title: 'Buku', icon: BookOpen, path: '/books', roles: ['super_admin', 'admin', 'guru', 'siswa'] },
  { title: 'Kategori', icon: FolderTree, path: '/categories', roles: ['super_admin', 'admin'] },
  { title: 'Siswa', icon: GraduationCap, path: '/students', roles: ['super_admin', 'admin'] },
  { title: 'Guru', icon: Users, path: '/teachers', roles: ['super_admin', 'admin'] },
  { title: 'Kelas', icon: School, path: '/classes', roles: ['super_admin', 'admin'] },
  { title: 'Peminjaman Reguler', icon: BookCopy, path: '/borrow-regular', roles: ['super_admin', 'admin', 'guru'] },
  { title: 'Peminjaman Pelajaran', icon: Library, path: '/borrow-lesson', roles: ['super_admin', 'admin'] },
  { title: 'Pengembalian', icon: RotateCcw, path: '/returns', roles: ['super_admin', 'admin'] },
  { title: 'Laporan', icon: FileBarChart, path: '/reports', roles: ['super_admin', 'admin'] },
  { title: 'Log Aktivitas', icon: Activity, path: '/activity-log', roles: ['super_admin', 'admin'] },
] as const;

export function AppSidebar() {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const filteredItems = menuItems.filter(item => hasRole(item.roles as any));

  return (
    <aside className={cn(
      "h-screen bg-sidebar flex flex-col border-r border-sidebar-border transition-all duration-300 sticky top-0",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-sm font-bold text-sidebar-foreground">Perpustakaan</h1>
            <p className="text-[10px] text-sidebar-muted">Sistem Manajemen</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {filteredItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <RouterNavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="animate-fade-in">{item.title}</span>}
            </RouterNavLink>
          );
        })}
      </nav>

      {/* User + Collapse */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-2 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-xs font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sidebar-foreground truncate">{user.name}</p>
              <p className="text-[10px] text-sidebar-muted capitalize">{user.role.replace('_', ' ')}</p>
            </div>
            <button onClick={logout} className="text-sidebar-muted hover:text-sidebar-foreground transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(c => !c)}
          className="w-full justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>
    </aside>
  );
}
