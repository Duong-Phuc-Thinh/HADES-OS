# HADES OS — TIÊU CHUẨN AN TOÀN & BẢO MẬT (SECURITY SPECIFICATION)

## 1. MÔ HÌNH NGUY CƠ & NGUYÊN TẮC THIẾT KẾ (THREAT MODEL & CORE PRINCIPLES)

HADES OS được thiết kế theo nguyên tắc **Phòng thủ Đa lớp (Defense in Depth)** và **Đặc quyền Tối thiểu (Principle of Least Privilege)**:
1. **Zero-Trust với Đầu ra của LLM**: Nội dung do mô hình AI tạo ra được coi là đề xuất (proposals) chứ KHÔNG PHẢI là chỉ thị trực tiếp để hệ điều hành thực thi.
2. **Untrusted External Content**: Nội dung email từ Gmail, tệp tin từ kho mã nguồn, kết quả trang web ngoại vi đều được phân loại là dữ liệu có độ tin cậy thấp, có nguy cơ mang payload Prompt Injection.
3. **Deny-by-Default Execution**: Mọi công cụ (tool) có khả năng thay đổi trạng thái (ghi email, thay đổi file, chạy lệnh CLI) đều bị chặn mặc định cho đến khi được cấp quyền rõ ràng và có sự đồng ý trực tiếp (Approval Gate) từ người dùng.
4. **Không lưu trữ bí mật dạng Plaintext**: API Key, OAuth Tokens không bao giờ được ghi vào database SQLite, log files, hay localStorage của giao diện.

---

## 2. BẢO MẬT GIAO DIỆN ELECTRON & IPC BRIDGE

- **Cấu hình Sandbox**:
  - `contextIsolation: true`
  - `nodeIntegration: false`
  - `sandbox: true`
- **Content Security Policy (CSP)** nghiêm ngặt:
  Chỉ cho phép tải mã nguồn nội bộ (`'self'`), cấm `eval()`, giới hạn kết nối mạng chỉ đến loopback backend (`http://127.0.0.1:<port>` và `ws://127.0.0.1:<port>`).
- **Typed IPC Bridge**:
  Renderer chỉ được gọi các hàm định sẵn trong `window.hadesApi`. Mọi đối số truyền qua IPC đều được validate kiểu dữ liệu.

---

## 3. BẢO MẬT BACKEND CỤC BỘ (LOCAL BACKEND SECURITY)

- **Liên kết mạng an toàn**:
  FastAPI Backend chỉ lắng nghe trên `127.0.0.1`, tuyệt đối không lắng nghe trên `0.0.0.0` hay giao diện mạng công cộng.
- **Session Capability Token**:
  Mỗi lần khởi chạy, Electron sinh một token ngẫu nhiên an toàn 256-bit (32 bytes hex). Token này được truyền riêng cho Backend và Renderer.
  Backend cài đặt Middleware kiểm tra:
  - Header `Authorization: Bearer <session_token>`.
  - Header `Host` phải là `127.0.0.1:<port>` hoặc `localhost:<port>`.
  - Từ chối mọi request không có token hợp lệ với mã `401 Unauthorized`.
- **CORS Protection**:
  Chặn mọi truy vấn cross-origin từ các trình duyệt web thông thường ngoài Electron.

---

## 4. BẢO VỆ CHỐNG INJECTION & RỦI RO LẬP TRÌNH (COMMAND & PATH SECURITY)

- **Tuyệt đối không dùng `shell=True`**:
  Mọi lệnh thực thi hệ thống đều dùng `subprocess.run` với mảng đối số tách biệt `['git', 'status']`, không qua shell command prompt (`cmd.exe` hay `powershell.exe`).
- **Danh sách Lệnh Cho phép (Command Allowlist)**:
  Chỉ những lệnh và cờ cụ thể được phép chạy:
  - Git Read-only: `git status --porcelain`, `git branch -a`, `git log -n <limit>`, `git diff`, `git show`.
  - Build/Test: `mvn test`, `gradle test`, `npm test` trong thư mục dự án được duyệt.
- **Chuẩn hóa Đường dẫn (Path Canonicalization)**:
  Mọi đường dẫn tệp tin đều được chuẩn hóa qua `os.path.realpath()` hoặc `pathlib.Path.resolve()`.
  Kiểm tra nghiêm ngặt đường dẫn phải nằm bên trong thư mục dự án trong Allowlist, ngăn chặn triệt để tấn công Path Traversal (`..\..\`).

---

## 5. BẢO MẬT DỮ LIỆU TÀI CHÍNH & EMAIL

- **Số học chính xác**:
  Tiền tệ VND được lưu trữ dưới dạng số nguyên (integer minor units / cents / đồng), nghiêm cấm dùng binary floating-point (`float` trong Python hoặc `number` không kiểm soát trong JS) cho các phép tính tổng và số dư.
- **Chống Trùng lặp Giao dịch**:
  Mỗi giao dịch sinh mã băm duy nhất (fingerprint = SHA256 của `ngày + số tiền + người nhận + tài khoản`).
- **Email Safe Parsing & Approval Gate**:
  - Không tự động gửi email, xóa email hoặc chuyển tiếp email.
  - Phải có bước người dùng xem trước (Preview) và bấm xác nhận (Confirm) trước khi gửi hoặc trước khi thêm giao dịch tài chính từ email vào sổ sách.
