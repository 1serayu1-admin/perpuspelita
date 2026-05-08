import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import { SettingsProvider } from '@/contexts/SettingsContext'
import type { AppRole } from '@/lib/types'
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

// Role groups — sumber tunggal agar mudah diubah
const ROLES = {
  all:    ['global_super_admin', 'admin', 'school_super_admin', 'guru', 'siswa'] as AppRole[],
  admin:  ['global_super_admin', 'admin', 'school_super_admin'] as AppRole[],
  staff:  ['global_super_admin', 'admin', 'school_super_admin', 'guru'] as AppRole[],
  member: ['global_super_admin', 'siswa', 'guru'] as AppRole[],
  superOnly: ['global_super_admin'] as AppRole[],
}

function App() {
  return null; // Routes moved to root
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />

              {/* Semua role terautentikasi */}
              <Route path="/dashboard"     element={<ProtectedRoute allowedRoles={ROLES.all}><Dashboard /></ProtectedRoute>} />
              <Route path="/books"         element={<ProtectedRoute allowedRoles={ROLES.all}><Books /></ProtectedRoute>} />
              <Route path="/tanya-ai"      element={<ProtectedRoute allowedRoles={ROLES.all}><TanyaAI /></ProtectedRoute>} />
              <Route path="/profil"        element={<ProtectedRoute allowedRoles={ROLES.all}><Profil /></ProtectedRoute>} />
              <Route path="/install"       element={<ProtectedRoute allowedRoles={ROLES.all}><InstallApp /></ProtectedRoute>} />

              {/* Staff (admin + school_super_admin + guru) */}
              <Route path="/categories"    element={<ProtectedRoute allowedRoles={ROLES.staff}><Categories /></ProtectedRoute>} />
              <Route path="/borrow-regular" element={<ProtectedRoute allowedRoles={ROLES.staff}><BorrowRegular /></ProtectedRoute>} />
              <Route path="/borrow-lesson" element={<ProtectedRoute allowedRoles={ROLES.staff}><BorrowLesson /></ProtectedRoute>} />
              <Route path="/returns"       element={<ProtectedRoute allowedRoles={ROLES.staff}><Returns /></ProtectedRoute>} />
              <Route path="/approval"      element={<ProtectedRoute allowedRoles={ROLES.staff}><ApprovalPage /></ProtectedRoute>} />
              <Route path="/settings"      element={<ProtectedRoute allowedRoles={ROLES.staff}><Settings /></ProtectedRoute>} />

              {/* Member (siswa + guru bisa request pinjam) */}
              <Route path="/borrow-request" element={<ProtectedRoute allowedRoles={ROLES.member}><BorrowRequestPage /></ProtectedRoute>} />

              {/* Admin & school_super_admin */}
              <Route path="/students"      element={<ProtectedRoute allowedRoles={ROLES.admin}><Students /></ProtectedRoute>} />
              <Route path="/teachers"      element={<ProtectedRoute allowedRoles={ROLES.admin}><Teachers /></ProtectedRoute>} />
              <Route path="/classes"       element={<ProtectedRoute allowedRoles={ROLES.admin}><Classes /></ProtectedRoute>} />
              <Route path="/reports"       element={<ProtectedRoute allowedRoles={ROLES.admin}><Reports /></ProtectedRoute>} />

              {/* Admin only */}
              <Route path="/activity-log"  element={<ProtectedRoute allowedRoles={ROLES.superOnly}><ActivityLog /></ProtectedRoute>} />
              <Route path="/backup"        element={<ProtectedRoute allowedRoles={ROLES.superOnly}><Backup /></ProtectedRoute>} />
              <Route path="/admin-management" element={<ProtectedRoute allowedRoles={ROLES.superOnly}><AdminManagement /></ProtectedRoute>} />
              <Route path="/users"         element={<ProtectedRoute allowedRoles={['global_super_admin']}><Users /></ProtectedRoute>} />
              <Route path="/schools"       element={<ProtectedRoute allowedRoles={ROLES.superOnly}><Schools /></ProtectedRoute>} />
              <Route path="/security"      element={<ProtectedRoute allowedRoles={ROLES.superOnly}><SecurityPanel /></ProtectedRoute>} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <Toaster richColors position="top-right" />
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
