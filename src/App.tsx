import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { BorrowRequestProvider } from "@/contexts/BorrowRequestContext";
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
import NotFound from "./pages/NotFound";
import { ReactNode } from "react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/books" element={<ProtectedRoute><Books /></ProtectedRoute>} />
      <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
      <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
      <Route path="/teachers" element={<ProtectedRoute><Teachers /></ProtectedRoute>} />
      <Route path="/classes" element={<ProtectedRoute><Classes /></ProtectedRoute>} />
      <Route path="/borrow-regular" element={<ProtectedRoute><BorrowRegular /></ProtectedRoute>} />
      <Route path="/borrow-lesson" element={<ProtectedRoute><BorrowLesson /></ProtectedRoute>} />
      <Route path="/returns" element={<ProtectedRoute><Returns /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/activity-log" element={<ProtectedRoute><ActivityLogPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/backup" element={<ProtectedRoute><Backup /></ProtectedRoute>} />
      <Route path="/admin-management" element={<ProtectedRoute><AdminManagement /></ProtectedRoute>} />
      <Route path="/borrow-request" element={<ProtectedRoute><BorrowRequestPage /></ProtectedRoute>} />
      <Route path="/approval" element={<ProtectedRoute><ApprovalPage /></ProtectedRoute>} />
      <Route path="/install" element={<ProtectedRoute><InstallApp /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SettingsProvider>
          <AuthProvider>
            <BorrowRequestProvider>
              <AppRoutes />
            </BorrowRequestProvider>
          </AuthProvider>
        </SettingsProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
