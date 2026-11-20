# ĐẶC TẢ CHI TIẾT PHÂN HỆ 2: THẺ MÓN ĂN & THÊM GIỎ HÀNG TRỰC TIẾP TRONG CHAT
**Mã phân hệ:** `SPEC-MOD-02` | **Phiên bản:** `2.1 - Full Scenario Specification`  
**Thuộc đặc tả:** [test/specs/spec.md](../spec.md) | **Phương pháp luận:** Spec-Kit SDD  
**Nguồn test cases:** Ánh xạ và diễn giải chi tiết 100% các kịch bản từ [test/docs/02_them_mon_vao_gio_ngay_trong_chat.md](../../docs/02_them_mon_vao_gio_ngay_trong_chat.md)

---

## 1. MỤC TIÊU & NGUYÊN TẮC CỐT LÕI
Phân hệ Thêm món vào giỏ ngay trong chat biến cuộc trò chuyện thành một điểm chạm thương mại tương tác 1 chạm (Conversational Commerce), cho phép khách hàng xem thẻ món ăn trực quan, điều chỉnh gia vị, thêm vào giỏ và đồng bộ giỏ hàng thời gian thực mà không bao giờ phải rời khỏi giao diện chat.

---

## 2. DIỄN GIẢI CHI TIẾT TOÀN BỘ 12 KỊCH BẢN ĐẶC TẢ (FULL SCENARIOS SPECIFICATION)

### SPEC-SCENARIO-ATC-01: Hiển thị Thẻ Món Ăn tương tác hoàn chỉnh (Product Card UI)
- **Ánh xạ Test Case:** `TC-ATC-01`
- **Mục tiêu:** Đảm bảo thẻ món ăn hiển thị đầy đủ các trường thông tin trực quan theo chuẩn thiết kế.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Hiển thị Thẻ Món Ăn "Bò bít tết sốt tiêu đen" trong khung chat
    Given Món "Bò bít tết sốt tiêu đen" đang hoạt động trong menu với giá 185.000 VNĐ
    When Khách hàng nhập tin nhắn: "Cho tôi xem món Bò bít tết sốt tiêu đen."
    Then Khung chat render 01 Thẻ Món Ăn trực quan (Product Card)
    And Thẻ món ăn phải bao gồm đầy đủ 5 trường thông tin:
      | Trường | Định dạng / Nội dung |
      | Ảnh món | Tỷ lệ 16:9, chất lượng cao, bo góc 12px |
      | Tên món | "Bò Bít Tết Sốt Tiêu Đen", in đậm font 16px |
      | Đơn giá | "185.000 VNĐ", màu cam đỏ nổi bật |
      | Mô tả ngắn | "Thịt thăn bò Úc áp chảo mềm mọng, sốt tiêu đen thơm nồng ăn kèm khoai tây chiên." |
      | Nút bấm | Nút "[+ Thêm vào giỏ]" màu xanh nổi bật |
  ```

---

### SPEC-SCENARIO-ATC-02: Thao tác 1 chạm thêm món vào giỏ hàng
- **Ánh xạ Test Case:** `TC-ATC-02`
- **Mục tiêu:** Phản hồi cảm ứng nhanh, cập nhật badge giỏ hàng thời gian thực.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách hàng nhấn nút [+ Thêm vào giỏ] trên thẻ món ăn
    Given Thẻ món ăn "Bò bít tết sốt tiêu đen" đang hiển thị trong khung chat
    And Số lượng món trong giỏ hàng hiện tại là 0
    When Khách hàng chạm/click vào nút "[+ Thêm vào giỏ]"
    Then Nút bấm lập tức chuyển trạng thái sang Loading (< 150ms)
    And Sau khi xử lý xong, nút đổi sang màu xanh lá với nhãn "[Đã thêm ✓]"
    And Badge số lượng trên biểu tượng giỏ hàng góc màn hình tăng tức thì từ 0 lên 1
    And Aria gửi tin nhắn xác nhận: "Đã thêm Bò bít tết vào giỏ hàng của bạn."
    And Sau 1.5 giây, nút bấm tự động hồi phục về trạng thái ban đầu để cho phép thêm tiếp
  ```

---

### SPEC-SCENARIO-ATC-03: Thêm món thông qua câu lệnh ngôn ngữ tự nhiên
- **Ánh xạ Test Case:** `TC-ATC-03`
- **Mục tiêu:** Phân tích câu lệnh đàm thoại và tự động thêm chính xác nhiều món vào giỏ.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Thêm đồng thời cơm chiên và nước chanh dây bằng lệnh chat
    When Khách hàng nhập tin nhắn: "Cho 1 phần Cơm chiên hải sản và 2 ly Nước chanh dây vào giỏ nhé."
    Then Bộ phân tích ngôn ngữ tự nhiên tách thành 2 hành động thêm món:
      | Tên món | Số lượng | Đơn giá | Thành tiền |
      | Cơm chiên hải sản | 1 | 95.000 VNĐ | 95.000 VNĐ |
      | Nước chanh dây | 2 | 35.000 VNĐ | 70.000 VNĐ |
    And Giỏ hàng cập nhật tăng thêm 3 sản phẩm
    And Badge giỏ hàng nhảy số cộng dồn
    And Aria phản hồi: "Dạ Aria đã thêm 1 Cơm chiên hải sản và 2 Nước chanh dây vào giỏ hàng (Tạm tính: 165.000 VNĐ) ạ!"
  ```

---

### SPEC-SCENARIO-ATC-04: Tùy biến món & Lưu trữ ghi chú hương vị (Modifiers)
- **Ánh xạ Test Case:** `TC-ATC-04`
- **Mục tiêu:** Ghi nhận chính xác các tùy chọn đường, đá, gia vị riêng của khách.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Thêm món có nhiều lớp ghi chú gia vị và đá đường
    When Khách hàng nhập: "Thêm 1 Trà sữa Ô Long 50% đường 70% đá, trân châu đen và 1 Phở bò không hành lá nhiều ớt."
    Then Hệ thống ghi nhận 2 CartItem với cấu trúc tùy biến:
      | Món ăn | Số lượng | Ghi chú tùy biến (Modifiers) |
      | Trà sữa Ô Long | 1 | Đường: 50%, Đá: 70%, Topping: Trân châu đen |
      | Phở bò | 1 | Không hành lá, Nhiều ớt |
    And Các ghi chú này hiển thị rõ ràng dưới dạng tag nhãn nhỏ trong chi tiết giỏ hàng
  ```

---

### SPEC-SCENARIO-ATC-05: Tăng/Giảm số lượng trực tiếp trên Thẻ Món Ăn
- **Ánh xạ Test Case:** `TC-ATC-05`
- **Mục tiêu:** Cho phép khách hàng chọn số lượng phần ăn trước khi bấm thêm vào giỏ.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách bấm nút [+] 3 lần để chọn 4 suất ăn
    Given Thẻ món đang hiển thị số lượng mặc định là 1
    When Khách hàng bấm nút "[+]" 3 lần liên tiếp
    Then Con số hiển thị trong ô số lượng tăng lần lượt từ 1 -> 2 -> 3 -> 4
    When Khách hàng bấm nút "[+ Thêm vào giỏ]"
    Then Hệ thống thêm đúng 4 phần ăn vào giỏ hàng
    And Tổng giá trị của món được nhân chính xác với 4: 185.000đ x 4 = 740.000 VNĐ
  ```

---

### SPEC-SCENARIO-ATC-06: Cơ chế chống spam click (Debounce Engine)
- **Ánh xạ Test Case:** `TC-ATC-06`
- **Mục tiêu:** Ngăn chặn lỗi gửi trùng lặp request khi khách hàng bấm nhanh hoặc đúp chuột.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách hàng nhấn nút [+ Thêm vào giỏ] 5 lần trong 1 giây
    When Phát hiện chuỗi click liên tiếp có khoảng cách < 400ms giữa các lần bấm
    Then Hệ thống kích hoạt bộ lọc Debounce Guard
    And Chỉ có sự kiện click đầu tiên được xử lý thành công
    And Các sự kiện click tiếp theo trong cửa sổ 400ms bị loại bỏ
    And Giỏ hàng chỉ tăng đúng 1 phần ăn, không bị đội số lượng ảo
    And Giao diện người dùng không bị giật lag hay treo ứng dụng
  ```

---

### SPEC-SCENARIO-ATC-07: Xử lý món đã tạm hết hàng trong kho (Out of Stock)
- **Ánh xạ Test Case:** `TC-ATC-07`
- **Mục tiêu:** Vô hiệu hóa nút bấm và thông báo khéo léo khi món ăn hết hàng.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách xem món ăn đang gắn trạng thái is_available = false
    Given Món "Cua hoàng đế hấp" có tồn kho bằng 0 (is_available = false)
    When Thẻ món ăn được hiển thị trong khung chat
    Then Thẻ phủ một lớp màu xám mờ bán trong suốt (opacity: 0.6)
    And Nút bấm chuyển sang màu xám với nhãn "[Tạm hết món]" và bị khóa tương tác (disabled = true)
    And Aria gửi kèm lời thoại: "Món này hôm nay quán đã hết nguyên liệu tươi ngon nhất, Aria gợi ý bạn thử món Tôm hùm bỏ lò phô mai tương tự nhé!"
  ```

---

### SPEC-SCENARIO-ATC-08: Xử lý hết hàng đúng thời điểm bấm (Race Condition)
- **Ánh xạ Test Case:** `TC-ATC-08`
- **Mục tiêu:** Bắt lỗi nhẹ nhàng khi món hết hàng đúng tích tắc khách bấm nút.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Món còn 1 suất cuối bị khách khác mua đúng lúc khách hiện tại bấm thêm
    Given Món ăn còn tồn kho = 1
    When Khách hàng bấm nút "[+ Thêm vào giỏ]" nhưng API trả về mã OUT_OF_STOCK
    Then Hệ thống hủy bỏ trạng thái loading của nút bấm
    And Nút bấm lập tức chuyển sang trạng thái disabled "[Tạm hết món]"
    And Khung chat hiển thị popup thông báo nhẹ nhàng: "Rất tiếc! Suất cuối cùng của món này vừa được đặt trước bởi khách khác. Bạn có muốn đổi sang món khác không?"
  ```

---

### SPEC-SCENARIO-ATC-09: Xem tóm tắt giỏ hàng ngay trong cuộc trò chuyện (Mini Cart)
- **Ánh xạ Test Case:** `TC-ATC-09`
- **Mục tiêu:** Cung cấp Thẻ Tóm Tắt Giỏ Hàng trực quan khi khách hỏi.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách hỏi kiểm tra giỏ hàng hiện tại
    When Khách hàng nhập: "Cho tôi xem lại giỏ hàng hiện tại gồm những gì và tổng tiền?"
    Then Khung chat render 01 Thẻ Tóm Tắt Giỏ Hàng (Mini Cart Card)
    And Thẻ hiển thị bảng danh sách các món đã chọn, số lượng, đơn giá, thành tiền
    And Hiển thị dòng Tạm tính, Thuế VAT (nếu có), Phí dịch vụ và Tổng thanh toán
    And Kèm 2 nút hành động: "[Xem chi tiết giỏ]" và "[Tiến hành đặt món / Thanh toán]"
  ```

---

### SPEC-SCENARIO-ATC-10: Xóa hoặc giảm món khỏi giỏ trực tiếp trong chat
- **Ánh xạ Test Case:** `TC-ATC-10`
- **Mục tiêu:** Chỉnh sửa giỏ hàng linh hoạt qua đàm thoại tự nhiên.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách yêu cầu bớt 1 ly nước chanh và xóa món cơm chiên
    Given Giỏ hàng đang có 1 Cơm chiên hải sản và 2 Nước chanh dây
    When Khách hàng nhắn: "Bỏ bớt 1 ly nước chanh dây và xóa món cơm chiên ra khỏi giỏ cho tôi."
    Then Hệ thống cập nhật giỏ hàng: Xóa bỏ dòng Cơm chiên hải sản, Giảm số lượng Nước chanh dây xuống 1
    And Badge giỏ hàng giảm từ 3 xuống còn 1
    And Aria thông báo: "Dạ Aria đã cập nhật lại giỏ hàng của bạn: Đã xóa Cơm chiên và chỉ giữ lại 1 Nước chanh dây (Tổng cộng: 35.000 VNĐ) ạ!"
  ```

---

### SPEC-SCENARIO-ATC-11: Giới hạn số lượng món tối đa trên đơn lẻ (Boundary Limit)
- **Ánh xạ Test Case:** `TC-ATC-11`
- **Mục tiêu:** Ngăn chặn việc nhập số lượng vô lý làm sai lệch đơn hàng bán lẻ.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách yêu cầu thêm số lượng cực lớn 999 phần ăn
    When Khách hàng nhập tin nhắn: "Thêm 999 phần Bò bít tết vào giỏ."
    Then Hệ thống áp dụng quy tắc chặn ngưỡng tối đa (Maximum Limit: 20 phần/món trên đơn lẻ trực tuyến)
    And Hệ thống từ chối thêm 999 phần vào giỏ
    And Aria phản hồi: "Dạ với số lượng lớn trên 20 phần ăn cho sự kiện hoặc tiệc công ty, bạn vui lòng liên hệ trực tiếp Hotline Quản lý nhà hàng để được phục vụ chu đáo nhất ạ!"
  ```

---

### SPEC-SCENARIO-ATC-12: Duy trì trạng thái giỏ hàng khi chuyển trang hoặc làm mới trình duyệt
- **Ánh xạ Test Case:** `TC-ATC-12`
- **Mục tiêu:** Đảm bảo dữ liệu giỏ hàng bền vững, không bị mất khi khách F5 hoặc đổi tab.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách thêm món vào giỏ sau đó làm mới trình duyệt (F5)
    Given Khách hàng đã thêm 3 món vào giỏ hàng
    When Khách hàng tải lại trang trình duyệt web (F5) hoặc mở tab mới trong vòng 4 giờ
    Then Toàn bộ 3 món ăn, số lượng, ghi chú gia vị và tổng tiền vẫn được giữ nguyên vẹn
    And Khi mở lại khung chat, Aria chủ động chào hỏi và nhắc nhở giỏ hàng chưa hoàn tất
  ```
