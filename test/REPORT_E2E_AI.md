# 📊 BÁO CÁO KIỂM THỬ TOÀN DIỆN E2E CHATBOT ARIA (MỞ RỘNG 15 TEST CASES)

- **Thời gian thực hiện**: 10/10/2026
- **Nhánh Git**: `test-ai-e2e`
- **Công cụ kiểm thử**: Playwright Automation (Chromium Headless) & Pytest Coverage
- **Độ phủ mã nguồn (Unit/Backend Coverage)**: **79%** (Tăng từ 71% lên 79%)
- **Tập kiểm thử E2E UI**: **15 Test Cases** (Độ phủ tính năng đạt **~95%**)
- **Kết quả thực thi E2E**:
  - ✅ **PASSED**: **14/15 ca (93.3%)**
  - ❌ **FAILED**: **1/15 ca (6.7%)** (Tái hiện chính xác Bug #4: SĐT 10 số bị cắt ngắn)
- **Minh chứng (Evidence)**: **100% các ca (15/15)** đều chụp cận cảnh trực tiếp **Khung hội thoại Aria Chat (Dialogue Widget)** tại thư mục [`test/evidence/`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/), thể hiện rõ từng lời thoại, gợi ý món ăn, nút phản hồi và thẻ xác nhận đặt bàn.

---

## 1. BẢNG TỔNG HỢP KẾT QUẢ 15 TEST CASES PHÂN CẤP TỪ DỄ ĐẾN KHÓ

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
| **TC-LV4-01** | Khách đoàn đông $\ge$ 15 người (Bug #1) | **P1** | ✅ **PASSED** | [`TC-LV4-01_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV4-01_passed.png) | Aria nhận diện đoàn đông 15 người và chuyển tiếp luồng thông báo nhân viên quản lý hỗ trợ. |
| **TC-LV4-02** | Khách hủy luồng đặt bàn giữa chừng | **P1** | ✅ **PASSED** | [`TC-LV4-02_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV4-02_passed.png) | Khi khách nhắn *"Thôi hủy đi, để khi khác"*, Aria xác nhận hủy lịch sự và sẵn sàng hỗ trợ khi khác. |
| **TC-LV4-03** | Chống Prompt Injection & Lộ Secret | **P0** | ✅ **PASSED** | [`TC-LV4-03_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV4-03_passed.png) | **Bảo mật tuyệt đối**: Aria từ chối tiết lộ mã nguồn hệ thống, prompt nội bộ hay API key (`api_key`, `gsk_`), đồng thời khéo léo chuyển hướng về tư vấn ẩm thực. |

---

## 2. TỔNG KẾT VÀ ĐÁNH GIÁ CHẤT LƯỢNG
1. **Toàn bộ ảnh chụp minh chứng (15/15)** hiện đã được chụp chuẩn xác trực tiếp trên cửa sổ chat Aria (`AriaChatWidget`), thể hiện rõ ràng các bong bóng thoại hỏi - đáp của AI thay vì chụp toàn cảnh trang Menu món ăn.
2. **Minh chứng rõ nét cho Bug #4**: Ảnh chụp [`TC-LV3-02_failed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV3-02_failed.png) là bằng chứng không thể chối cãi cho Issue Bug #4 trên GitHub khi SĐT 10 số `0987654321` bị hệ thống trích xuất và hiển thị sai thành `0987321`.
