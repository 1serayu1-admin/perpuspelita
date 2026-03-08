import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { NetworkStatus } from "@/components/NetworkStatus";
import { SettingsProvider } from "@/contexts/SettingsContext";
import type { Role } from "@/lib/types";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Books from "./pages/Books";
import Categories from "./pages/Categories";
import Students from "./pages/Students";
import Teachers from "./pages/Teachers";
import Classes from "./pages/Classes";
import BorrowRegular from "./pages/BorrowRegular";
import BorrowLesson from "./pages/BorrowLesson";
import Returns from "./pages/Returns";
import Reports from "./pages/Reports";
import ActivityLogPage from "./pages/ActivityLog";
import SettingsPage from "./pages/Settings";
import Backup from "./pages/Backup";
import AdminManagement from "./pages/AdminManagement";
import BorrowRequestPage from "./pages/BorrowRequestPage";
import ApprovalPage from "./pages/ApprovalPage";
import InstallApp from "./pages/InstallApp";
import Schools from "./pages/Schools";
import NotFound from "./pages/NotFound";
import { ReactNode } from "react";

const queryClient = new QueryClient();

function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { isAuthenticated, loading, hasRole } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !hasRole(roles)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const adminRoles: Role[] = ['super_admin', 'admin'];
  const superOnly: Role[] = ['super_admin'];
  const allRoles: Role[] = ['super_admin', 'admin', 'guru', 'siswa'];
  const studentTeacher: Role[] = ['siswa', 'guru'];

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<ProtectedRoute roles={allRoles}><Dashboard /></ProtectedRoute>} />
      <Route path="/books" element={<ProtectedRoute roles={allRoles}><Books /></ProtectedRoute>} />
      <Route path="/categories" element={<ProtectedRoute roles={adminRoles}><Categories /></ProtectedRoute>} />
      <Route path="/students" element={<ProtectedRoute roles={adminRoles}><Students /></ProtectedRoute>} />
      <Route path="/teachers" element={<ProtectedRoute roles={adminRoles}><Teachers /></ProtectedRoute>} />
      <Route path="/classes" element={<ProtectedRoute roles={adminRoles}><Classes /></ProtectedRoute>} />
      <Route path="/borrow-regular" element={<ProtectedRoute roles={adminRoles}><BorrowRegular /></ProtectedRoute>} />
      <Route path="/borrow-lesson" element={<ProtectedRoute roles={adminRoles}><BorrowLesson /></ProtectedRoute>} />
      <Route path="/returns" element={<ProtectedRoute roles={adminRoles}><Returns /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute roles={adminRoles}><Reports /></ProtectedRoute>} />
      <Route path="/activity-log" element={<ProtectedRoute roles={adminRoles}><ActivityLogPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute roles={superOnly}><SettingsPage /></ProtectedRoute>} />
      <Route path="/backup" element={<ProtectedRoute roles={adminRoles}><Backup /></ProtectedRoute>} />
      <Route path="/admin-management" element={<ProtectedRoute roles={superOnly}><AdminManagement /></ProtectedRoute>} />
      <Route path="/borrow-request" element={<ProtectedRoute roles={studentTeacher}><BorrowRequestPage /></ProtectedRoute>} />
      <Route path="/approval" element={<ProtectedRoute roles={adminRoles}><ApprovalPage /></ProtectedRoute>} />
      <Route path="/install" element={<ProtectedRoute roles={superOnly}><InstallApp /></ProtectedRoute>} />
      <Route path="/schools" element={<ProtectedRoute roles={superOnly}><Schools /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <NetworkStatus />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SettingsProvider>
            <AppRoutes />
          </SettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
