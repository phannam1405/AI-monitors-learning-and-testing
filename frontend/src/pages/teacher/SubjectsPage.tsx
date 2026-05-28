import { useEffect, useState } from 'react'
import { subjectApi } from '../../api'
import type { Subject } from '../../types'
import { Button, Modal, Input, PageHeader, Badge } from '../../components/common'
import toast from 'react-hot-toast'

export function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name: '', code: '', description: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => { subjectApi.getMine().then(r => setSubjects(r.data.result)) }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await subjectApi.create(form)
      setSubjects(s => [...s, res.data.result])
      setModal(false)
      setForm({ name: '', code: '', description: '' })
      toast.success('Tạo môn học thành công!')
    } catch {
    } finally { setLoading(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Xoá môn học này?')) return
    await subjectApi.delete(id)
    setSubjects(s => s.filter(x => x.id !== id))
    toast.success('Đã xoá')
  }

  return (
    <div>
      <PageHeader title="📚 Môn học" subtitle="Quản lý các môn học của bạn"
        action={<Button onClick={() => setModal(true)}>+ Tạo môn học</Button>} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map(s => (
          <div key={s.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-white">{s.name}</div>
                <Badge label={s.code} color="blue" />
              </div>
              <button onClick={() => handleDelete(s.id)} className="text-gray-500 hover:text-red-400 text-sm">🗑</button>
            </div>
            {s.description && <p className="text-xs text-gray-400 line-clamp-2">{s.description}</p>}
            <p className="text-xs text-gray-500">{new Date(s.createdAt).toLocaleDateString('vi-VN')}</p>
          </div>
        ))}
        {subjects.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-500">Chưa có môn học nào</div>
        )}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Tạo môn học mới">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Tên môn học" placeholder="Lập Trình Web" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <Input label="Mã môn (code)" placeholder="CNWEB" value={form.code}
            onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required />
          <div>
            <label className="block text-sm text-gray-300 mb-1">Mô tả</label>
            <textarea className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm resize-none h-20"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setModal(false)}>Huỷ</Button>
            <Button type="submit" loading={loading}>Tạo</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
