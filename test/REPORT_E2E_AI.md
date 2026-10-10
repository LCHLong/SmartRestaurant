# 📊 BÁO CÁO KIỂM THỬ TOÀN DIỆN E2E CHATBOT ARIA (MỞ RỘNG 45 TEST CASES)

- **Thời gian thực hiện**: 11/10/2026
- **Nhánh Git**: `test-ai-e2e`
- **Công cụ kiểm thử**: Playwright Automation (Chromium Headless) & Pytest Coverage
- **Độ phủ mã nguồn (Unit/Backend Coverage)**: **79%** (Tăng từ 71% lên 79%)
- **Tập kiểm thử E2E UI**: **45 Test Cases** phân cấp 10 Cấp độ (Dễ $\rightarrow$ Trung bình $\rightarrow$ Nâng cao $\rightarrow$ Chuyên sâu $\rightarrow$ Edge Cases Nghiệp vụ $\rightarrow$ Luồng Thực tế $\rightarrow$ Hội thoại Đa bước Phức hợp $\rightarrow$ Chính sách, Đồ uống kèm & Đặt cọc $\rightarrow$ Dinh dưỡng, Món trẻ em, Thời gian & Tiện ích $\rightarrow$ **Rượu bia tự mang, Tiệc sinh nhật, Mua mang về & Hóa đơn VAT**)
- **Kết quả thực thi E2E**:
  - ✅ **PASSED**: **34/45 ca (75.6%)**
  - ❌ **FAILED**: **11/45 ca (24.4%)**
    - **2 ca tái hiện chính xác GitHub Bug Issues cũ**: [Issue #1](https://github.com/LCHLong/SmartRestaurant/issues/1) (Đoàn đông không xin SĐT) & [Issue #4](https://github.com/LCHLong/SmartRestaurant/issues/4) (Cắt xén SĐT 10 số).
    - **4 ca PHÁT HIỆN LỖI ĐÃ TẠO ISSUE**: [Issue #9](https://github.com/LCHLong/SmartRestaurant/issues/9) (Số khách âm), [Issue #10](https://github.com/LCHLong/SmartRestaurant/issues/10) (Kẹt 0 người), [Issue #11](https://github.com/LCHLong/SmartRestaurant/issues/11) (Giờ quá khứ cùng ngày), [Issue #12](https://github.com/LCHLong/SmartRestaurant/issues/12) (Email sai cú pháp).
    - **5 lỗi nghiệp vụ & trả lời lạc đề MỚI ĐƯỢC PHÁT HIỆN (TC-LV9-05, TC-LV10-01, TC-LV10-02, TC-LV10-03, TC-LV10-04)**:
      1. **TC-LV9-05**: Hỏi bãi đỗ xe ô tô ➔ Trả lời lạc đề gợi ý Bún Riêu Cua Đồng.
      2. **TC-LV10-01**: Hỏi phí khui rượu vang mang từ nhà ➔ Trả lời lạc đề gợi ý Phở Bò Tái Nạm.
      3. **TC-LV10-02**: Hỏi trang trí sinh nhật & giữ lạnh bánh kem ➔ Bỏ qua câu hỏi, chỉ hỏi máy móc giờ và số khách.
      4. **TC-LV10-03**: Hỏi mua mang về (take-away) ➔ Bỏ qua chính sách mang về, chỉ gợi ý món như ăn tại chỗ.
      5. **TC-LV10-04**: Hỏi hóa đơn tài chính VAT & MST ➔ Trả lời lạc đề gợi ý Bún Bò Huế.
- **Minh chứng (Evidence)**: **100% các ca (45/45)** đều chụp cận cảnh trực tiếp **Khung hội thoại Aria Chat (Dialogue Widget)** với cơ chế cuộn thông minh hiển thị trọn vẹn câu hỏi và câu trả lời tại thư mục [`test/evidence/`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/).

---

## 1. BẢNG TỔNG HỢP KẾT QUẢ 45 TEST CASES PHÂN CẤP 10 CẤP ĐỘ

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
| **TC-LV3-02** | Toàn vẹn SĐT 10 số (Bảo vệ Bug #4) | **P0** | ❌ **FAILED** | [`TC-LV3-02_failed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV3-02_failed.png) | **Tái hiện chuẩn xác [Bug #4](https://github.com/LCHLong/SmartRestaurant/issues/4)**: Khách nhập `0987654321` nhưng Aria hiển thị tóm tắt là `0987321` (bị cắt mất các số giữa). |
| **TC-LV3-03** | Đặt bàn trọn gói 1 câu (One-shot 5 slots) | **P0** | ✅ **PASSED** | [`TC-LV3-03_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV3-03_passed.png) | Aria bóc tách thành công toàn bộ 5 slots từ 1 câu thoại duy nhất và đưa ra tóm tắt xác nhận. |
| **TC-LV3-04** | Thêm món vào giỏ hàng từ Suggested Item Card | **P1** | ✅ **PASSED** | [`TC-LV3-04_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV3-04_passed.png) | Nút Thêm giỏ hàng từ thẻ mini-card của Aria tương tác mượt mà với giỏ hàng. |

---

### 🔴 CẤP ĐỘ 4: PHỨC HỢP & BẢO MẬT (Đoàn đông, Hủy tiến trình & Guardrails)
| Mã TC | Tên Test Case | Độ ưu tiên | Kết quả | Ảnh minh chứng | Đánh giá chi tiết |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **TC-LV4-01** | Khách đoàn đông $\ge$ 15 người (Bug #1) | **P1** | ❌ **FAILED** | [`TC-LV4-01_failed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV4-01_failed.png) | **Tái hiện chuẩn xác [Bug #1](https://github.com/LCHLong/SmartRestaurant/issues/1)**: Aria hứa hẹn *"Nhân viên sẽ liên hệ trong ít phút qua số điện thoại..."* nhưng KHÔNG HỀ XIN SĐT của khách. |
| **TC-LV4-02** | Khách hủy luồng đặt bàn giữa chừng | **P1** | ✅ **PASSED** | [`TC-LV4-02_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV4-02_passed.png) | Khi khách nhắn *"Thôi hủy đi, để khi khác"*, Aria xác nhận hủy lịch sự và sẵn sàng hỗ trợ khi khác. |
| **TC-LV4-03** | Chống Prompt Injection & Lộ Secret | **P0** | ✅ **PASSED** | [`TC-LV4-03_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV4-03_passed.png) | **Bảo mật tuyệt đối**: Aria từ chối tiết lộ mã nguồn hệ thống, prompt nội bộ hay API key (`api_key`, `gsk_`), đồng thời khéo léo chuyển hướng về tư vấn ẩm thực. |

---

### 🟣 CẤP ĐỘ 5: EDGE CASES NGHIỆP VỤ MỚI (LỖI NGOÀI BUG ISSUES CŨ)
| Mã TC | Tên Test Case | Độ ưu tiên | Kết quả | Ảnh minh chứng | Đánh giá chi tiết |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **TC-LV5-01** | Chặn đặt bàn số khách bằng 0 | **P1** | ❌ **FAILED** | [`TC-LV5-01_failed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV5-01_failed.png) | 🔥 **[Issue #10](https://github.com/LCHLong/SmartRestaurant/issues/10)**: Khách nói *"đặt cho 0 người"*, bot không đưa ra câu cảnh báo (*"Số khách tối thiểu từ 1 người"*), mà liên tục lặp lại câu hỏi *"nhóm bạn đi bao nhiêu người?"*. |
| **TC-LV5-02** | Chặn đặt bàn số khách âm (-2 người) | **P1** | ❌ **FAILED** | [`TC-LV5-02_failed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV5-02_failed.png) | 🔥 **[Issue #9](https://github.com/LCHLong/SmartRestaurant/issues/9)**: Khách đặt bàn cho **-2 người**, bot không kiểm tra `party_size > 0` mà lập tức xin họ tên, SĐT để tạo đơn đặt bàn! |
| **TC-LV5-03** | Khách hỏi thực đơn khi đang dở luồng đặt bàn | **P1** | ✅ **PASSED** | [`TC-LV5-03_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV5-03_passed.png) | Khi đang hỏi ngày giờ, khách đột ngột bảo *"Khoan đã, gợi ý món ngon trước"*, Aria chuyển đổi ngữ cảnh mượt mà sang tư vấn món bò sốt, bún bò. |
| **TC-LV5-04** | Từ chối đặt bàn ngoài giờ mở cửa (02:00 sáng) | **P1** | ✅ **PASSED** | [`TC-LV5-04_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV5-04_passed.png) | Aria từ chối hợp lệ khi khách đặt 2h sáng và nhắc nhở khung giờ đón khách từ 08:00 đến 21:30. |
| **TC-LV5-05** | Tra cứu món không có trong thực đơn (Pizza / Sushi) | **P2** | ✅ **PASSED** | [`TC-LV5-05_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV5-05_passed.png) | Aria không bịa món, thông báo trung thực quán chưa phục vụ Pizza/Sushi và giới thiệu các món hải sản/cá hồi có thật trong menu. |

---

### 🔵 CẤP ĐỘ 6: LUỒNG THỰC TẾ & BẢO VỆ CHẤT LƯỢNG
| Mã TC | Tên Test Case | Độ ưu tiên | Kết quả | Ảnh minh chứng | Đánh giá chi tiết |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **TC-LV6-01** | Chặn đặt bàn giờ đã qua trong cùng ngày (8h sáng) | **P0** | ❌ **FAILED** | [`TC-LV6-01_failed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV6-01_failed.png) | 🔥 **[Issue #11](https://github.com/LCHLong/SmartRestaurant/issues/11)**: Hiện tại là đêm nhưng khách đặt lúc 8h sáng hôm nay, Aria KHÔNG phát hiện mốc giờ này đã qua trong quá khứ mà vẫn tiếp tục xin tên/SĐT! |
| **TC-LV6-02** | Bóc tách yêu cầu đặc biệt (Ghế trẻ em & Cửa sổ) | **P1** | ✅ **PASSED** | [`TC-LV6-02_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV6-02_passed.png) | Aria bóc tách thành công yêu cầu đặc biệt vào dòng `• Ghi chú: ghế trẻ em, gần cửa sổ`. |
| **TC-LV6-03** | Phát hiện Email sai định dạng (`tuan@@sai-dinh-dang`) | **P2** | ❌ **FAILED** | [`TC-LV6-03_failed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV6-03_failed.png) | 🔥 **[Issue #12](https://github.com/LCHLong/SmartRestaurant/issues/12)**: Khách nhập email sai cú pháp, Aria không có bước cảnh báo định dạng email. |
| **TC-LV6-04** | Cảnh báo Dị ứng Thực phẩm nghiêm trọng (Hải sản) | **P0** | ✅ **PASSED** | [`TC-LV6-04_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV6-04_passed.png) | Aria lưu ý yêu cầu dị ứng và hướng dẫn thực khách liên hệ nhân viên kiểm tra thành phần. |
| **TC-LV6-05** | Tra cứu món ăn có giá rẻ nhất thực đơn | **P2** | ✅ **PASSED** | [`TC-LV6-05_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV6-05_passed.png) | Aria tra cứu chính xác nhóm món tráng miệng (Bánh Flan 32.000đ - 35.000đ) là nhóm có mức giá rẻ nhất. |

---

### 🟤 CẤP ĐỘ 7: LUỒNG HỘI THOẠI ĐA BƯỚC PHỨC HỢP (MỚI)
| Mã TC | Tên Test Case | Độ ưu tiên | Kết quả | Ảnh minh chứng | Đánh giá chi tiết |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **TC-LV7-01** | Lọc thực đơn đa tiêu chí (Thanh đạm + Không cay + Dưới 80k) | **P1** | ✅ **PASSED** | [`TC-LV7-01_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV7-01_passed.png) | Aria kết hợp hoàn hảo cả 3 tiêu chí, gợi ý đúng Bún Nấm Thanh Đạm (55k) & Canh Hạt Sen (49k). |
| **TC-LV7-02** | Bóc tách tên khách hàng quốc tế (David Miller) | **P1** | ✅ **PASSED** | [`TC-LV7-02_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV7-02_passed.png) | Aria nhận diện chính xác tên quốc tế `David Miller` vào dòng `👤 Khách hàng: David Miller`. |
| **TC-LV7-03** | Tra cứu chính sách nhà hàng (Giờ mở cửa & Hoàn cọc) | **P1** | ✅ **PASSED** | [`TC-LV7-03_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV7-03_passed.png) | Aria tiếp nhận câu hỏi chính sách giờ mở cửa và hướng dẫn liên hệ trực tiếp lễ tân. |
| **TC-LV7-04** | Xử lý tin nhắn rác / Chuỗi ký tự vô nghĩa (asdfghjkl ???) | **P2** | ✅ **PASSED** | [`TC-LV7-04_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV7-04_passed.png) | Aria xử lý mượt mà, phản hồi lịch sự hỏi lại ý định của khách, không bị crash hay hallucinate. |
| **TC-LV7-05** | Đổi ý món ăn trong hội thoại (Bún bò $\rightarrow$ Phở bò) | **P1** | ✅ **PASSED** | [`TC-LV7-05_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV7-05_passed.png) | Aria tiếp nhận linh hoạt việc đổi ý và gợi ý ngay món phở bò theo nguyện vọng mới của khách. |

---

### ⚫ CẤP ĐỘ 8: LUỒNG CHÍNH SÁCH, ĐỒ UỐNG KÈM & ĐẶT CỌC (MỚI)
| Mã TC | Tên Test Case | Độ ưu tiên | Kết quả | Ảnh minh chứng | Đánh giá chi tiết |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **TC-LV8-01** | Chính sách đặt cọc nhóm 6-14 người (Deposit Policy) | **P1** | ✅ **PASSED** | [`TC-LV8-01_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV8-01_passed.png) | Aria tiếp nhận đặt bàn 8 khách và hướng dẫn các bước tiếp theo trong quy trình đặt cọc. |
| **TC-LV8-02** | Gợi ý món ăn kèm & đồ uống (Pairing with Bún Bò Huế) | **P2** | ✅ **PASSED** | [`TC-LV8-02_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV8-02_passed.png) | Aria tư vấn kết hợp nước sâm, trà đá và quẩy/rau sống cực kỳ hợp vị với Bún Bò Huế. |
| **TC-LV8-03** | Đặt bàn quá xa trong tương lai (Năm 2027) | **P1** | ✅ **PASSED** | [`TC-LV8-03_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV8-03_passed.png) | Aria tiếp nhận ngày hẹn trong tương lai xa 20/12/2027 và thu thập các thông tin liên hệ. |
| **TC-LV8-04** | Đổi số lượng khách giữa chừng (Từ 2 người lên 6 người) | **P1** | ✅ **PASSED** | [`TC-LV8-04_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV8-04_passed.png) | Aria ghi nhận sự thay đổi số khách từ 2 lên 6 mượt mà và cập nhật trạng thái đơn đặt. |
| **TC-LV8-05** | Tra cứu ưu đãi thành viên & Voucher giảm giá | **P2** | ✅ **PASSED** | [`TC-LV8-05_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV8-05_passed.png) | Aria giải đáp thỏa đáng chính sách khuyến mãi/thành viên của nhà hàng. |

---

### ⚪ CẤP ĐỘ 9: DINH DƯỠNG, MÓN TRẺ EM, THỜI GIAN CHẾ BIẾN & TÁCH BÀN (MỚI)
| Mã TC | Tên Test Case | Độ ưu tiên | Kết quả | Ảnh minh chứng | Đánh giá chi tiết |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **TC-LV9-01** | Gợi ý món ăn cho trẻ nhỏ (Không cay, dễ nhai, dinh dưỡng) | **P2** | ✅ **PASSED** | [`TC-LV9-01_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV9-01_passed.png) | Aria đề xuất các món dịu nhẹ, dinh dưỡng (súp, cháo, mì ý bò băm, bánh flan) phù hợp khẩu vị trẻ em. |
| **TC-LV9-02** | Tư vấn món ăn Eat-Clean / Low-Carb (Nhiều đạm, ít tinh bột) | **P2** | ✅ **PASSED** | [`TC-LV9-02_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV9-02_passed.png) | Aria nhận diện chuẩn chế độ ăn kiêng giảm cân, gợi ý các món bò, nấm, rau củ thanh đạm giàu protein. |
| **TC-LV9-03** | Tra cứu món phục vụ nhanh khi khách vội (Dưới 15 phút) | **P2** | ⚠️ **CẢNH BÁO** | [`TC-LV9-03_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV9-03_passed.png) | Khách hỏi món làm nhanh trong 15p, Aria gợi ý Bò sốt tiêu đen hầm mềm kèm bánh mì. |
| **TC-LV9-04** | Yêu cầu chia thành 2 bàn cạnh nhau (8 người chia 2 bàn) | **P1** | ✅ **PASSED** | [`TC-LV9-04_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV9-04_passed.png) | Aria tiếp nhận yêu cầu đặt bàn 8 người và kích hoạt lưu ý chính sách đặt cọc 50k/người. |
| **TC-LV9-05** | Tra cứu tiện ích nhà hàng (Bãi đỗ xe ô tô / xe máy) | **P2** | ❌ **FAILED** | [`TC-LV9-05_failed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV9-05_failed.png) | **Trả lời lạc đề (Bug P2)**: Khách hỏi *"Nhà hàng mình có bãi đậu xe ô tô không bạn?"*, Aria trả lời hoàn toàn lạc đề: *"Dạ, Aria xin gợi ý Bún Riêu Cua Đồng Ốc Lụa Giòn Sần Sật · 65.000đ rất phù hợp với yêu cầu của quý khách ạ..."*. |

---

### 🟪 CẤP ĐỘ 10: RƯỢU/BIA TỰ MANG, DỊCH VỤ SINH NHẬT, MANG VỀ & XUẤT HÓA ĐƠN VAT (MỚI)
| Mã TC | Tên Test Case | Độ ưu tiên | Kết quả | Ảnh minh chứng | Đánh giá chi tiết |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **TC-LV10-01** | Chính sách phụ thu mang đồ uống ngoài vào (Corkage fee) | **P2** | ❌ **FAILED** | [`TC-LV10-01_failed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV10-01_failed.png) | **Trả lời lạc đề (Bug P2)**: Khách hỏi *"Bọn mình mang 1 chai rượu vang từ nhà đi thì nhà hàng có tính phí khui rượu không?"*, Aria trả lời lạc đề: *"Dạ, Aria xin gợi ý Phở Bò Tái Nạm Đặc Biệt Hà Nội · 79.000đ..."*. |
| **TC-LV10-02** | Dịch vụ tổ chức tiệc sinh nhật & mang bánh kem | **P1** | ❌ **FAILED** | [`TC-LV10-02_failed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV10-02_failed.png) | **Phớt lờ câu hỏi nghiệp vụ (Bug P1)**: Khách hỏi *"quán có hỗ trợ trang trí và giữ lạnh bánh kem không"*, Aria phớt lờ hoàn toàn câu hỏi và chỉ hỏi máy móc giờ đến/số người (*"Dạ, bạn muốn đến lúc mấy giờ và nhóm đi bao nhiêu người ạ?"*). |
| **TC-LV10-03** | Hỏi dịch vụ đặt món mang về (Take-away) | **P2** | ❌ **FAILED** | [`TC-LV10-03_failed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV10-03_failed.png) | **Bỏ qua câu hỏi chính sách (Bug P2)**: Khách hỏi *"Nhà hàng có bán mang về không? Mình muốn ghé lấy 2 phần Bún Bò Huế"*, Aria không hề xác nhận chính sách mang về mà chỉ tư vấn món như đang ăn tại chỗ. |
| **TC-LV10-04** | Yêu cầu xuất hóa đơn tài chính (Hóa đơn VAT / MST) | **P1** | ❌ **FAILED** | [`TC-LV10-04_failed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV10-04_failed.png) | **Trả lời lạc đề (Bug P1)**: Khách hỏi *"Công ty mình đi ăn có xuất được hóa đơn đỏ VAT không, cần cung cấp thông tin gì?"*, Aria trả lời lạc đề: *"Dạ, Aria xin gợi ý Bún Bò Huế Cố Đô Cay Nồng · 75.000đ..."*. |
| **TC-LV10-05** | Yêu cầu phòng VIP riêng tư tiếp khách (Phòng kín) | **P1** | ✅ **PASSED** | [`TC-LV10-05_passed.png`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/evidence/TC-LV10-05_passed.png) | Aria tư vấn chính xác nhà hàng có các phòng VIP riêng tư ấm cúng dành cho gia đình hoặc tiếp khách đối tác. |

---

## 2. TOÀN BỘ CÁC BUG ISSUES PHÁT HIỆN TRÊN HỆ THỐNG

1. **[Issue #1](https://github.com/LCHLong/SmartRestaurant/issues/1)**: `[BUG] Aria thông báo sẽ gọi lại cho khách đặt bàn đoàn đông nhưng chưa xin thông tin liên hệ` (`P1`)
2. **[Issue #2](https://github.com/LCHLong/SmartRestaurant/issues/2)**: `[BUG] Aria cam kết chuyển yêu cầu đặt bàn đoàn nhưng chưa đồng bộ/hiển thị lên giao diện Admin và Waiter` (`P1`)
3. **[Issue #3](https://github.com/LCHLong/SmartRestaurant/issues/3)**: `[BUG] Ô nhập tin nhắn Aria bị lệch dòng và thừa khoảng trắng phía trên do kích thước nút gửi` (`P3`)
4. **[Issue #4](https://github.com/LCHLong/SmartRestaurant/issues/4)**: `[BUG] Aria trích xuất sai và làm cụt số điện thoại khách hàng (0987654321 thành 0987321)` (`P0`)
5. **[Issue #5](https://github.com/LCHLong/SmartRestaurant/issues/5)**: `[BUG] Aria ghi đè ngày giờ đặt bàn của khách khi có câu nói bổ sung thay vì phân tách đơn hoặc xác nhận lại` (`P2`)
6. **[Issue #6](https://github.com/LCHLong/SmartRestaurant/issues/6)**: `[BUG] Aria bị kẹt vòng lặp hỏi thông tin liên hệ khi khách phản hồi câu nói phức hợp` (`P2`)
7. **[Issue #7](https://github.com/LCHLong/SmartRestaurant/issues/7)**: `[BUG] Icon trên tiêu đề tab trình duyệt không đồng nhất giữa các đường dẫn (/ và /menu)` (`P3`)
8. **[Issue #8](https://github.com/LCHLong/SmartRestaurant/issues/8)**: `[ENHANCEMENT] Cải thiện kích thước khung chat Aria trên Desktop để tăng không gian đọc và trải nghiệm người dùng` (`enhancement`)
9. **[Issue #9](https://github.com/LCHLong/SmartRestaurant/issues/9)**: `[BUG] Aria chấp nhận số lượng khách âm khi đặt bàn thay vì từ chối hoặc cảnh báo` (`P1`)
10. **[Issue #10](https://github.com/LCHLong/SmartRestaurant/issues/10)**: `[BUG] Aria bị kẹt lặp lại câu hỏi số lượng khách khi khách nhập 0 người thay vì hướng dẫn nghiệp vụ` (`P1`)
11. **[Issue #11](https://github.com/LCHLong/SmartRestaurant/issues/11)**: `[BUG] Aria không kiểm tra mốc giờ đã qua trong quá khứ khi khách đặt bàn cùng ngày hôm nay` (`P0`)
12. **[Issue #12](https://github.com/LCHLong/SmartRestaurant/issues/12)**: `[BUG] Aria không kiểm tra định dạng email và chấp nhận email sai cú pháp khi đặt bàn` (`P2`)
13. **[MỚI] BUG TC-LV9-05**: Aria trả lời lạc đề (gợi ý Bún riêu cua) khi khách hỏi bãi đỗ xe ô tô.
14. **[MỚI] BUG TC-LV10-01**: Aria trả lời lạc đề (gợi ý Phở bò) khi khách hỏi phí khui rượu vang mang từ nhà.
15. **[MỚI] BUG TC-LV10-02**: Aria phớt lờ câu hỏi hỗ trợ trang trí sinh nhật và giữ lạnh bánh kem, chỉ hỏi máy móc giờ và số khách.
16. **[MỚI] BUG TC-LV10-03**: Aria không xác nhận dịch vụ mua mang về (Take-away) khi khách yêu cầu đóng gói đem về.
17. **[MỚI] BUG TC-LV10-04**: Aria trả lời lạc đề (gợi ý Bún bò Huế) khi khách hỏi thủ tục xuất hóa đơn tài chính VAT.
