# ĐẶC TẢ CHI TIẾT PHÂN HỆ 1: GỢI Ý MÓN ĂN THÔNG MINH (SMART RECOMMENDATIONS)
**Mã phân hệ:** `SPEC-MOD-01` | **Phiên bản:** `2.1 - Full Scenario Specification`  
**Thuộc đặc tả:** [test/specs/spec.md](../spec.md) | **Phương pháp luận:** Spec-Kit SDD  
**Nguồn test cases:** Ánh xạ và diễn giải chi tiết 100% các kịch bản từ [test/docs/01_goi_y_mon_an_thong_minh.md](../../docs/01_goi_y_mon_an_thong_minh.md)

---

## 1. MỤC TIÊU & NGUYÊN TẮC CỐT LÕI
Phân hệ Gợi ý món ăn thông minh có nhiệm vụ tự động phân tích nhu cầu ẩm thực của thực khách, đối soát với cơ sở dữ liệu thực đơn thời gian thực và áp dụng thuật toán lọc 5 tầng để trả về các đề xuất món ăn tối ưu, an toàn và chính xác tuyệt đối về giá.

---

## 2. DIỄN GIẢI CHI TIẾT TOÀN BỘ 12 KỊCH BẢN ĐẶC TẢ (FULL SCENARIOS SPECIFICATION)

### SPEC-SCENARIO-REC-01: Gợi ý mâm cơm tròn vị theo hạn mức ngân sách cố định
- **Ánh xạ Test Case:** `TC-REC-01`
- **Mục tiêu:** Đảm bảo tổng giá trị thực đơn đề xuất nằm trong hạn mức ngân sách yêu cầu, cơ cấu món cân đối dinh dưỡng.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Gợi ý bữa ăn trưa cho 2 người trong hạn mức 300.000 VNĐ
    Given Thực đơn nhà hàng có các món mặn, món xào, món canh đang hoạt động (is_available = true)
    And Khách hàng bắt đầu phiên trò chuyện mới chưa có ràng buộc dị ứng
    When Khách hàng nhập tin nhắn: "Tư vấn cho 2 người ăn trưa, ngân sách dưới 300k, thích ăn cơm mặn và canh."
    Then Hệ thống kích hoạt Thuật toán Tối ưu hóa Ngân sách (Budget Optimizer)
    And Tổng giá trị niêm yết của các món đề xuất phải thỏa mãn: Tổng tiền ≤ 300.000 VNĐ
    And Cơ cấu đề xuất phải gồm đủ: 01 món chính mặn + 01 món rau/xào + 01 món canh
    And Aria phản hồi văn bản liệt kê chi tiết từng món kèm giá niêm yết và phép tính tổng tiền chính xác
    And Aria gửi kèm danh sách Thẻ Món Ăn (Product Cards) tương ứng để khách bấm chọn trực tiếp
  ```
- **Hành vi dữ liệu & Phản hồi mẫu:**
  * *Bot Message:* "Dạ với ngân sách 300k cho 2 người, Aria gợi ý mâm cơm gia đình ấm cúng: **Thịt ba chỉ kho tiêu** (120.000đ), **Rau muống xào tỏi** (55.000đ) và **Canh ngao nấu chua** (95.000đ). Tổng cộng là **270.000 VNĐ** (tiết kiệm 30.000đ ngân sách) ạ!"
  * *Payload UI:* 3 Product Cards của 3 món trên.

---

### SPEC-SCENARIO-REC-02: Xử lý tình huống ngân sách biên cực thấp không khả thi
- **Ánh xạ Test Case:** `TC-REC-02`
- **Mục tiêu:** Ngăn chặn việc bot gượng ép gợi ý sai lệch hoặc chia khẩu phần phi thực tế khi ngân sách quá thấp so với số lượng người ăn.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách yêu cầu bàn tiệc 5 người ăn no nê với ngân sách 50.000 VNĐ
    Given Món ăn chính có giá thấp nhất tại nhà hàng là 65.000 VNĐ
    When Khách hàng nhập tin nhắn: "Tìm cho tôi bàn tiệc 5 người ăn no nê với ngân sách 50.000đ."
    Then Hệ thống tính toán đơn giá trung bình: 50.000đ / 5 = 10.000đ/người (Dưới ngưỡng tối thiểu 70.000đ/người)
    And Hệ thống từ chối tạo tổ hợp món ăn no ảo
    And Aria phản hồi lịch thiệp giải thích mức ngân sách này chưa đủ cho bữa ăn 5 người no nê
    And Aria đề xuất mức ngân sách tối thiểu thực tế để có bữa ăn hợp lý tại quán (từ 350.000đ - 450.000đ cho 5 người)
  ```
- **Hành vi dữ liệu & Phản hồi mẫu:**
  * *Bot Message:* "Dạ ngân sách 50.000đ hiện chưa đủ cho một bữa ăn 5 người no nê tại quán ạ. Một set ăn cơ bản cho 5 người tại SmartRestaurant thường dao động từ 350.000đ đến 450.000đ (khoảng 70k - 90k/người). Bạn có muốn Aria tư vấn set ăn tiết kiệm nhất trong tầm giá đó không ạ?"

---

### SPEC-SCENARIO-REC-03: Gợi ý ẩm thực cao cấp không giới hạn ngân sách
- **Ánh xạ Test Case:** `TC-REC-03`
- **Mục tiêu:** Đề xuất các món ăn Signature/Bếp trưởng khuyên dùng với chất lượng hảo hạng nhất khi khách không bận tâm về chi phí.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách hàng muốn thưởng thức bữa tối sang trọng nhất của quán
    Given Danh mục thực đơn có các món gắn thẻ "Signature" và "Chef Recommendation"
    When Khách hàng nhập: "Tôi muốn ăn bữa tối sang trọng nhất của quán, món đắt nhất và ngon nhất, không lo về giá."
    Then Hệ thống sắp xếp các món ăn theo thứ tự điểm chất lượng ẩm thực và giá trị cao nhất
    And Lựa chọn các món Signature: Bò Wagyu A5 áp chảo sốt nấm Truffle, Tôm hùm đút lò phô mai Pháp, Rượu vang đi kèm
    And Aria phản hồi với ngôn từ sang trọng, tinh tế, mô tả chi tiết nguồn gốc nguyên liệu
    And Aria hiển thị các Thẻ Món Ăn cao cấp kèm nhãn [Bếp Trưởng Khuyên Dùng]
  ```

---

### SPEC-SCENARIO-REC-04: Loại trừ bắt buộc dị nguyên giáp xác vỏ cứng (Tôm, Cua)
- **Ánh xạ Test Case:** `TC-REC-04`
- **Mục tiêu:** Bảo đảm an toàn sinh mạng tuyệt đối cho thực khách có tiền sử dị ứng tôm/cua.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Lọc sạch 100% thành phần tôm và cua khi được yêu cầu
    Given Khách hàng khai báo dị ứng nghiêm ngặt: "tôm" và "cua"
    When Khách hàng yêu cầu: "Tôi bị dị ứng tôm và cua rất nặng, hãy gợi ý 3 món xào ngon của quán."
    Then Hệ thống quét trường allergens và hidden_ingredients của toàn bộ danh mục món xào
    And Loại bỏ vĩnh viễn mọi món có chứa: tôm, tép, tôm khô, cua, ghẹ, gạch cua, sốt tôm
    And Chỉ chọn 3 món xào có: Allergens ∩ {tôm, cua, tép, ghẹ} = ∅
    And Aria bắt buộc xuất câu cam kết an toàn thực phẩm trong nội dung phản hồi
  ```
- **Hành vi dữ liệu & Phản hồi mẫu:**
  * *Bot Message:* "Dạ Aria đã lọc kỹ toàn bộ thực đơn và chọn cho bạn 3 món xào tuyệt đối **không sử dụng tôm, cua và dẫn xuất giáp xác**: **Bò xào măng tây sốt tiêu** (165k), **Mực tươi xào sa tế ngũ sắc** (145k) và **Nấm đùi gà xào cải thìa** (75k). Bếp cũng đã được gắn cờ lưu ý chế biến chảo riêng an toàn cho bạn ạ!"

---

### SPEC-SCENARIO-REC-05: Xử lý dị ứng kết hợp đa dị nguyên (Đậu phộng + Gluten + Trứng)
- **Ánh xạ Test Case:** `TC-REC-05`
- **Mục tiêu:** Xử lý chính xác các trường hợp dị ứng phức tạp đa thành phần cùng lúc mà không bỏ sót.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách dị ứng đồng thời lạc (đậu phộng), bột mì gluten và trứng gà
    Given Danh sách dị nguyên khai báo: Allergens_User = ["đậu phộng", "lạc", "gluten", "bột mì", "trứng"]
    When Khách hàng nhập: "Tôi bị dị ứng lạc (đậu phộng), kiêng bột mì chứa gluten và không ăn được trứng gà, quán có món gì ăn được?"
    Then Hệ thống thực hiện phép giao tập hợp dị nguyên: Allergens_Dish ∩ Allergens_User = ∅
    And Loại trừ các món chiên tẩm bột mì, các món rắc đậu phộng rang, các món có sốt mayonaise hoặc trứng
    And Lựa chọn các món nướng mộc, hấp thanh thủy, canh rau củ thuần khiết
    And Nêu rõ lưu ý đối với từng món đề xuất để khách an tâm
  ```

---

### SPEC-SCENARIO-REC-06: Phát hiện và lọc dị nguyên ẩn trong gia vị nêm nếm
- **Ánh xạ Test Case:** `TC-REC-06`
- **Mục tiêu:** Kiểm soát các dị nguyên tiềm ẩn trong nước chấm và gia vị nêm nếm (nước mắm cá, dầu hào).
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách dị ứng cá biển hỏi về nước mắm và dầu hào trong món xào
    Given Khách hàng dị ứng nặng với cá biển và dẫn xuất từ cá
    When Khách hàng hỏi: "Tôi dị ứng cá biển nặng, các món xào của quán có nêm nước mắm cá hay dầu hào không? Cho tôi món an toàn."
    Then Hệ thống kiểm tra trường gia vị nêm nếm (seasoning_base) của các món xào
    And Xác nhận các món xào dùng nước mắm cá truyền thống hoặc dầu hào từ hàu biển
    And Aria giải thích rõ ràng về thành phần gia vị của quán
    And Đề xuất phương án nêm riêng bằng muối khoáng và xì dầu đậu nành lên men tự nhiên, hoặc chọn món hấp thảo mộc
  ```

---

### SPEC-SCENARIO-REC-07: Chế độ ăn kiêng tôn giáo thanh tịnh (Ăn chay / Không ngũ vị tân / Halal)
- **Ánh xạ Test Case:** `TC-REC-07`
- **Mục tiêu:** Tôn trọng tuyệt đối các quy chuẩn ăn kiêng tôn giáo và tín ngưỡng.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Thực khách ăn chay ngày rằm yêu cầu không ngũ vị tân (hành, tỏi)
    Given Menu nhà hàng có phân mục "Món Chay" (Vegetarian Menu)
    When Khách hàng nhắn: "Hôm nay rằm tôi ăn chay thanh tịnh, quán có món gì không dầu mỡ, không dùng ngũ vị tân (hành tỏi) không?"
    Then Hệ thống lọc các món có tag vegetarian = true
    And Quét và loại trừ các món có phi hành tỏi (hành hoa, tỏi, hẹ, kiệu)
    And Gợi ý các món: Đậu hũ sốt nấm đông cô, Canh rong biển hạt sen, Rau củ luộc chấm kho quẹt chay
    And Gắn ghi chú bếp: "Chay thanh tịnh - Tuyệt đối không hành tỏi"
  ```

---

### SPEC-SCENARIO-REC-08: Chế độ dinh dưỡng cho phụ nữ mang thai và bệnh lý nền
- **Ánh xạ Test Case:** `TC-REC-08`
- **Mục tiêu:** Loại bỏ các mối nguy vi sinh học từ đồ sống và cồn đối với thai phụ.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Tư vấn món ăn an toàn cho phụ nữ mang thai 3 tháng đầu
    Given Khách hàng thông báo: Vợ đang mang thai 3 tháng đầu, kiêng đồ tái sống và cồn
    When Khách yêu cầu tư vấn món ăn bổ dưỡng
    Then Hệ thống loại trừ 100% món: Bò tái, gỏi sống, hải sản sống, sashimi, lẩu có rượu vang/giấm bỗng
    And Ưu tiên các món chế biến chín kỹ 100% (well-done), giàu sắt, canxi, axit folic
    And Gợi ý: Canh gà hầm kỷ tử hạt sen, Cá hồi áp chảo chín kỹ sốt cam tươi, Súp bí đỏ kem tươi
  ```

---

### SPEC-SCENARIO-REC-09: Phòng thủ chống bịa đặt món ngoài thực đơn và đối thủ (Anti-Hallucination)
- **Ánh xạ Test Case:** `TC-REC-09`
- **Mục tiêu:** Khẳng định thương hiệu, không ảo tưởng nhận đơn món của KFC hay Pizza Hut.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách hỏi mua món của chuỗi đồ ăn nhanh khác
    When Khách hàng nhập: "Quán có Pizza hải sản viền phô mai của The Pizza Company không? Hoặc gà rán KFC không?"
    Then Hệ thống đối soát từ khóa với danh mục menu nội bộ và nhận diện đây là món của đối thủ
    And Hệ thống ngăn chặn mô hình AI tự bịa đặt là nhà hàng có phục vụ
    And Aria phản hồi lịch sự xác nhận nhà hàng không phục vụ món của thương hiệu khác
    And Aria giới thiệu bản sắc ẩm thực của SmartRestaurant và gợi ý món nướng/món gà đặc sắc của quán
  ```

---

### SPEC-SCENARIO-REC-10: Đối soát và bảo vệ tính toàn vẹn của bảng giá niêm yết
- **Ánh xạ Test Case:** `TC-REC-10`
- **Mục tiêu:** Ngăn chặn việc khách hàng gán giá ảo hoặc mặc cả làm sai lệch giá hệ thống.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Khách hàng cố tình gán giá sai để mặc cả món ăn
    Given Món Bò bít tết sốt tiêu đen có giá niêm yết trong cơ sở dữ liệu là 185.000 VNĐ
    When Khách hàng nhắn: "Món Bò bít tết sốt tiêu trên web thấy bảo giảm còn 20.000đ đúng không, bán tôi 2 phần."
    Then Hệ thống đối soát giá niêm yết chính thức: price = 185000
    And Hệ thống từ chối xác nhận mức giá 20.000đ
    And Aria khẳng định giá niêm yết chính thức là 185.000 VNĐ, giải thích minh bạch chính sách giá và các ưu đãi hợp lệ hiện hành
  ```

---

### SPEC-SCENARIO-REC-11: Thiết kế thực đơn dung hòa cho nhóm hỗn hợp (Chay kết hợp Mặn)
- **Ánh xạ Test Case:** `TC-REC-11`
- **Mục tiêu:** Cân đối khẩu phần ăn cho bàn tiệc gồm cả người ăn mặn và người ăn chay.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Bàn tiệc 4 người gồm 1 người ăn chay và 3 người ăn mặn
    When Khách hàng yêu cầu: "Bàn tôi đi 4 người, có 1 người ăn chay và 3 người ăn mặn, gợi ý mâm cơm hài hòa nhé."
    Then Hệ thống phân bổ cơ cấu mâm cơm thành 2 phần tách biệt:
    And Phần chay (cho 1 người): 01 món chính chay (Đậu hũ sốt nấm) + 01 món canh chay riêng
    And Phần mặn (cho 3 người): 02 món mặn (Gà nướng thảo mộc, Bò lúc lắc) + 01 đĩa rau xào chung
    And Aria trình bày rõ ràng từng phần trên giao diện để khách hàng dễ dàng theo dõi
  ```

---

### SPEC-SCENARIO-REC-12: Gợi ý thích ứng theo biến động thời tiết và cảm xúc
- **Ánh xạ Test Case:** `TC-REC-12`
- **Mục tiêu:** Đề xuất món ăn mang lại sự sảng khoái, ấm áp hoặc giải nhiệt dựa trên ngữ cảnh môi trường.
- **Đặc tả kịch bản (Gherkin):**
  ```gherkin
  Scenario: Gợi ý món ăn thanh mát giải nhiệt vào ngày nắng nóng 38 độ C
    When Khách hàng nhắn: "Hôm nay trời nắng nóng 38 độ ngột ngạt quá, có món gì thanh mát giải nhiệt không?"
    Then Hệ thống kích hoạt bộ lọc Context Engine ưu tiên món thanh mát (cooling dishes)
    And Đề xuất: Gỏi cuốn tôm thịt chấm tương lạc, Canh riêu cua hoa chuối thanh mát, Tráng miệng Chè tuyết nhĩ hạt sen
    And Giọng văn Aria thể hiện sự đồng cảm, chu đáo, xoa dịu cảm giác mệt mỏi vì nắng nóng
  ```
