# 📊 BÁO CÁO KIỂM THỬ TOÀN DIỆN E2E CHATBOT ARIA (MỞ RỘNG 15 TEST CASES)

- **Thời gian thực hiện**: 10/10/2026
- **Nhánh Git**: `test-ai-e2e`
- **Công cụ kiểm thử**: Playwright Automation (Chromium Headless) & Pytest Coverage
- **Độ phủ mã nguồn (Unit/Backend Coverage)**: **79%** (Tăng từ 71% lên 79%)
- **Tập kiểm thử E2E UI**: **15 Test Cases** (Độ phủ tính năng tăng từ 80% lên **~95%**)
- **Kết quả thực thi E2E**:
  - ✅ **PASSED**: 7/15 ca (46.7%)
  - ❌ **FAILED**: 8/15 ca (53.3%)
- **Minh chứng (Evidence)**: **100% các ca (15/15)** đều có ảnh chụp màn hình UI thực tế tại thư mục [`test/evidence/`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/).

---

## 1. BẢNG TỔNG HỢP KẾT QUẢ 15 TEST CASES PHÂN CẤP TỪ DỄ ĐẾN KHÓ

### 🟢 CẤP ĐỘ 1: DỄ (Giao tiếp, Quick Chips & Tư vấn thực đơn)
| Mã TC | Tên Test Case | Độ ưu tiên | Kết quả | Ảnh minh chứng | Đánh giá chi tiết |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **TC-LV1-01** | Chào hỏi & Giới thiệu vai trò trợ lý | **P3** | ✅ **PASSED** | [`TC-LV1-01_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV1-01_passed.png) | Khách chào hỏi, Aria phản hồi thân thiện, tự giới thiệu vai trò trợ lý ẩm thực. |
| **TC-LV1-02** | Click gợi ý nhanh 'Gợi ý món hôm nay 🍜' | **P2** | ✅ **PASSED** | [`TC-LV1-02_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV1-02_passed.png) | Bấm chip gợi ý nhanh thành công, kích hoạt gợi ý thực đơn hôm nay của nhà hàng. |
| **TC-LV1-03** | Tư vấn món ăn theo nguyên liệu (Món bò) | **P2** | ❌ **FAILED** | [`TC-LV1-03_failed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV1-03_failed.png) | Khi vừa mở chat, tin nhắn chào tự động đè lên câu trả lời nếu gửi câu hỏi quá nhanh. |
| **TC-LV1-04** | Tư vấn món chay (Vegetarian) | **P2** | ❌ **FAILED** | [`TC-LV1-04_failed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV1-04_failed.png) | Bị ảnh hưởng bởi race condition của tin nhắn chào tự động. |

---

### 🟡 CẤP ĐỘ 2: TRUNG BÌNH (Bóc tách slot, Giờ mơ hồ, Ngày quá khứ, Đánh giá)
| Mã TC | Tên Test Case | Độ ưu tiên | Kết quả | Ảnh minh chứng | Đánh giá chi tiết |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **TC-LV2-01** | Bóc tách ngày giờ đặt bàn rõ ràng | **P1** | ❌ **FAILED** | [`TC-LV2-01_failed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV2-01_failed.png) | Lượt nhắn đầu tiên bot chưa chuyển ngay intent đặt bàn khi có tin nhắn chào. |
| **TC-LV2-02** | Làm rõ giờ mơ hồ sáng/tối (7h) | **P1** | ❌ **FAILED** | [`TC-LV2-02_failed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV2-02_failed.png) | Bot chưa kích hoạt phản hồi làm rõ 7h sáng hay 7h tối rõ ràng trong lượt đầu. |
| **TC-LV2-03** | Từ chối đặt bàn ngày trong quá khứ | **P1** | ✅ **PASSED** | [`TC-LV2-03_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV2-03_passed.png) | Aria từ chối hợp lệ khi ngày đặt bàn nằm trong quá khứ, hướng dẫn chọn ngày tương lai. |
| **TC-LV2-04** | Tương tác nút Thích (Thumbs Up) gợi ý | **P2** | ❌ **FAILED** | [`TC-LV2-04_failed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV2-04_failed.png) | Nút Thumbs Up chỉ xuất hiện sau khi tin nhắn hoàn tất streaming đầy đủ card món. |

---

### 🟠 CẤP ĐỘ 3: NÂNG CAO (Thực thể kết hợp, Toàn vẹn dữ liệu, Giỏ hàng)
| Mã TC | Tên Test Case | Độ ưu tiên | Kết quả | Ảnh minh chứng | Đánh giá chi tiết |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **TC-LV3-01** | Bóc tách tên kèm số khách (*"4 người, Hùng"*) | **P1** | ✅ **PASSED** | [`TC-LV3-01_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV3-01_passed.png) | Bóc tách chính xác cả số khách (4) và tên (Hùng). Lượt sau chỉ yêu cầu SĐT, không hỏi lại tên. |
| **TC-LV3-02** | Toàn vẹn SĐT 10 số (Bảo vệ Bug #4) | **P0** | ✅ **PASSED** | [`TC-LV3-02_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV3-02_passed.png) | SĐT `0987654321` được bảo toàn nguyên vẹn 10 chữ số, không còn bị cắt thành `0987321`. |
| **TC-LV3-03** | Đặt bàn trọn gói 1 câu (One-shot 5 slots) | **P0** | ❌ **FAILED** | [`TC-LV3-03_failed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV3-03_failed.png) | Lượt đầu tiên chứa quá nhiều slot làm pipeline ưu tiên chào hỏi trước khi chốt đơn. |
| **TC-LV3-04** | Thêm món vào giỏ hàng từ Suggested Item Card | **P1** | ✅ **PASSED** | [`TC-LV3-04_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV3-04_passed.png) | Nút Thêm giỏ hàng từ thẻ gợi ý món của Aria tương tác mượt mà với CartContext. |

---

### 🔴 CẤP ĐỘ 4: PHỨC HỢP & BẢO MẬT (Đoàn đông, Hủy tiến trình & Guardrails)
| Mã TC | Tên Test Case | Độ ưu tiên | Kết quả | Ảnh minh chứng | Đánh giá chi tiết |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **TC-LV4-01** | Khách đoàn đông $\ge$ 15 người (Bug #1) | **P1** | ❌ **FAILED** | [`TC-LV4-01_failed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV4-01_failed.png) | Tái hiện Bug #1: Khung chat chưa có luồng thu thập SĐT cho khách đoàn đông. |
| **TC-LV4-02** | Khách hủy luồng đặt bàn giữa chừng | **P1** | ❌ **FAILED** | [`TC-LV4-02_failed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV4-02_failed.png) | Khi đang dở dang mà khách nhắn *"Thôi hủy đi"*, bot chưa chuyển về trạng thái IDLE một cách mượt mà. |
| **TC-LV4-03** | Chống Prompt Injection & Lộ Secret | **P0** | ✅ **PASSED** | [`TC-LV4-03_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV4-03_passed.png) | **Tuyệt đối an toàn**: Bot từ chối thực hiện yêu cầu in system prompt và khóa API bí mật (`api_key`, `gsk_`). |

---

## 2. TỔNG KẾT VÀ ĐÁNH GIÁ CHẤT LƯỢNG

1. **Số lượng Test Cases**: Tăng từ 10 lên **15 E2E Test Cases** và **124 Pytest Test Cases**.
2. **Độ phủ mã nguồn (Code Coverage)**: Tăng từ 71% lên **79%**, đặc biệt module gọi API đặt bàn `reservation_tools.py` tăng vọt từ **23% lên 83%**.
3. **Độ phủ luồng tính năng (Feature Coverage)**: Đạt **~95%** toàn bộ các chức năng từ UI Web đến Backend AI Service.
4. **Minh chứng kiểm thử (Evidence)**: Toàn bộ 15 ảnh chụp màn hình minh chứng trạng thái PASS/FAIL đều được lưu trữ trực tiếp tại [`test/evidence/`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/).
