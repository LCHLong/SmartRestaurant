# ĐẶC TẢ CHI TIẾT PHÂN HỆ 4: NHỚ KHẨU VỊ KHÁCH QUEN (MEMGPT CONTEXTUAL MEMORY)
**Mã phân hệ:** `SPEC-MOD-04` | **Phiên bản:** `2.1 - Full Scenario Specification`  
**Thuộc đặc tả:** [test/specs/spec.md](../spec.md) | **Phương pháp luận:** Spec-Kit SDD  
**Nguồn test cases:** Ánh xạ và diễn giải chi tiết 100% các kịch bản từ [test/docs/04_nho_khau_vi_khach_quen_memgpt.md](../../docs/04_nho_khau_vi_khach_quen_memgpt.md)

---

## 1. MỤC TIÊU & NGUYÊN TẮC CỐT LÕI
Phân hệ MemGPT xây dựng bộ nhớ ngữ cảnh dài hạn cho từng thực khách thân thiết, lưu giữ lịch sử món ăn, thói quen nêm nếm gia vị, độ cay và các chất kiêng khem, hỗ trợ ra lệnh gọi lại món quen siêu tốc đồng thời tuân thủ triệt để quyền riêng tư dữ liệu (Transparency & Right to be Forgotten).

---

## 2. DIỄN GIẢI CHI TIẾT TOÀN BỘ 10 KỊCH BẢN ĐẶC TẢ (FULL SCENARIOS SPECIFICATION)

### SPEC-SCENARIO-MEM-01: Lời chào cá nhân hóa nhận diện khách hàng thân thiết
- **Ánh xạ Test Case:** `TC-MEM-01`
- **Mục tiêu:** Tạo cảm giác được chào đón ấm áp, nhận diện đúng tên và món ruột của khách cũ.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Chú Hùng (khách cũ đã dùng bữa 3 lần) mở khung chat
    Given Hồ sơ khách hàng lưu: Tên = "Chú Hùng", Món yêu thích = "Bò bít tết sốt tiêu"
    When Chú Hùng mở phiên trò chuyện mới
    Then Aria nhận diện định danh khách hàng
    And Aria mở đầu bằng lời chào cá nhân hóa ấm cúng: "Chào mừng chú Hùng đã quay trở lại với SmartRestaurant! Hôm nay chú vẫn dùng món Bò tiêu quen thuộc hay muốn thử món mới trong tuần này ạ?"
  ```

---

### SPEC-SCENARIO-MEM-02: Xử lý kịch bản khách mới hoàn toàn (Cold Start Protocol)
- **Ánh xạ Test Case:** `TC-MEM-02`
- **Mục tiêu:** Không tự bịa đặt hoặc suy diễn thói quen khi khách chưa từng có lịch sử ăn uống.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách mới tinh lần đầu tiên mở chatbox
    Given Khách hàng chưa từng có lịch sử đơn hàng hoặc số điện thoại lưu trong hệ thống
    When Khách hàng mở khung chat
    Then Hệ thống kích hoạt quy trình khởi đầu chuẩn mực (Cold Start Greeting)
    And Aria chào đón lịch sự, giới thiệu vai trò và các năng lực chính (Gợi ý món, Đặt bàn, Xem menu)
    And Tuyệt đối không nhắc đến bất kỳ thói quen hay món ăn quen thuộc giả định nào
  ```

---

### SPEC-SCENARIO-MEM-03: Tự động ghi nhớ thói quen gia vị (Độ cay & Không hành lá)
- **Ánh xạ Test Case:** `TC-MEM-03`
- **Mục tiêu:** Tự động điền các lưu ý gia vị quen thuộc khi khách gọi món mà không cần khách nhắc lại.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách có thói quen "không hành lá, ít cay" gọi món xào
    Given Hồ sơ khách hàng lưu trữ thói quen: dietary_preferences = ["no_onion"], spice_preference_tier = 1 (ít cay)
    When Khách hàng gõ: "Cho anh 1 phần Mì xào bò giòn."
    Then Hệ thống tự động gắn thuộc tính vào đơn hàng:
      - custom_notes: "Không hành lá"
      - spice_level: "mild (ít cay)"
    And Aria phản hồi xác nhận: "Dạ 1 Mì xào bò giòn - Aria vẫn lưu ý bếp là **không hành lá và ít cay** như mọi khi của anh đúng không ạ?"
  ```

---

### SPEC-SCENARIO-MEM-04: Đặt lại món theo thói quen cũ ("Như cũ" / "Như lần trước")
- **Ánh xạ Test Case:** `TC-MEM-04`
- **Mục tiêu:** Phục vụ lệnh gọi món nhanh trong 3 giây cho khách quen bận rộn.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách ra lệnh "Cho 1 combo ăn trưa như tuần trước anh hay gọi nhé"
    Given Đơn hàng gần nhất của khách gồm: 1 Cơm sườn nướng mật ong (85k) + 1 Canh chua cá lóc (65k) + 1 Trà đào ít đá (35k)
    When Khách hàng nhập tin nhắn: "Cho 1 combo ăn trưa như tuần trước anh hay gọi nhé."
    Then Hệ thống truy xuất chính xác 3 món từ trường last_order_summary
    And Tự động chuẩn bị giỏ hàng với đúng các món và ghi chú gia vị của tuần trước
    And Aria hiển thị tóm tắt danh sách món, đơn giá và hỏi xác nhận trước khi chốt giỏ hàng
  ```

---

### SPEC-SCENARIO-MEM-05: Gợi ý món mới dựa trên gu ẩm thực đã lưu trữ
- **Ánh xạ Test Case:** `TC-MEM-05`
- **Mục tiêu:** Mở rộng trải nghiệm ẩm thực cho khách mà vẫn tôn trọng phong cách nêm nếm yêu thích.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách muốn đổi món nhưng vẫn giữ gu đậm đà và không cay
    Given Khách hàng có gu ẩm thực: Thích vị đậm đà, không ăn được cay
    When Khách hàng nhắn: "Hôm nay ngán bò rồi, có món gì mới lạ nhưng vẫn đậm đà, không cay không?"
    Then Hệ thống loại trừ các món thịt bò và các món cay (chili_level > 0)
    And Tìm kiếm trong thực đơn các món thịt heo/gia cầm có vị sốt đậm đà
    And Đề xuất: Heo nướng mắc khén sốt mật ong rừng (không cay) hoặc Vịt quay Quảng Đông sốt mận
  ```

---

### SPEC-SCENARIO-MEM-06: Ghi đè khẩu vị tạm thời cho một bữa ăn cụ thể (Context Override)
- **Ánh xạ Test Case:** `TC-MEM-06`
- **Mục tiêu:** Linh hoạt chiều theo ý khách trong bữa ăn đặc biệt mà không làm hỏng hồ sơ gốc.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách vốn ăn ít cay hôm nay đi tiếp khách cần ăn siêu cay
    Given Hồ sơ gốc của khách là ăn ít cay (spice_tier = 1)
    When Khách dặn: "Hôm nay anh đi tiếp khách thích ăn cay, làm món cay nhiều và bỏ thêm ớt nhé, đừng làm ít cay như mọi khi."
    Then Hệ thống áp dụng quy tắc Ưu tiên ngữ cảnh tức thời: Priority(Current Order) > Priority(Profile)
    And Đơn hàng này được gắn mức cay cấp 3 (Hot) và thêm ớt tươi
    And Hệ thống KHÔNG ghi đè mức cay cấp 3 vào hồ sơ dài hạn (vẫn giữ spice_tier = 1 cho các lần đi ăn một mình sau này)
  ```

---

### SPEC-SCENARIO-MEM-07: Cập nhật khẩu vị vĩnh viễn vào bộ nhớ dài hạn (Memory Update)
- **Ánh xạ Test Case:** `TC-MEM-07`
- **Mục tiêu:** Cập nhật thói quen mới khi khách có thay đổi chế độ dinh dưỡng lâu dài.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách thông báo mới bị bệnh gout, kiêng vĩnh viễn thịt bò và hải sản
    When Khách hàng nhắn: "Bác sĩ bảo tôi bị gout nên từ nay tôi kiêng hoàn toàn thịt bò và hải sản nhé, nhớ giùm tôi."
    Then Hệ thống cập nhật trường known_allergies hoặc dietary_preferences của hồ sơ khách:
      - Thêm cấm: "thịt bò", "hải sản", "nội tạng"
    And Aria xác nhận: "Dạ Aria đã cập nhật hồ sơ sức khỏe của bạn: Kiêng hoàn toàn thịt bò và hải sản. Kể từ nay mọi đề xuất của quán sẽ tự động loại bỏ 2 nhóm thực phẩm này để bảo vệ sức khỏe cho bạn ạ!"
  ```

---

### SPEC-SCENARIO-MEM-08: Minh bạch thông tin lưu trữ cá nhân (Memory Transparency)
- **Ánh xạ Test Case:** `TC-MEM-08`
- **Mục tiêu:** Tôn trọng quyền được biết của khách hàng đối với dữ liệu do AI lưu trữ.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách hỏi chatbot đang ghi nhớ những gì về mình
    When Khách hàng nhắn: "Aria đang nhớ những thông tin gì về sở thích ăn uống của tôi vậy?"
    Then Hệ thống trích xuất và hiển thị minh bạch các thông tin trong CustomerProfile:
      - Tên xưng hô: Chú Hùng
      - Độ cay yêu thích: Ít cay (Cấp 1)
      - Thói quen gia vị: Không ăn hành lá
      - Món gọi nhiều nhất: Bò bít tết sốt tiêu, Mì xào giòn
      - Số lần ghé thăm: 4 lần
    And Kèm thông báo: "Bạn có thể yêu cầu chỉnh sửa hoặc xóa bất kỳ thông tin nào bất cứ lúc nào ạ!"
  ```

---

### SPEC-SCENARIO-MEM-09: Quyền được lãng quên & Xóa dữ liệu cá nhân (Right to be Forgotten)
- **Ánh xạ Test Case:** `TC-MEM-09`
- **Mục tiêu:** Xóa triệt để 100% dữ liệu khẩu vị khi khách hàng yêu cầu bảo mật riêng tư.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách hàng yêu cầu xóa sạch toàn bộ lịch sử khẩu vị
    When Khách hàng nhắn: "Hãy xóa toàn bộ lịch sử ăn uống và khẩu vị của tôi đi."
    Then Hệ thống thực thi lệnh xóa sạch (Purge):
      - Đặt lại trường favorite_dish_ids = []
      - Xóa spice_preference_tier và dietary_preferences
      - Xóa last_order_summary
      - Đặt cờ privacy_opt_out = true
    And Aria phản hồi: "Dạ Aria đã xóa hoàn toàn mọi thông tin lịch sử khẩu vị của bạn trên hệ sinh thái quán. Rất hân hạnh được phục vụ bạn như một thực khách mới trong những lần tiếp theo ạ!"
  ```

---

### SPEC-SCENARIO-MEM-10: Cách ly tuyệt đối dữ liệu giữa các khách hàng (Tenant Isolation)
- **Ánh xạ Test Case:** `TC-MEM-10`
- **Mục tiêu:** Triệt tiêu hoàn toàn rò rỉ dữ liệu giữa 2 phiên người dùng khác nhau trên cùng thiết bị.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách A đăng xuất và Khách B đăng nhập vào hệ thống
    Given Khách A (thích ăn cay, mê thịt bò) đăng xuất phiên
    When Khách B (người ăn chay thuần, kiêng ngọt) đăng nhập trên cùng trình duyệt
    Then Toàn bộ Working Memory và Session Context của Khách A bị hủy ngay lập tức
    And Khung chat khởi tạo ngữ cảnh mới hoàn toàn theo hồ sơ của Khách B
    And Tuyệt đối không xuất hiện bất kỳ món thịt bò hay thói quen ăn cay nào của Khách A trong gợi ý cho Khách B
  ```
