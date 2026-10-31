# Rà soát backend và frontend — 19/10/2026

Đợt sửa tập trung vào lỗi xử lý yêu cầu, trạng thái giao diện, dữ liệu đầu vào và code thừa. Hợp đồng của các yêu cầu hợp lệ, phân quyền, quy trình duyệt câu hỏi, lựa chọn đề, giới hạn thời gian và hỏi đào sâu được giữ nguyên.

## Các lỗi đã sửa

| Vấn đề | Thay đổi | Kiểm chứng |
| --- | --- | --- |
| Yêu cầu của phiên cũ trả 401 sau khi đã đăng nhập phiên mới có thể đăng xuất người dùng mới | Chỉ phát sự kiện đăng xuất nếu token gửi đi vẫn là token hiện tại | Kiểm thử phản hồi 401 cũ và 401 của phiên hiện tại |
| Timeout xảy ra khi đọc nội dung hoặc âm thanh phản hồi không có thông báo nhất quán | Bao cả việc đọc text/blob trong xử lý lỗi API; giữ nguyên ApiError từ máy chủ | Kiểm thử timeout cho cả text và blob, kiểm thử thông báo lỗi hiện có |
| Bấm cập nhật giám sát làm mất snapshot trước khi nhận kết quả mới | Tách usePolling; chỉ xóa snapshot khi đổi tài nguyên, giữ dữ liệu khi cập nhật thất bại | Kiểm thử bấm Cập nhật ngay khi máy chủ lỗi và vẫn xem được bảng cũ |
| Hai lần submit liên tiếp có thể tạo hai yêu cầu ghi | useMutation khóa bằng ref ngay từ lần gọi đầu và bỏ cập nhật UI sau unmount | Kiểm thử submit biểu mẫu tạo môn hai lần chỉ gửi một yêu cầu |
| Sai HTTP method, Content-Type hoặc Accept bị đổi thành lỗi 500 | Trả đúng 405/415/406, giữ các header liên quan như Allow | Kiểm thử MockMvc các trường hợp không hợp lệ |
| Cập nhật người dùng chấp nhận họ tên/email rỗng | Từ chối chuỗi rỗng hoặc chỉ có khoảng trắng, vẫn cho phép bỏ qua trường không sửa | Kiểm thử dữ liệu bị từ chối và thông tin cũ không bị ghi đè |
| Metadata tài khoản phụ thuộc mặc định DB và updatedAt không được cập nhật | Gán createdAt/updatedAt khi tạo; cập nhật updatedAt khi sửa, đổi mật khẩu hoặc bật/tắt tài khoản | Kiểm thử tạo tài khoản và thời điểm cập nhật |
| Tên kỳ thi dài hơn giới hạn cột chưa được kiểm tra sớm | Kiểm tra tối đa 200 ký tự ở request dùng chung cho tạo/sửa | Kiểm thử dữ liệu quá dài trả 400 |

## Dọn code

- Tách Users và Courses khỏi ApiContent; thay chuỗi điều kiện lồng nhau bằng switch rõ ràng.
- Sắp xếp lại component Users, dùng chung cấu hình cột và thao tác reset; khóa biểu mẫu khi đang lưu.
- Tách polling thành hook riêng; bỏ các import frontend không dùng.
- Dùng truy vấn theo môn/kỳ thi thay cho lấy toàn bộ rồi lọc; bỏ việc dùng exception để lọc danh sách kỳ thi của giảng viên.
- Bỏ dependency, annotation processor và tham số MapStruct không dùng; bỏ property Spotless không có plugin sử dụng. UserMapper hiện tại là component viết tay, không đổi cách ánh xạ.
- Giữ cấu hình tắt SQL log mặc định đã sửa ở lượt trước.

## Kết quả kiểm tra

- Backend: `mvnw.cmd -o test` — 76 kiểm thử, không lỗi hoặc thất bại.
- Frontend: `npm test` — 21 kiểm thử thành công.
- Giao diện: `PLAYWRIGHT_CHANNEL=msedge npm run test:e2e` — 32 kiểm thử thành công, gồm CRUD, duyệt câu hỏi, lịch thi, giám sát, khôi phục phòng thi và trả lời tự động bằng giọng nói.
- `npm run build` thành công; `git diff --check` không có lỗi khoảng trắng.

Backend được kiểm thử bằng H2; giao diện dùng API/micro giả lập. Các kết quả này xác nhận hồi quy trong bộ kiểm thử, không thay thế một ca thi nghiệm thu với người dùng và dịch vụ AI thật. Đợt sửa không chạy migration hoặc sửa dữ liệu Neon. Khởi động lại backend và tải lại trang để nạp bản cập nhật.
