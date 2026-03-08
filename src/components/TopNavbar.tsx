import { useAuth } from '@/contexts/AuthContext';
import { Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MobileSidebarTrigger } from '@/components/AppSidebar';

export function TopNavbar() {
  const { user } = useAuth();

  return (
    <header className="h-14 bg-card border-b flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30 gap-2">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <MobileSidebarTrigger />
        <div className="hidden sm:flex items-center gap-3 flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Input
            placeholder="Cari buku, siswa, guru..."
            className="border-0 bg-muted/50 h-9 text-sm focus-visible:ring-1"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">3</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
            {user?.name.charAt(0) ?? 'U'}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-foreground">{user?.name}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{user?.role.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
