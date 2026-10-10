# 📊 BÁO CÁO KIỂM THỬ TOÀN DIỆN E2E CHATBOT ARIA (MỞ RỘNG 25 TEST CASES)

- **Thời gian thực hiện**: 11/10/2026
- **Nhánh Git**: `test-ai-e2e`
- **Công cụ kiểm thử**: Playwright Automation (Chromium Headless) & Pytest Coverage
- **Độ phủ mã nguồn (Unit/Backend Coverage)**: **79%** (Tăng từ 71% lên 79%)
- **Tập kiểm thử E2E UI**: **25 Test Cases** phân cấp 6 Cấp độ (Dễ $\rightarrow$ Trung bình $\rightarrow$ Nâng cao $\rightarrow$ Chuyên sâu $\rightarrow$ Edge Cases Nghiệp vụ $\rightarrow$ **Luồng Thực tế & Bảo vệ Chất lượng**)
- **Kết quả thực thi E2E**:
  - ✅ **PASSED**: **19/25 ca (76.0%)**
  - ❌ **FAILED**: **6/25 ca (24.0%)**
    - **2 ca tái hiện chính xác GitHub Bug Issues**: Bug #1 (Đoàn đông không xin SĐT) & Bug #4 (Cắt xén SĐT 10 số).
    - **4 ca PHÁT HIỆN LỖI MỚI TOÀN DIỆN (Ngoài GitHub Issues)**:
      1. Chặn số khách bằng 0 (Kẹt vòng lặp câu hỏi - Issue #10)
      2. Chấp nhận số khách âm -2 người (Thiếu validation - Issue #9)
      3. Chấp nhận đặt bàn giờ đã qua trong cùng ngày hôm nay (8h sáng)
      4. Bỏ qua và không cảnh báo định dạng email sai (`tuan@@sai-dinh-dang`)
- **Minh chứng (Evidence)**: **100% các ca (25/25)** đều chụp cận cảnh trực tiếp **Khung hội thoại Aria Chat (Dialogue Widget)** tại thư mục [`test/evidence/`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/).

---

## 1. BẢNG TỔNG HỢP KẾT QUẢ 25 TEST CASES PHÂN CẤP 6 CẤP ĐỘ

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
| **TC-LV5-01** | Chặn đặt bàn số khách bằng 0 (Issue #10) | **P1** | ❌ **FAILED** | [`TC-LV5-01_failed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV5-01_failed.png) | 🔥 **LỖI MỚI #1 (Issue #10)**: Khách nói *"đặt cho 0 người"*, bot không đưa ra câu cảnh báo (*"Số khách tối thiểu từ 1 người"*), mà liên tục lặp lại câu hỏi *"nhóm bạn đi bao nhiêu người?"*. |
| **TC-LV5-02** | Chặn đặt bàn số khách âm (-2 người) (Issue #9) | **P1** | ❌ **FAILED** | [`TC-LV5-02_failed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV5-02_failed.png) | 🔥 **LỖI MỚI #2 (Issue #9)**: Khách đặt bàn cho **-2 người**, bot không kiểm tra `party_size > 0` mà lập tức xin họ tên, SĐT để tạo đơn đặt bàn! |
| **TC-LV5-03** | Khách hỏi thực đơn khi đang dở luồng đặt bàn | **P1** | ✅ **PASSED** | [`TC-LV5-03_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV5-03_passed.png) | Khi đang hỏi ngày giờ, khách đột ngột bảo *"Khoan đã, gợi ý món ngon trước"*, Aria chuyển đổi ngữ cảnh mượt mà sang tư vấn món bò sốt, bún bò. |
| **TC-LV5-04** | Từ chối đặt bàn ngoài giờ mở cửa (02:00 sáng) | **P1** | ✅ **PASSED** | [`TC-LV5-04_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV5-04_passed.png) | Aria từ chối hợp lệ khi khách đặt 2h sáng và nhắc nhở khung giờ đón khách từ 08:00 đến 21:30. |
| **TC-LV5-05** | Tra cứu món không có trong thực đơn (Pizza / Sushi) | **P2** | ✅ **PASSED** | [`TC-LV5-05_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV5-05_passed.png) | Aria không bịa món, thông báo trung thực quán chưa phục vụ Pizza/Sushi và giới thiệu các món hải sản/cá hồi có thật trong menu. |

---

### 🔵 CẤP ĐỘ 6: LUỒNG THỰC TẾ & BẢO VỆ CHẤT LƯỢNG (PHÁT HIỆN THÊM LỖI MỚI)
| Mã TC | Tên Test Case | Độ ưu tiên | Kết quả | Ảnh minh chứng | Đánh giá chi tiết |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **TC-LV6-01** | Chặn đặt bàn giờ đã qua trong cùng ngày (8h sáng) | **P0** | ❌ **FAILED** | [`TC-LV6-01_failed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV6-01_failed.png) | 🔥 **LỖI MỚI #3 (Past Time Same Day)**: Hiện tại là đêm nhưng khách đặt lúc 8h sáng hôm nay, Aria KHÔNG phát hiện mốc giờ này đã qua trong quá khứ mà vẫn tiếp tục xin tên/SĐT! |
| **TC-LV6-02** | Bóc tách yêu cầu đặc biệt (Ghế trẻ em & Cửa sổ) | **P1** | ✅ **PASSED** | [`TC-LV6-02_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV6-02_passed.png) | Aria bóc tách thành công yêu cầu đặc biệt vào dòng `• Ghi chú: ghế trẻ em, gần cửa sổ`. |
| **TC-LV6-03** | Phát hiện Email sai định dạng (`tuan@@sai-dinh-dang`) | **P2** | ❌ **FAILED** | [`TC-LV6-03_failed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV6-03_failed.png) | 🔥 **LỖI MỚI #4 (Email Validation)**: Khách nhập email sai cấu trúc, Aria không có bước nhắc nhở hoặc kiểm tra định dạng email hợp lệ. |
| **TC-LV6-04** | Cảnh báo Dị ứng Thực phẩm nghiêm trọng (Hải sản) | **P0** | ✅ **PASSED** | [`TC-LV6-04_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV6-04_passed.png) | Aria lưu ý yêu cầu dị ứng và hướng dẫn thực khách liên hệ nhân viên kiểm tra thành phần. |
| **TC-LV6-05** | Tra cứu món ăn có giá rẻ nhất thực đơn | **P2** | ✅ **PASSED** | [`TC-LV6-05_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV6-05_passed.png) | Aria tra cứu chính xác nhóm món tráng miệng (Bánh Flan 32.000đ - 35.000đ) là nhóm có mức giá rẻ nhất. |

---

## 2. TỔNG HỢP CÁC BUG ISSUES ĐÃ TẠO TRÊN GITHUB

1. **[Issue #1](https://github.com/LCHLong/SmartRestaurant/issues/1)**: `[BUG] Aria thông báo sẽ gọi lại cho khách đặt bàn đoàn đông nhưng chưa xin thông tin liên hệ`
2. **[Issue #2](https://github.com/LCHLong/SmartRestaurant/issues/2)**: `[BUG] Aria cam kết chuyển yêu cầu đặt bàn đoàn nhưng chưa đồng bộ/hiển thị lên giao diện Admin và Waiter`
3. **[Issue #3](https://github.com/LCHLong/SmartRestaurant/issues/3)**: `[BUG] Ô nhập tin nhắn Aria bị lệch dòng và thừa khoảng trắng phía trên do kích thước nút gửi`
4. **[Issue #4](https://github.com/LCHLong/SmartRestaurant/issues/4)**: `[BUG] Aria trích xuất sai và làm cụt số điện thoại khách hàng (0987654321 thành 0987321)`
5. **[Issue #5](https://github.com/LCHLong/SmartRestaurant/issues/5)**: `[BUG] Aria ghi đè ngày giờ đặt bàn của khách khi có câu nói bổ sung thay vì phân tách đơn hoặc xác nhận lại`
6. **[Issue #6](https://github.com/LCHLong/SmartRestaurant/issues/6)**: `[BUG] Aria bị kẹt vòng lặp hỏi thông tin liên hệ khi khách phản hồi câu nói phức hợp`
7. **[Issue #7](https://github.com/LCHLong/SmartRestaurant/issues/7)**: `[BUG] Icon trên tiêu đề tab trình duyệt không đồng nhất giữa các đường dẫn (/ và /menu)`
8. **[Issue #8](https://github.com/LCHLong/SmartRestaurant/issues/8)**: `[ENHANCEMENT] Cải thiện kích thước khung chat Aria trên Desktop để tăng không gian đọc và trải nghiệm người dùng`
9. **[Issue #9](https://github.com/LCHLong/SmartRestaurant/issues/9)**: `[BUG] Aria chấp nhận số lượng khách âm khi đặt bàn thay vì từ chối hoặc cảnh báo`
10. **[Issue #10](https://github.com/LCHLong/SmartRestaurant/issues/10)**: `[BUG] Aria bị kẹt lặp lại câu hỏi số lượng khách khi khách nhập 0 người thay vì hướng dẫn nghiệp vụ`
11. **[Issue #11](https://github.com/LCHLong/SmartRestaurant/issues/11)**: `[BUG] Aria không kiểm tra mốc giờ đã qua trong quá khứ khi khách đặt bàn cùng ngày hôm nay`
12. **[Issue #12](https://github.com/LCHLong/SmartRestaurant/issues/12)**: `[BUG] Aria không kiểm tra định dạng email và chấp nhận email sai cú pháp khi đặt bàn`
