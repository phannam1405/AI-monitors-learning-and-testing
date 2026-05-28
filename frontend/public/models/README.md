# AI Models

Đặt các file ONNX models vào thư mục này:

1. `yolov8n-face.onnx` — Face detection model
   - Convert từ yolov8n-face.pt: `yolo export model=yolov8n-face.pt format=onnx`

2. `drowsiness_efficientnet_b0.onnx` — Drowsiness classification model
   - File ONNX gốc từ project Python

Cả 2 file này cần được copy vào thư mục `public/models/` để browser có thể load.
