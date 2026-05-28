import { useEffect, useRef, useCallback } from 'react'
import type { EventType } from '../types'
import { useAuthStore } from '../store/authStore'

interface EnqueueOptions {
  sessionId: number
  eventType: EventType
  occurredAt: Date
  confidence?: number
  durationSeconds?: number
}

export function useEvidenceQueue(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const workerRef = useRef<Worker | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const { token } = useAuthStore()

  useEffect(() => {
    const worker = new Worker(new URL('../workers/uploadWorker.ts', import.meta.url), {
      type: 'module',
    })
    workerRef.current = worker

    // Gửi token cho worker
    worker.postMessage({ type: 'SET_TOKEN', payload: { token } })

    worker.onmessage = (e) => {
      if (e.data.type === 'UPLOAD_SUCCESS') {
        console.log('[UploadWorker] Clip uploaded:', e.data.id)
      } else if (e.data.type === 'UPLOAD_FAILED') {
        console.warn('[UploadWorker] Clip upload failed:', e.data.id)
      }
    }

    return () => worker.terminate()
  }, [token])

  /**
   * Ghi 3 giây video rồi đẩy vào upload queue.
   * Gọi khi AI phát hiện event.
   */
  const captureAndEnqueue = useCallback((opts: EnqueueOptions) => {
    const video = videoRef.current
    if (!video || !video.srcObject) return

    const stream = video.srcObject as MediaStream
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
      ? 'video/webm;codecs=vp8'
      : 'video/webm'

    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 500_000 })
    const chunks: Blob[] = []

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType })
      const id = `${opts.eventType}_${opts.occurredAt.getTime()}`
      workerRef.current?.postMessage({
        type: 'ENQUEUE',
        payload: {
          id,
          blob,
          sessionId: opts.sessionId,
          eventType: opts.eventType,
          occurredAt: opts.occurredAt.toISOString(),
          confidence: opts.confidence,
          durationSeconds: opts.durationSeconds ?? 3,
        },
      })
    }

    recorder.start()
    mediaRecorderRef.current = recorder

    // Dừng sau 3 giây
    setTimeout(() => {
      if (recorder.state === 'recording') recorder.stop()
    }, 3000)
  }, [videoRef])

  /** Flush toàn bộ queue khi kết thúc session */
  const flushQueue = useCallback(() => {
    workerRef.current?.postMessage({ type: 'FLUSH' })
  }, [])

  return { captureAndEnqueue, flushQueue }
}
