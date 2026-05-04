import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

// Test: ONE real page only
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'

const SafePlaceholder = ({ name }: { name: string }) => (
  <div style={{ padding: 50, fontFamily: 'monospace' }}>
    <h1 style={{ color: 'green' }}>{name} SAFE</h1>
    <p>This route is working correctly.</p>
  </div>
)

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* All routes with safe placeholders, except Dashboard */}
        <Route path="/login" element={<SafePlaceholder name="LOGIN" />} />
        <Route path="/debug-supabase" element={<SafePlaceholder name="DEBUG" />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin', 'school_super_admin']}>
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
        <Route path="/books" element={<SafePlaceholder name="BOOKS" />} />
        <Route path="/categories" element={<SafePlaceholder name="CATEGORIES" />} />
        <Route path="/students" element={<SafePlaceholder name="STUDENTS" />} />
        <Route path="/teachers" element={<SafePlaceholder name="TEACHERS" />} />
        <Route path="/classes" element={<SafePlaceholder name="CLASSES" />} />
        <Route path="/borrow-regular" element={<SafePlaceholder name="BORROW REGULAR" />} />
        <Route path="/borrow-lesson" element={<SafePlaceholder name="BORROW LESSON" />} />
        <Route path="/returns" element={<SafePlaceholder name="RETURNS" />} />
        <Route path="/reports" element={<SafePlaceholder name="REPORTS" />} />
        <Route path="/activity-log" element={<SafePlaceholder name="ACTIVITY LOG" />} />
        <Route path="/settings" element={<SafePlaceholder name="SETTINGS" />} />
        <Route path="/backup" element={<SafePlaceholder name="BACKUP" />} />
        <Route path="/admin-management" element={<SafePlaceholder name="ADMIN MGMT" />} />
        <Route path="/borrow-request" element={<SafePlaceholder name="BORROW REQUEST" />} />
        <Route path="/approval" element={<SafePlaceholder name="APPROVAL" />} />
        <Route path="/install" element={<SafePlaceholder name="INSTALL" />} />
        <Route path="/schools" element={<SafePlaceholder name="SCHOOLS" />} />
        <Route path="/security" element={<SafePlaceholder name="SECURITY" />} />
        <Route path="*" element={<SafePlaceholder name="404 NOT FOUND" />} />
      </Routes>
    </HashRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
)
