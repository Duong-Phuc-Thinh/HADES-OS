# HADES OS — PERSONAL AI COMMAND DESKTOP

> **Hệ điều hành Trợ lý Cá nhân Đa Tác nhân (Local-First, Gemini-Powered) cho Windows 10/11**  
> *Lấy cảm hứng từ giao diện chỉ huy tương lai HADES / JARVIS với mô hình Robot 3D tương tác.*

---

## 1. TỔNG QUAN DỰ ÁN

**HADES OS** là một ứng dụng máy tính để bàn (Windows Desktop Application) hoàn chỉnh, được xây dựng theo kiến trúc Local-First, bảo vệ quyền riêng tư tuyệt đối, tích hợp mô hình ngôn ngữ lớn Google Gemini AI cùng hệ thống Đa Tác nhân (Multi-Agent Orchestrator) chuyên trách:

- 🤖 **3D Holographic Robot HUD**: Mô hình Robot tương tác 3D (Three.js / React Three Fiber), mắt phát sáng cyan, chuyển động lơ lửng, vòng radar holo xoay quanh và máy trạng thái hoạt họa (`IDLE`, `LISTENING`, `THINKING`, `SPEAKING`, `PROCESSING`, `SUCCESS`, `ERROR`).
- ⚡ **Tâm điểm Chỉ huy Đa Tác nhân (Agent Command Center)**: Điều phối tập trung qua `HADES Orchestrator` với các tác nhân chuyên sâu (`GmailAgent`, `FinanceAgent`, `CodingAgent`, `ProductivityAgent`, `SystemAgent`).
- 🛡️ **Bảo mật Đa lớp (Defense in Depth)**: Ranh giới Electron Sandbox nghiêm ngặt (`contextIsolation: true`, `nodeIntegration: false`), Session Capability Token động 256-bit chống DNS rebinding, và lưu trữ khóa trong Windows Credential Manager (`keyring`).
- 💰 **Trung tâm Tài chính (Finance Center)**: Quản lý thu chi bằng số học nguyên VND chính xác, ngân sách tháng, biểu đồ Recharts, xuất nhập CSV và nhận diện giao dịch trùng lặp bằng thuật toán Fingerprinting.
- 💻 **Trung tâm Lập trình (Coding Center)**: Quản lý danh mục dự án được cấp phép (Allowlist Directories), tích hợp Git CLI chỉ đọc an toàn (`git status`, `git log`, `git diff`), chuẩn hóa kiến trúc Spring Boot và React TypeScript.
- ✉️ **Trung tâm Gmail (Gmail Center)**: Hỗ trợ xác thực Google OAuth 2.0 PKCE trên desktop, tóm tắt email thông minh, phòng chống Prompt Injection và **Cổng Phê duyệt Bắt buộc (Approval Gate)** trước khi gửi email.
- 🎙️ **Hệ thống Giọng nói (Voice System)**: Chế độ đàm thoại Push-to-Talk bằng tiếng Việt qua Web Speech API, đồng bộ nhịp nhàng với hiệu ứng avatar 3D.

---

## 2. KIẾN TRÚC HỆ THỐNG & CÔNG NGHỆ

```
+---------------------------------------------------------------------------------+
|                                 WINDOWS 10 / 11                                 |
+---------------------------------------------------------------------------------+
|  ELECTRON MAIN PROCESS (Node.js)                                                |
|  - Quản lý vòng đời ứng dụng & Watchdog tự động khởi động/tắt Backend           |
|  - Sinh Session Capability Token ngẫu nhiên (32-byte crypto hex)                |
|  - Cửa sổ không viền (Frameless HUD Window) & Kiểm soát điều hướng ngoại vi     |
+----------------------------------------+----------------------------------------+
                                         | Typed IPC Bridge (window.hadesApi)
                                         v
+---------------------------------------------------------------------------------+
|  ELECTRON PRELOAD (contextIsolation: true, sandbox: true)                       |
+----------------------------------------+----------------------------------------+
                                         |
                                         v
+---------------------------------------------------------------------------------+
|  FRONTEND RENDERER (React 19 + TypeScript + Vite + Tailwind CSS)               |
|  - 3D Holographic Robot HUD (Three.js / React Three Fiber / Drei)               |
|  - Futuristic HUD Components (CircularGauge, HudPanel, NeonButton, StatusTag)  |
|  - State Management: Zustand Stores                                             |
|  - Routing: Home, AgentCenter, Gmail, Finance, Coding, Productivity, Settings   |
+----------------------------------------+----------------------------------------+
                                         | HTTP / SSE Stream (127.0.0.1:<port>)
                                         v
+---------------------------------------------------------------------------------+
|  LOCAL BACKEND (FastAPI + Python 3.14 + Uvicorn)                                |
|  - SessionCapabilityMiddleware (Xác thực Bearer Token & Kiểm tra Host Header)   |
|  - Multi-Agent Orchestrator (Intent Classifier, Router, Context Assembler)      |
|  - Tool Gateway & Deny-by-default Permission Manager                            |
|  - Persistence Layer: SQLite (WAL Mode) + SQLAlchemy + Alembic                  |
|  - Secure OS Storage: Windows Credential Manager (DPAPI / Windows Vault)        |
+---------------------------------------------------------------------------------+
```

---

## 3. HƯỚNG DẪN CÀI ĐẶT & CHẠY ỨNG DỤNG

### Yêu cầu tiên quyết:
- **Hệ điều hành**: Windows 10 hoặc Windows 11 (64-bit).
- **Node.js**: Phiên bản 18+ (Đã xác minh tương thích Node v24).
- **Python**: Phiên bản 3.12+ (Đã xác minh tương thích Python 3.14).
- **Git**: Đã cài đặt trên Windows.

### Bước 1: Khởi tạo Môi trường Python Backend
```powershell
# Tạo môi trường ảo Python
python -m venv .venv

# Kích hoạt môi trường ảo
.\.venv\Scripts\Activate.ps1

# Cài đặt các thư viện phụ thuộc
pip install fastapi uvicorn pydantic sqlalchemy alembic pytest ruff psutil keyring google-genai
```

### Bước 2: Khởi tạo Phụ thuộc Frontend & Electron
```powershell
npm install
```

### Bước 3: Chạy Kiểm thử Tự động
```powershell
# Kiểm thử Backend (11 unit/integration tests)
$env:PYTHONPATH="."
.\.venv\Scripts\pytest backend/tests -v

# Rà soát mã nguồn Backend bằng Ruff
.\.venv\Scripts\ruff check backend

# Kiểm thử Component Frontend bằng Vitest
npm test
```

### Bước 4: Khởi chạy Ứng dụng Desktop
```powershell
# Chạy chế độ phát triển (Frontend Vite + Backend FastAPI + Electron)
npm run dev

# Hoặc biên dịch mã nguồn và đóng gói
npm run build
```

---

## 4. BẢNG TIÊU CHÍ AN TOÀN & BẢO MẬT (SECURITY STANDARDS)

| Tính năng bảo mật | Cơ chế triển khai | Trạng thái |
|---|---|---|
| **Ranh giới Sandbox** | `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false` | ✅ Đã kiểm chứng |
| **Bảo vệ Local Backend** | Kiểm tra Session Capability Token ngẫu nhiên & Chặn DNS Rebinding | ✅ Đã kiểm chứng (Test passed) |
| **Lưu trữ Khóa bí mật** | Windows Credential Manager (`keyring` DPAPI), không lưu plaintext | ✅ Đã kiểm chứng |
| **Phòng thủ Path Traversal** | Chuẩn hóa `resolve()` và bắt buộc nằm trong thư mục Allowlist | ✅ Đã kiểm chứng (Test passed) |
| **Chống Shell Injection** | Tuyệt đối không dùng `shell=True`, sử dụng mảng đối số và allowlist | ✅ Đã kiểm chứng (Test passed) |
| **Phòng ngừa Prompt Injection** | Bộ lọc tách biệt dữ liệu ngoại vi (`SecuritySanitizer`) | ✅ Đã kiểm chứng (Test passed) |
| **Cổng Phê duyệt Gửi Thư** | Bắt buộc người dùng xem trước và bấm duyệt trước khi gửi email | ✅ Đã kiểm chứng |
| **Số học Tài chính Chính xác** | Sử dụng số nguyên (VND minor units), không dùng floating-point | ✅ Đã kiểm chứng (Test passed) |

---

## 5. BẢN QUYỀN & GIẤY PHÉP
Dự án được phát triển dưới giấy phép MIT License. Mọi chi tiết kỹ thuật tuân thủ nghiêm ngặt chuẩn kiến trúc hệ thống desktop bảo mật cao.
