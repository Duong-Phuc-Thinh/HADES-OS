# HƯỚNG DẪN SỬ DỤNG CHI TIẾT — HADES OS

Tài liệu này cung cấp hướng dẫn vận hành toàn diện cho người dùng về các phân hệ trong ứng dụng **HADES OS**.

---

## 1. MÀN HÌNH TỔNG QUAN — HADES COMMAND DESKTOP

Giao diện chỉ huy chính mang phong cách Cyberpunk HUD tương lai, cung cấp góc nhìn toàn cảnh về hệ thống:
1. **Mô hình Robot 3D Tương tác (Center HUD)**:
   - Avatar hiển thị trạng thái hiện thời của AI:
     - `IDLE`: Chuyển động lơ lửng thư giãn, mắt cyan dịu.
     - `LISTENING`: Đang lắng nghe giọng nói từ micro (bấm nút Mic trên thanh điều khiển).
     - `THINKING`: Xoay đầu phân tích, vòng radar quay nhanh.
     - `SPEAKING`: Mắt và viền xung nhịp theo nội dung phản hồi.
     - `ERROR`: Chớp cảnh báo màu đỏ/cam khi gặp lỗi kết nối.
2. **Giám sát Phần cứng Windows Thực tế (Left Panel)**:
   - Đồng hồ đo CPU Load thực tế cập nhật theo chu kỳ 3 giây.
   - Thống kê RAM sử dụng / tổng dung lượng RAM (GB).
   - Dung lượng ổ đĩa C: (Dung lượng trống thực tế).
   - Tên Card đồ họa (GPU) nhận diện tự động từ Windows.
3. **Thanh Mệnh lệnh & Đàm thoại (Bottom Command Bar)**:
   - Nhập câu hỏi hoặc mệnh lệnh bằng bàn phím (bấm `Enter` để thực thi).
   - Bấm nút **Microphone** để kích hoạt chế độ giọng nói Push-to-Talk bằng tiếng Việt.

---

## 2. TRUNG TÂM TÁC NHÂN (AGENT COMMAND CENTER)

1. **Sơ đồ Mạng lưới Tác nhân**:
   - `HADES Orchestrator`: Bộ não điều phối trung tâm. Khi bạn gửi câu hỏi, Orchestrator sẽ tự động phân loại ý định (Intent Classification) và chuyển giao cho tác nhân chuyên trách.
   - `GmailAgent`: Chuyên xử lý email, tóm tắt và soạn thảo.
   - `FinanceAgent`: Chuyên quản lý chi tiêu, tính toán ngân sách.
   - `CodingAgent`: Chuyên kiểm tra trạng thái Git và đánh giá code.
   - `ProductivityAgent`: Quản lý công việc và hạn chót.
   - `SystemAgent`: Thu thập thông số kỹ thuật phần cứng máy tính.
2. **Cổng Phê duyệt (Approval Gate)**:
   - Đối với các hành động nhạy cảm (như gửi email, chạy lệnh test, hoặc ghi sửa file), hệ thống sẽ dừng lại và hiển thị yêu cầu phê duyệt tại đây để bạn quyết định trước khi thực hiện.
3. **Nhật ký Thực thi (Audit Logs)**:
   - Hiển thị danh sách các lần gọi công cụ, thời gian thực thi (ms) và phân loại bảo mật.

---

## 3. TRUNG TÂM GMAIL (GMAIL CENTER)

1. **Kết nối Tài khoản**:
   - Bấm nút **"Kết nối tài khoản Google"** để khởi chạy luồng OAuth 2.0 PKCE trên trình duyệt.
   - Sau khi hoàn tất, Refresh Token được mã hóa và cất giữ trong Windows Credential Manager.
2. **Xem & Tóm tắt Email Thông minh**:
   - Chọn bất kỳ email nào trong danh sách hộp thư.
   - Bấm nút **"AI Tóm Tắt & Phân Loại"** để nhận bản tóm tắt nội dung chính và hạn chót cần xử lý.
3. **Soạn thảo & Gửi thư An toàn**:
   - Nhập nội dung vào khung soạn thảo trả lời.
   - Bấm **"Gửi Email (Cần duyệt)"**: Cửa sổ xác nhận an toàn sẽ hiện ra để bạn kiểm tra lại nội dung lần cuối trước khi gửi thật.

---

## 4. TRUNG TÂM TÀI CHÍNH (FINANCE CENTER)

1. **Số học Chính xác (VND Minor Units)**:
   - Mọi khoản thu chi đều được tính toán theo đơn vị nguyên đồng (VND), ngăn chặn triệt để lỗi làm tròn số thực.
2. **Thêm Khoản Thu / Chi**:
   - Bấm nút **"Thêm Giao Dịch"**.
   - Chọn loại: **Khoản Chi** hoặc **Khoản Thu**.
   - Nhập số tiền (ví dụ: `45000` hoặc `1500000`), chọn danh mục (Ăn uống, Tiền nhà, Lương, Mua sắm...) và tài khoản thanh toán.
   - Bấm **"Lưu Giao Dịch"**. Số dư tài khoản sẽ tự động cộng/trừ tương ứng.
3. **Chống Trùng lặp Giao dịch**:
   - Hệ thống tự động tính mã băm vân tay (Fingerprint). Nếu bạn vô tình thêm 2 giao dịch trùng ngày, trùng số tiền và trùng đối tác, hệ thống sẽ cảnh báo ngăn chặn.
4. **Xuất Báo cáo CSV**:
   - Bấm nút **"Xuất CSV"** để tải về tệp bảng tính Excel/CSV chứa toàn bộ sổ thu chi.

---

## 5. TRUNG TÂM LẬP TRÌNH (CODING CENTER)

1. **Đăng ký Thư mục Dự án (Allowlist)**:
   - Bấm **"Đăng ký Dự án Mới"**.
   - Nhập tên dự án và đường dẫn thư mục mã nguồn trên máy (ví dụ `D:\IT\GreenPhone`).
   - Hệ thống áp dụng quy tắc chuẩn hóa đường dẫn tuyệt đối (Path Canonicalization) để bảo vệ bạn khỏi các tệp độc hại ngoài danh mục.
2. **Giám sát Trạng thái Git**:
   - Hiển thị nhánh hiện tại (`current_branch`), các tệp đang staged, unstaged, và commit history mới nhất.
3. **Đánh giá Mã nguồn (AI Code Review)**:
   - Bấm nút **"AI Code Review"** để tác nhân `CodingAgent` kiểm tra mã nguồn theo chuẩn:
     - Spring Boot: Phân tầng Layered Architecture, tính toàn vẹn `@Transactional`, quản lý lỗi tiếng Việt.
     - React: Strict TypeScript, xử lý async, cấu trúc component modular.
   - Đề xuất commit message chuẩn theo định dạng Conventional Commits bằng tiếng Việt.

---

## 6. TRUNG TÂM CÀI ĐẶT & HIỆU NĂNG (SETTINGS)

1. **Cấu hình Gemini API Key**:
   - Nhập khóa API từ Google AI Studio. Khóa sẽ được lưu an toàn trong hệ điều hành Windows qua Windows Credential Manager.
   - Tùy chọn mô hình: `Gemini 2.5 Flash` (mặc định) hoặc `Gemini 2.5 Pro`.
2. **Tùy chỉnh Đồ họa 3D**:
   - Mức chất lượng: `Tiết kiệm (Low)`, `Cân bằng (Medium)`, `Cao cấp (High)`.
   - Bật **"Chế độ Giảm chuyển động"** nếu muốn tắt hiệu ứng xoay để tiết kiệm pin tối đa trên laptop.
