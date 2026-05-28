import { useState, useEffect, useRef, useCallback } from 'react'
import { roomApi, sessionApi, examApi, submissionApi, reportApi } from '../../api'
import type { Exam, MonitoringSession, Question, Report, Room, Submission } from '../../types'
import AIMonitor from '../../components/ai/AIMonitor'
import ReportChart from '../../components/report/ReportChart'
import { Button, Input } from '../../components/common'
import toast from 'react-hot-toast'

type Step = 'join' | 'password' | 'exam' | 'result'

export default function ExamRoom() {
  const [step, setStep] = useState<Step>('join')
  const [roomCode, setRoomCode] = useState('')
  const [examPassword, setExamPassword] = useState('')
  const [room, setRoom] = useState<Room | null>(null)
  const [exam, setExam] = useState<Exam | null>(null)
  const [session, setSession] = useState<MonitoringSession | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentQ, setCurrentQ] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // ── Step 1: Join room ──
  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await roomApi.join(roomCode.trim().toUpperCase())
      const r = res.data.result
      if (r.type !== 'EXAM') { toast.error('Đây là phòng học, không phải phòng thi!'); return }
      if (!r.examId) { toast.error('Phòng chưa có đề thi'); return }
      setRoom(r)
      setStep('password')
    } catch {
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: Verify exam password ──
  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!room?.examId) return
    setLoading(true)
    try {
      const ok = await examApi.verifyPassword(room.examId, examPassword)
      if (!ok.data.result) { toast.error('Mật khẩu không đúng'); return }

      // Lấy đề thi (xáo câu/đáp án)
      const examRes = await examApi.take(room.examId)
      const examData = examRes.data.result

      // Bắt đầu session
      const sessRes = await sessionApi.start(room.id)

      setExam(examData)
      setQuestions(examData.questions ?? [])
      setSession(sessRes.data.result)
      setTimeLeft((examData.durationMinutes ?? 30) * 60)
      setStep('exam')

      // Vào fullscreen
      try { await containerRef.current?.requestFullscreen() } catch { /* ignore */ }

      toast.success('Bắt đầu làm bài!')
    } catch {
    } finally {
      setLoading(false)
    }
  }

  // ── Timer countdown ──
  useEffect(() => {
    if (step !== 'exam') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          handleSubmit(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [step])

  // ── Submit ──
  const handleSubmit = useCallback(async (isAuto = false) => {
    if (!session) return
    if (timerRef.current) clearInterval(timerRef.current)
    setLoading(true)
    try {
      const subRes = await submissionApi.submit({
        sessionId: session.id,
        answers,
        isAutoSubmit: isAuto,
      })
      await sessionApi.end(session.id)
      const rpt = await reportApi.getBySession(session.id)
      setSubmission(subRes.data.result)
      setReport(rpt.data.result)
      setStep('result')
      if (document.fullscreenElement) document.exitFullscreen()
      toast.success(isAuto ? 'Hết giờ! Bài đã được tự nộp.' : 'Nộp bài thành công!')
    } catch {
    } finally {
      setLoading(false)
    }
  }, [session, answers])

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const answered = Object.keys(answers).length

  // ── Render ──
  if (step === 'join') return (
    <div className="max-w-md mx-auto pt-12">
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">✏️</div>
        <h1 className="text-2xl font-bold text-white">Vào phòng thi</h1>
        <p className="text-gray-400 text-sm mt-2">Nhập mã phòng thi từ giáo viên</p>
      </div>
      <form onSubmit={handleJoinRoom} className="bg-gray-800 rounded-2xl p-6 border border-gray-700 space-y-4">
        <Input label="Mã phòng thi" placeholder="VD: XYZ789" value={roomCode}
          onChange={e => setRoomCode(e.target.value.toUpperCase())} maxLength={10}
          className="text-center text-xl tracking-widest font-mono" required autoFocus />
        <Button type="submit" loading={loading} className="w-full">Tiếp tục</Button>
      </form>
      <div className="mt-4 bg-red-900/30 rounded-xl p-4 border border-red-800 text-sm text-red-300 space-y-1">
        <p className="font-medium text-red-200">⚠️ Lưu ý khi thi:</p>
        <p>• Thoát fullscreen sẽ bị ghi nhận vi phạm</p>
        <p>• Cúi mặt quá 1.5 giây bị đánh dấu gian lận</p>
        <p>• Không có điều khiển ngón tay trong phòng thi</p>
      </div>
    </div>
  )

  if (step === 'password') return (
    <div className="max-w-md mx-auto pt-12">
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">🔐</div>
        <h1 className="text-xl font-bold text-white">{room?.name}</h1>
        <p className="text-gray-400 text-sm mt-1">{room?.subjectName} · {room?.examTitle}</p>
      </div>
      <form onSubmit={handleVerifyPassword} className="bg-gray-800 rounded-2xl p-6 border border-gray-700 space-y-4">
        <Input label="Mật khẩu đề thi" type="password" placeholder="Nhập mật khẩu từ giáo viên"
          value={examPassword} onChange={e => setExamPassword(e.target.value)} required autoFocus />
        <Button type="submit" loading={loading} className="w-full">Vào thi</Button>
      </form>
    </div>
  )

  if (step === 'exam' && session && exam) {
    const q = questions[currentQ]
    return (
      <div ref={containerRef} className="min-h-screen bg-gray-950 flex flex-col">
        {/* Top bar */}
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="text-white font-medium text-sm">{exam.title}</div>
          <div className={`font-mono font-bold text-lg ${timeLeft < 300 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
            ⏱ {fmt(timeLeft)}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">{answered}/{questions.length} câu</span>
            <Button variant="danger" size="sm" loading={loading}
              onClick={() => { if (confirm('Xác nhận nộp bài?')) handleSubmit(false) }}>
              Nộp bài
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Camera sidebar */}
          <div className="w-64 bg-gray-900 border-r border-gray-800 p-3 shrink-0">
            <AIMonitor sessionId={session.id} mode="EXAM" />
            {/* Question navigator */}
            <div className="mt-3">
              <p className="text-xs text-gray-400 mb-2">Câu hỏi</p>
              <div className="grid grid-cols-5 gap-1">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentQ(i)}
                    className={`w-full aspect-square rounded text-xs font-medium transition-colors ${
                      i === currentQ ? 'bg-blue-600 text-white'
                        : answers[questions[i].id] ? 'bg-green-700 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Question area */}
          <div className="flex-1 overflow-auto p-6">
            {q && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-start gap-3">
                  <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full shrink-0">
                    {currentQ + 1}
                  </span>
                  <p className="text-white text-base leading-relaxed">{q.content}</p>
                </div>

                <div className="space-y-3">
                  {(['A', 'B', 'C', 'D'] as const).map(opt => {
                    const text = q[`option${opt}` as keyof Question] as string
                    const selected = answers[q.id] === opt
                    return (
                      <button
                        key={opt}
                        onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                          selected
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-750'
                        }`}
                      >
                        <span className={`font-bold mr-3 ${selected ? 'text-white' : 'text-blue-400'}`}>{opt}.</span>
                        {text}
                      </button>
                    )
                  })}
                </div>

                {/* Prev/Next */}
                <div className="flex justify-between pt-2">
                  <Button variant="ghost" onClick={() => setCurrentQ(i => Math.max(0, i - 1))} disabled={currentQ === 0}>
                    ← Câu trước
                  </Button>
                  <Button onClick={() => setCurrentQ(i => Math.min(questions.length - 1, i + 1))} disabled={currentQ === questions.length - 1}>
                    Câu tiếp →
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (step === 'result' && submission && report) return (
    <div className="max-w-2xl mx-auto space-y-6 py-6">
      {/* Score */}
      <div className="text-center bg-gray-800 rounded-2xl p-8 border border-gray-700">
        <div className="text-6xl font-bold text-white mb-2">
          {submission.totalScore?.toFixed(1) ?? '—'}
          <span className="text-2xl text-gray-400">/10</span>
        </div>
        <p className="text-gray-400">
          {submission.correctCount}/{submission.totalQuestions} câu đúng
          {submission.isAutoSubmitted && ' · Tự nộp (hết giờ)'}
        </p>
        <div className={`mt-3 text-sm font-medium ${report.cheatingCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
          {report.cheatingCount > 0
            ? `⚠️ Phát hiện ${report.cheatingCount} vi phạm — Chờ giáo viên xem xét`
            : '✅ Không phát hiện vi phạm'}
        </div>
      </div>

      {/* Báo cáo */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <h3 className="font-semibold text-white mb-4">Báo cáo giám sát</h3>
        <ReportChart report={report} />
      </div>

      {/* Chi tiết đáp án */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <h3 className="font-semibold text-white">Chi tiết đáp án</h3>
        </div>
        <div className="divide-y divide-gray-700">
          {submission.answers?.map((a, i) => (
            <div key={a.questionId} className={`p-4 ${a.isCorrect ? 'bg-green-900/10' : 'bg-red-900/10'}`}>
              <div className="flex items-start gap-3">
                <span className={`text-lg shrink-0 ${a.isCorrect ? '✅' : '❌'}`}>
                  {a.isCorrect ? '✅' : '❌'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 mb-1">Câu {i + 1}: {a.questionContent}</p>
                  <p className="text-xs text-gray-400">
                    Bạn chọn: <span className={a.isCorrect ? 'text-green-400' : 'text-red-400'}>{a.selectedAnswer ?? '(bỏ trống)'}</span>
                    {!a.isCorrect && <span> · Đáp án: <span className="text-green-400">{a.correctAnswer}</span></span>}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <Button onClick={() => { setStep('join'); setRoomCode(''); setExamPassword('') }}>
          Về trang chủ
        </Button>
      </div>
    </div>
  )

  return null
}
