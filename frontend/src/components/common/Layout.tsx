import { type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

interface NavItem { label: string; path: string; icon: string }

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  ADMIN: [
    { label: 'Tổng quan', path: '/admin', icon: '📊' },
    { label: 'Quản lý tài khoản', path: '/admin/users', icon: '👥' },
  ],
  TEACHER: [
    { label: 'Tổng quan', path: '/teacher', icon: '📊' },
    { label: 'Môn học', path: '/teacher/subjects', icon: '📚' },
    { label: 'Đề thi', path: '/teacher/exams', icon: '📝' },
    { label: 'Phòng học/thi', path: '/teacher/rooms', icon: '🏫' },
    { label: 'Báo cáo', path: '/teacher/reports', icon: '📈' },
  ],
  STUDENT: [
    { label: 'Tổng quan', path: '/student', icon: '📊' },
    { label: 'Giám sát học', path: '/student/study', icon: '📖' },
    { label: 'Giám sát thi', path: '/student/exam', icon: '✏️' },
    { label: 'Kết quả', path: '/student/results', icon: '🏆' },
  ],
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, clearAuth } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = user ? NAV_BY_ROLE[user.role] ?? [] : []

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-5 border-b border-gray-800">
          <div className="text-lg font-bold text-white">🎓 GiámSát</div>
          <div className="text-xs text-gray-400 mt-1 capitalize">{user?.role?.toLowerCase()}</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => {
            const active = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User info + logout */}
        <div className="p-3 border-t border-gray-800">
          <div className="px-3 py-2 mb-1">
            <div className="text-sm font-medium text-white truncate">{user?.fullName}</div>
            <div className="text-xs text-gray-400 truncate">{user?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
          >
            <span>🚪</span> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
