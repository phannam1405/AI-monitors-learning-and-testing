import { useEffect, useState } from 'react'
import { roomApi, evidenceApi } from '../../api'
import type { Evidence, Report, Room } from '../../types'
import { Badge, LoadingScreen, Modal, PageHeader, Select } from '../../components/common'
import ReportChart from '../../components/report/ReportChart'

const EVENT_LABEL: Record<string, string> = {
  DROWSY: '😴 Buồn ngủ', SLEEP: '💤 Ngủ gật', PHONE: '📱 Điện thoại',
  HEAD_DOWN: '👇 Cúi mặt', CHEATING: '⚠️ Gian lận',
  FULLSCREEN_EXIT: '🖥 Thoát fullscreen', TAB_HIDDEN: '📑 Chuyển tab',
}
const EVENT_COLOR: Record<string, 'orange' | 'red' | 'purple' | 'blue' | 'red' | 'gray'> = {
  DROWSY: 'orange', SLEEP: 'red', PHONE: 'purple',
  HEAD_DOWN: 'blue', CHEATING: 'red', FULLSCREEN_EXIT: 'gray', TAB_HIDDEN: 'gray',
}

export function TeacherReportsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoomId, setSelectedRoomId] = useState<string>('')
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [evidenceLoading, setEvidenceLoading] = useState(false)
  const [detailModal, setDetailModal] = useState(false)
  const [videoModal, setVideoModal] = useState<string | null>(null)

  useEffect(() => {
    roomApi.getMine().then(r => setRooms(r.data.result))
  }, [])

  useEffect(() => {
    if (!selectedRoomId) return
    setLoading(true)
    roomApi.getReports(Number(selectedRoomId))
      .then(r => setReports(r.data.result))
      .finally(() => setLoading(false))
  }, [selectedRoomId])

  const openDetail = async (report: Report) => {
    setSelectedReport(report)
    setDetailModal(true)
    setEvidenceLoading(true)
    try {
      const res = await evidenceApi.getBySession(report.sessionId)
      setEvidence(res.data.result)
    } catch {
    } finally {
      setEvidenceLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="📈 Báo cáo sinh viên" subtitle="Xem kết quả giám sát theo phòng" />

      <div className="mb-6 max-w-sm">
        <Select
          label="Chọn phòng"
          value={selectedRoomId}
          onChange={e => setSelectedRoomId(e.target.value)}
          options={[
            { value: '', label: '-- Chọn phòng để xem báo cáo --' },
            ...rooms.map(r => ({ value: String(r.id), label: `${r.code} — ${r.name} (${r.type})` })),
          ]}
        />
      </div>

      {loading ? (
        <LoadingScreen />
      ) : reports.length === 0 && selectedRoomId ? (
        <div className="text-center py-12 text-gray-500 bg-gray-800 rounded-xl border border-gray-700">
          Chưa có báo cáo nào trong phòng này
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <div
              key={r.id}
              className="bg-gray-800 rounded-xl p-4 border border-gray-700 cursor-pointer hover:border-gray-500 transition-colors"
              onClick={() => openDetail(r)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">{r.studentName}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {r.roomName} · {r.mode === 'EXAM' ? '✏️ Thi' : '📖 Học'} ·{' '}
                    {new Date(r.generatedAt).toLocaleString('vi-VN')}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {r.cheatingCount > 0 && (
                    <Badge label={`${r.cheatingCount} vi phạm`} color="red" />
                  )}
                  <div className={`text-lg font-bold ${r.focusPercentage >= 70 ? 'text-green-400' : r.focusPercentage >= 40 ? 'text-orange-400' : 'text-red-400'}`}>
                    {r.focusPercentage}%
                  </div>
                  <span className="text-gray-500 text-xs">tập trung</span>
                </div>
              </div>

              {/* Mini stats */}
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                {r.drowsyCount > 0 && <span>😴 {r.drowsyCount} lần buồn ngủ</span>}
                {r.sleepCount > 0 && <span>💤 {r.sleepCount} lần ngủ gật</span>}
                {r.phoneCount > 0 && <span>📱 {r.phoneCount} lần điện thoại</span>}
                {r.headDownCount > 0 && <span>👇 {r.headDownCount} lần cúi</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={detailModal} onClose={() => { setDetailModal(false); setEvidence([]) }}
        title={`Báo cáo: ${selectedReport?.studentName}`} size="lg">
        {selectedReport && (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
            <ReportChart report={selectedReport} />

            {/* Evidence clips */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">🎥 Chứng cứ vi phạm</h4>
              {evidenceLoading ? (
                <p className="text-gray-400 text-sm text-center py-4">Đang tải chứng cứ...</p>
              ) : evidence.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">Không có chứng cứ nào</p>
              ) : (
                <div className="space-y-2">
                  {evidence.map(ev => (
                    <div key={ev.id}
                      className="flex items-center justify-between bg-gray-700 rounded-lg px-3 py-2.5 cursor-pointer hover:bg-gray-600 transition-colors"
                      onClick={() => setVideoModal(ev.clipUrl)}>
                      <div className="flex items-center gap-3">
                        <Badge label={EVENT_LABEL[ev.eventType] ?? ev.eventType} color={EVENT_COLOR[ev.eventType] ?? 'gray'} />
                        <span className="text-xs text-gray-400">
                          {new Date(ev.occurredAt).toLocaleTimeString('vi-VN')}
                        </span>
                        {ev.confidence && (
                          <span className="text-xs text-gray-500">
                            {(ev.confidence * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                      <span className="text-blue-400 text-xs">▶ Xem</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Video Modal */}
      {videoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setVideoModal(null)}
        >
          <div className="bg-gray-900 rounded-2xl overflow-hidden max-w-2xl w-full border border-gray-700"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-gray-700">
              <span className="text-sm text-white font-medium">🎥 Clip chứng cứ</span>
              <button onClick={() => setVideoModal(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <video
              src={videoModal}
              controls
              autoPlay
              className="w-full max-h-80 bg-black"
            />
          </div>
        </div>
      )}
    </div>
  )
}
