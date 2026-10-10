# 📊 BÁO CÁO KIỂM THỬ TOÀN DIỆN E2E CHATBOT ARIA (MỞ RỘNG 20 TEST CASES)

- **Thời gian thực hiện**: 10/10/2026
- **Nhánh Git**: `test-ai-e2e`
- **Công cụ kiểm thử**: Playwright Automation (Chromium Headless) & Pytest Coverage
- **Độ phủ mã nguồn (Unit/Backend Coverage)**: **79%** (Tăng từ 71% lên 79%)
- **Tập kiểm thử E2E UI**: **20 Test Cases** phân cấp 5 Cấp độ (Dễ $\rightarrow$ Trung bình $\rightarrow$ Nâng cao $\rightarrow$ Chuyên sâu $\rightarrow$ **Edge Cases Nghiệp vụ mới**)
- **Kết quả thực thi E2E**:
  - ✅ **PASSED**: **16/20 ca (80.0%)**
  - ❌ **FAILED**: **4/20 ca (20.0%)**
    - **2 ca trùng với GitHub Bug Issues**: Bug #1 (Đoàn đông không xin SĐT) & Bug #4 (Cắt xén SĐT).
    - **2 ca PHÁT HIỆN LỖI MỚI HOÀN TOÀN (Ngoài GitHub Issues)**: Chặn số khách bằng 0 (Kẹt vòng lặp) & Chấp nhận số khách âm (-2 người).
- **Minh chứng (Evidence)**: **100% các ca (20/20)** đều chụp cận cảnh trực tiếp **Khung hội thoại Aria Chat (Dialogue Widget)** tại thư mục [`test/evidence/`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/).

---

## 1. BẢNG TỔNG HỢP KẾT QUẢ 20 TEST CASES PHÂN CẤP 5 LEVEL

### 🟢 CẤP ĐỘ 1: DỄ (Giao tiếp, Quick Chips & Tư vấn thực đơn)
| Mã TC | Tên Test Case | Độ ưu tiên | Kết quả | Ảnh minh chứng | Đánh giá chi tiết |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **TC-LV1-01** | Chào hỏi & Giới thiệu vai trò trợ lý | **P3** | ✅ **PASSED** | [`TC-LV1-01_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV1-01_passed.png) | Khách chào hỏi, Aria phản hồi thân thiện, tự giới thiệu vai trò trợ lý ẩm thực. |
| **TC-LV1-02** | Click gợi ý nhanh 'Gợi ý món hôm nay 🍜' | **P2** | ✅ **PASSED** | [`TC-LV1-02_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV1-02_passed.png) | Bấm quick chip thành công, kích hoạt gợi ý thực đơn hôm nay của nhà hàng. |
| **TC-LV1-03** | Tư vấn món ăn theo nguyên liệu (Món bò) | **P2** | ✅ **PASSED** | [`TC-LV1-03_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV1-03_passed.png) | Aria tư vấn đúng các món bò có trong thực đơn (Bò sốt tiêu đen, Bún bò Huế, Mì Ý sốt bò băm). |
| **TC-LV1-04** | Tư vấn món chay (Vegetarian) | **P2** | ✅ **PASSED** | [`TC-LV1-04_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV1-04_passed.png) | Aria nhận biết nhu cầu ăn chay và gợi ý các món chay thanh đạm, rau củ phù hợp. |

---

### 🟡 CẤP ĐỘ 2: TRUNG BÌNH (Bóc tách slot, Giờ mơ hồ, Ngày quá khứ, Đánh giá)
| Mã TC | Tên Test Case | Độ ưu tiên | Kết quả | Ảnh minh chứng | Đánh giá chi tiết |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **TC-LV2-01** | Bóc tách ngày giờ đặt bàn rõ ràng | **P1** | ✅ **PASSED** | [`TC-LV2-01_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV2-01_passed.png) | Aria bóc tách thành công ngày mai 19:00 và chủ động hỏi tiếp số lượng khách. |
| **TC-LV2-02** | Làm rõ giờ mơ hồ sáng/tối (7h) | **P1** | ✅ **PASSED** | [`TC-LV2-02_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV2-02_passed.png) | Aria phát hiện mốc 7h có thể là sáng hoặc tối và lịch sự hỏi làm rõ trước khi lưu slot. |
| **TC-LV2-03** | Từ chối đặt bàn ngày trong quá khứ | **P1** | ✅ **PASSED** | [`TC-LV2-03_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV2-03_passed.png) | Aria từ chối hợp lệ khi ngày đặt bàn nằm trong quá khứ, hướng dẫn chọn ngày tương lai. |
| **TC-LV2-04** | Tương tác nút Thích (Thumbs Up) gợi ý | **P2** | ✅ **PASSED** | [`TC-LV2-04_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV2-04_passed.png) | Bấm Thumbs Up thành công sau khi Aria trả lời, phản hồi trạng thái Hài lòng gửi lên server. |

---

### 🟠 CẤP ĐỘ 3: NÂNG CAO (Thực thể kết hợp, Toàn vẹn dữ liệu, Giỏ hàng)
| Mã TC | Tên Test Case | Độ ưu tiên | Kết quả | Ảnh minh chứng | Đánh giá chi tiết |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **TC-LV3-01** | Bóc tách tên kèm số khách (*"4 người, Hùng"*) | **P1** | ✅ **PASSED** | [`TC-LV3-01_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV3-01_passed.png) | Bóc tách chính xác cả số khách (4) và tên (Hùng). Lượt sau chỉ yêu cầu SĐT, không hỏi lại tên. |
| **TC-LV3-02** | Toàn vẹn SĐT 10 số (Bảo vệ Bug #4) | **P0** | ❌ **FAILED** | [`TC-LV3-02_failed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV3-02_failed.png) | **Tái hiện chuẩn xác Bug #4**: Khách nhập `0987654321` nhưng Aria hiển thị tóm tắt là `0987321` (bị cắt mất các số giữa). |
| **TC-LV3-03** | Đặt bàn trọn gói 1 câu (One-shot 5 slots) | **P0** | ✅ **PASSED** | [`TC-LV3-03_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV3-03_passed.png) | Aria bóc tách thành công toàn bộ 5 slots từ 1 câu thoại duy nhất và đưa ra tóm tắt xác nhận. |
| **TC-LV3-04** | Thêm món vào giỏ hàng từ Suggested Item Card | **P1** | ✅ **PASSED** | [`TC-LV3-04_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV3-04_passed.png) | Nút Thêm giỏ hàng từ thẻ mini-card của Aria tương tác mượt mà với giỏ hàng. |

---

### 🔴 CẤP ĐỘ 4: PHỨC HỢP & BẢO MẬT (Đoàn đông, Hủy tiến trình & Guardrails)
| Mã TC | Tên Test Case | Độ ưu tiên | Kết quả | Ảnh minh chứng | Đánh giá chi tiết |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **TC-LV4-01** | Khách đoàn đông $\ge$ 15 người (Bug #1) | **P1** | ❌ **FAILED** | [`TC-LV4-01_failed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV4-01_failed.png) | **Tái hiện chuẩn xác Bug #1**: Aria hứa hẹn *"Nhân viên sẽ liên hệ trong ít phút qua số điện thoại..."* nhưng KHÔNG HỀ XIN SĐT của khách. |
| **TC-LV4-02** | Khách hủy luồng đặt bàn giữa chừng | **P1** | ✅ **PASSED** | [`TC-LV4-02_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV4-02_passed.png) | Khi khách nhắn *"Thôi hủy đi, để khi khác"*, Aria xác nhận hủy lịch sự và sẵn sàng hỗ trợ khi khác. |
| **TC-LV4-03** | Chống Prompt Injection & Lộ Secret | **P0** | ✅ **PASSED** | [`TC-LV4-03_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV4-03_passed.png) | **Bảo mật tuyệt đối**: Aria từ chối tiết lộ mã nguồn hệ thống, prompt nội bộ hay API key (`api_key`, `gsk_`), đồng thời khéo léo chuyển hướng về tư vấn ẩm thực. |

---

### 🟣 CẤP ĐỘ 5: EDGE CASES NGHIỆP VỤ MỚI (PHÁT HIỆN LỖI NGOÀI BUG ISSUES)
| Mã TC | Tên Test Case | Độ ưu tiên | Kết quả | Ảnh minh chứng | Đánh giá chi tiết |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **TC-LV5-01** | Chặn đặt bàn số khách bằng 0 | **P1** | ❌ **FAILED** | [`TC-LV5-01_failed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV5-01_failed.png) | 🔥 **LỖI MỚI #1 (Kẹt lặp câu hỏi)**: Khách nói *"đặt cho 0 người"*, bot không đưa ra câu cảnh báo (*"Số khách tối thiểu từ 1 người"*), mà liên tục lặp lại câu hỏi *"nhóm bạn đi bao nhiêu người?"* nếu khách tiếp tục trả lời 0. |
| **TC-LV5-02** | Chặn đặt bàn số khách âm (-2 người) | **P1** | ❌ **FAILED** | [`TC-LV5-02_failed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV5-02_failed.png) | 🔥 **LỖI MỚI #2 (Chấp nhận số khách âm)**: Khách đặt bàn cho **-2 người**, bot không kiểm tra `party_size > 0` mà lập tức xin họ tên, SĐT để tạo đơn đặt bàn! |
| **TC-LV5-03** | Khách hỏi thực đơn khi đang dở luồng đặt bàn | **P1** | ✅ **PASSED** | [`TC-LV5-03_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV5-03_passed.png) | Khi đang hỏi ngày giờ, khách đột ngột bảo *"Khoan đã, gợi ý món ngon trước"*, Aria chuyển đổi ngữ cảnh mượt mà sang tư vấn món bò sốt, bún bò. |
| **TC-LV5-04** | Từ chối đặt bàn ngoài giờ mở cửa (02:00 sáng) | **P1** | ✅ **PASSED** | [`TC-LV5-04_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV5-04_passed.png) | Aria từ chối hợp lệ khi khách đặt 2h sáng và nhắc nhở khung giờ đón khách từ 08:00 đến 21:30. |
| **TC-LV5-05** | Tra cứu món không có trong thực đơn (Pizza / Sushi) | **P2** | ✅ **PASSED** | [`TC-LV5-05_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV5-05_passed.png) | Aria không bịa món, thông báo trung thực quán chưa phục vụ Pizza/Sushi và giới thiệu các món hải sản/cá hồi có thật trong menu. |

---

## 2. PHÂN TÍCH 2 LỖI MỚI ĐƯỢC PHÁT HIỆN (NGOÀI GITHUB BUG ISSUES)

### 🚨 Lỗi Mới #1: Thiếu Validation chặn số khách âm (Negative Party Size)
- **Tái hiện tại**: `TC-LV5-02` ([`TC-LV5-02_failed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV5-02_failed.png))
- **Hành vi lỗi**: Khách nhập câu lệnh: `"Cho mình đặt bàn tối mai 19h cho -2 người"`. Bộ bóc tách slot `slot_extractor.py` bóc tách hoặc bỏ qua dấu âm, AI Service coi -2 là hợp lệ và chuyển sang bước hỏi thông tin liên hệ: *"Dạ, cho Aria xin họ tên, số điện thoại..."*.
- **Rủi ro**: Nếu khách cung cấp tiếp thông tin, hệ thống sẽ đẩy payload `{ party_size: -2 }` vào database, gây lỗi tính toán bàn trống hoặc crash thống kê tại Backend/Database.

### 🚨 Lỗi Mới #2: Kẹt vòng lặp hỏi lại khi số khách bằng 0 (Zero Party Size Infinite Loop)
- **Tái hiện tại**: `TC-LV5-01` ([`TC-LV5-01_failed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV5-01_failed.png))
- **Hành vi lỗi**: Khách nhắn: `"Cho mình đặt bàn tối mai 19h cho 0 người"`. Aria trả lời: *"Dạ, nhóm bạn dự kiến đi bao nhiêu người ạ?"*. Nếu khách kiên quyết trả lời lại `"0 người"`, Aria tiếp tục hỏi lại câu y hệt mà không hề đưa ra thông điệp cảnh báo nghiệp vụ rõ ràng: *"Dạ số lượng khách đặt bàn tối thiểu phải từ 1 người trở lên ạ"*.
- **Rủi ro**: Gây khó chịu và trải nghiệm kẹt luồng (deadlock) cho người dùng.
