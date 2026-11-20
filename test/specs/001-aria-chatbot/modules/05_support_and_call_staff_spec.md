# ĐẶC TẢ CHI TIẾT PHÂN HỆ 5: HỖ TRỢ THỰC KHÁCH & GỌI NHÂN VIÊN (SUPPORT & CALL STAFF)
**Mã phân hệ:** `SPEC-MOD-05` | **Phiên bản:** `2.1 - Full Scenario Specification`  
**Thuộc đặc tả:** [test/specs/spec.md](../spec.md) | **Phương pháp luận:** Spec-Kit SDD  
**Nguồn test cases:** Ánh xạ và diễn giải chi tiết 100% các kịch bản từ [test/docs/05_ho_tro_thuc_khach_va_goi_nhan_vien.md](../../docs/05_ho_tro_thuc_khach_va_goi_nhan_vien.md)

---

## 1. MỤC TIÊU & NGUYÊN TẮC CỐT LÕI
Phân hệ Hỗ trợ thực khách & Gọi nhân viên có nhiệm vụ giải đáp tức thì 100% các thắc mắc thông dụng (FAQ) về tiện ích nhà hàng, điều phối dịch vụ đặt món mang về (Takeaway), cung cấp nút bấm gọi phục vụ 1 chạm với cơ chế chống nghẽn tín hiệu (Anti-spam Cooldown), và kích hoạt còi báo động khẩn cấp tới Quản lý khi khách hàng phàn nàn.

---

## 2. DIỄN GIẢI CHI TIẾT TOÀN BỘ 10 KỊCH BẢN ĐẶC TẢ (FULL SCENARIOS SPECIFICATION)

### SPEC-SCENARIO-SUP-01: Giải đáp thông tin mạng Wifi & Tiện ích kết nối
- **Ánh xạ Test Case:** `TC-SUP-01`
- **Mục tiêu:** Cung cấp thông tin truy cập internet tức thì kèm nút sao chép mật khẩu 1 chạm.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách hỏi thông tin và mật khẩu wifi quán
    When Khách hàng nhập tin nhắn: "Cho xin pass wifi quán mình với."
    Then Hệ thống nhận diện ý định faq.wifi
    And Aria phản hồi ngay lập tức:
      - Tên mạng Wifi (SSID): "SmartRestaurant_Guest"
      - Mật khẩu: "smartrestaurant2026"
    And Khung chat render 01 nút bấm tiện ích: "[Sao chép Mật khẩu]"
    And Khi khách chạm vào nút sao chép, mật khẩu tự động lưu vào Clipboard và hiển thị thông báo "Đã sao chép!"
  ```

---

### SPEC-SCENARIO-SUP-02: Hướng dẫn bãi đỗ xe máy & Ô tô 7 chỗ
- **Ánh xạ Test Case:** `TC-SUP-02`
- **Mục tiêu:** Cung cấp thông tin rõ ràng về vị trí đỗ xe và chính sách chi phí.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách hỏi chỗ đỗ ô tô 7 chỗ và biểu phí gửi xe
    When Khách hàng hỏi: "Quán có chỗ đỗ xe ô tô 7 chỗ không? Phí gửi xe bao nhiêu?"
    Then Hệ thống nhận diện ý định faq.parking
    And Aria phản hồi chi tiết:
      - Xe máy: Đỗ miễn phí ngay trước sảnh nhà hàng, có nhân viên bảo vệ phát thẻ và trông giữ.
      - Ô tô (4-7 chỗ): Bãi đỗ hầm toà nhà lân cận cách quán 30m, có nhân viên bảo vệ hướng dẫn vị trí đậu.
      - Chi phí: Miễn phí 100% cho thực khách có hóa đơn dùng bữa tại nhà hàng.
    And Kèm nút bấm: "[Xem vị trí bãi đỗ xe trên bản đồ]"
  ```

---

### SPEC-SCENARIO-SUP-03: Hỗ trợ xuất hóa đơn GTGT (VAT) điện tử & Phương thức thanh toán
- **Ánh xạ Test Case:** `TC-SUP-03`
- **Mục tiêu:** Minh bạch quy trình xuất hóa đơn tài chính và các cổng thanh toán được chấp nhận.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách hỏi về xuất hóa đơn đỏ công ty và phương thức quẹt thẻ/QR
    When Khách hàng hỏi: "Quán có xuất hóa đơn đỏ trong ngày không? Có quẹt thẻ tín dụng hay chuyển khoản QR không?"
    Then Hệ thống nhận diện ý định faq.vat_invoice và faq.payment_methods
    And Aria giải đáp:
      - Nhà hàng có xuất hóa đơn GTGT điện tử chính thức trong ngày làm việc.
      - Chấp nhận đa dạng hình thức: Tiền mặt, Thẻ Visa/Master/JCB, VietQR, Apple Pay, MoMo.
    And Aria cung cấp form nhanh hướng dẫn khách để lại 4 thông tin: Tên công ty, Mã số thuế, Địa chỉ công ty và Email nhận hóa đơn.
  ```

---

### SPEC-SCENARIO-SUP-04: Chính sách mang rượu, bánh kem từ ngoài vào & Thú cưng
- **Ánh xạ Test Case:** `TC-SUP-04`
- **Mục tiêu:** Cung cấp thông tin phụ thu rõ ràng, tránh gây khó chịu khi thanh toán.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách hỏi phí mang rượu vang, bánh sinh nhật và quy định dẫn cún cưng
    When Khách hỏi: "Tôi mang chai rượu vang và bánh kem sinh nhật từ ngoài vào có tính phí phụ thu không? Có được dắt cún cưng theo không?"
    Then Hệ thống nhận diện ý định faq.surcharge
    And Aria thông báo chính sách minh bạch:
      - Rượu vang mang ngoài vào: Phụ phí phục vụ ly đá và khui rượu là 150.000 VNĐ/chai.
      - Bánh kem sinh nhật: Miễn phí 100%, nhà hàng hỗ trợ giữ lạnh, tặng nến và chuẩn bị đĩa chia bánh.
      - Thú cưng: Quán chào đón thú cưng nhỏ tại khu vực bàn tiệc sân vườn ngoài trời thoáng mát.
  ```

---

### SPEC-SCENARIO-SUP-05: Quy trình hỗ trợ đặt món mang về (Takeaway)
- **Ánh xạ Test Case:** `TC-SUP-05`
- **Mục tiêu:** Hẹn giờ bếp nấu chính xác và thông báo phí bao bì đóng gói.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách đặt 2 suất cơm mang về ghé lấy lúc 12h15
    When Khách hàng nhắn: "Tôi muốn đặt 2 suất cơm sườn mang về lúc 12h15 ghé lấy."
    Then Hệ thống chuyển chế độ đơn hàng sang "Mang về (Takeaway)"
    And Tính toán thời gian chế biến của bếp: Khoảng 15-20 phút
    And Xác nhận giờ hẹn nhận món: 12:15 trưa
    And Thông báo phụ phí hộp sinh học bã mía tự hủy thân thiện môi trường: 5.000 VNĐ/suất
    And Aria cấp mã đơn hàng mang về và gửi thông báo xác nhận giờ lấy
  ```

---

### SPEC-SCENARIO-SUP-06: Thao tác nút bấm "Gọi nhân viên bàn" 1 chạm
- **Ánh xạ Test Case:** `TC-SUP-06`
- **Mục tiêu:** Gửi tín hiệu điều phối kèm số bàn tới nhân viên phục vụ trong $\le 200$ms.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách đang ngồi tại Bàn 05 bấm nút gọi nhân viên
    Given Phiên trò chuyện của khách được liên kết với table_id = "BÀN-05"
    When Khách hàng nhấn nút "[🛎️ Gọi nhân viên bàn]"
    Then Hệ thống lập tức bắn gói tin WebSocket tới Tablet/Smartwatch của nhân viên khu vực Bàn 05
    And Nút bấm chuyển sang trạng thái Loading -> Xác nhận gửi thành công
    And Khung chat hiển thị thông báo an tâm: "Yêu cầu hỗ trợ tại Bàn 05 đã được chuyển tới nhân viên phục vụ! Nhân viên sẽ có mặt trong 1-2 phút ạ."
  ```

---

### SPEC-SCENARIO-SUP-07: Chọn lý do gọi nhân viên nhanh qua Quick Tags
- **Ánh xạ Test Case:** `TC-SUP-07`
- **Mục tiêu:** Tiết kiệm thời gian đi lại cho nhân viên bằng cách mang sẵn đồ dùng cần thiết.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách chọn lý do [Xin thêm đá lạnh / Nước chấm] sau khi bấm gọi
    Given Nút gọi nhân viên vừa được kích hoạt
    When Hệ thống hiển thị 4 Quick Tags và khách chạm vào tag "[Xin thêm đá lạnh / Nước chấm]"
    Then Gói tin điều phối gửi tới nhân viên được cập nhật nội dung:
      {
        "table_id": "BÀN-05",
        "action": "Xin thêm đá lạnh và nước chấm",
        "priority": "NORMAL"
      }
    And Nhân viên chuẩn bị sẵn ca đá và nước sốt mang thẳng tới bàn mà không cần đến hỏi lại
  ```

---

### SPEC-SCENARIO-SUP-08: Cơ chế chống spam nút gọi nhân viên (Rate Limiting Cooldown)
- **Ánh xạ Test Case:** `TC-SUP-08`
- **Mục tiêu:** Ngăn chặn việc trẻ em hoặc khách bấm nút liên hồi làm nghẽn chuông nhân viên.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách hàng nhấn nút Gọi nhân viên 5 lần liên tục trong 10 giây
    Given Nút gọi nhân viên vừa được bấm thành công lần đầu tiên
    When Hệ thống ghi nhận các lần bấm tiếp theo trong vòng 45 giây
    Then Bộ đếm Cooldown Guard khóa sự kiện phát chuông mới
    And Nút hiển thị bộ đếm ngược thời gian: "[Đang gọi phục vụ... 45s]"
    And Khung chat hiển thị thông báo nhẹ nhàng: "Yêu cầu trước đó đang được nhân viên tiếp nhận và di chuyển tới bàn, bạn vui lòng đợi trong giây lát nhé!"
    And Sau khi hết 45 giây, nút tự động mở khóa về trạng thái ban đầu
  ```

---

### SPEC-SCENARIO-SUP-09: Xử lý gián đoạn kết nối mạng khi bấm gọi nhân viên
- **Ánh xạ Test Case:** `TC-SUP-09`
- **Mục tiêu:** Báo lỗi trung thực, tuyệt đối không báo thành công giả tạo khi mất mạng.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Thiết bị của khách mất kết nối internet đúng lúc bấm gọi phục vụ
    Given Thiết bị của khách bị mất mạng (mất sóng / ngắt wifi)
    When Khách hàng nhấn nút "[🛎️ Gọi nhân viên bàn]"
    Then Gói tin WebSocket không gửi được (Network Timeout)
    And Hệ thống KHÔNG được hiển thị thông báo thành công giả tạo
    And Khung chat hiển thị cảnh báo viền đỏ: "Lỗi kết nối mạng! Không thể gửi yêu cầu gọi nhân viên. [Bấm để thử lại]"
    And Nút [Bấm để thử lại] cho phép kích hoạt gửi lại ngay khi mạng có trở lại
  ```

---

### SPEC-SCENARIO-SUP-10: Tiếp nhận phàn nàn & Báo động khẩn cấp tới Quản lý (Urgent Escalation)
- **Ánh xạ Test Case:** `TC-SUP-10`
- **Mục tiêu:** Xoa dịu thái độ khách hàng và điều động quản lý ca trực xử lý tại chỗ trong vòng 60 giây.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách phàn nàn gay gắt vì đợi món 40 phút chưa có
    When Khách hàng nhắn: "Phục vụ quá tệ, 40 phút rồi chưa có món, tôi cần gặp quản lý ngay lập tức!"
    Then Bộ nhận diện cảm xúc phát hiện mức độ bức xúc cao (Sentiment = NEGATIVE_CRITICAL)
    And Hệ thống tự động kích hoạt chế độ Báo Động Khẩn Cấp (is_urgent = true)
    And Bắn thông báo chuông ưu tiên cao nhất tới máy tính bảng của Quản lý nhà hàng
    And Aria gửi lời xin lỗi chân thành và xoa dịu: "Aria chân thành xin lỗi anh/chị vì sự chậm trễ này! Sự bất tiện của anh/chị là lỗi của nhà hàng. Aria đã báo động trực tiếp tới Quản lý ca trực, Quản lý sẽ có mặt tại Bàn của anh/chị ngay trong vòng 1 phút để hỗ trợ giải quyết ạ."
  ```
