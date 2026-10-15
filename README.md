# AIVES — Frontend

Giao diện React kết nối Spring Boot và SQL Server qua `/api`. Giữ khung giao diện từ nhánh `FE`, thay dữ liệu mẫu và đăng nhập giả bằng API thật.

## Chạy local (PowerShell)

Chạy backend ở cổng 8080 trước. Trong thư mục `SWD392/Dev_Frontend`:

```powershell
npm.cmd ci
npm.cmd run dev
```

Mở http://localhost:3000. Vite chuyển tiếp `/api` đến `http://localhost:8080`; không cần kết nối SQL trực tiếp từ trình duyệt. Nếu backend dùng cổng khác:

```powershell
$env:API_PROXY_TARGET = 'http://localhost:8081'
npm.cmd run dev
```

Khi triển khai bản build, cấu hình reverse proxy `/api` đến backend hoặc đặt `VITE_API_BASE_URL` trước khi build. Biến frontend là công khai: không đặt mật khẩu SQL hoặc khóa AI trong `.env` frontend.

## Chức năng

- Đăng nhập, đăng ký sinh viên, khôi phục phiên; phân quyền từ backend. Admin sửa vai trò và trạng thái tài khoản.
- Quản lý môn học, tải tài liệu PDF/DOCX/PPTX/TXT, lập chỉ mục, yêu cầu AI sinh câu hỏi chờ duyệt.
- CRUD câu hỏi, Bloom, import JSON, rubric và duyệt/từ chối câu hỏi.
- Tạo kỳ thi, phân lịch sinh viên, xuất bản và xem transcript theo từng lượt thi.
- Sinh viên xem lịch, vào phòng thi, nghe câu hỏi, trả lời bằng giọng nói, sửa/gửi transcript và xem lại câu trả lời đã lưu.

Danh sách trống hiển thị trạng thái trống; lỗi kết nối hiển thị thông báo và nút tải lại. Không tự sinh bản ghi demo để thay dữ liệu SQL.

Google cần `GOOGLE_CLIENT_ID` ở backend và origin frontend được đăng ký trong Google Console. Khi chưa cấu hình, nút Google bị vô hiệu hóa. Sinh câu hỏi từ tài liệu và hỏi đào sâu cần backend có `AI_MODEL` và dịch vụ AI thật đang chạy; giao diện hiển thị lỗi nếu dịch vụ chưa sẵn sàng.

TTS/STT dùng khả năng giọng nói của Chrome/Edge, cần quyền microphone và localhost hoặc HTTPS. Kiểm thử tự động đã kiểm tra lưu transcript; nhận dạng/đọc giọng nói cần kiểm tra với microphone thực tế.

## Kiểm tra

```powershell
npm.cmd test
npm.cmd run build
```

Kiểm thử trình duyệt cần backend thật và tài khoản admin dành riêng cho kiểm thử:

```powershell
$env:TEST_USERNAME = 'your_test_admin'
$env:TEST_PASSWORD = 'your_test_password'
npm.cmd run test:e2e
```

Playwright dùng Microsoft Edge và Vite tại cổng 13000. Chạy trên database phát triển riêng; bài kiểm tra vấn đáp tạo kỳ thi và lưu ID dữ liệu vào `test-results/oral-fixtures.json` để dọn sau kiểm thử. Không dùng database production.
