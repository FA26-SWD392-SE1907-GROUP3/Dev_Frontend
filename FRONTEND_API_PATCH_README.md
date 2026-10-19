# AIVES Frontend — Student API integration

Dựa trên AIVES_Frontend_SpringBoot_Integrated.zip và AIVES_API_Patch.zip.

## Đã thay đổi
- `src/services/api.js`: thêm `api.studentExams()` và `api.studentAttempts(candidateId)`.
- `src/components/StudentWorkspace.jsx`: tải lịch thi từ API, hiển thị lịch và trạng thái, xem lượt thi, tiếp tục lượt đang thi, vẫn giữ nhập Candidate ID dự phòng.
- Không thay đổi màn hình admin, lecturer, login và luồng Interview hiện có.

## Chạy
1. Đảm bảo backend đã tích hợp `StudentExamController` và repository từ `AIVES_API_Patch.zip`.
2. `npm ci` rồi `npm run dev` trong thư mục Dev_Frontend.
3. Backend chạy cổng 8080; đăng nhập bằng STUDENT.
4. Kiểm tra GET `/api/v1/student/exams` và GET `/api/v1/student/exams/{candidateId}/attempts` trả 200.

## Giới hạn
- Chưa chạy được `npm run build` trong môi trường tạo bản vá do không có node_modules (`vite: not found`).
- Chưa kiểm thử end-to-end với backend Neon đang chạy trên máy bạn.
- API patch chỉ có hai endpoint đọc; các chức năng AI/chấm điểm chưa được thêm.
