## Cập nhật tính năng

Phòng thi mặc định là hội thoại bằng giọng nói: vào phòng một lần, AI đọc xong thì micro tự ghi; sau khi sinh viên đã nói và ngừng khoảng 4 giây, hệ thống tự gửi bản ghi, AI xử lý và hỏi tiếp. Có phụ đề trực tiếp, trạng thái AI nói/nghe/suy nghĩ, nút Tôi đã trả lời xong, và chế độ dự phòng ghi âm/nhập văn bản. Giảng viên cấu hình độc lập giới hạn hỏi xoáy mỗi câu chính và tổng câu đào sâu mỗi sinh viên; backend kiểm tra cả hai. Hội thoại luân phiên, chưa hỗ trợ nói chen ngắt AI hoặc video. Chi tiết tại INTERVIEW_FEATURE.md trong backend.

Luồng câu hỏi hỗ trợ import CSV/JSON có mẫu và xem trước, hoặc sinh AI từ PDF/DOCX ngay tại Ngân hàng câu hỏi. Mọi câu mới chờ giáo viên sửa/từ chối/loại bỏ/duyệt, gắn Bloom và rubric có tiêu chí/thang điểm. Kỳ thi có RANDOM/ADAPTIVE, số câu chính và **tổng câu đào sâu tối đa cho mỗi sinh viên**, không đặt lại khi chuyển câu chính. Key nằm trong .env backend; khởi động lại backend và tải lại frontend sau khi cập nhật. Với schema quản lý thủ công, chạy `D:/Dev_Backend/SWD392_SE1907_AIVES/database/04_student_followup_budget.sql`; ddl-auto=update hiện tại tự thêm cột mới.

Hướng dẫn đầy đủ: D:/Dev_Backend/SWD392_SE1907_AIVES/INTERVIEW_FEATURE.md và TEACHING_FEATURES.md.

# AIVES – Frontend tích hợp Spring Boot (phiên bản cập nhật)

Source này được sửa trực tiếp từ `Dev_Frontend.zip` theo **các Controller thực tế** trong `Dev_Backend.zip` người dùng cung cấp. Dùng React 19, Vite 8, Tailwind CSS 4; giữ giao diện AIVES, Navbar và Sidebar của nhóm. **Không chứa connection string, mật khẩu Neon hay JWT secret.**

## Khởi động nhanh

**1.** Mở `Dev_Backend/SWD392_SE1907_AIVES` trong IntelliJ, khởi động Spring Boot trên `localhost:8080` (database Neon, biến `JWT_SECRET`, Entity/schema phải hợp lệ). Kiểm tra http://localhost:8080/actuator/health .

**2.** Trong thư mục frontend có `package.json`:

```bash
cp .env.example .env          # PowerShell: Copy-Item .env.example .env
npm ci
npm run dev
```

Mở **http://localhost:3000**. Vite proxy tất cả request `/api/*` sang backend `http://localhost:8080`. Nếu backend không dùng cổng 8080, chạy:

```bash
# PowerShell
$env:API_PROXY_TARGET="http://localhost:8081"
npm run dev
```

`VITE_API_BASE_URL=/api/v1` là đường dẫn tương đối của frontend. Không đưa PostgreSQL connection string hoặc JWT secret vào `.env` frontend. Frontend kết nối thông qua REST API, **không** kết nối trực tiếp Neon.

## Những API đã tích hợp

| Phần | Endpoint Spring Boot | Ghi chú |
|---|---|---|
| Đăng nhập | `POST /api/v1/auth/login` | `{email,password}` -> `{code,data:{authenticate,token}}` |
| Hồ sơ | `GET /api/v1/users/{id}` | JWT trong Authorization |
| Quản trị user | `GET/POST /api/v1/users`; `PUT /users/{id}`; `PATCH .../activate|deactivate` | Admin mới được quản trị |
| Môn học | `GET/POST /api/v1/courses` | `code`, `name`, `description` |
| Phân công/ghi danh | `POST /api/v1/courses/{id}/lecturers|students`; `GET /courses/{id}/students` | Chỉ Admin ghi danh; giáo viên đọc danh sách để phân lịch |
| Rubric | `POST /api/v1/rubrics`, `GET /api/v1/courses/{id}/rubrics`, `POST /api/v1/rubrics/{id}/criteria`, `PATCH .../publish` | Chấm tổng điểm trên backend |
| Câu hỏi | `GET /api/v1/courses/{id}/questions`, `POST /api/v1/questions`, `PUT/DELETE /questions/{id}`, `PATCH /questions/{id}/review?approve=true|false` | Giáo viên sửa/loại bỏ/duyệt; chỉ APPROVED thuộc ngân hàng chính thức |
| Kỳ thi | `GET/POST /api/v1/exams`, `GET/PUT /exams/{id}`, `GET/POST /exams/{id}/questions|candidates`, các API sửa/gỡ câu và lịch, `PATCH .../activate|close` | Giáo viên quản lý đề và lịch theo tên kỳ thi |
| Sinh viên thi | `POST /api/v1/attempts/start/{candidateId}`, `GET /api/v1/attempts/{attemptId}/questions`, `POST /api/v1/attempts/questions/{assignedQuestionId}/answer` | Câu trả lời text |

## Quy trình test bằng dữ liệu thật

1. Admin đăng nhập tài khoản đã có trong database (backend không có đăng ký công khai).
2. Admin tạo tài khoản giảng viên và sinh viên qua quản lý user.
3. Admin tạo môn và phân công giảng viên; từ đây giáo viên phụ trách nhóm 1 và 2.
4. Giảng viên tạo rubric và các tiêu chí tổng điểm bằng `maxScore`; publish.
5. Giáo viên tạo câu hỏi thủ công hoặc AI. Ở tab Chờ giáo viên duyệt, kiểm tra nguồn, sửa/loại bỏ, rồi duyệt vào Ngân hàng chính thức.
6. Admin ghi danh sinh viên trong Môn học & sinh viên. Giáo viên tạo kỳ thi, thêm đủ câu APPROVED vào đề, chọn sinh viên đã ghi danh để phân lịch; kích hoạt khi đã chuẩn bị xong.
7. Giáo viên xem danh sách thí sinh, sửa hoặc bỏ lịch chưa bắt đầu; kết thúc kỳ thi khi không còn lượt đang thi.
8. Sinh viên đăng nhập, chọn kỳ thi theo tên từ Lịch thi / Phòng thi, bắt đầu trong đúng khung giờ và trả lời qua giọng nói hoặc văn bản.

## Backend chưa có nên frontend không gọi

- `GET /auth/me`, `POST /auth/logout`, `POST /auth/register`, Google Sign-In (frontend cũ dùng nhưng backend mới không có).
- Danh sách kỳ thi và lịch thi sinh viên đã có API; danh sách được giới hạn theo quyền môn học.
- Sinh viên chọn kỳ thi theo tên trong lịch thi; không cần nhập Candidate ID để mở phòng.
- Giảng viên có Giám sát ca thi: tiến độ tự cập nhật 5 giây, lịch sử lượt thi, transcript, nghe bản ghi và tải transcript TXT. Chỉ giáo viên phụ trách môn được truy cập; admin không có menu hoặc quyền API giám sát. Chấm điểm chưa hoàn thiện.
- Chấm điểm AI, công bố kết quả và báo cáo toàn lớp chưa thuộc luồng phỏng vấn hiện tại.

**Lưu ý:** Backend ở bản ZIP có thể chưa khởi động nếu Entity lệch schema Neon. Lỗi `course_materials.file_sha256` kiểu `CHAR(64)` cần sửa trong Entity Java như đã thảo luận, độc lập với source frontend này.

## Test

```bash
npm test               # API mock bằng Node built-in test runner
npm run build          # cần npm ci thành công
npm run test:e2e       # Playwright với API giả lập; cần cài browser: npx playwright install chromium
```

Đã chạy Node API tests, Vite build và Playwright bằng Edge. Test UI dùng API/micro giả lập; các API OpenAI thật được thử riêng bằng audio tổng hợp. Chưa chạy một buổi thi bằng dữ liệu sinh viên thật trên Neon.

## Cấu trúc thay đổi

- `src/services/api.js`: lớp API /api/v1, unwrap `ApiResponse`, JWT, error handling.
- `src/App.jsx`, `src/components/auth/AuthPage.jsx`: đăng nhập email + hồ sơ + phân quyền.
- `src/components/api/ApiContent.jsx`: users, courses, questions, exams.
- `src/components/api/Rubrics.jsx`, `src/components/api/Dashboard.jsx`, `src/components/api/Monitor.jsx`.
- `src/components/StudentWorkspace.jsx`, `src/components/Interview.jsx`: phỏng vấn từng lượt bằng giọng nói/text, STT trực tiếp, TTS, hỏi xoáy và khôi phục lượt thi.
- `tests/api.test.mjs`: kiểm thử request theo backend.

Chỉ dùng JWT trong `sessionStorage`, không tin nội dung decode ở frontend để xác thực; backend Spring Security vẫn quyết định quyền trên từng API. API key OpenAI chỉ được lưu trên backend. Micro cần HTTPS hoặc localhost; reverse proxy phải hỗ trợ WebSocket.

## Sửa và xóa dữ liệu

Admin có sửa tài khoản, khóa/mở/xóa mềm tài khoản, sửa/ngừng sử dụng/khôi phục môn học, đổi/gỡ giảng viên và ngừng/ghi danh lại sinh viên. Giảng viên có đổi tên/xóa tài liệu chưa dùng, sửa rubric nháp/ngừng rubric chưa gắn câu hỏi, sửa/xóa tiêu chí nháp, sửa/loại câu hỏi, sửa/xóa kỳ thi nháp và sửa/bỏ lịch chưa có lượt thi. Backend chặn các thao tác ảnh hưởng ca đang mở, sinh viên đang thi hoặc nguồn/căn cứ đã dùng; dữ liệu lịch sử được bảo toàn.

Trang giám sát vẫn chỉ dành cho giảng viên. Nếu API giám sát chưa tồn tại sau cập nhật, cần Stop/Run lại backend trong IDE rồi tải lại trang. Backend cũ có thể chuyển lỗi thiếu route thành `Internal server error`; bộ xử lý mới trả 404 đúng nghĩa. Chi tiết API và điều kiện xóa: `D:\Dev_Backend\SWD392_SE1907_AIVES\CRUD_OPERATIONS.md`.
