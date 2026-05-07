import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import './index.css'

// Pages
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Login from './pages/Login'
import Profil from './pages/Profil'
import TanyaAI from './pages/TanyaAI'
import Books from './pages/Books'
import Categories from './pages/Categories'
import Students from './pages/Students'
import Teachers from './pages/Teachers'
import Classes from './pages/Classes'
import BorrowRegular from './pages/BorrowRegular'
import BorrowLesson from './pages/BorrowLesson'
import Returns from './pages/Returns'
import Reports from './pages/Reports'
import ActivityLog from './pages/ActivityLog'
import Settings from './pages/Settings'
import Backup from './pages/Backup'
import AdminManagement from './pages/AdminManagement'
import BorrowRequestPage from './pages/BorrowRequestPage'
import ApprovalPage from './pages/ApprovalPage'
import InstallApp from './pages/InstallApp'
import Schools from './pages/Schools'
import SecurityPanel from './pages/SecurityPanel'
import NotFound from './pages/NotFound'

const queryClient = new QueryClient()

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin', 'school_super_admin', 'guru', 'siswa']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profil"
          element={
            <ProtectedRoute allowedRoles={['siswa', 'guru', 'admin', 'school_super_admin']}>
              <Profil />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tanya-ai"
          element={
            <ProtectedRoute allowedRoles={['siswa', 'guru', 'admin', 'school_super_admin']}>
              <TanyaAI />
            </ProtectedRoute>
          }
        />
        <Route
          path="/books"
          element={
            <ProtectedRoute allowedRoles={['siswa', 'guru', 'admin', 'school_super_admin']}>
              <Books />
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <ProtectedRoute allowedRoles={['admin', 'school_super_admin', 'guru']}>
              <Categories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students"
          element={
            <ProtectedRoute allowedRoles={['admin', 'school_super_admin']}>
              <Students />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teachers"
          element={
            <ProtectedRoute allowedRoles={['admin', 'school_super_admin']}>
              <Teachers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/classes"
          element={
            <ProtectedRoute allowedRoles={['admin', 'school_super_admin']}>
              <Classes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/borrow-regular"
          element={
            <ProtectedRoute allowedRoles={['admin', 'school_super_admin', 'guru']}>
              <BorrowRegular />
            </ProtectedRoute>
          }
        />
        <Route
          path="/borrow-lesson"
          element={
            <ProtectedRoute allowedRoles={['admin', 'school_super_admin', 'guru']}>
              <BorrowLesson />
            </ProtectedRoute>
          }
        />
        <Route
          path="/returns"
          element={
            <ProtectedRoute allowedRoles={['admin', 'school_super_admin', 'guru']}>
              <Returns />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['admin', 'school_super_admin']}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/activity-log"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ActivityLog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={['admin', 'school_super_admin', 'guru']}>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/backup"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Backup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-management"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/borrow-request"
          element={
            <ProtectedRoute allowedRoles={['admin', 'school_super_admin', 'guru', 'siswa']}>
              <BorrowRequestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/approval"
          element={
            <ProtectedRoute allowedRoles={['admin', 'school_super_admin', 'guru']}>
              <ApprovalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/install"
          element={
            <ProtectedRoute allowedRoles={['admin', 'school_super_admin', 'guru', 'siswa']}>
              <InstallApp />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schools"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Schools />
            </ProtectedRoute>
          }
        />
        <Route
          path="/security"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SecurityPanel />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
