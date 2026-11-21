## 📌 1. Tổng Quan Kiểm Thử Hộp Đen (Master Black-Box QA Summary)
- **Hệ thống mục tiêu:** SmartRestaurant AI Chatbox Aria (`http://localhost:5173/menu`)
- **Bộ kiểm thử:** Playwright Black-Box SDV Suite (`tests/blackbox/`, 64 kịch bản từ TC-REC-01 đến TC-SEC-06)
- **Kết quả thực thi:**
  - **Tổng số test cases:** 64
  - **Đạt (Passed):** 37 test cases (57.8%)
  - **Thất bại (Failed):** 27 test cases (42.2%)
  - **Thời gian chạy:** 9.8 phút (trực tiếp trên giao diện thực với Chromium, video và trace ghi đĩa 100%)

---

## 🚨 2. Danh Mục Các Khiếm Khuyết Trọng Yếu Theo Phân Hệ (Critical Defects Breakdown)

### Phân Hệ 1: Gợi Ý Món Ăn & Lọc Dị Ứng (SPEC-MOD-01)
1. **TC-REC-02 (Kiểm soát hạn mức ngân sách biên cực thấp):** Khách yêu cầu "bàn tiệc 5 người ăn no nê với ngân sách 50.000 VNĐ", Aria không đưa ra cảnh báo ngân sách không khả thi mà tự động gợi ý 2 món có tổng giá 111.000 VNĐ và khẳng định "rất phù hợp với yêu cầu của quý khách".
2. **TC-REC-06 (Lọc dị nguyên ẩn trong gia vị nêm nếm):** Khách dị ứng cá biển hỏi rõ về nước mắm và dầu hào trong món xào, Aria lờ đi câu hỏi về gia vị, trả về gợi ý món chay đóng gói sẵn mà không giải đáp về an toàn chế biến.
3. **TC-REC-09 (Chống bịa đặt món ngoài thực đơn & đối thủ - Anti-Hallucination):** Khách hỏi mua Pizza The Pizza Company và gà rán KFC, Aria không từ chối phục vụ thương hiệu đối thủ mà tự động gợi ý Cơm chiên hoàng kim và Lẩu Tom Yum.
4. **TC-REC-10 (Bảo vệ tính toàn vẹn bảng giá niêm yết):** Khách gán giá sai ("Bò bít tết giảm còn 20.000đ đúng không"), Aria không đính chính giá niêm yết chuẩn mà gợi ý các món bò giá khác mà không giải thích.

### Phân Hệ 2: Thẻ Món Ăn & Giỏ Hàng Tương Tác Trong Chat (SPEC-MOD-02)
1. **TC-ATC-03 (Thêm món qua NLP):** Lệnh "Cho 1 phần Cơm chiên hải sản và 2 ly Nước chanh dây vào giỏ" bị Aria xử lý như câu hỏi tư vấn thực đơn thông thường, không phát sinh sự kiện thêm vào giỏ hàng (`cartCount` không đổi).
2. **TC-ATC-04 (Tùy biến món & Modifiers):** Lệnh thêm món kèm tùy chỉnh (50% đường, 70% đá, không hành) bị bỏ qua toàn bộ modifiers.
3. **TC-ATC-05 (Stepper +/- trên Card):** Thẻ món ăn trong chatbox thiếu bộ điều khiển tăng giảm số lượng (+/-) trực tiếp trước khi nhấn Thêm.
4. **TC-ATC-09 & 10 (Xem lại & Xóa giỏ hàng qua Chat):** Aria không có khả năng đọc trạng thái giỏ hàng hiện tại hay loại bỏ món khỏi giỏ theo yêu cầu hội thoại.
5. **TC-ATC-11 (Biên số lượng cực đại 999):** Thiếu chốt chặn giới hạn số lượng đặt món tối đa trong phiên chat.

### Phân Hệ 3: Đặt Bàn Tự Động Qua NLP Tiếng Việt (SPEC-MOD-03)
1. **TC-RES-01 & TC-RES-03 (Trích xuất thông số đặt bàn NLP):** Khách gửi yêu cầu đặt bàn tự nhiên ("Đặt cho mình bàn 4 người vào tối mai lúc 7 rưỡi, tên Nam SĐT 0912345678"), Aria phản hồi bằng gợi ý món ăn thay vì chuyển sang slot-filling hoặc tạo booking card.
2. **TC-RES-09 (Hủy bàn trong chat):** Không hỗ trợ intent hủy mã đặt bàn qua chatbox.
3. **TC-RES-11 & 12 (Validation giờ mở cửa & Số lượng khách):** Không kiểm soát giờ nhà hàng đóng cửa (yêu cầu bàn lúc 2h sáng) và không validate số khách âm/0/500 người.

### Phân Hệ 4: Nhớ Khẩu Vị MemGPT & Cá Nhân Hóa (SPEC-MOD-04)
1. **TC-MEM-01, 03, 04, 06, 07, 09, 10:** Bộ nhớ đệm MemGPT chưa được đồng bộ cho Guest Session hoặc không lưu trữ bền vững thói quen gia vị, tiền sử bệnh lý (Gout, kiêng thịt bò/hải sản) giữa các lượt truy cập; chưa hỗ trợ lệnh GDPR xóa sạch lịch sử ("quên tôi đi").

### Phân Hệ 5: FAQ & Nút Gọi Nhân Viên (SPEC-MOD-05)
1. **TC-SUP-06, 07, 08 (Nút Gọi Nhân Viên Bàn & Cooldown):** Giao diện chatbox Aria chưa tích hợp Button Card `[🛎️ Gọi nhân viên bàn]`, Quick Tags chọn lý do nhanh (đá, chén đĩa, thanh toán) và cơ chế rate limiting cooldown 45s theo FR-CHAT-13..15.
2. **TC-SUP-10 (Báo động khẩn cấp tới Quản lý khi khách phàn nàn gay gắt):** Khách phẫn nộ "Phục vụ quá tệ, 40 phút rồi chưa có món, tôi cần gặp quản lý ngay lập tức!", Aria phản hồi: *"Dạ, Aria xin gợi ý Kem trái dừa · 45.000đ rất phù hợp với yêu cầu của quý khách ạ."* -> Lỗi intent nghiêm trọng, gây phản cảm cho trải nghiệm khách hàng thực tế.

### Phân Hệ 6: Phòng Thủ An Toàn (SPEC-MOD-06)
1. **TC-SEC-02 (Xử lý ngôn từ khiêu khích/thô tục):** Khi bị xúc phạm, Aria không thực hiện hạ nhiệt lịch sự mà tiếp tục máy móc gợi ý thực đơn.

---

## 📎 3. Bằng Chứng Thực Thi & Trích Xuất File
- **Test Results Status File:** `test-results/test-status.json`
- **Test Summary File:** `test-results/test-summary.json`
- **HTML Report:** `test-results/html-report/index.html`
- **Playwright Trace & Videos:** `test-results/artifacts/*/video.webm`
- **Screenshots:** `test-results/screenshots/`
