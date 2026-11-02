# Kiểm tra vấn đáp bằng micro trên máy thật

Các test tự động giả lập giọng nói và nhà cung cấp AI. Checklist này kiểm tra chất lượng giọng Việt, độ trễ và micro thật sau khi backend được khởi động lại.

1. Đăng nhập sinh viên đã được ghi danh và phân lịch; vào phòng. Chưa nhấn tham gia thì thời gian trả lời chưa bắt đầu. Không có nút camera hay yêu cầu quyền camera.
2. Nhấn **Tham gia phỏng vấn**, cho phép micro. Nghe lời chào và câu hỏi; khi giám khảo nói xong, trạng thái chuyển **Đang nghe bạn**. Không cần nhấn gửi trong chế độ giọng nói.
3. Trả lời một ý ngắn, ngừng nói khoảng 1,5 giây. Kiểm tra giám khảo phản hồi gắn với đúng ý vừa nói và chỉ hỏi một câu làm rõ.
4. Nói “Thầy/cô có thể nói rõ câu hỏi này nghĩa là gì không?”. Giám khảo cần diễn đạt lại câu hỏi, không đọc đáp án tham khảo. Lượt làm rõ vẫn chịu giới hạn hỏi thêm.
5. Trình bày một ý mâu thuẫn với câu trả lời trước. Kiểm tra giám khảo nêu nhẹ nhàng hai ý rồi yêu cầu giải thích, khi còn lượt xoáy.
6. Nói chen lúc giám khảo đang đọc. Giọng AI phải dừng; lời bổ sung xuất hiện trong phụ đề, sau đó được phản hồi. Dùng tai nghe khi kiểm tra để phân biệt giọng người nói với tiếng loa lọt vào micro.
7. Im lặng 8 giây khi chưa trả lời: giám khảo nhắc nhẹ một lần, không tăng số lượt xoáy.
8. Tắt mic khi đang có vài từ nhận dạng; đợi hơn 1,5 giây rồi bật lại và nói tiếp. Phần đã nói được giữ, không tự gửi trong lúc tắt mic; đồng hồ vẫn chạy.
9. Nói liên tục qua mốc hết giờ: phần văn bản server đã nhận trước hạn phải được chốt; không nhận sửa câu trả lời sau hạn. Sau đó hệ thống tự tiếp tục, không cần nhấn gửi.
10. Đạt số lượt hỏi thêm của câu chính: giám khảo ghi nhận và chuyển câu, không phát câu xoáy vượt giới hạn. Khi chuyển câu có lời nối tự nhiên; khi hết bài có lời kết.
11. Từ chối quyền micro hoặc dùng trình duyệt không hỗ trợ: hiện chế độ văn bản, giữ phần lời nói đã nhận được; có thể trở lại giọng nói.
12. Mở lịch sử hội thoại, tải lại trang và xem kết quả: transcript không trùng câu trả lời, điểm dùng rubric của đề. Kiểm tra thêm màn hình điện thoại, mở rộng phòng và phím Escape.

Mặc định đề mới: 60 giây/lượt, 2 lượt hỏi thêm/câu. Đề đã có giữ cấu hình giảng viên đã lưu; lịch thi và tổng ngân sách hỏi thêm vẫn do server áp dụng.
