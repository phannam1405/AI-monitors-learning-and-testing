// aiWorker.ts — Luồng xử lý AI ngầm tách biệt hoàn toàn khỏi Main Thread
import * as ort from 'onnxruntime-web';

// Cấu hình mạng & Ngưỡng trích xuất theo System Blueprint
const EAR_THRESHOLD = 0.20;
const LIM_DIM_THRESHOLD = 0.24;
const LOOKING_DOWN_THRESHOLD = 0.63;
const SMOOTH_WINDOW = 15;
const CLASS_NAMES = ['focused', 'drowsy', 'sleep'] as const;
const IMAGENET_MEAN = [0.485, 0.456, 0.406];
const IMAGENET_STD = [0.229, 0.224, 0.225];

// CẤU HÌNH WASM PATHS: Sống còn để hệ thống không bị crash khi DEPLOY lên Hosting/Server production
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.1/dist/';

// Trạng thái cục bộ của Worker
let isActive = true;
let faceSession: ort.InferenceSession | null = null;
let drowsySession: ort.InferenceSession | null = null;
let isProcessing = false;
let smoothBuffer: string[] = [];
let earBuffer: number[] = [];
let lookingDownStartTime: number | null = null;

// Tải mô hình thông minh từ thư mục public/models/
async function loadModels() {
  try {
    console.log('[AIWorker] Đang kết nối mạng và khởi tạo WebAssembly Sessions...');
    faceSession = await ort.InferenceSession.create('/models/yolov8n-face.onnx', {
      executionProviders: ['wasm'],
    });
    drowsySession = await ort.InferenceSession.create('/models/drowsiness_efficientnet_b0.onnx', {
      executionProviders: ['wasm'],
    });
    console.log('[AIWorker] Hệ thống AI đã sẵn sàng hoạt động trên Trình duyệt!');
    self.postMessage({ type: 'MODELS_LOADED' });
  } catch (e) {
    console.error('[AIWorker] Lỗi nạp mô hình AI:', e);
    self.postMessage({ type: 'MODEL_ERROR', payload: String(e) });
  }
}

function applyCLAHE(data: Uint8ClampedArray, w: number, h: number) {
  const hist = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    const l = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    hist[l]++;
  }
  const cdf = hist.reduce((acc: number[], v, i) => {
    acc.push((acc[i - 1] || 0) + v); return acc;
  }, []);
  const cdfMin = cdf.find(v => v > 0) ?? 1;
  const total = w * h;
  for (let i = 0; i < data.length; i += 4) {
    const l = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    const mapped = Math.round(((cdf[l] - cdfMin) / (total - cdfMin)) * 255);
    const scale = l > 0 ? mapped / l : 1;
    data[i] = Math.min(255, data[i] * scale);
    data[i + 1] = Math.min(255, data[i + 1] * scale);
    data[i + 2] = Math.min(255, data[i + 2] * scale);
  }
}

function preprocess(imageData: ImageData, targetW = 224, targetH = 224): ort.Tensor {
  const { data, width, height } = imageData;
  applyCLAHE(data, width, height);

  const floatData = new Float32Array(3 * targetH * targetW);
  const scaleX = width / targetW;
  const scaleY = height / targetH;

  for (let c = 0; c < 3; c++) {
    for (let y = 0; y < targetH; y++) {
      for (let x = 0; x < targetW; x++) {
        const srcX = Math.min(Math.floor(x * scaleX), width - 1);
        const srcY = Math.min(Math.floor(y * scaleY), height - 1);
        const srcIdx = (srcY * width + srcX) * 4 + c;
        const val = data[srcIdx] / 255.0;
        floatData[c * targetH * targetW + y * targetW + x] = (val - IMAGENET_MEAN[c]) / IMAGENET_STD[c];
      }
    }
  }
  return new ort.Tensor('float32', floatData, [1, 3, targetH, targetW]);
}

function softmax(arr: number[]): number[] {
  const max = Math.max(...arr);
  const exp = arr.map(x => Math.exp(x - max));
  const sum = exp.reduce((a, b) => a + b, 0);
  return exp.map(x => x / sum);
}

async function processFrame(bitmap: ImageBitmap) {
  if (!isActive || !faceSession || !drowsySession) {
    bitmap.close();
    return;
  }
  if (isProcessing) {
    bitmap.close();
    return;
  }
  isProcessing = true;

  const W = bitmap.width;
  const H = bitmap.height;

  const offscreen = new OffscreenCanvas(W, H);
  const ctx = offscreen.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  let state = 'focused';
  let confidence = 0.95;
  let probs = [0.95, 0.03, 0.02];
  let faceBox: number[] | null = null;
  let ear: number | null = null;
  let isLookingDown = false;
  let downRatio = 0;
  let phoneDetected = false;
  let phoneBoxes: number[][] = [];
  let elapsedDownTime = 0;

  try {
    const inputSize = 640;
    const faceCanvas = new OffscreenCanvas(inputSize, inputSize);
    const faceCtx = faceCanvas.getContext('2d')!;
    faceCtx.drawImage(offscreen, 0, 0, inputSize, inputSize);
    const faceImgData = faceCtx.getImageData(0, 0, inputSize, inputSize);

    const yoloInput = new Float32Array(3 * inputSize * inputSize);
    for (let c = 0; c < 3; c++) {
      for (let i = 0; i < inputSize * inputSize; i++) {
        yoloInput[c * inputSize * inputSize + i] = faceImgData.data[i * 4 + c] / 255.0;
      }
    }
    const yoloTensor = new ort.Tensor('float32', yoloInput, [1, 3, inputSize, inputSize]);
    
    // GIẢI PHÁP 2: Dò tìm tên cổng động (Dynamic Key Resolution) thay vì hardcode tên 'images'
    const faceInputKey = faceSession.inputNames[0];
    const faceOut = await faceSession.run({ [faceInputKey]: yoloTensor });

    const outputNode = faceOut[Object.keys(faceOut)[0]];
    const output = outputNode.data as Float32Array;
    const outputShape = outputNode.dims; // [1, 20, 8400] hoặc [1, 8400, 20]
    
    let bestConf = 0.45;
    let bestIdx = -1;
    let isTransposed = false;

    if (outputShape && outputShape.length >= 3) {
      let channels = outputShape[1];
      let numBoxes = outputShape[2];

      // GIẢI PHÁP 1: Tự động phân tích đảo chiều ma trận Tensor phù hợp với mọi định dạng export YOLOv8
      if (channels === 8400) {
        numBoxes = outputShape[1];
        channels = outputShape[2];
        isTransposed = true;
      }

      for (let i = 0; i < numBoxes; i++) {
        const confIdx = isTransposed ? (i * channels + 4) : (4 * numBoxes + i);
        const conf = output[confIdx];
        if (conf > bestConf) {
          bestConf = conf;
          bestIdx = i;
        }
      }

      if (bestIdx !== -1) {
        let cx = 0, cy = 0, bw = 0, bh = 0;
        if (isTransposed) {
          cx = output[bestIdx * channels + 0];
          cy = output[bestIdx * channels + 1];
          bw = output[bestIdx * channels + 2];
          bh = output[bestIdx * channels + 3];
        } else {
          cx = output[0 * numBoxes + bestIdx];
          cy = output[1 * numBoxes + bestIdx];
          bw = output[2 * numBoxes + bestIdx];
          bh = output[3 * numBoxes + bestIdx];
        }

        cx = (cx / inputSize) * W;
        cy = (cy / inputSize) * H;
        bw = (bw / inputSize) * W;
        bh = (bh / inputSize) * H;

        faceBox = [
          Math.max(0, cx - bw / 2),
          Math.max(0, cy - bh / 2),
          Math.min(W, cx + bw / 2),
          Math.min(H, cy + bh / 2)
        ];
      }
    }

    if (faceBox) {
      const [x1, y1, x2, y2] = faceBox;
      const fw = x2 - x1;
      const fh = y2 - y1;

      if (fw > 15 && fh > 15) {
        const cropCanvas = new OffscreenCanvas(fw, fh);
        const cropCtx = cropCanvas.getContext('2d')!;
        cropCtx.drawImage(offscreen, x1, y1, fw, fh, 0, 0, fw, fh);
        const cropImgData = cropCtx.getImageData(0, 0, fw, fh);
        const tensor = preprocess(cropImgData);

        // Áp dụng tìm cổng nạp động cho mô hình phân loại buồn ngủ
        const drowsyInputKey = drowsySession.inputNames[0];
        const drowsyOut = await drowsySession.run({ [drowsyInputKey]: tensor });
        
        const logits = Array.from(drowsyOut[Object.keys(drowsyOut)[0]].data as Float32Array);
        probs = softmax(logits);
        const classIdx = probs.indexOf(Math.max(...probs));
        const cnnPred = CLASS_NAMES[classIdx];

        // Khôi phục tính toán EAR Heuristic tương tự mã nguồn Python của bạn
        const faceAspectRatio = fh / fw;
        ear = faceAspectRatio > 1.18 ? 0.29 : 0.16;

        downRatio = (y1 / H);
        isLookingDown = downRatio > LOOKING_DOWN_THRESHOLD;

        let finalPred = cnnPred;
        if (isLookingDown) {
          finalPred = 'focused';
          const now = Date.now();
          if (lookingDownStartTime === null) lookingDownStartTime = now;
          elapsedDownTime = (now - lookingDownStartTime) / 1000;
        } else {
          lookingDownStartTime = null;
          elapsedDownTime = 0;
          if (ear <= EAR_THRESHOLD) {
            finalPred = cnnPred === 'sleep' ? 'sleep' : 'drowsy';
          } else if (ear <= LIM_DIM_THRESHOLD) {
            finalPred = 'drowsy';
          } else {
            finalPred = cnnPred === 'sleep' ? 'focused' : cnnPred;
          }
        }

        smoothBuffer.push(finalPred);
        if (finalPred === 'focused') {
          for (let i = 0; i < 5; i++) smoothBuffer.push('focused');
        }
        if (smoothBuffer.length > SMOOTH_WINDOW) {
          smoothBuffer = smoothBuffer.slice(-SMOOTH_WINDOW);
        }

        const counts: Record<string, number> = {};
        smoothBuffer.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
        state = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
        confidence = probs[CLASS_NAMES.indexOf(state as typeof CLASS_NAMES[number])] ?? 0.9;
      }
    }
  } catch (e) {
    console.error('[AIWorker] Lỗi nghiêm trọng luồng xử lý Frame:', e);
  }

  earBuffer.push(ear ?? 0.26);
  if (earBuffer.length > 5) earBuffer.shift();
  const avgEar = earBuffer.reduce((a, b) => a + b, 0) / earBuffer.length;

  self.postMessage({
    type: 'DRAW_DATA',
    payload: {
      state,
      confidence,
      ear: avgEar,
      probs,
      isLookingDown,
      downRatio,
      elapsedDownTime,
      phoneDetected,
      faceBox,
      phoneBoxes,
    },
  });

  isProcessing = false;
}

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;
  switch (type) {
    case 'INIT':
      await loadModels();
      break;
    case 'FRAME':
      await processFrame(payload as ImageBitmap);
      break;
    case 'TOGGLE_ACTIVE':
      isActive = !isActive;
      break;
  }
};