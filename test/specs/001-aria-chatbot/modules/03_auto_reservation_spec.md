# ĐẶC TẢ CHI TIẾT PHÂN HỆ 3: ĐẶT BÀN TỰ ĐỘNG (AUTO RESERVATION ENGINE)
**Mã phân hệ:** `SPEC-MOD-03` | **Phiên bản:** `2.1 - Full Scenario Specification`  
**Thuộc đặc tả:** [test/specs/spec.md](../spec.md) | **Phương pháp luận:** Spec-Kit SDD  
**Nguồn test cases:** Ánh xạ và diễn giải chi tiết 100% các kịch bản từ [test/docs/03_dat_ban_tu_dong.md](../../docs/03_dat_ban_tu_dong.md)

---

## 1. MỤC TIÊU & NGUYÊN TẮC CỐT LÕI
Phân hệ Đặt bàn tự động xử lý các luồng hội thoại đặt chỗ đa dạng bằng tiếng Việt tự nhiên, kiểm tra tình trạng bàn trống theo thời gian thực, tự động thu thập thông tin còn thiếu (slot-filling), cấp mã đặt bàn định dạng `#RES-YYYY-XXXX` và sinh Thẻ Xác Nhận Đặt Bàn (Booking Card) cho phép chỉnh sửa hoặc hủy bàn trực tiếp.

---

## 2. DIỄN GIẢI CHI TIẾT TOÀN BỘ 13 KỊCH BẢN ĐẶC TẢ (FULL SCENARIOS SPECIFICATION)

### SPEC-SCENARIO-RES-01: Đặt bàn với câu chứa đầy đủ thông tin bằng tiếng Việt tự nhiên
- **Ánh xạ Test Case:** `TC-RES-01`
- **Mục tiêu:** Nhận diện toàn bộ các thực thể cần thiết trong 1 câu nói và tạo mã đặt bàn ngay lập tức.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách đặt bàn đủ 5 thông số trong 1 câu nhắn
    Given Nhà hàng còn bàn trống cho 4 khách lúc 19:30 ngày mai
    When Khách hàng nhắn: "Đặt cho mình bàn 4 người vào tối mai lúc 7 rưỡi nhé, tên Nam SĐT 0912345678."
    Then Bộ phân tích NLP tiếng Việt trích xuất thành công:
      | Thực thể | Giá trị nhận diện |
      | Ngày đặt | Ngày hiện tại + 1 ngày |
      | Giờ đặt | 19:30:00 |
      | Số khách | 4 người lớn |
      | Tên khách | "Nam" |
      | Số điện thoại | "0912345678" |
    And Hệ thống không cần hỏi lại bất kỳ thông tin nào
    And Sinh mã bàn duy nhất theo định dạng chuẩn (ví dụ: #RES-2026-8891)
    And Khung chat hiển thị ngay Thẻ Xác Nhận Đặt Bàn (Booking Card)
  ```

---

### SPEC-SCENARIO-RES-02: Cơ chế thu thập thông tin còn thiếu (Slot Filling Loop)
- **Ánh xạ Test Case:** `TC-RES-02`
- **Mục tiêu:** Hỏi bổ sung thông minh khi câu lệnh ban đầu chỉ có ngày chung chung.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách chỉ nói ngày trưa Chủ Nhật, thiếu giờ và số khách
    When Khách hàng nhắn: "Mình muốn đặt bàn vào trưa Chủ Nhật tuần này."
    Then Hệ thống ghi nhận slot [Ngày] = Ngày Chủ Nhật gần nhất
    And Phát hiện thiếu 4 slots: [Giờ], [Số khách], [Tên], [SĐT]
    And Aria không hỏi dồn dập, mà hỏi 2 thông tin ưu tiên trước: "Dạ Aria đã ghi nhận trưa Chủ Nhật (ngày DD/MM). Bạn dự định đến lúc mấy giờ và bàn dành cho bao nhiêu khách ạ?"
    When Khách bổ sung: "Tầm 12h, đi 6 người nhé"
    Then Hệ thống lưu slot [Giờ = 12:00] và [Số khách = 6], tiếp tục hỏi: "Dạ vâng, bạn cho Aria xin Tên và Số điện thoại để hệ thống gửi mã xác nhận bàn nhé!"
  ```

---

### SPEC-SCENARIO-RES-03: Xử lý các cụm từ chỉ thời gian tương đối phức tạp
- **Ánh xạ Test Case:** `TC-RES-03`
- **Mục tiêu:** Phân giải chính xác các khẩu ngữ thời gian tiếng Việt đa dạng.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách dùng khẩu ngữ "tối mốt tầm bảy giờ kém mười lăm"
    When Khách hàng nhắn: "Cho đặt bàn 2 người vào tối mốt tầm bảy giờ kém mười lăm."
    Then Bộ phân giải thời gian tính toán:
      - Ngày = Ngày hiện tại + 2 ngày
      - Giờ = 18:45:00 (buổi tối)
      - Số người = 2
    And Aria phản hồi xác nhận rõ ràng: "Dạ Aria đã ghi nhận yêu cầu đặt bàn 2 người vào lúc **18:45 tối mốt (ngày DD/MM)**..."
  ```

---

### SPEC-SCENARIO-RES-04: Tiếp nhận sở thích vị trí ngồi (Seating Preference)
- **Ánh xạ Test Case:** `TC-RES-04`
- **Mục tiêu:** Ghi nhận khu vực ngồi theo mong muốn của khách (ngoài trời, cửa sổ, yên tĩnh).
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách yêu cầu bàn ngoài trời thoáng mát hút thuốc được
    When Khách nhắn: "Đặt bàn 6 người tối nay 19:00, ưu tiên bàn ngoài trời thoáng mát hút thuốc được."
    Then Hệ thống gán thuộc tính seating_preference = "outdoor_smoking"
    And Kiểm tra sơ đồ bàn: Gán mã bàn thuộc khu vực Sân vườn / Ngoài trời
    And Thẻ xác nhận đặt bàn hiển thị rõ dòng ghi chú: "Khu vực: Ngoài trời (Thoáng mát)"
  ```

---

### SPEC-SCENARIO-RES-05: Sinh mã đặt bàn độc nhất & Render Thẻ Đặt Bàn (Booking Card)
- **Ánh xạ Test Case:** `TC-RES-05`
- **Mục tiêu:** Cung cấp Thẻ Đặt Bàn trực quan kèm nút chỉnh sửa/hủy nhanh.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Xuất Thẻ Đặt Bàn sau khi chốt đủ thông tin
    Given Hệ thống đã thu thập đủ 5 trường thông tin hợp lệ
    When Lệnh đặt bàn được xác nhận thành công
    Then Hệ thống phát sinh mã đặt bàn chuẩn: #RES-YYYY-XXXX (không trùng lặp toàn hệ thống)
    And Khung chat render 01 Thẻ Xác Nhận Đặt Bàn với đầy đủ thông tin:
      - Mã đặt bàn + Nút sao chép mã
      - Họ tên khách & Số điện thoại
      - Ngày giờ đón khách & Số lượng người
      - Trạng thái: [Đã xác nhận giữ chỗ ✓]
      - Hai nút thao tác: "[Chỉnh sửa thông tin]" và "[Hủy giữ chỗ]"
  ```

---

### SPEC-SCENARIO-RES-06: Xử lý khung giờ cao điểm kín bàn (Peak Hour Sold-Out)
- **Ánh xạ Test Case:** `TC-RES-06`
- **Mục tiêu:** Khéo léo đề xuất 2 khung giờ trống lân cận khi giờ yêu cầu hết bàn.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách đặt bàn lúc 19:30 tối thứ 7 nhưng nhà hàng đã kín chỗ
    Given Sức chứa khu vực bàn vào khung giờ 19:30 thứ 7 đã đạt 100%
    When Khách hàng yêu cầu đặt bàn lúc 19:30 tối thứ 7
    Then Hệ thống phát hiện trạng thái CAPACITY_EXCEEDED
    And Thuật toán tự động tìm kiếm 2 khung giờ trống gần nhất: 18:30 (sớm hơn) và 20:15 (muộn hơn)
    And Aria thông báo nhẹ nhàng: "Dạ khung giờ 19:30 tối thứ 7 hiện quán đã kín bàn. Nhà hàng còn bàn trống lúc **18:30** hoặc **20:15**, bạn có muốn đổi sang một trong hai khung giờ này không ạ?"
  ```

---

### SPEC-SCENARIO-RES-07: Chính sách đặt bàn ngày Lễ / Sự kiện đặc biệt
- **Ánh xạ Test Case:** `TC-RES-07`
- **Mục tiêu:** Nhắc nhở quy định đặt cọc hoặc phụ thu ngày lễ (Valentine, 8/3, 20/10, Tết).
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách đặt bàn vào đêm Valentine 14/2
    Given Ngày 14/2 được cấu hình là ngày sự kiện đặc biệt (Special Event Day)
    When Khách hàng đặt bàn 2 người lúc 19:00 ngày 14/2
    Then Aria thông báo chính sách ngày lễ: "Dạ tối Valentine 14/2 nhà hàng có chương trình âm nhạc Acoustic lãng mạn và tặng kèm nến thơm. Để giữ chỗ tốt nhất, quán áp dụng chính sách đặt cọc giữ bàn 200.000đ (được trừ trực tiếp vào hóa đơn khi dùng bữa)."
    And Hướng dẫn khách thao tác xác nhận đặt cọc
  ```

---

### SPEC-SCENARIO-RES-08: Chỉnh sửa thông tin đặt bàn trực tiếp trong chat
- **Ánh xạ Test Case:** `TC-RES-08`
- **Mục tiêu:** Hỗ trợ đổi giờ hoặc thay đổi số lượng khách của mã bàn đã đặt.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách yêu cầu đổi giờ mã bàn #RES-2026-891 từ 19:00 sang 20:00 và tăng lên 6 người
    Given Khách hàng đang có mã đặt bàn #RES-2026-891 lúc 19:00 cho 4 người
    When Khách hàng nhắn: "Mã bàn #RES-2026-891 tôi muốn đổi sang 20:00 và đi 6 người được không?"
    Then Hệ thống kiểm tra tình trạng bàn cho 6 người lúc 20:00
    And Nếu còn chỗ: Cập nhật bản ghi đặt bàn, xuất Thẻ Đặt Bàn mới cập nhật với giờ 20:00 và 6 người
    And Nếu hết chỗ: Giữ nguyên mã cũ và thông báo khung giờ 20:00 không còn đủ bàn cho 6 người
  ```

---

### SPEC-SCENARIO-RES-09: Hủy đặt bàn trực tiếp trong cuộc trò chuyện
- **Ánh xạ Test Case:** `TC-RES-09`
- **Mục tiêu:** Hủy bàn nhanh chóng và lịch thiệp theo yêu cầu của khách.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách bấm nút [Hủy giữ chỗ] trên Thẻ Đặt Bàn
    Given Thẻ đặt bàn #RES-2026-891 đang ở trạng thái confirmed
    When Khách hàng bấm nút "[Hủy giữ chỗ]" hoặc nhắn: "Hủy giúp tôi mã bàn #RES-2026-891"
    Then Hệ thống chuyển trạng thái mã bàn sang cancelled
    And Giải phóng sức chứa bàn trong cơ sở dữ liệu
    And Thẻ đặt bàn trên màn hình đổi trạng thái sang nhãn màu đỏ "[ĐÃ HỦY GIỮ CHỖ]"
    And Aria gửi lời cảm ơn và hẹn gặp lại thực khách vào dịp khác
  ```

---

### SPEC-SCENARIO-RES-10: Chặn đặt bàn trong quá khứ
- **Ánh xạ Test Case:** `TC-RES-10`
- **Mục tiêu:** Ngăn chặn đặt bàn vào thời điểm đã trôi qua.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách đặt bàn lúc 10:00 sáng trong khi thời gian hiện tại là 14:00 chiều
    When Khách nhập thời gian đặt bàn: 10:00 hôm nay
    Then Hệ thống kiểm tra điều kiện: booking_datetime < current_datetime
    And Hệ thống từ chối ghi nhận
    And Aria thông báo: "Dạ thời gian 10:00 sáng hôm nay đã trôi qua rồi ạ. Bạn có muốn đặt bàn cho bữa tối nay (từ 17:30 đến 21:00) hoặc trưa ngày mai không ạ?"
  ```

---

### SPEC-SCENARIO-RES-11: Chặn đặt bàn ngoài giờ hoạt động
- **Ánh xạ Test Case:** `TC-RES-11`
- **Mục tiêu:** Từ chối giờ nửa đêm khi nhà hàng đã đóng cửa.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách yêu cầu đặt bàn ăn khuya lúc 2h sáng
    When Khách hàng nhắn: "Đặt bàn ăn khuya lúc 2h sáng mai cho 4 người."
    Then Hệ thống kiểm tra khung giờ hoạt động: 10:00 đến 22:30 hàng ngày
    And Giờ 02:00 sáng nằm ngoài khung giờ đón khách
    And Aria từ chối lịch sự và thông báo: "Dạ SmartRestaurant mở cửa đón khách từ 10:00 sáng đến 22:30 tối hàng ngày ạ. Khung giờ 2h sáng quán đã đóng cửa nghỉ ngơi. Bạn có thể chọn khung giờ dùng bữa từ 10:00 trưa mai nhé!"
  ```

---

### SPEC-SCENARIO-RES-12: Bắt lỗi số lượng khách bất thường (Số âm / Đoàn tiệc cực lớn)
- **Ánh xạ Test Case:** `TC-RES-12`
- **Mục tiêu:** Chặn số âm, số 0 và chuyển kênh tư vấn riêng cho đoàn tiệc lớn (> 30 người).
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách nhập đặt bàn cho -2 người hoặc 500 người ăn cưới
    When Khách hàng nhập số lượng khách <= 0
    Then Aria thông báo số lượng khách phải từ 1 người trở lên
    When Khách hàng nhập số lượng khách > 30 người (ví dụ: 500 người)
    Then Aria thông báo: "Dạ với đoàn tiệc từ 30 khách trở lên, nhà hàng có chính sách sảnh riêng VIP và thực đơn tiệc trọn gói ưu đãi. Aria xin phép kết nối bạn với Bộ phận Quản lý Sự kiện để được tư vấn chu đáo nhất ạ!"
  ```

---

### SPEC-SCENARIO-RES-13: Kiểm thực định dạng số điện thoại Việt Nam
- **Ánh xạ Test Case:** `TC-RES-13`
- **Mục tiêu:** Ngăn chặn nhập số điện thoại rác hoặc thiếu số.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách nhập số điện thoại sai định dạng (ví dụ: "12345" hoặc "abcdxyz")
    When Khách hàng nhập số điện thoại không khớp biểu thức chính quy ^(0|\+84)(3|5|7|8|9)[0-9]{8}$
    Then Hệ thống bắt lỗi định dạng INVALID_PHONE_NUMBER
    And Aria nhắc nhở: "Dạ số điện thoại bạn vừa nhập chưa đúng định dạng chuẩn 10 số tại Việt Nam. Bạn vui lòng gửi lại số điện thoại chính xác (ví dụ: 0901234567) để nhận tin nhắn SMS xác nhận mã bàn nhé!"
  ```
