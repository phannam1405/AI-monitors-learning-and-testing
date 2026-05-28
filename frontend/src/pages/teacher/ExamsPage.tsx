import { useEffect, useState } from 'react'
import { examApi, subjectApi } from '../../api'
import type { Exam, Question, Subject } from '../../types'
import { Button, Modal, Input, Select, PageHeader, Badge } from '../../components/common'
import toast from 'react-hot-toast'

type View = 'list' | 'questions'

export function ExamsPage() {
  const [view, setView] = useState<View>('list')
  const [exams, setExams] = useState<Exam[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])

  const [createModal, setCreateModal] = useState(false)
  const [questionModal, setQuestionModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const [examForm, setExamForm] = useState({
    subjectId: '', title: '', password: '', durationMinutes: '30',
    shuffleQuestions: true, shuffleAnswers: true,
  })
  const [qForm, setQForm] = useState({
    content: '', optionA: '', optionB: '', optionC: '', optionD: '',
    correctAnswer: 'A',
  })

  useEffect(() => {
    Promise.all([examApi.getMine(), subjectApi.getMine()]).then(([e, s]) => {
      setExams(e.data.result)
      setSubjects(s.data.result)
    })
  }, [])

  const openExam = async (exam: Exam) => {
    const res = await examApi.getOne(exam.id)
    setSelectedExam(res.data.result)
    setQuestions(res.data.result.questions ?? [])
    setView('questions')
  }

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await examApi.create({
        ...examForm,
        subjectId: Number(examForm.subjectId),
        durationMinutes: Number(examForm.durationMinutes),
      })
      setExams(ex => [res.data.result, ...ex])
      setCreateModal(false)
      toast.success('Tạo đề thi thành công!')
    } catch {
    } finally { setLoading(false) }
  }

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedExam) return
    setLoading(true)
    try {
      const res = await examApi.addQuestion(selectedExam.id, qForm)
      setQuestions(qs => [...qs, res.data.result])
      setQForm({ content: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A' })
      setQuestionModal(false)
      toast.success('Đã thêm câu hỏi!')
    } catch {
    } finally { setLoading(false) }
  }

  const handleDeleteQuestion = async (qId: number) => {
    if (!confirm('Xoá câu hỏi này?')) return
    await examApi.deleteQuestion(qId)
    setQuestions(qs => qs.filter(q => q.id !== qId))
    toast.success('Đã xoá câu hỏi')
  }

  const handleToggleExam = async (id: number) => {
    const res = await examApi.toggle(id)
    setExams(es => es.map(e => e.id === id ? res.data.result : e))
  }

  const handleDeleteExam = async (id: number) => {
    if (!confirm('Xoá đề thi này? Dữ liệu sẽ không thể khôi phục!')) return
    await examApi.delete(id)
    setExams(es => es.filter(e => e.id !== id))
    toast.success('Đã xoá đề thi')
  }

  // ── View: Questions ──
  if (view === 'questions' && selectedExam) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setView('list')} className="text-gray-400 hover:text-white text-sm">← Quay lại</button>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">{selectedExam.title}</h2>
            <p className="text-xs text-gray-400">{selectedExam.subjectName} · {selectedExam.durationMinutes} phút · {questions.length} câu</p>
          </div>
          <Button onClick={() => setQuestionModal(true)}>+ Thêm câu hỏi</Button>
        </div>

        <div className="space-y-3">
          {questions.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-gray-800 rounded-xl border border-gray-700">
              Chưa có câu hỏi nào. Thêm câu hỏi đầu tiên!
            </div>
          )}
          {questions.map((q, i) => (
            <div key={q.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white mb-3">
                    <span className="text-blue-400 mr-2">Câu {i + 1}.</span>{q.content}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['A', 'B', 'C', 'D'] as const).map(opt => (
                      <div key={opt}
                        className={`text-xs px-3 py-1.5 rounded-lg border ${
                          q.correctAnswer === opt
                            ? 'bg-green-900/40 border-green-700 text-green-300'
                            : 'bg-gray-700 border-gray-600 text-gray-300'
                        }`}>
                        <span className="font-bold mr-1">{opt}.</span>
                        {q[`option${opt}` as keyof Question] as string}
                        {q.correctAnswer === opt && <span className="ml-1">✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={() => handleDeleteQuestion(q.id)} className="text-gray-500 hover:text-red-400 shrink-0">🗑</button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal thêm câu hỏi */}
        <Modal isOpen={questionModal} onClose={() => setQuestionModal(false)} title="Thêm câu hỏi" size="lg">
          <form onSubmit={handleAddQuestion} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Nội dung câu hỏi</label>
              <textarea
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={qForm.content} onChange={e => setQForm(f => ({ ...f, content: e.target.value }))} required
                placeholder="Nhập câu hỏi..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(['A', 'B', 'C', 'D'] as const).map(opt => (
                <Input key={opt} label={`Đáp án ${opt}`} placeholder={`Nhập đáp án ${opt}...`}
                  value={qForm[`option${opt}` as keyof typeof qForm] as string}
                  onChange={e => setQForm(f => ({ ...f, [`option${opt}`]: e.target.value }))} required />
              ))}
            </div>
            <Select label="Đáp án đúng" value={qForm.correctAnswer}
              onChange={e => setQForm(f => ({ ...f, correctAnswer: e.target.value }))}
              options={['A', 'B', 'C', 'D'].map(v => ({ value: v, label: `Đáp án ${v}` }))} />
            <div className="flex justify-end gap-3">
              <Button variant="ghost" type="button" onClick={() => setQuestionModal(false)}>Huỷ</Button>
              <Button type="submit" loading={loading}>Thêm câu hỏi</Button>
            </div>
          </form>
        </Modal>
      </div>
    )
  }

  // ── View: List ──
  return (
    <div>
      <PageHeader title="📝 Đề thi" subtitle="Quản lý đề thi trắc nghiệm"
        action={<Button onClick={() => setCreateModal(true)}>+ Tạo đề thi</Button>} />

      <div className="space-y-3">
        {exams.map(exam => (
          <div key={exam.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex-1 cursor-pointer" onClick={() => openExam(exam)}>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white hover:text-blue-300 transition-colors">{exam.title}</span>
                  <Badge label={exam.isActive ? 'Đang mở' : 'Đã đóng'} color={exam.isActive ? 'green' : 'gray'} />
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span>📚 {exam.subjectName}</span>
                  <span>⏱ {exam.durationMinutes} phút</span>
                  <span>❓ {exam.questionCount ?? 0} câu</span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button size="sm" variant={exam.isActive ? 'danger' : 'success'} onClick={() => handleToggleExam(exam.id)}>
                  {exam.isActive ? 'Đóng' : 'Kích hoạt'}
                </Button>
                <button onClick={() => handleDeleteExam(exam.id)} className="text-gray-500 hover:text-red-400 text-sm px-2">🗑</button>
              </div>
            </div>
          </div>
        ))}
        {exams.length === 0 && (
          <div className="text-center py-12 text-gray-500">Chưa có đề thi nào</div>
        )}
      </div>

      {/* Modal tạo đề thi */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Tạo đề thi mới" size="md">
        <form onSubmit={handleCreateExam} className="space-y-4">
          <Select label="Môn học" value={examForm.subjectId}
            onChange={e => setExamForm(f => ({ ...f, subjectId: e.target.value }))}
            options={[{ value: '', label: '-- Chọn môn --' }, ...subjects.map(s => ({ value: String(s.id), label: `${s.code} - ${s.name}` }))]}
            required />
          <Input label="Tên đề thi" placeholder="Kiểm tra giữa kỳ..." value={examForm.title}
            onChange={e => setExamForm(f => ({ ...f, title: e.target.value }))} required />
          <Input label="Mật khẩu phòng thi" type="password" placeholder="Tối thiểu 4 ký tự"
            value={examForm.password} onChange={e => setExamForm(f => ({ ...f, password: e.target.value }))}
            required minLength={4} />
          <Input label="Thời gian làm bài (phút)" type="number" min={5} max={300}
            value={examForm.durationMinutes}
            onChange={e => setExamForm(f => ({ ...f, durationMinutes: e.target.value }))} required />
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" checked={examForm.shuffleQuestions}
                onChange={e => setExamForm(f => ({ ...f, shuffleQuestions: e.target.checked }))}
                className="accent-blue-500" />
              Xáo câu hỏi
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" checked={examForm.shuffleAnswers}
                onChange={e => setExamForm(f => ({ ...f, shuffleAnswers: e.target.checked }))}
                className="accent-blue-500" />
              Xáo đáp án
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setCreateModal(false)}>Huỷ</Button>
            <Button type="submit" loading={loading}>Tạo đề thi</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
