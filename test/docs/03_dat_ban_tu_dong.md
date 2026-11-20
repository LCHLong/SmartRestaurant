# 03. BẢNG TEST CASES CHI TIẾT: ĐẶT BÀN TỰ ĐỘNG

**Mã phân hệ:** `TC-RES` (Auto Reservation)  
**Tiêu chí nghiệm thu cốt lõi:**
- Hiểu chính xác 100% các cách diễn đạt ngày/giờ trong tiếng Việt (tương đối, tuyệt đối, tiếng lóng thời gian).
- Kiểm tra bàn trống thông minh; xử lý linh hoạt khi kín bàn giờ cao điểm.
- Sinh mã đặt bàn duy nhất và hiển thị Thẻ Xác Nhận Đặt Bàn (Booking Card) trực quan, có thể chỉnh sửa/hủy nhanh.

---

## 1. Danh sách Test Cases Chi tiết

| Test Case ID | Phân loại kiểm thử | Mục tiêu & Kịch bản kiểm thử | Dữ liệu đầu vào (User Prompt) | Kết quả kỳ vọng trên giao diện (Expected Output) | Mức độ nghiêm trọng nếu lỗi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-RES-01** | Ngôn ngữ tự nhiên chuẩn | Đặt bàn với câu chứa đầy đủ thông tin bằng tiếng Việt tự nhiên. | *"Đặt cho mình bàn 4 người vào tối mai lúc 7 rưỡi nhé, tên Nam SĐT 0912345678."* | Aria nhận diện chuẩn xác: Ngày = (Ngày mai), Giờ = 19:30, Số khách = 4, Tên = Nam, SĐT = 0912345678. Kiểm tra bàn trống và xuất ngay Thẻ Đặt Bàn mà không hỏi lại. | **P1 - Critical** |
| **TC-RES-02** | Thu thập thông tin thiếu (Slot Filling) | Khách chỉ nói nhu cầu chung chung, thiếu giờ cụ thể và số khách. | *"Mình muốn đặt bàn vào trưa Chủ Nhật tuần này."* | Aria ghi nhận ngày trưa Chủ Nhật, hỏi tiếp nhẹ nhàng: *"Dạ Aria đã ghi nhận trưa Chủ Nhật (ngày DD/MM). Bạn dự định đến lúc mấy giờ và bàn dành cho bao nhiêu khách ạ?"* | **P1 - Critical** |
| **TC-RES-03** | Thời gian tương đối phức tạp | Dùng các từ chỉ thời gian đa dạng trong khẩu ngữ Việt Nam. | *"Cho đặt bàn 2 người vào tối mốt tầm bảy giờ kém mười lăm."* | Aria tính toán đúng ngày mốt (Hôm nay + 2 ngày), giờ = 18:45, số người = 2. Phản hồi xác nhận ngày giờ chính xác bằng số cho khách kiểm tra. | **P1 - Critical** |
| **TC-RES-04** | Yêu cầu vị trí ngồi cụ thể | Khách nêu sở thích vị trí (gần cửa sổ, ngoài trời, phòng riêng, góc yên tĩnh). | *"Đặt bàn 6 người tối nay 19:00, ưu tiên bàn ngoài trời thoáng mát hút thuốc được."* | Ghi nhận yêu cầu khu vực: "Ngoài trời / Thoáng mát". Hiển thị rõ ghi chú vị trí trên Thẻ xác nhận đặt bàn. | **P2 - Major** |
| **TC-RES-05** | Sinh mã đặt bàn & Thẻ xác nhận (Booking Card) | Sau khi chốt thông tin đặt chỗ thành công. | Khách hoàn tất bước nhập thông tin. | Hiển thị Thẻ Đặt Bàn gồm: Mã đặt bàn (VD: `#RES-2026-891`), Tên khách, SĐT, Ngày giờ, Số khách, Khu vực bàn. Kèm 2 nút bấm thao tác nhanh: `[Chỉnh sửa]` và `[Hủy bàn]`. | **P1 - Critical** |
| **TC-RES-06** | Xử lý khung giờ kín bàn (Peak Hour / Sold out) | Khách đặt bàn vào khung giờ cao điểm đã kín chỗ. | Đặt bàn 4 người lúc 19:30 tối thứ 7 (Khung giờ giả lập hết bàn trống). | Aria thông báo nhẹ nhàng: *"Khung giờ 19:30 tối thứ 7 hiện tại đã kín bàn. Nhà hàng còn bàn trống lúc 18:30 hoặc 20:15, bạn có muốn đổi sang khung giờ này không ạ?"* | **P1 - Critical** |
| **TC-RES-07** | Đặt bàn ngày Lễ / Sự kiện đặc biệt | Đặt bàn vào ngày cao điểm (Valentine 14/2, 8/3, 20/10, Đêm Giáng Sinh). | *"Đặt bàn 2 người tối Valentine 14/2 lúc 19:00."* | Aria kiểm tra lịch sự kiện, thông báo về chính sách ngày lễ (ví dụ phụ thu sự kiện hoặc yêu cầu đặt cọc giữ chỗ trước 24h), hướng dẫn các bước xác nhận. | **P2 - Major** |
| **TC-RES-08** | Chỉnh sửa thông tin đặt bàn ngay trong chat | Khách đã có mã đặt bàn, muốn đổi giờ hoặc số lượng người. | *"Mã bàn #RES-2026-891 tôi muốn đổi sang 20:00 và đi 6 người được không?"* | Aria kiểm tra bàn trống cho 6 người lúc 20:00; nếu còn bàn thì cập nhật thông tin và cấp lại Thẻ Đặt Bàn mới cập nhật; nếu hết bàn thì giữ nguyên mã cũ và báo khách. | **P1 - Critical** |
| **TC-RES-09** | Hủy đặt bàn trực tiếp trong chat | Khách có việc bận đột xuất muốn hủy giữ chỗ. | Bấm nút `[Hủy bàn]` trên thẻ hoặc gõ *"Hủy giúp tôi mã đặt bàn #RES-2026-891"*. | Aria xin lý do hủy (tùy chọn), xác nhận hủy thành công, chuyển trạng thái thẻ sang `[Đã hủy]` và gửi lời chào lịch sự hẹn gặp lại lần sau. | **P1 - Critical** |
| **TC-RES-10** | Ngoại lệ: Đặt thời gian trong quá khứ | Khách nhập thời gian đã trôi qua so với giờ hiện tại. | Nhập đặt bàn lúc *"10:00 sáng hôm nay"* (trong khi hiện tại đang là 14:00 chiều). | Aria thông báo thời gian đã qua và đề xuất khách chọn thời điểm trong tương lai. | **P2 - Major** |
| **TC-RES-11** | Ngoại lệ: Đặt ngoài giờ hoạt động | Khách yêu cầu bàn lúc nhà hàng chưa mở cửa hoặc đã đóng cửa. | *"Đặt bàn ăn khuya lúc 2h sáng mai cho 4 người."* | Aria thông báo giờ mở cửa của nhà hàng (VD: 09:30 - 22:30 hàng ngày), từ chối nhận giờ 2h sáng một cách lịch thiệp. | **P2 - Major** |
| **TC-RES-12** | Ngoại lệ: Số lượng khách bất thường | Nhập số khách bằng 0, số âm hoặc số khách khổng lồ. | *"Đặt bàn cho -2 người"* hoặc *"Đặt bàn cho 5000 người ăn cưới."* | Aria phát hiện số lượng không hợp lệ; với số lượng quá lớn (>30 người), Aria hướng dẫn chuyển sang kênh liên hệ tổ chức sự kiện/tiệc cưới riêng. | **P2 - Major** |
| **TC-RES-13** | Ngoại lệ: Số điện thoại không hợp lệ | Khách nhập số điện thoại sai định dạng. | Nhập SĐT: *"12345"* hoặc *"abcdxyz"*. | Aria phát hiện SĐT không hợp lệ tại Việt Nam, đề nghị khách cung cấp lại số điện thoại 10 chữ số hợp lệ để nhận tin nhắn xác nhận bàn. | **P2 - Major** |

---

## 2. Tiêu chí Đánh giá & Phân loại Lỗi của Phân hệ Đặt Bàn
- **Lỗi P0 (Blocker):** Trùng lặp mã đặt bàn; ghi nhận sai ngày hoặc sai giờ dẫn đến khách đến nhà hàng không có bàn; hệ thống báo đặt thành công nhưng không tạo mã bàn trên thực tế.
- **Lỗi P1 (Critical):** Hiểu sai ngày chỉ định (ví dụ khách nói "tối mai" nhưng hệ thống lại tạo bàn cho "hôm nay"); chấp nhận thời gian trong quá khứ; không hiển thị Thẻ Xác Nhận Đặt Bàn.
- **Lỗi P2 (Major):** Không gợi ý được khung giờ thay thế khi kín bàn; nút [Chỉnh sửa]/[Hủy bàn] trên thẻ không hoạt động.
- **Lỗi P3 (Minor):** Câu chữ thông báo giờ đóng cửa chưa rõ ràng; thiếu icon nhận diện trạng thái bàn.
