import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { reportApi, sessionApi } from '../../api'
import { useAuthStore } from '../../store/authStore'
import type { MonitoringSession, Report } from '../../types'
import { Badge, LoadingScreen } from '../../components/common'

export default function StudentDashboard() {
  const { user } = useAuthStore()
  const [sessions, setSessions] = useState<MonitoringSession[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([sessionApi.myHistory(), reportApi.getMine()])
      .then(([s, r]) => {
        setSessions(s.data.result)
        setReports(r.data.result)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingScreen />

  const totalSessions = sessions.length
  const avgFocus = reports.length
    ? (reports.reduce((a, r) => a + r.focusPercentage, 0) / reports.length).toFixed(1)
    : '—'
  const totalCheating = reports.reduce((a, r) => a + r.cheatingCount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Xin chào, {user?.fullName} 👋</h1>
        <p className="text-gray-400 text-sm mt-1">Chọn chế độ giám sát để bắt đầu</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/student/study" className="group bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl p-6 border border-blue-700 hover:border-blue-500 transition-colors">
          <div className="text-3xl mb-3">📖</div>
          <h3 className="text-lg font-semibold text-white">Giám sát tự học</h3>
          <p className="text-blue-300 text-sm mt-1">Join phòng và bật giám sát AI khi học qua Zoom/Meet</p>
          <div className="mt-4 text-blue-400 text-sm group-hover:text-blue-300">Vào học →</div>
        </Link>

        <Link to="/student/exam" className="group bg-gradient-to-br from-purple-900 to-purple-800 rounded-2xl p-6 border border-purple-700 hover:border-purple-500 transition-colors">
          <div className="text-3xl mb-3">✏️</div>
          <h3 className="text-lg font-semibold text-white">Giám sát thi</h3>
          <p className="text-purple-300 text-sm mt-1">Nhập mã phòng thi và làm bài với AI giám sát nghiêm ngặt</p>
          <div className="mt-4 text-purple-400 text-sm group-hover:text-purple-300">Vào thi →</div>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
          <div className="text-2xl font-bold text-blue-400">{totalSessions}</div>
          <div className="text-xs text-gray-400 mt-1">Buổi học/thi</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
          <div className="text-2xl font-bold text-green-400">{avgFocus}%</div>
          <div className="text-xs text-gray-400 mt-1">Tập trung TB</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
          <div className="text-2xl font-bold text-red-400">{totalCheating}</div>
          <div className="text-xs text-gray-400 mt-1">Vi phạm</div>
        </div>
      </div>

      {/* Recent sessions */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h3 className="font-semibold text-white">Lịch sử gần đây</h3>
          <Link to="/student/results" className="text-sm text-blue-400 hover:text-blue-300">Xem tất cả →</Link>
        </div>
        {sessions.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">Chưa có buổi học/thi nào</div>
        ) : (
          <div className="divide-y divide-gray-700">
            {sessions.slice(0, 5).map(s => {
              const report = reports.find(r => r.sessionId === s.id)
              return (
                <div key={s.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white">{s.roomName}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(s.startTime).toLocaleString('vi-VN')} · {s.mode === 'STUDY' ? '📖 Học' : '✏️ Thi'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {report && (
                      <span className="text-green-400 text-sm font-medium">
                        {report.focusPercentage}%
                      </span>
                    )}
                    <Badge
                      label={s.status === 'COMPLETED' ? 'Hoàn thành' : s.status === 'ACTIVE' ? 'Đang học' : 'Gián đoạn'}
                      color={s.status === 'COMPLETED' ? 'green' : s.status === 'ACTIVE' ? 'blue' : 'orange'}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
