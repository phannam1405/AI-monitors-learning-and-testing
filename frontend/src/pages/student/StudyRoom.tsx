import { useState } from 'react'
import { roomApi, sessionApi, reportApi } from '../../api'
import type { MonitoringSession, Report, Room } from '../../types'
import AIMonitor from '../../components/ai/AIMonitor'
import ReportChart from '../../components/report/ReportChart'
import { Button, Input } from '../../components/common'
import toast from 'react-hot-toast'

type Step = 'join' | 'monitoring' | 'report'

export default function StudyRoom() {
  const [step, setStep] = useState<Step>('join')
  const [roomCode, setRoomCode] = useState('')
  const [room, setRoom] = useState<Room | null>(null)
  const [session, setSession] = useState<MonitoringSession | null>(null)
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(false)
  const [ending, setEnding] = useState(false)

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomCode.trim()) return
    setLoading(true)
    try {
      const roomRes = await roomApi.join(roomCode.trim().toUpperCase())
      const r = roomRes.data.result
      if (r.type !== 'STUDY') {
        toast.error('Đây là phòng thi, không phải phòng học!')
        return
      }
      const sessRes = await sessionApi.start(r.id)
      setRoom(r)
      setSession(sessRes.data.result)
      setStep('monitoring')
      toast.success(`Đã vào phòng: ${r.name}`)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const handleEnd = async () => {
    if (!session) return
    setEnding(true)
    try {
      await sessionApi.end(session.id)
      const rpt = await reportApi.getBySession(session.id)
      setReport(rpt.data.result)
      setStep('report')
      toast.success('Buổi học đã kết thúc!')
    } catch {
    } finally {
      setEnding(false)
    }
  }

  // ── Step: Join ──
  if (step === 'join') {
    return (
      <div className="max-w-md mx-auto pt-12">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">📖</div>
          <h1 className="text-2xl font-bold text-white">Giám sát tự học</h1>
          <p className="text-gray-400 text-sm mt-2">
            Nhập mã phòng học từ giáo viên. Camera sẽ giám sát trong khi bạn học qua Zoom/Meet.
          </p>
        </div>

        <form onSubmit={handleJoin} className="bg-gray-800 rounded-2xl p-6 border border-gray-700 space-y-4">
          <Input
            label="Mã phòng học"
            placeholder="VD: ABC123"
            value={roomCode}
            onChange={e => setRoomCode(e.target.value.toUpperCase())}
            maxLength={10}
            className="text-center text-xl tracking-widest font-mono"
            required
            autoFocus
          />
          <Button type="submit" loading={loading} className="w-full">
            Vào phòng học
          </Button>
        </form>

        <div className="mt-6 bg-blue-900/30 rounded-xl p-4 border border-blue-800 text-sm text-blue-300 space-y-2">
          <p className="font-medium text-blue-200">ℹ️ Lưu ý:</p>
          <p>• Camera sẽ theo dõi trạng thái tập trung của bạn</p>
          <p>• Mở Zoom/Meet ở cửa sổ khác để học bình thường</p>
          <p>• AI sẽ cảnh báo nếu bạn buồn ngủ hoặc dùng điện thoại</p>
        </div>
      </div>
    )
  }

  // ── Step: Monitoring ──
  if (step === 'monitoring' && session) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">📖 {room?.name}</h2>
            <p className="text-sm text-gray-400">
              Bắt đầu: {new Date(session.startTime).toLocaleTimeString('vi-VN')}
            </p>
          </div>
          <Button variant="danger" loading={ending} onClick={handleEnd}>
            Kết thúc buổi học
          </Button>
        </div>

        {/* AI Monitor */}
        <AIMonitor sessionId={session.id} mode="STUDY" />

        {/* Tips */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 text-sm text-gray-400 space-y-1">
          <p>💡 <strong className="text-white">Giơ 10 ngón tay 1.5 giây</strong> để tạm dừng/tiếp tục giám sát</p>
          <p>💡 Giơ <strong className="text-white">1-5 ngón tay</strong> để mở link nhanh</p>
          <p>💡 Cúi mặt quá <strong className="text-white">7 giây</strong> sẽ nhận cảnh báo</p>
        </div>
      </div>
    )
  }

  // ── Step: Report ──
  if (step === 'report' && report) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <h2 className="text-xl font-bold text-white">Báo cáo buổi học</h2>
          <p className="text-gray-400 text-sm mt-1">{room?.name}</p>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <ReportChart report={report} />
        </div>

        <div className="text-center">
          <Button onClick={() => { setStep('join'); setRoomCode(''); setRoom(null); setSession(null); setReport(null) }}>
            Học buổi mới
          </Button>
        </div>
      </div>
    )
  }

  return null
}
