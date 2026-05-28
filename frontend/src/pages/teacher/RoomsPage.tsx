import { useEffect, useState } from 'react'
import { roomApi, subjectApi, examApi } from '../../api'
import type { Room, Subject, Exam } from '../../types'
import { Button, Modal, Input, Select, PageHeader, Badge } from '../../components/common'
import toast from 'react-hot-toast'

export function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({
    name: '', type: 'STUDY', subjectId: '', examId: '',
    scheduledStart: '', scheduledEnd: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([roomApi.getMine(), subjectApi.getMine(), examApi.getMine()])
      .then(([r, s, e]) => {
        setRooms(r.data.result)
        setSubjects(s.data.result)
        setExams(e.data.result)
      })
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        type: form.type,
        subjectId: Number(form.subjectId),
      }
      if (form.type === 'EXAM' && form.examId) payload.examId = Number(form.examId)
      if (form.scheduledStart) payload.scheduledStart = form.scheduledStart
      if (form.scheduledEnd) payload.scheduledEnd = form.scheduledEnd

      const res = await roomApi.create(payload)
      setRooms(r => [res.data.result, ...r])
      setModal(false)
      toast.success(`Tạo phòng thành công! Mã: ${res.data.result.code}`)
    } catch {
    } finally { setLoading(false) }
  }

  const handleToggle = async (id: number) => {
    const res = await roomApi.toggle(id)
    setRooms(rs => rs.map(r => r.id === id ? res.data.result : r))
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Xoá phòng này?')) return
    await roomApi.delete(id)
    setRooms(rs => rs.filter(r => r.id !== id))
    toast.success('Đã xoá phòng')
  }

  return (
    <div>
      <PageHeader title="🏫 Phòng học / Thi" subtitle="Tạo và quản lý phòng giám sát"
        action={<Button onClick={() => setModal(true)}>+ Tạo phòng</Button>} />

      <div className="space-y-3">
        {rooms.map(room => (
          <div key={room.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{room.type === 'STUDY' ? '📖' : '✏️'}</span>
                <div>
                  <div className="font-semibold text-white">{room.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge label={room.type === 'STUDY' ? 'Học' : 'Thi'} color={room.type === 'STUDY' ? 'blue' : 'purple'} />
                    <Badge label={room.subjectName} color="gray" />
                    <span className="font-mono text-blue-400 text-sm bg-blue-900/30 px-2 py-0.5 rounded">
                      {room.code}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge label={room.isOpen ? 'Đang mở' : 'Đã đóng'} color={room.isOpen ? 'green' : 'gray'} />
                <Button size="sm" variant={room.isOpen ? 'danger' : 'success'} onClick={() => handleToggle(room.id)}>
                  {room.isOpen ? 'Đóng' : 'Mở'}
                </Button>
                <button onClick={() => handleDelete(room.id)} className="text-gray-500 hover:text-red-400 text-sm px-2">🗑</button>
              </div>
            </div>
            {room.examTitle && (
              <p className="text-xs text-gray-400 mt-2 ml-11">📝 {room.examTitle}</p>
            )}
          </div>
        ))}
        {rooms.length === 0 && (
          <div className="text-center py-12 text-gray-500">Chưa có phòng nào</div>
        )}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Tạo phòng mới" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Tên phòng" placeholder="Phòng học Lập Trình Web" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <Select label="Loại phòng" value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            options={[{ value: 'STUDY', label: '📖 Phòng học' }, { value: 'EXAM', label: '✏️ Phòng thi' }]} />
          <Select label="Môn học" value={form.subjectId}
            onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}
            options={[{ value: '', label: '-- Chọn môn --' }, ...subjects.map(s => ({ value: String(s.id), label: `${s.code} - ${s.name}` }))]}
            required />
          {form.type === 'EXAM' && (
            <Select label="Đề thi" value={form.examId}
              onChange={e => setForm(f => ({ ...f, examId: e.target.value }))}
              options={[{ value: '', label: '-- Chọn đề thi --' }, ...exams.filter(ex => ex.subjectId === Number(form.subjectId)).map(ex => ({ value: String(ex.id), label: ex.title }))]} />
          )}
          <Input label="Thời gian bắt đầu (tuỳ chọn)" type="datetime-local" value={form.scheduledStart}
            onChange={e => setForm(f => ({ ...f, scheduledStart: e.target.value }))} />
          <Input label="Thời gian kết thúc (tuỳ chọn)" type="datetime-local" value={form.scheduledEnd}
            onChange={e => setForm(f => ({ ...f, scheduledEnd: e.target.value }))} />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setModal(false)}>Huỷ</Button>
            <Button type="submit" loading={loading}>Tạo phòng</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
