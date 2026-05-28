import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import type { Report } from '../../types'

const COLORS = {
  focused: '#22c55e',
  drowsy: '#f97316',
  sleep: '#ef4444',
  phone: '#a855f7',
}

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}p ${s}s` : `${s}s`
}

interface Props { report: Report }

export default function ReportChart({ report }: Props) {
  
  const pieData = [
    { name: 'Tập trung', value: report.focusedSeconds, color: COLORS.focused },
    { name: 'Buồn ngủ', value: report.drowsySeconds, color: COLORS.drowsy },
    { name: 'Ngủ gật', value: report.sleepSeconds, color: COLORS.sleep },
    { name: 'Điện thoại', value: report.phoneSeconds, color: COLORS.phone },
  ].filter(d => d.value > 0)

  // Parse timeline JSON
  let timelineData: { minute: number; state: string }[] = []
  try {
    if (report.summaryJson) timelineData = JSON.parse(report.summaryJson)
  } catch { /* ignore */ }

  const timelineBars = timelineData.map(p => ({
    minute: `${p.minute}p`,
    focused: p.state === 'focused' ? 1 : 0,
    drowsy: p.state === 'drowsy' ? 1 : 0,
    sleep: p.state === 'sleep' ? 1 : 0,
    phone: p.state === 'phone' ? 1 : 0,
    head_down: p.state === 'head_down' ? 1 : 0,
  }))

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Tập trung', value: report.focusPercentage + '%', color: 'green' },
          { label: 'Buồn ngủ', value: report.drowsyCount + ' lần', color: 'orange' },
          { label: 'Ngủ gật', value: report.sleepCount + ' lần', color: 'red' },
          { label: report.mode === 'EXAM' ? 'Gian lận' : 'Điện thoại',
            value: (report.mode === 'EXAM' ? report.cheatingCount : report.phoneCount) + ' lần',
            color: 'purple' },
        ].map(s => (
          <div key={s.label} className="bg-gray-800 rounded-xl p-3 text-center">
            <div className={`text-2xl font-bold text-${s.color}-400`}>{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Thời gian chi tiết */}
      <div className="bg-gray-800 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
        <div className="text-gray-400">⏱ Tổng thời gian tập trung</div>
        <div className="text-green-400 font-medium text-right">{fmtTime(report.focusedSeconds)}</div>
        <div className="text-gray-400">😴 Tổng thời gian buồn ngủ</div>
        <div className="text-orange-400 font-medium text-right">{fmtTime(report.drowsySeconds)}</div>
        <div className="text-gray-400">💤 Tổng thời gian ngủ gật</div>
        <div className="text-red-400 font-medium text-right">{fmtTime(report.sleepSeconds)}</div>
        <div className="text-gray-400">📱 Tổng thời gian dùng điện thoại</div>
        <div className="text-purple-400 font-medium text-right">{fmtTime(report.phoneSeconds)}</div>
        <div className="text-gray-400">👇 Số lần cúi mặt</div>
        <div className="text-blue-400 font-medium text-right">{report.headDownCount} lần</div>
      </div>

      {/* Pie chart */}
      {pieData.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Phân bố trạng thái</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: unknown) => fmtTime(Number(v))} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Timeline */}
      {timelineBars.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Timeline theo phút</h4>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={timelineBars} barSize={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="minute" tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <YAxis hide />
              <Tooltip />
              <Bar dataKey="focused" stackId="a" fill={COLORS.focused} />
              <Bar dataKey="drowsy" stackId="a" fill={COLORS.drowsy} />
              <Bar dataKey="sleep" stackId="a" fill={COLORS.sleep} />
              <Bar dataKey="phone" stackId="a" fill={COLORS.phone} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
