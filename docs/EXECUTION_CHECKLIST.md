# HADES OS — KẾ HOẠCH & BẢNG TIẾN ĐỘ THỰC THI (EXECUTION CHECKLIST)

## QUY TẮC CỐT LÕI (MANDATORY RULES)
- Mọi giải pháp đều là mã nguồn thực thi thật (No fake integrations / no mock placeholders in production path).
- Toàn bộ giao diện người dùng, tài liệu giải thích, thông báo lỗi viết bằng **Tiếng Việt**.
- Xác minh bằng kiểm thử tự động (Unit / Integration test) trước khi đánh dấu hoàn thành mỗi Milestone.
- Không tự ý chạy các lệnh Git nguy hiểm hoặc commit/push tự động.

---

## DANH SÁCH CỘT MỐC (MILESTONES)

### [x] M0 — Khảo sát môi trường & Thiết kế kiến trúc (Requirements & Architecture)
- [x] Khảo sát môi trường hệ thống (Node.js v24.17.0, Python 3.14.6, Git 2.52.0, Windows 10/11 x64).
- [x] Thử nghiệm và xác minh khả năng tương thích của các thư viện Backend trên Python 3.14.
- [x] Soạn thảo tài liệu Kiến trúc hệ thống (`docs/ARCHITECTURE.md`).
- [x] Soạn thảo đặc tả Lược đồ Cơ sở dữ liệu 20 bảng chuẩn hóa (`docs/DATABASE_SCHEMA.md`).
- [x] Soạn thảo chính sách An ninh bảo mật & Ranh giới đặc quyền (`docs/SECURITY.md`).
- [x] Lập bảng tiến độ thực thi chi tiết (`docs/EXECUTION_CHECKLIST.md`).

---

### [ ] M1 — Nền tảng Ứng dụng Desktop (Desktop Foundation)
- [ ] Khởi tạo dự án Electron + Vite + React 19 + TypeScript + Tailwind CSS.
- [ ] Thiết lập cấu hình Electron bảo mật (`contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`, CSP).
- [ ] Xây dựngTyped IPC Bridge (`window.hadesApi`) và Backend Manager trong Electron Main Process.
- [ ] Khởi tạo FastAPI Backend với middleware xác thực Session Capability Token và CORS guard.
- [ ] Thiết lập SQLite (WAL mode) với SQLAlchemy ORM và Alembic Migrations.
- [ ] Xây dựng cơ chế khởi động/tắt Backend tự động (Lifecycle Watchdog & Graceful Shutdown).
- [ ] Viết và chạy bộ kiểm thử M1 (Health check, IPC contract, Database connectivity).

---

### [ ] M2 — Giao diện Tương lai HUD & Avatar 3D HADES (Futuristic UI & 3D Robot)
- [ ] Xây dựng Hệ thống Design System HUD: Dark Navy (`#020813`), Electric Blue (`#00f0ff`), Neon Amber (`#ff9900`), Circuit texture, Thin borders.
- [ ] Phát triển các component HUD tái sử dụng: `HudPanel`, `CircularGauge`, `NeonButton`, `StatusIndicator`, `MetricCard`, `AgentNode`, `CommandBar`.
- [ ] Xây dựng Avatar Robot 3D với Three.js / React Three Fiber (Mô hình Low-poly Cybernetic, mắt phát sáng Cyan, tai nghe công nghệ, phần thân trên lơ lửng).
- [ ] Xây dựng State Machine cho Avatar: `IDLE`, `LISTENING`, `THINKING`, `SPEAKING`, `PROCESSING`, `SUCCESS`, `ERROR`.
- [ ] Thêm hiệu ứng âm thanh phản hồi (Audio-reactive visualizer) và tùy chọn Reduced-Motion / Graphic Presets (Low/Medium/High).
- [ ] Xây dựng màn hình Home: Đồng hồ Windows thực tế, giám sát phần cứng thực tế (CPU, RAM, GPU, Disk), thời tiết theo vị trí chỉ định.
- [ ] Viết component tests cho các HUD components.

---

### [ ] M3 — Trọng tâm Gemini AI & Hệ thống Đa Tác nhân (Gemini & Multi-Agent Orchestrator)
- [ ] Tích hợp Google Gemini API qua SDK `google-genai` với cơ chế cấu hình bảo mật API Key qua Windows Credential Manager.
- [ ] Xây dựng Streaming Chat với Server-Sent Events (SSE) / WebSocket.
- [ ] Xây dựng Central AI Orchestrator: Nhận diện ý định (Intent Classification), điều phối tác nhân, tổng hợp ngữ cảnh.
- [ ] Xây dựng Tool Gateway với Typed Contracts, kiểm soát quyền hạn (Deny-by-default) và Approval Gate.
- [ ] Hỗ trợ chế độ hoạt động Ngoại tuyến (Offline Fallback) khi mất mạng hoặc chưa cấu hình API Key.
- [ ] Viết bộ kiểm thử Orchestrator và Tool Gateway.

---

### [ ] M4 — Trung tâm Gmail (Gmail Center)
- [ ] Triển khai luồng xác thực OAuth 2.0 PKCE trên desktop với loopback HTTP server cục bộ.
- [ ] Lưu trữ an toàn Refresh Token trong Windows OS Credential Storage.
- [ ] Tích hợp Gmail API chính thức: Danh sách email, tìm kiếm, lọc theo nhãn/người gửi, chi tiết email.
- [ ] Tác nhân GmailAgent: Tóm tắt email thông minh, phân loại (Công việc, Ngân hàng, GitHub, v.v.), trích xuất hạn chót (Deadlines).
- [ ] Tạo bản nháp (Draft) và kiểm soát an toàn: Bắt buộc người dùng bấm xác nhận trực tiếp trước khi gửi email.
- [ ] Phòng chống Prompt Injection đối với nội dung email không tin cậy.
- [ ] Viết kiểm thử cho Gmail OAuth state và GmailAgent với Mock API.

---

### [ ] M5 — Trung tâm Tài chính (Finance Center)
- [ ] Xây dựng hệ thống quản lý thu/chi với số học nguyên (integer minor units / cents) cho VND.
- [ ] Quản lý danh mục (Categories), tài khoản (Accounts), giao dịch (Transactions), ngân sách tháng (Budgets).
- [ ] Báo cáo phân tích thu chi, biểu đồ xu hướng Recharts, cảnh báo vượt ngân sách.
- [ ] Nhập/Xuất dữ liệu định dạng CSV chuẩn, thuật toán phát hiện giao dịch trùng lặp (Fingerprinting).
- [ ] Tích hợp Gmail-to-Finance: Trích xuất giao dịch từ hóa đơn email, hiển thị trường chưa chắc chắn, yêu cầu duyệt trước khi ghi sổ.
- [ ] Viết kiểm thử tính toán tài chính, chống lỗi số thực, và phát hiện trùng lặp.

---

### [ ] M6 — Trung tâm Lập trình (Coding Center)
- [ ] Quản lý danh mục dự án được cấp phép (Allowlisted Project Directories) với chuẩn hóa đường dẫn tuyệt đối.
- [ ] Cấu hình hồ sơ mẫu cho GreenPhone (Spring Boot/React TS), CertMaster (Java/TOEIC), EDTOEIC Assistant (Extension/Python).
- [ ] Tích hợp Git CLI chỉ đọc an toàn (`git status`, `git branch`, `git log`, `git diff`).
- [ ] Tích hợp GitHub API (Issues, Pull Requests) khi có cấu hình Personal Access Token.
- [ ] AI Code Review theo chuẩn kỹ thuật (Spring Boot layered architecture, React strict TypeScript).
- [ ] Chạy kiểm thử tự động với danh sách lệnh an toàn (`mvn test`, `npm test`) có giới hạn timeout và subprocess isolation.
- [ ] Đề xuất commit message chuẩn bằng tiếng Việt.
- [ ] Viết kiểm thử bảo mật chống Shell Injection và Path Traversal.

---

### [ ] M7 — Trung tâm Năng suất & Hệ thống Giọng nói (Productivity & Voice System)
- [ ] Quản lý công việc (Tasks), độ ưu tiên, hạn chót, liên kết dự án, lịch trình trong ngày.
- [ ] Hệ thống thông báo hệ thống và cảnh báo quá hạn.
- [ ] Tích hợp Voice Push-to-talk: Nhận diện giọng nói (Speech-to-Text) và Đọc phản hồi (Text-to-Speech) tiếng Việt.
- [ ] Kết nối trạng thái giọng nói trực tiếp với Avatar 3D (Listening / Speaking state).
- [ ] Kiểm thử luồng công việc và trạng thái âm thanh.

---

### [ ] M8 — Tối ưu hóa, Kiểm thử Toàn diện & Đóng gói Windows (Hardening & Release)
- [ ] Rà soát an ninh toàn diện (Security Audit): Kiểm tra CSP, Sandbox, Path traversal, Shell injection, Token leakage.
- [ ] Tối ưu hóa hiệu năng: Điều tiết GPU khi ẩn cửa sổ, adaptive 3D quality presets, dọn dẹp bộ nhớ.
- [ ] Chạy bộ kiểm thử tự động tổng thể (Frontend + Backend).
- [ ] Đóng gói ứng dụng thành file cài đặt Windows `.exe` bằng Electron Builder và Sidecar backend.
- [ ] Hoàn thiện tài liệu hướng dẫn cài đặt và vận hành chi tiết bằng tiếng Việt.
