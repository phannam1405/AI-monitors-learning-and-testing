import { useEffect, useRef, useState } from 'react';
import { useAIMonitor } from '../../hooks/useAIMonitor';
import { useEvidenceQueue } from '../../hooks/useEvidenceQueue';
import type { EventType } from '../../types';

const STATE_COLOR: Record<string, string> = {
  focused: '#22c55e',
  drowsy: '#f97316',
  sleep: '#ef4444',
  phone: '#a855f7',
  head_down: '#3b82f6',
};

const STATE_LABEL: Record<string, string> = {
  focused: 'Tập trung',
  drowsy: 'Buồn ngủ',
  sleep: 'Ngủ gật',
  phone: 'Dùng điện thoại',
  head_down: 'Cúi mặt',
};

interface Props {
  sessionId: number;
  mode: 'STUDY' | 'EXAM';
}

export default function AIMonitor({ sessionId, mode }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const { captureAndEnqueue, flushQueue } = useEvidenceQueue(videoRef);

  const handleEvent = (eventType: EventType, confidence?: number, durationSeconds?: number) => {
    captureAndEnqueue({
      sessionId,
      eventType,
      occurredAt: new Date(),
      confidence,
      durationSeconds,
    });
  };

  const { drawData, toggleActive } = useAIMonitor(videoRef, canvasRef, {
    mode,
    sessionId,
    onEvent: handleEvent,
  });

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let isMounted = true;

    const startWebcamStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, frameRate: { ideal: 30 } },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        activeStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play()
            .then(() => {
              if (isMounted) setCameraReady(true);
            })
            .catch((playErr) => {
              if (playErr.name !== 'AbortError') {
                console.error("Lỗi đồng bộ nguồn phát video:", playErr);
              }
            });
        }
      } catch (err: any) {
        if (isMounted) {
          setCameraError('Hệ thống không tìm thấy hoặc chưa được cấp quyền Camera: ' + err.message);
        }
      }
    };

    startWebcamStream();

    return () => {
      isMounted = false;
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
      }
      flushQueue();
    };
  }, []);

  if (cameraError) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900 rounded-xl text-red-400 text-sm p-4">
        ⚠️ {cameraError}
      </div>
    );
  }

  const color = STATE_COLOR[drawData.state] ?? '#22c55e';
  const isHeadDownWarning =
    mode === 'STUDY'
      ? drawData.elapsedDownTime >= 7
      : drawData.elapsedDownTime >= 1.5;

  return (
    <div className="relative bg-gray-900 rounded-xl overflow-hidden select-none">
      {/* KHẮC PHỤC LỖI TRÌNH DUYỆT TỰ ĐỘNG ĐÓNG FRAME: Để kích thước bằng 0 thay vì dùng ẩn CSS hidden */}
      <video ref={videoRef} className="w-0 h-0 absolute opacity-0" muted playsInline />

      {/* Đồ họa khung hình camera */}
      <canvas
        ref={canvasRef}
        className="w-full rounded-xl transform -scale-x-100" 
        style={{ maxHeight: 360 }}
      />

      {!drawData.isActive && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 z-10">
          <span className="text-red-400 text-lg font-bold">⏸ GIÁM SÁT TẠM DỪNG</span>
          {mode === 'STUDY' && (
            <button
              onClick={toggleActive}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-500 pointer-events-auto"
            >
              Tiếp tục giám sát
            </button>
          )}
        </div>
      )}

      {!cameraReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="text-gray-400 text-sm animate-pulse">Đang nạp mô hình AI & kết nối camera...</div>
        </div>
      )}

      {/* Bảng HUD thông số trên góc */}
      <div className="absolute top-2 left-2 right-2 flex items-start justify-between pointer-events-none z-10">
        <span className="bg-black/60 text-gray-300 text-xs px-2 py-1 rounded-md font-mono">
          FPS: {drawData.fps ?? 0}
        </span>

        <div
          className="flex items-center gap-2 px-3 py-1 rounded-full text-white text-sm font-semibold shadow-lg"
          style={{ backgroundColor: color + 'cc' }}
        >
          <span
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: color }}
          />
          {STATE_LABEL[drawData.state] ?? drawData.state}
          <span className="text-xs opacity-80 ml-1">
            {((drawData.confidence ?? 0) * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Biểu đồ phần trăm trạng thái tập trung */}
      <div className="absolute bottom-2 left-2 space-y-1 pointer-events-none z-10">
        {['focused', 'drowsy', 'sleep'].map((cls, i) => (
          <div key={cls} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: STATE_COLOR[cls] }}
            />
            <div className="w-24 h-2 bg-black/40 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(drawData.probs?.[i] ?? 0) * 100}%`,
                  backgroundColor: STATE_COLOR[cls],
                }}
              />
            </div>
            <span className="text-white text-xs font-mono w-10">
              {((drawData.probs?.[i] ?? 0) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>

      {drawData.ear !== null && drawData.ear !== undefined && (
        <div className="absolute bottom-2 right-2 bg-black/60 text-gray-300 text-xs px-2 py-1 rounded-md font-mono pointer-events-none z-10">
          EAR: {drawData.ear.toFixed(2)}
        </div>
      )}

      {/* Thanh hiển thị vi phạm thời gian thực */}
      {isHeadDownWarning && (
        <div className="absolute bottom-12 left-2 right-2 bg-red-600/90 text-white text-xs font-bold py-2 px-3 rounded-lg text-center pointer-events-none animate-pulse z-10">
          {mode === 'EXAM'
            ? `⚠️ GIAN LẬN: Cúi mặt (${drawData.elapsedDownTime.toFixed(1)}s)`
            : `⚠️ CẢNH BÁO: Cúi mặt quá lâu (${drawData.elapsedDownTime.toFixed(1)}s)`}
        </div>
      )}

      {drawData.phoneDetected && (
        <div className="absolute top-12 left-2 right-2 bg-purple-600/90 text-white text-xs font-bold py-2 px-3 rounded-lg text-center pointer-events-none z-10">
          📱 Phát hiện điện thoại!
        </div>
      )}

      {mode === 'STUDY' && drawData.isActive && (
        <button
          onClick={toggleActive}
          className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md hover:bg-black/80 pointer-events-auto z-20"
        >
          ⏸ Tạm dừng
        </button>
      )}
    </div>
  );
}