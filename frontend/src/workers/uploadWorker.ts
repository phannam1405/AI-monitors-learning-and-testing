// uploadWorker.ts — chạy trong Web Worker
// Nhận clip Blob từ main thread, upload lên server, retry nếu lỗi

interface UploadTask {
  id: string
  blob: Blob
  sessionId: number
  eventType: string
  occurredAt: string
  confidence?: number
  durationSeconds?: number
  retries: number
}

const queue: UploadTask[] = []
let isProcessing = false
const MAX_RETRIES = 3
const RETRY_DELAY = 30_000

function getToken(): string {
  // Worker không có localStorage — token được gửi từ main thread
  return (self as any).__token || ''
}

async function uploadTask(task: UploadTask): Promise<boolean> {
  const formData = new FormData()
  formData.append('file', task.blob, `clip_${Date.now()}.webm`)
  formData.append('sessionId', String(task.sessionId))
  formData.append('eventType', task.eventType)
  formData.append('occurredAt', task.occurredAt)
  if (task.confidence != null) formData.append('confidence', String(task.confidence))
  if (task.durationSeconds != null) formData.append('durationSeconds', String(task.durationSeconds))

  try {
    const res = await fetch('/api/evidence/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    })
    return res.ok
  } catch {
    return false
  }
}

async function processQueue() {
  if (isProcessing || queue.length === 0) return
  isProcessing = true

  while (queue.length > 0) {
    const task = queue[0]
    const success = await uploadTask(task)
    if (success) {
      queue.shift()
      self.postMessage({ type: 'UPLOAD_SUCCESS', id: task.id })
    } else {
      task.retries++
      if (task.retries >= MAX_RETRIES) {
        queue.shift()
        self.postMessage({ type: 'UPLOAD_FAILED', id: task.id })
      } else {
        // Đẩy về cuối queue, retry sau
        queue.push(queue.shift()!)
        await new Promise(r => setTimeout(r, RETRY_DELAY))
      }
    }
  }

  isProcessing = false
}

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data
  switch (type) {
    case 'SET_TOKEN':
      ;(self as any).__token = payload.token
      break

    case 'ENQUEUE':
      queue.push({ ...payload, retries: 0 })
      processQueue()
      break

    case 'FLUSH':
      // Flush: xử lý ngay toàn bộ queue (khi kết thúc session)
      processQueue()
      break

    case 'GET_QUEUE_SIZE':
      self.postMessage({ type: 'QUEUE_SIZE', size: queue.length })
      break
  }
}
