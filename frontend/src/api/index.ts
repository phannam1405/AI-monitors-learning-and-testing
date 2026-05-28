import api from './axiosInstance'
import type { ApiResponse, Exam, Evidence, MonitoringSession, Question, Report, Room, Subject, Submission, User } from '../types'

// ── Auth ──
export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post<ApiResponse<{ accessToken: string; user: User }>>('/auth/login', data),
  register: (data: { username: string; email: string; password: string; fullName: string }) =>
    api.post<ApiResponse<{ accessToken: string; user: User }>>('/auth/register', data),
  me: () => api.get<ApiResponse<User>>('/auth/me'),
}

// ── Admin ──
export const adminApi = {
  getUsers: (role?: string) => api.get<ApiResponse<User[]>>('/admin/users', { params: { role } }),
  updateRole: (id: number, role: string) => api.put<ApiResponse<User>>(`/admin/users/${id}/role`, { role }),
  toggleStatus: (id: number) => api.put<ApiResponse<User>>(`/admin/users/${id}/status`),
  deleteUser: (id: number) => api.delete<ApiResponse<null>>(`/admin/users/${id}`),
}

// ── Subjects ──
export const subjectApi = {
  getAll: () => api.get<ApiResponse<Subject[]>>('/subjects'),
  getMine: () => api.get<ApiResponse<Subject[]>>('/subjects/my'),
  getOne: (id: number) => api.get<ApiResponse<Subject>>(`/subjects/${id}`),
  create: (data: { name: string; code: string; description?: string }) =>
    api.post<ApiResponse<Subject>>('/subjects', data),
  update: (id: number, data: { name: string; code: string; description?: string }) =>
    api.put<ApiResponse<Subject>>(`/subjects/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<null>>(`/subjects/${id}`),
}

// ── Exams ──
export const examApi = {
  getMine: () => api.get<ApiResponse<Exam[]>>('/exams/my'),
  getBySubject: (subjectId: number) => api.get<ApiResponse<Exam[]>>(`/exams/subject/${subjectId}`),
  getOne: (id: number) => api.get<ApiResponse<Exam>>(`/exams/${id}`),
  take: (id: number) => api.get<ApiResponse<Exam>>(`/exams/${id}/take`),
  verifyPassword: (id: number, password: string) =>
    api.post<ApiResponse<boolean>>(`/exams/${id}/verify-password`, { password }),
  create: (data: object) => api.post<ApiResponse<Exam>>('/exams', data),
  update: (id: number, data: object) => api.put<ApiResponse<Exam>>(`/exams/${id}`, data),
  toggle: (id: number) => api.put<ApiResponse<Exam>>(`/exams/${id}/toggle`),
  delete: (id: number) => api.delete<ApiResponse<null>>(`/exams/${id}`),
  addQuestion: (examId: number, data: object) =>
    api.post<ApiResponse<Question>>(`/exams/${examId}/questions`, data),
  updateQuestion: (questionId: number, data: object) =>
    api.put<ApiResponse<Question>>(`/exams/questions/${questionId}`, data),
  deleteQuestion: (questionId: number) =>
    api.delete<ApiResponse<null>>(`/exams/questions/${questionId}`),
}

// ── Rooms ──
export const roomApi = {
  getMine: () => api.get<ApiResponse<Room[]>>('/rooms/my'),
  getOne: (id: number) => api.get<ApiResponse<Room>>(`/rooms/${id}`),
  create: (data: object) => api.post<ApiResponse<Room>>('/rooms', data),
  toggle: (id: number) => api.put<ApiResponse<Room>>(`/rooms/${id}/toggle`),
  delete: (id: number) => api.delete<ApiResponse<null>>(`/rooms/${id}`),
  join: (code: string) => api.post<ApiResponse<Room>>('/rooms/join', { code }),
  getSessions: (id: number) => api.get<ApiResponse<MonitoringSession[]>>(`/rooms/${id}/sessions`),
  getReports: (id: number) => api.get<ApiResponse<Report[]>>(`/rooms/${id}/reports`),
}

// ── Sessions ──
export const sessionApi = {
  start: (roomId: number) => api.post<ApiResponse<MonitoringSession>>('/sessions/start', { roomId }),
  end: (id: number) => api.post<ApiResponse<MonitoringSession>>(`/sessions/${id}/end`),
  heartbeat: (id: number) => api.post<ApiResponse<null>>(`/sessions/${id}/heartbeat`),
  logEvent: (id: number, data: object) => api.post<ApiResponse<null>>(`/sessions/${id}/event`, data),
  myHistory: () => api.get<ApiResponse<MonitoringSession[]>>('/sessions/my'),
}

// ── Evidence ──
export const evidenceApi = {
  upload: (formData: FormData) =>
    api.post<ApiResponse<Evidence>>('/evidence/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getBySession: (sessionId: number) =>
    api.get<ApiResponse<Evidence[]>>(`/evidence/session/${sessionId}`),
}

// ── Submissions ──
export const submissionApi = {
  submit: (data: { sessionId: number; answers: Record<number, string>; isAutoSubmit?: boolean }) =>
    api.post<ApiResponse<Submission>>('/submissions', data),
  getBySession: (sessionId: number) =>
    api.get<ApiResponse<Submission>>(`/submissions/session/${sessionId}`),
  getMine: () => api.get<ApiResponse<Submission[]>>('/submissions/my'),
}

// ── Reports ──
export const reportApi = {
  getBySession: (sessionId: number) =>
    api.get<ApiResponse<Report>>(`/reports/session/${sessionId}`),
  getMine: () => api.get<ApiResponse<Report[]>>('/reports/my'),
  getByStudent: (studentId: number) =>
    api.get<ApiResponse<Report[]>>(`/reports/student/${studentId}`),
}
