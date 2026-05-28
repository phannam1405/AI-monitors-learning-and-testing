import { useEffect, useState } from 'react'
import { reportApi, submissionApi, evidenceApi } from '../../api'
import type { Evidence, Report, Submission } from '../../types'
import { Badge, LoadingScreen, Modal } from '../../components/common'
import ReportChart from '../../components/report/ReportChart'

export default function ResultsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'study' | 'exam'>('study')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null)
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [modal, setModal] = useState(false)

  useEffect(() => {
    Promise.all([reportApi.getMine(), submissionApi.getMine()])
      .then(([r, s]) => {
        setReports(r.data.result)
        setSubmissions(s.data.result)
      })
      .finally(() => setLoading(false))
  }, [])

  const openReport = async (report: Report) => {
    setSelectedReport(report)
    setSelectedSub(submissions.find(s => s.sessionId === report.sessionId) ?? null)
    const ev = await evidenceApi.getBySession(report.sessionId).catch(() => ({ data: { result: [] } }))
    setEvidence(ev.data.result)
    setModal(true)
  }

  const studyReports = reports.filter(r => r.mode === 'STUDY')
  const examReports = reports.filter(r => r.mode === 'EXAM')

  if (loading) return <LoadingScreen />

  const renderReportCard = (r: Report) => {
    const sub = submissions.find(s => s.sessionId === r.sessionId)
    return (
      <div key={r.id}
        className="bg-gray-800 rounded-xl p-4 border border-gray-700 cursor-pointer hover:border-gray-500 transition-colors"
        onClick={() => openReport(r)}>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-white">{r.roomName}</div>
            <div className="text-xs text-gray-400 mt-0.5">
              {new Date(r.generatedAt).toLocaleString('vi-VN')}
            </div>
          </div>
          <div className="text-right">
            {sub && (
              <div className="text-xl font-bold text-white mb-0.5">
                {sub.totalScore?.toFixed(1)}<span className="text-sm text-gray-400">/10</span>
              </div>
            )}
            <div className={`text-sm font-semibold ${r.focusPercentage >= 70 ? 'text-green-400' : r.focusPercentage >= 40 ? 'text-orange-400' : 'text-red-400'}`}>
              {r.focusPercentage}% tập trung
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400 flex-wrap">
          {r.drowsyCount > 0 && <span className="text-orange-400">😴 {r.drowsyCount} buồn ngủ</span>}
          {r.sleepCount > 0 && <span className="text-red-400">💤 {r.sleepCount} ngủ gật</span>}
          {r.phoneCount > 0 && <span className="text-purple-400">📱 {r.phoneCount} điện thoại</span>}
          {r.cheatingCount > 0 && <Badge label={`${r.cheatingCount} vi phạm`} color="red" />}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">🏆 Kết quả học tập</h1>
        <p className="text-sm text-gray-400 mt-1">Lịch sử giám sát và kết quả thi</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('study')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'study' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
          📖 Học ({studyReports.length})
        </button>
        <button
          onClick={() => setActiveTab('exam')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'exam' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
          ✏️ Thi ({examReports.length})
        </button>
      </div>

      <div className="space-y-3">
        {activeTab === 'study' && (
          studyReports.length === 0
            ? <div className="text-center py-12 text-gray-500">Chưa có buổi học nào</div>
            : studyReports.map(renderReportCard)
        )}
        {activeTab === 'exam' && (
          examReports.length === 0
            ? <div className="text-center py-12 text-gray-500">Chưa có bài thi nào</div>
            : examReports.map(renderReportCard)
        )}
      </div>

      {/* Detail Modal */}
      <Modal isOpen={modal} onClose={() => { setModal(false); setEvidence([]) }}
        title={selectedReport?.roomName ?? 'Chi tiết'} size="lg">
        {selectedReport && (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
            {/* Điểm thi (nếu có) */}
            {selectedSub && (
              <div className="bg-gray-700 rounded-xl p-4 text-center">
                <div className="text-4xl font-bold text-white">
                  {selectedSub.totalScore?.toFixed(1)}
                  <span className="text-lg text-gray-400">/10</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {selectedSub.correctCount}/{selectedSub.totalQuestions} câu đúng
                </p>
              </div>
            )}

            <ReportChart report={selectedReport} />

            {/* Chi tiết đáp án nếu là bài thi */}
            {selectedSub?.answers && selectedSub.answers.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Chi tiết đáp án</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedSub.answers.map((a, i) => (
                    <div key={a.questionId} className={`flex items-start gap-2 p-2 rounded-lg text-xs ${a.isCorrect ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
                      <span className="shrink-0">{a.isCorrect ? '✅' : '❌'}</span>
                      <div>
                        <p className="text-gray-300 mb-0.5">Câu {i + 1}: {a.questionContent}</p>
                        <p className="text-gray-400">
                          Chọn: <span className={a.isCorrect ? 'text-green-400' : 'text-red-400'}>{a.selectedAnswer ?? '(bỏ trống)'}</span>
                          {!a.isCorrect && <span> → Đúng: <span className="text-green-400">{a.correctAnswer}</span></span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence */}
            {evidence.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">🎥 Chứng cứ ({evidence.length} clip)</h4>
                <div className="grid grid-cols-2 gap-2">
                  {evidence.map(ev => (
                    <a key={ev.id} href={ev.clipUrl} target="_blank" rel="noreferrer"
                      className="bg-gray-700 rounded-lg p-2 hover:bg-gray-600 transition-colors">
                      <div className="text-xs text-gray-300 font-medium">{ev.eventType}</div>
                      <div className="text-xs text-gray-400">{new Date(ev.occurredAt).toLocaleTimeString('vi-VN')}</div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
