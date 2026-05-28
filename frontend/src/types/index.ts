export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT'
export type RoomType = 'STUDY' | 'EXAM'
export type SessionStatus = 'ACTIVE' | 'COMPLETED' | 'INTERRUPTED'
export type EventType = 'DROWSY' | 'SLEEP' | 'PHONE' | 'HEAD_DOWN' | 'FULLSCREEN_EXIT' | 'TAB_HIDDEN' | 'CHEATING'
export type AIState = 'focused' | 'drowsy' | 'sleep' | 'phone' | 'head_down'

export interface User {
  id: number; username: string; email: string
  fullName: string; role: Role; isActive: boolean; createdAt: string
}
export interface Subject {
  id: number; name: string; code: string
  description?: string; teacherId: number; teacherName: string; createdAt: string
}
export interface Exam {
  id: number; subjectId: number; subjectName: string; title: string
  durationMinutes: number; isActive: boolean; shuffleQuestions: boolean
  shuffleAnswers: boolean; questionCount: number; createdAt: string
  questions?: Question[]
}
export interface Question {
  id: number; content: string; optionA: string; optionB: string
  optionC: string; optionD: string; orderIndex: number; correctAnswer?: string
}
export interface Room {
  id: number; code: string; name: string; type: RoomType
  examId?: number; examTitle?: string; subjectId: number; subjectName: string
  teacherName: string; isOpen: boolean; scheduledStart?: string
  scheduledEnd?: string; createdAt: string
}
export interface MonitoringSession {
  id: number; studentId: number; studentName: string; roomId: number
  roomName: string; roomCode: string; mode: RoomType; startTime: string
  endTime?: string; status: SessionStatus; evidenceFolder: string
  tabHiddenCount: number; fullscreenExitCount: number
}
export interface Report {
  id: number; sessionId: number; studentName: string; roomName: string; mode: string
  focusedSeconds: number; drowsySeconds: number; sleepSeconds: number; phoneSeconds: number
  headDownCount: number; drowsyCount: number; sleepCount: number
  phoneCount: number; cheatingCount: number; focusPercentage: number
  generatedAt: string; summaryJson?: string
}
export interface Evidence {
  id: number; sessionId: number; eventType: EventType
  occurredAt: string; durationSeconds?: number; confidence?: number; clipUrl: string
}
export interface Submission {
  id: number; sessionId: number; examId: number; examTitle: string
  studentName: string; submittedAt?: string; totalScore?: number
  totalQuestions: number; correctCount?: number; isAutoSubmitted: boolean
  answers?: AnswerResult[]
}
export interface AnswerResult {
  questionId: number; questionContent: string
  selectedAnswer?: string; correctAnswer: string; isCorrect: boolean
}
export interface ApiResponse<T> { code: number; message: string; result: T }
