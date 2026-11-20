# HADES OS — SYSTEM ARCHITECTURE & SECURITY SPECIFICATION

## 1. TỔNG QUAN HỆ THỐNG (SYSTEM OVERVIEW)
HADES OS là trợ lý máy tính cá nhân đa tác nhân (Multi-Agent Personal AI Desktop Assistant) cho Windows 10/11, hoạt động theo mô hình Local-First, tích hợp mô hình Gemini AI, giao diện tương lai HUD/3D Robot (lấy cảm hứng từ giao diện HADES/JARVIS) và hệ thống kiểm soát quyền hạn phân lớp nghiêm ngặt (Deny-by-default).

## 2. PHÂN TẦNG KIẾN TRÚC (ARCHITECTURAL LAYERS)

```
+---------------------------------------------------------------------------------+
|                                 WINDOWS 10 / 11                                 |
+---------------------------------------------------------------------------------+
|  ELECTRON MAIN PROCESS (Node.js)                                                |
|  - Lifecycle Management (Launch, Graceful Shutdown, Watchdog)                   |
|  - Process Spawner: Local FastAPI Backend (127.0.0.1:<ephemeral_port>)          |
|  - Session Token Generation (Secure Crypto Random Capability)                   |
|  - Native Windows Menus, Window Chrome, System Tray, Hardware Sensors Bridge    |
+----------------------------------------+----------------------------------------+
                                         | Typed IPC Bridge
                                         v
+---------------------------------------------------------------------------------+
|  ELECTRON PRELOAD & CONTEXT BRIDGE (contextIsolation: true, sandbox: true)      |
|  - window.hadesApi: strictly typed, deny-by-default IPC interface               |
|  - No direct Node.js or filesystem exposure to renderer                         |
+----------------------------------------+----------------------------------------+
                                         |
                                         v
+---------------------------------------------------------------------------------+
|  FRONTEND RENDERER (React 19 + TypeScript + Vite + Tailwind CSS)               |
|  - 3D Holographic Robot HUD (Three.js / React Three Fiber / Drei)               |
|  - Futuristic HUD Components (Circular HUD, Gauges, Neon Glow, Radar)          |
|  - State Management: Zustand Stores (Agent, Voice, Chat, System, Finance)      |
|  - Routing: React Router (Home, AgentCenter, Gmail, Finance, Coding, Settings) |
|  - REST & SSE/WebSocket Client to Local Backend (using Bearer Capability Token) |
+----------------------------------------+----------------------------------------+
                                         | HTTP / SSE / WebSocket (127.0.0.1)
                                         v
+---------------------------------------------------------------------------------+
|  LOCAL BACKEND (FastAPI + Python 3.14 + Uvicorn)                                |
|  +---------------------------------------------------------------------------+  |
|  | Security Gateway: Session Token Middleware, Origin Validation, CORS Guard |  |
|  +---------------------------------------------------------------------------+  |
|  | Central AI Orchestrator (Intent Classifier, Router, Context Assembler)   |  |
|  +---------------------------------------------------------------------------+  |
|  | Specialized Agents:                                                       |  |
|  | - GmailAgent (OAuth 2.0 PKCE, Summaries, Classify, Draft Responses)      |  |
|  | - FinanceAgent (VND Decimal Arithmetic, Budgets, CSV, Duplicate Check)    |  |
|  | - CodingAgent (Allowlisted Repo, Git CLI Read-only, Diagnostics, Review)   |  |
|  | - ProductivityAgent (Tasks, Deadlines, Agenda, Reminders)                 |  |
|  | - SystemAgent (Windows Hardware Metrics, OS info via psutil)              |  |
|  +---------------------------------------------------------------------------+  |
|  | Tool Gateway & Permission Guard (Deny-by-default, Approval Registry)      |  |
|  +---------------------------------------------------------------------------+  |
|  | Persistence Layer: SQLAlchemy + Alembic + SQLite (WAL mode)               |  |
|  | Secure Credentials: OS Credential Manager (keyring / Windows DPAPI)       |  |
+---------------------------------------------------------------------------------+
```

## 3. RANH GIỚI BẢO MẬT & CHÍNH SÁCH QUYỀN HẠN (SECURITY BOUNDARIES & PERMISSIONS)

### 3.1. Electron Renderer Sandbox
- `nodeIntegration: false`
- `contextIsolation: true`
- `sandbox: true`
- Content Security Policy (CSP):
  `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' http://127.0.0.1:* ws://127.0.0.1:*; font-src 'self' data:;`
- Ngăn chặn mọi hành vi mở URL ngoại vi trực tiếp trong Electron window; chỉ mở thông qua `shell.openExternal` sau khi kiểm tra protocol an toàn (`http:`, `https:`).

### 3.2. Local Backend Authentication (Capability Token)
- Mỗi lần khởi động, Electron Main Process sinh một chuỗi ngẫu nhiên cryptographically secure (32-byte hex session capability token).
- Token được truyền qua biến môi trường hoặc stdin cho tiến trình FastAPI Backend.
- Tất cả các request HTTP/WebSocket từ Renderer đến Backend bắt buộc phải gửi Header `Authorization: Bearer <session_token>`.
- Chống DNS rebinding: Backend kiểm tra `Host: 127.0.0.1:<port>` hoặc `localhost:<port>` và `Origin: null` hoặc nguồn hợp lệ từ Electron origin.

### 3.3. Mô hình Quyền Hạn Đa Tác Nhân (Deny-by-Default Permission Model)
Tất cả các hành vi truy cập dữ liệu hoặc thao tác hệ thống được chia thành các Scope:
- `READ_LOCAL`: Đọc thông số phần cứng, cấu hình ứng dụng.
- `READ_GMAIL`: Đọc email và metadata hộp thư.
- `WRITE_GMAIL_DRAFT`: Tạo hoặc sửa bản nháp email.
- `SEND_GMAIL`: Gửi email (BẮT BUỘC có Approval Gate từ người dùng).
- `READ_FINANCE`: Đọc danh sách giao dịch, ngân sách.
- `WRITE_FINANCE`: Thêm, sửa, xóa giao dịch tài chính.
- `READ_REPOSITORY`: Đọc git log, diff, status trong thư mục được cho phép (Allowlisted).
- `EDIT_REPOSITORY`: Thay đổi mã nguồn (Bắt buộc phê duyệt từng lần).
- `RUN_APPROVED_TEST`: Thực thi lệnh test đã được allowlist (mvn test, npm test...).
- `EXECUTE_COMMAND`: Thực thi lệnh CLI cho phép.
- `EXTERNAL_NETWORK`: Gọi API ngoại vi (Gemini API, Google OAuth...).

### 3.4. Lưu trữ thông tin nhạy cảm
- Tuyệt đối không lưu Gemini API Key, OAuth Access/Refresh Token trong file SQLite hoặc LocalStorage dưới dạng plaintext.
- Sử dụng Windows Credential Manager (`keyring` thư viện Windows DPAPI / Windows Vault) để mã hóa và lưu trữ an toàn cấp hệ điều hành.

## 4. CHI TIẾT CÁC PHÂN HỆ CHỨC NĂNG

### 4.1. 3D Robot Avatar HUD
- Sử dụng Three.js + React Three Fiber + Drei.
- Tạo mô hình Robot Futuristic 3D dạng metallic low-poly, mắt phát sáng cyan, chi tiết cybernetic headphones/ears, phần thân trên và hiệu ứng lơ lửng (floating).
- State Machine chuyển đổi trạng thái:
  - `IDLE`: Chuyển động thở, xoay đầu chậm, mắt cyan dịu.
  - `LISTENING`: Mắt sáng rực, hiệu ứng sóng âm audio vòng tròn.
  - `THINKING`: Xoay đầu phân tích, vòng hào quang holo xung quanh xoay tròn.
  - `SPEAKING`: Sóng âm dao động theo âm thanh (audio-reactive), miệng/mắt xung nhịp.
  - `PROCESSING`: Vòng HUD xoay với gia tốc cao, hiệu ứng quét hạt.
  - `SUCCESS`: Mắt chớp sáng xanh lục/cyan ánh kim, hiệu ứng hoàn tất.
  - `ERROR`: Chớp nháy màu cam/đỏ amber cảnh báo.
- Chế độ tiết kiệm tài nguyên (Low/Medium/High quality) và Reduced-Motion cho máy cấu hình văn phòng.

### 4.2. Trọng tâm Trí tuệ Nhân tạo (Gemini AI & Orchestrator)
- SDK chính thức: `google-genai` của Google.
- Hỗ trợ Streaming phản hồi văn bản, Function Calling định kiểu qua Pydantic.
- Tự động fallback sang chế độ Offline hoạt động cục bộ (quản lý công việc, tài chính, git local) khi không có Internet hoặc chưa nhập API Key.
- Giữ lịch sử hội thoại có giới hạn ngữ cảnh (sliding window / context truncation).

### 4.3. Quản lý Tài chính (Finance Center)
- Số học chính xác: Lưu trữ giá trị tiền tệ bằng integer minor units hoặc Decimal (tránh lỗi dấu phẩy động IEEE 754).
- Mặc định tiền tệ Việt Nam Đồng (VND).
- Tích hợp trích xuất tự động giao dịch từ hóa đơn Gmail (với bước xác nhận của người dùng trước khi ghi sổ).
- Nhận diện giao dịch trùng lặp (dựa vào hash nội dung, ngày, số tiền, merchant).

### 4.4. Hỗ trợ Lập trình (Coding Center)
- Quản lý danh sách thư mục dự án cho phép (Allowlist Directories).
- Tích hợp Git CLI chỉ đọc an toàn (`git status`, `git branch`, `git log -n 20`, `git diff`).
- Tuyệt đối không chạy lệnh shell tự do; sử dụng danh sách lệnh được duyệt với timeout và giới hạn output.
- Đánh giá mã nguồn (AI Code Review), đề xuất giải pháp, đề xuất commit message chuẩn bằng tiếng Việt.

### 4.5. Voice System (Âm thanh & Giọng nói)
- Push-to-talk an toàn, không ghi âm ngầm liên tục.
- Tích hợp nhận diện giọng nói (Speech-to-Text) và phát âm phản hồi (Text-to-Speech) hỗ trợ tiếng Việt.
- Đồng bộ hiệu ứng âm thanh trực tiếp với avatar 3D.
