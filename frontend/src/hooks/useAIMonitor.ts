import { useEffect, useRef, useState, useCallback } from 'react'
import type { AIState, EventType } from '../types'
import { sessionApi } from '../api'

export interface AIMonitorConfig {
  mode: 'STUDY' | 'EXAM'
  sessionId: number
  onEvent: (eventType: EventType, confidence?: number, durationSeconds?: number) => void
}

export interface AIDrawData {
  state: AIState
  confidence: number
  ear: number | null
  probs: number[]
  isLookingDown: boolean
  downRatio: number
  elapsedDownTime: number
  phoneDetected: boolean
  faceBox: [number, number, number, number] | null
  phoneBoxes: [number, number, number, number, number][]
  fps: number
  totalFingers: number
  isActive: boolean
}

const HEAD_DOWN_THRESHOLD_STUDY = 7    // giây
const HEAD_DOWN_THRESHOLD_EXAM = 1.5  // giây

export function useAIMonitor(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  config: AIMonitorConfig
) {
  const [drawData, setDrawData] = useState<AIDrawData>({
    state: 'focused', confidence: 0, ear: null, probs: [0, 0, 0],
    isLookingDown: false, downRatio: 0, elapsedDownTime: 0,
    phoneDetected: false, faceBox: null, phoneBoxes: [],
    fps: 0, totalFingers: 0, isActive: true,
  })

  const workerRef = useRef<Worker | null>(null)
  const animFrameRef = useRef<number>(0)
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastEventRef = useRef<Map<string, number>>(new Map())
  const isActiveRef = useRef(true)

  // Cooldown: không log cùng 1 event quá 1 lần / 10 giây
  const EVENT_COOLDOWN_MS = 10_000

  const shouldFireEvent = useCallback((eventType: string): boolean => {
    const last = lastEventRef.current.get(eventType) ?? 0
    const now = Date.now()
    if (now - last < EVENT_COOLDOWN_MS) return false
    lastEventRef.current.set(eventType, now)
    return true
  }, [])

  useEffect(() => {
    // ── Luồng 2: AI Worker ──
    const worker = new Worker(new URL('../workers/aiWorker.ts', import.meta.url), {
      type: 'module',
    })
    workerRef.current = worker

    worker.postMessage({ type: 'INIT', payload: { mode: config.mode } })

    worker.onmessage = (e) => {
      const { type, payload } = e.data

      if (type === 'DRAW_DATA') {
        setDrawData(prev => ({ ...prev, ...payload }))

        // Fire events khi phát hiện vi phạm
        const d = payload as Partial<AIDrawData>

        if (d.phoneDetected && shouldFireEvent('PHONE')) {
          config.onEvent('PHONE', 0.9, 3)
        }
        if (d.state === 'sleep' && shouldFireEvent('SLEEP')) {
          config.onEvent('SLEEP', d.confidence, 3)
        }
        if (d.state === 'drowsy' && shouldFireEvent('DROWSY')) {
          config.onEvent('DROWSY', d.confidence, 3)
        }

        const threshold = config.mode === 'EXAM'
          ? HEAD_DOWN_THRESHOLD_EXAM
          : HEAD_DOWN_THRESHOLD_STUDY

        if ((d.elapsedDownTime ?? 0) >= threshold && shouldFireEvent('HEAD_DOWN')) {
          const evType: EventType = config.mode === 'EXAM' ? 'CHEATING' : 'HEAD_DOWN'
          config.onEvent(evType, undefined, d.elapsedDownTime)
        }
      }
    }

    // ── Luồng 1: Camera & Render ──
    let lastFrameTime = performance.now()
    const fpsBuffer: number[] = []

    const renderLoop = () => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || video.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(renderLoop)
        return
      }

      const ctx = canvas.getContext('2d')!
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Vẽ frame video
      ctx.drawImage(video, 0, 0)

      // Gửi frame sang Worker (zero-copy via ImageBitmap)
      createImageBitmap(video).then(bitmap => {
        worker.postMessage({ type: 'FRAME', payload: bitmap }, [bitmap])
      })

      // Tính FPS
      const now = performance.now()
      const delta = now - lastFrameTime
      lastFrameTime = now
      fpsBuffer.push(1000 / delta)
      if (fpsBuffer.length > 30) fpsBuffer.shift()
      const fps = Math.round(fpsBuffer.reduce((a, b) => a + b, 0) / fpsBuffer.length)
      setDrawData(prev => ({ ...prev, fps }))

      animFrameRef.current = requestAnimationFrame(renderLoop)
    }

    animFrameRef.current = requestAnimationFrame(renderLoop)

    // ── Heartbeat mỗi 10s ──
    heartbeatRef.current = setInterval(() => {
      sessionApi.heartbeat(config.sessionId).catch(() => {})
    }, 10_000)

    // ── Page Visibility API ──
    const handleVisibilityChange = () => {
      if (document.hidden) {
        sessionApi.logEvent(config.sessionId, {
          eventType: 'TAB_HIDDEN',
          occurredAt: new Date().toISOString(),
        }).catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // ── Fullscreen exit (Exam mode) ──
    const handleFullscreenChange = () => {
      if (config.mode === 'EXAM' && !document.fullscreenElement) {
        sessionApi.logEvent(config.sessionId, {
          eventType: 'FULLSCREEN_EXIT',
          occurredAt: new Date().toISOString(),
        }).catch(() => {})
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      worker.terminate()
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [config.sessionId, config.mode])

  const toggleActive = useCallback(() => {
    isActiveRef.current = !isActiveRef.current
    workerRef.current?.postMessage({ type: 'TOGGLE_ACTIVE' })
    setDrawData(prev => ({ ...prev, isActive: isActiveRef.current }))
  }, [])

  return { drawData, toggleActive }
}
