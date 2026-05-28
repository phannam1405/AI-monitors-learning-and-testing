import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'

import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import Layout from './components/common/Layout'
import { PrivateRoute } from './components/common'

import StudentDashboard from './pages/student/StudentDashboard'
import StudyRoom from './pages/student/StudyRoom'
import ExamRoom from './pages/student/ExamRoom'
import ResultsPage from './pages/student/ResultsPage'

import UserManagement from './pages/admin/UserManagement'
import { SubjectsPage } from './pages/teacher/SubjectsPage'
import { ExamsPage } from './pages/teacher/ExamsPage'
import { RoomsPage } from './pages/teacher/RoomsPage'
import { TeacherReportsPage } from './pages/teacher/ReportsPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function AppRoutes() {
  const { isAuthenticated, user } = useAuthStore()
  const home = user?.role === 'ADMIN' ? '/admin' : user?.role === 'TEACHER' ? '/teacher' : '/student'

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={isAuthenticated ? <Navigate to={home} replace /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to={home} replace /> : <RegisterPage />} />
      <Route path="/unauthorized" element={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-white mb-2">Không có quyền truy cập</h1>
            <p className="text-gray-400">Bạn không có quyền xem trang này.</p>
          </div>
        </div>
      } />

      {/* Admin */}
      <Route path="/admin" element={<PrivateRoute roles={['ADMIN']}><Layout>
        <div className="text-center py-12">
          <div className="text-5xl mb-4">👑</div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 mt-2">Chào mừng quản trị viên</p>
        </div>
      </Layout></PrivateRoute>} />
      <Route path="/admin/users" element={<PrivateRoute roles={['ADMIN']}><Layout><UserManagement /></Layout></PrivateRoute>} />

      {/* Teacher */}
      <Route path="/teacher" element={<PrivateRoute roles={['TEACHER']}><Layout>
        <div className="text-center py-12">
          <div className="text-5xl mb-4">👨‍🏫</div>
          <h1 className="text-2xl font-bold text-white">Teacher Dashboard</h1>
          <p className="text-gray-400 mt-2">Chào mừng giáo viên</p>
        </div>
      </Layout></PrivateRoute>} />
      <Route path="/teacher/subjects" element={<PrivateRoute roles={['TEACHER']}><Layout><SubjectsPage /></Layout></PrivateRoute>} />
      <Route path="/teacher/exams"    element={<PrivateRoute roles={['TEACHER']}><Layout><ExamsPage /></Layout></PrivateRoute>} />
      <Route path="/teacher/rooms"    element={<PrivateRoute roles={['TEACHER']}><Layout><RoomsPage /></Layout></PrivateRoute>} />
      <Route path="/teacher/reports"  element={<PrivateRoute roles={['TEACHER']}><Layout><TeacherReportsPage /></Layout></PrivateRoute>} />

      {/* Student */}
      <Route path="/student"         element={<PrivateRoute roles={['STUDENT']}><Layout><StudentDashboard /></Layout></PrivateRoute>} />
      <Route path="/student/study"   element={<PrivateRoute roles={['STUDENT']}><Layout><StudyRoom /></Layout></PrivateRoute>} />
      <Route path="/student/exam"    element={<PrivateRoute roles={['STUDENT']}><ExamRoom /></PrivateRoute>} />
      <Route path="/student/results" element={<PrivateRoute roles={['STUDENT']}><Layout><ResultsPage /></Layout></PrivateRoute>} />

      <Route path="/" element={<Navigate to={isAuthenticated ? home : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1f2937', color: '#f9fafb', border: '1px solid #374151' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#f9fafb' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#f9fafb' } },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
