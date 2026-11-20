# 05. BẢNG TEST CASES CHI TIẾT: HỖ TRỢ THỰC KHÁCH & GỌI NHÂN VIÊN

**Mã phân hệ:** `TC-SUP` (Customer Support & Call Staff)  
**Tiêu chí nghiệm thu cốt lõi:**
- Giải đáp chính xác 100% các câu hỏi thường gặp (FAQ: Wifi, bãi xe, chính sách, hóa đơn).
- Quy trình hỗ trợ mang về (Takeaway) rõ ràng về thời gian và phí phụ thu bao bì (nếu có).
- Nút "Gọi nhân viên bàn" kích hoạt tức thời, có gắn thông tin số bàn, cơ chế chống spam hiệu quả và xử lý than phiền khéo léo.

---

## 1. Danh sách Test Cases Chi tiết

| Test Case ID | Phân loại kiểm thử | Mục tiêu & Kịch bản kiểm thử | Dữ liệu đầu vào (User Prompt / Action) | Kết quả kỳ vọng trên giao diện (Expected Output) | Mức độ nghiêm trọng nếu lỗi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-SUP-01** | FAQ: Mạng Wifi & Tiện ích | Khách hỏi thông tin kết nối internet tại quán. | *"Cho xin pass wifi quán mình với."* | Aria cung cấp ngay Tên mạng Wifi (SSID) và Mật khẩu chính xác, kèm lưu ý nếu có cổng đăng nhập riêng (Captive portal). | **P2 - Major** |
| **TC-SUP-02** | FAQ: Bãi đỗ xe máy & Ô tô | Khách hỏi về chỗ gửi xe, đặc biệt là xe ô tô 7 chỗ. | *"Quán có chỗ đỗ xe ô tô 7 chỗ không? Phí gửi xe bao nhiêu?"* | Aria trả lời rõ ràng: Vị trí bãi đỗ xe ô tô (trước cửa/hầm toà nhà lân cận), chính sách miễn phí gửi xe cho thực khách hoặc mức phí cụ thể. | **P2 - Major** |
| **TC-SUP-03** | FAQ: Hóa đơn đỏ (VAT) & Thanh toán | Khách hỏi về xuất hóa đơn GTGT công ty và các cổng thanh toán. | *"Quán có xuất hóa đơn đỏ trong ngày không? Có quẹt thẻ tín dụng hay chuyển khoản QR không?"* | Aria khẳng định hỗ trợ xuất hóa đơn VAT điện tử trong ngày, hướng dẫn để lại thông tin công ty; liệt kê đầy đủ phương thức thanh toán: Tiền mặt, Thẻ Visa/Master, VietQR, Apple Pay. | **P2 - Major** |
| **TC-SUP-04** | FAQ: Phụ thu mang đồ ngoài & Thú cưng | Khách hỏi về việc mang rượu vang hoặc bánh sinh nhật từ ngoài vào. | *"Tôi mang chai rượu vang và bánh kem sinh nhật từ ngoài vào có tính phí phụ thu không? Có được dắt cún cưng theo không?"* | Aria giải đáp chính sách minh bạch: Phí khui rượu (nếu có), hỗ trợ giữ lạnh và tặng nến bánh sinh nhật miễn phí; quy định về thú cưng (khu vực ngoài trời được phép hay không). | **P2 - Major** |
| **TC-SUP-05** | Hỗ trợ đặt món mang về (Takeaway) | Khách muốn gọi đồ ăn mang về văn phòng hoặc về nhà. | *"Tôi muốn đặt 2 suất cơm sườn mang về lúc 12h15 ghé lấy."* | Aria chuyển chế độ đơn hàng sang "Mang về", ghi nhận giờ hẹn lấy món, thông báo thời gian bếp chuẩn bị (15 phút) và thông tin tiền hộp/bao bì (nếu có). | **P1 - Critical** |
| **TC-SUP-06** | Thao tác nút "Gọi nhân viên bàn" (Cơ bản) | Khách đang ngồi tại bàn số 5 nhấn nút gọi phục vụ trên khung chat. | Bấm nút `[🛎️ Gọi nhân viên bàn]` gắn trên thanh menu chat. | Nút chuyển trạng thái loading $\rightarrow$ Hiển thị thông báo xác nhận: *"Yêu cầu hỗ trợ tại Bàn 05 đã được gửi thẳng đến đồng hồ/tablet nhân viên phục vụ! Nhân viên sẽ đến trong 1-2 phút."* | **P1 - Critical** |
| **TC-SUP-07** | Chọn lý do gọi nhân viên nhanh (Quick Tags) | Sau khi bấm gọi nhân viên, xuất hiện các tùy chọn lý do phổ biến. | Bấm chọn tag: `[Xin thêm đá / Chén đĩa]` hoặc `[Thanh toán bàn]`. | Hệ thống gửi chính xác lý do kèm số bàn đến nhân viên, giúp nhân viên mang sẵn đồ dùng đến bàn mà không mất công đi lại 2 lần. | **P2 - Major** |
| **TC-SUP-08** | Chống spam nút gọi nhân viên (Rate Limiting / Debounce) | Khách hoặc trẻ nhỏ bấm nút "Gọi nhân viên" 5-10 lần liên tục. | Bấm nút liên tục trong thời gian ngắn. | Hệ thống chỉ kích hoạt 1 tín hiệu đầu tiên, sau đó đưa nút vào trạng thái đếm ngược (cooldown 45-60 giây) với thông báo: *"Yêu cầu trước của bạn đang được nhân viên tiếp nhận, vui lòng đợi trong giây lát."* | **P1 - Critical** |
| **TC-SUP-09** | Xử lý mạng yếu khi gọi nhân viên | Mạng bị mất kết nối ngay thời điểm bấm gọi nhân viên. | Giả lập ngắt mạng và bấm nút gọi. | Hệ thống hiển thị cảnh báo: *"Không thể gửi yêu cầu do gián đoạn kết nối mạng. [Thử lại]"*, không hiển thị thông báo giả là đã gọi thành công. | **P1 - Critical** |
| **TC-SUP-10** | Tiếp nhận phàn nàn & Khẩn cấp (Escalation) | Khách giận dữ vì chờ món quá lâu hoặc chất lượng dịch vụ kém. | *"Phục vụ quá tệ, 40 phút rồi chưa có món, tôi cần gặp quản lý ngay lập tức!"* | Aria phản hồi với sự cảm thông sâu sắc, xin lỗi khách hàng, tự động kích hoạt chế độ báo động khẩn cấp tới Quản lý nhà hàng và ưu tiên điều nhân viên tới bàn ngay tức khắc. | **P1 - Critical** |

---

## 2. Tiêu chí Đánh giá & Phân loại Lỗi của Phân hệ Hỗ trợ
- **Lỗi P0 (Blocker):** Bấm nút "Gọi nhân viên" báo thành công nhưng trên thực tế hệ thống không hề gửi tín hiệu đến nhân viên/quản lý khiến khách ngồi chờ vô vọng.
- **Lỗi P1 (Critical):** Trả lời sai thông tin mật khẩu wifi hoặc bãi xe khiến khách gặp rắc rối; không có cơ chế chống spam khiến thiết bị phục vụ bị nghẽn tín hiệu; Aria trả lời khiêu khích hoặc vô cảm khi khách phàn nàn dịch vụ.
- **Lỗi P2 (Major):** Nút gọi nhân viên bị ẩn hoặc khó tìm trên màn hình điện thoại; không nhận diện được số bàn của khách đang ngồi.
- **Lỗi P3 (Minor):** Câu trả lời FAQ quá dài dòng, không tóm tắt được trọng tâm thông tin khách cần.
