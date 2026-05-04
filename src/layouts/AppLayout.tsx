import { ReactNode } from 'react';
import { AppSidebar } from '@/components/AppSidebar';

export function AppLayout({ children }: { children: ReactNode }) {
  try {
    return (
      <div className="min-h-screen flex w-full">
        {/* AppSidebar with safe auth fallbacks */}
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* TopNavbar temporarily disabled - may use AuthContext */}
          <div className="h-16 border-b bg-background flex items-center px-4">
            <span className="font-medium">Navbar Safe</span>
          </div>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
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
