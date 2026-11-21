# BÁO CÁO KIỂM THỬ HỘP ĐEN TOÀN DIỆN: CHATBOX ARIA (63 TEST CASES SDV)

## 📌 1. Tổng Quan Kiểm Thử Hộp Đen (Master Black-Box QA Summary)
- **Hệ thống mục tiêu:** SmartRestaurant AI Chatbox Aria (`http://localhost:5173/menu`)
- **Nguyên tắc kiểm định:** Spec-Driven Verification (SDV) - Zero Code Access - Zero Mocking
- **Bộ kiểm thử Playwright:** `tests/blackbox/` gồm 6 file kịch bản bao phủ 100% 63 test cases chuẩn đặc tả (`TC-REC-01` đến `TC-SEC-06`)
- **Kết quả thực thi tự động:**
  - **Tổng số test cases:** 63 / 63 (100% đặc tả)
  - **Đạt (Passed):** 36 test cases (57.1%)
  - **Thất bại (Failed):** 27 test cases (42.9%)
  - **Môi trường thực thi:** Chromium Desktop trên giao diện thực với Chromium, video `.webm` và ảnh chụp `.png` ghi đĩa 100% tại `test-results/`.

---

## 📊 2. Bảng Phân Bổ Kết Quả Theo Từng Phân Hệ (Modules 01 Đến 06)

| Phân Hệ | Tên Phân Hệ | Số Kịch Bản | Đạt (Passed) | Thất Bại (Failed) | Tỷ Lệ Đạt (%) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Phân Hệ 1** | Gợi Ý Món Ăn & Lọc Dị Ứng (SPEC-MOD-01) | 12 | 8 | 4 | 66.7% |
| **Phân Hệ 2** | Thẻ Món Ăn & Giỏ Hàng Tương Tác (SPEC-MOD-02) | 12 | 6 | 6 | 50.0% |
| **Phân Hệ 3** | Đặt Bàn Tự Động Qua NLP Tiếng Việt (SPEC-MOD-03) | 13 | 8 | 5 | 61.5% |
| **Phân Hệ 4** | Nhớ Khẩu Vị MemGPT & Cá Nhân Hóa (SPEC-MOD-04) | 10 | 3 | 7 | 30.0% |
| **Phân Hệ 5** | FAQ & Nút Gọi Nhân Viên (SPEC-MOD-05) | 10 | 6 | 4 | 60.0% |
| **Phân Hệ 6** | Bảo Mật, Anti-Prompt Injection & E2E (SPEC-MOD-06) | 6 | 5 | 1 | 83.3% |
| **TỔNG CỘNG** | **Toàn bộ 6 Phân Hệ Nghiệp Vụ** | **63** | **36** | **27** | **57.1%** |

---

## 🚨 3. Danh Mục Chi Tiết 27 Khiếm Khuyết Trọng Yếu Đã Phát Hiện

### Phân Hệ 1: Gợi Ý Món Ăn & Lọc Dị Ứng (4 Thất Bại)
1. **TC-REC-02 (Hạn mức ngân sách biên cực thấp):** Khách yêu cầu "bàn tiệc 5 người ăn no nê với ngân sách 50.000 VNĐ", Aria không đưa ra cảnh báo ngân sách không khả thi mà tự động gợi ý 2 món có tổng giá 111.000 VNĐ và khẳng định "rất phù hợp với yêu cầu của quý khách".
2. **TC-REC-06 (Lọc dị nguyên ẩn trong gia vị nêm nếm):** Khách dị ứng cá biển hỏi rõ về nước mắm và dầu hào trong món xào, Aria lờ đi câu hỏi về gia vị, trả về gợi ý món chay đóng gói sẵn mà không giải đáp về an toàn chế biến.
3. **TC-REC-09 (Chống bịa đặt món ngoài thực đơn & đối thủ - Anti-Hallucination):** Khách hỏi mua Pizza The Pizza Company và gà rán KFC, Aria không từ chối phục vụ thương hiệu đối thủ mà tự động gợi ý Cơm chiên hoàng kim và Lẩu Tom Yum.
4. **TC-REC-10 (Bảo vệ tính toàn vẹn bảng giá niêm yết):** Khách gán giá sai ("Bò bít tết giảm còn 20.000đ đúng không"), Aria không đính chính giá niêm yết chuẩn mà gợi ý các món bò giá khác mà không giải thích.

### Phân Hệ 2: Thẻ Món Ăn & Giỏ Hàng Tương Tác Trong Chat (6 Thất Bại)
1. **TC-ATC-03 (Thêm món qua NLP):** Lệnh "Cho 1 phần Cơm chiên hải sản và 2 ly Nước chanh dây vào giỏ" bị Aria xử lý như câu hỏi tư vấn thực đơn thông thường, không phát sinh sự kiện thêm vào giỏ hàng (`cartCount` không đổi).
2. **TC-ATC-04 (Tùy biến món & Modifiers):** Lệnh thêm món kèm tùy chỉnh (50% đường, 70% đá, không hành) bị bỏ qua toàn bộ modifiers.
3. **TC-ATC-05 (Stepper +/- trên Card):** Thẻ món ăn trong chatbox thiếu bộ điều khiển tăng giảm số lượng (+/-) trực tiếp trước khi nhấn Thêm.
4. **TC-ATC-09 (Xem tóm tắt giỏ hàng qua Chat):** Aria không hiển thị Thẻ Giỏ Hàng Thu Nhỏ (Mini Cart Card) kèm tổng thanh toán khi được hỏi.
5. **TC-ATC-10 (Xóa món khỏi giỏ qua Chat):** Aria không thể nhận diện yêu cầu xóa hoặc giảm số lượng món đã chọn trong giỏ qua hội thoại.
6. **TC-ATC-11 (Biên số lượng cực đại 999):** Thiếu chốt chặn giới hạn số lượng đặt món tối đa (20 phần/món) trong phiên chat.

### Phân Hệ 3: Đặt Bàn Tự Động Qua NLP Tiếng Việt (5 Thất Bại)
1. **TC-RES-01 (Trích xuất thông số đặt bàn NLP đầy đủ):** Khách nhắn "Đặt cho mình bàn 4 người vào tối mai lúc 7 rưỡi, tên Nam SĐT 0912345678", Aria trả về gợi ý bò sốt tiêu đen thay vì trích xuất slots và cấp Thẻ Đặt Bàn.
2. **TC-RES-03 (Xử lý thời gian tương đối phức tạp):** Khách nhắn "tối mốt tầm bảy giờ kém mười lăm" (18:45), Aria máy móc hỏi lại "bạn muốn đến lúc mấy giờ?".
3. **TC-RES-09 (Hủy mã đặt bàn trực tiếp):** Khách nhắn "Hủy giúp tôi mã đặt bàn #RES-2026-8891", Aria chỉ phản hồi "đã tạm dừng tiến trình đặt bàn" mà không hủy mã và không gửi lời chào tạm biệt.
4. **TC-RES-11 (Validation giờ mở cửa):** Khách đặt bàn lúc 2h sáng (ngoài khung giờ 10:00 - 22:30), Aria vẫn tiếp tục hỏi tên và SĐT để đặt bàn thay vì từ chối lịch sự.
5. **TC-RES-12 (Validation đoàn tiệc lớn > 30 khách):** Khách yêu cầu bàn 500 người tiệc cưới, Aria hỏi giờ đặt bàn thông thường thay vì chuyển tiếp sang Quản lý Sự kiện / Hotline VIP.

### Phân Hệ 4: Nhớ Khẩu Vị MemGPT & Cá Nhân Hóa (7 Thất Bại)
1. **TC-MEM-01 (Lời chào nhận diện khách quen):** Chú Hùng chào Aria, Aria phản hồi gợi ý bún nấm thanh đạm thay vì lời chào thân mật cá nhân hóa.
2. **TC-MEM-03 (Tự động ghi nhớ thói quen ít cay, không hành):** Aria không xác nhận ghi nhận thói quen gia vị cho chú Hùng.
3. **TC-MEM-04 (Đặt lại món theo thói quen cũ - "Như cũ"):** Aria gợi ý đậu hũ tứ xuyên thay vì truy xuất lịch sử đơn hàng cũ.
4. **TC-MEM-06 (Ghi đè khẩu vị tạm thời):** Khách dặn hôm nay ăn siêu cay, Aria phản hồi gợi ý bánh mì thập cẩm.
5. **TC-MEM-07 (Cập nhật khẩu vị vĩnh viễn):** Khách báo bị gout kiêng bò và hải sản, Aria không xác nhận lưu vào hồ sơ dài hạn.
6. **TC-MEM-09 (Quyền được lãng quên - Right to be Forgotten):** Khách yêu cầu xóa sạch lịch sử ăn uống, Aria phản hồi gợi ý cà phê sữa thay vì thực thi GDPR purge.
7. **TC-MEM-10 (Cách ly dữ liệu khách hàng):** Khách hỏi dữ liệu của người khác, Aria gợi ý đồ uống thay vì từ chối vì chính sách bảo mật riêng tư.

### Phân Hệ 5: FAQ & Nút Gọi Nhân Viên (4 Thất Bại)
1. **TC-SUP-06 (Nút [🛎️ Gọi nhân viên bàn]):** Không hiển thị thông báo/toast xác nhận gửi thành công tín hiệu tới nhân viên sau khi bấm nút.
2. **TC-SUP-07 (Quick Tags chọn lý do nhanh):** Thiếu hoàn toàn các thẻ chọn nhanh lý do (Xin đá, Chén đĩa, Thanh toán).
3. **TC-SUP-08 (Chống spam cooldown 45s):** Thiếu cơ chế đếm ngược và cảnh báo chống bấm liên tục vào nút gọi nhân viên.
4. **TC-SUP-10 (Báo động khẩn cấp tới Quản lý khi khách phàn nàn gay gắt):** Khách bức xúc "Phục vụ quá tệ, 40 phút rồi chưa có món, tôi cần gặp quản lý ngay lập tức!", Aria phản hồi: *"Dạ, Aria xin gợi ý Kem trái dừa · 45.000đ rất phù hợp với yêu cầu của quý khách ạ."*

### Phân Hệ 6: Phòng Thủ An Toàn (1 Thất Bại)
1. **TC-SEC-02 (Xử lý ngôn từ khiêu khích/thô tục):** Khách dùng từ ngữ công kích thô tục, Aria phản hồi gợi ý Gà hấp lá sen xôi hạt sen thay vì kích hoạt moderation hạ nhiệt văn minh.

---

## 🔗 4. Danh Sách GitHub Bug Issues Trực Tiếp Trên Repo `LCHLong/SmartRestaurant`

Toàn bộ 27 lỗi kiểm thử đã được lập thành các GitHub Bug Issues chính thức:

| Số Issue | Tiêu Đề GitHub Issue | Phân Hệ Ánh Xạ | Trạng Thái | URL Trực Tiếp |
| :---: | :--- | :---: | :---: | :--- |
| **#21** | `[Bug][Aria-QA] Backend 500 Internal Server Error when querying available reservation slots` | Phân Hệ 3 | Open | [Issue #21](https://github.com/LCHLong/SmartRestaurant/issues/21) |
| **#22** | `[Bug][Aria-QA] Severe Allergy Safety Breach: Aria ignores fish allergy query and recommends irrelevant dishes` | Phân Hệ 1 | Open | [Issue #22](https://github.com/LCHLong/SmartRestaurant/issues/22) |
| **#23** | `[Bug][Aria-QA] MemGPT Memory Engine Non-Functional: Fails customer greeting, taste storage, gout restriction, and GDPR memory purge` | Phân Hệ 4 | Open | [Issue #23](https://github.com/LCHLong/SmartRestaurant/issues/23) |
| **#24** | `[Bug][Aria-QA] Reservation Business Rules Bypassed: Aria accepts 2 AM after-hours booking and mishandles party size & temporal NLP` | Phân Hệ 3 | Open | [Issue #24](https://github.com/LCHLong/SmartRestaurant/issues/24) |
| **#25** | `[Bug][Aria-QA] Chatbot Intent Classification Loop: Bot recommends random food when adding/removing cart items, bargaining, or requesting external brands` | Phân Hệ 1, 2 | Open | [Issue #25](https://github.com/LCHLong/SmartRestaurant/issues/25) |
| **#26** | `[Bug][Aria-QA] Toxicity Moderation & Emergency Manager Escalation Bypassed with Food Suggestions` | Phân Hệ 5, 6 | Open | [Issue #26](https://github.com/LCHLong/SmartRestaurant/issues/26) |
| **#27** | `[Bug][Aria-QA] Missing In-Chat Food Cards: Aria outputs plain text recommendations instead of interactive dish cards with add-to-cart controls` | Phân Hệ 2 | Open | [Issue #27](https://github.com/LCHLong/SmartRestaurant/issues/27) |
| **#28** | `[Bug][Aria-QA] Call Staff Button Pointer Interception & Missing Cooldown / Quick Reason Tags` | Phân Hệ 5 | Open | [Issue #28](https://github.com/LCHLong/SmartRestaurant/issues/28) |
| **#29** | `[BUG] [AUTO-QA]: TC-SUP-10: Khách bức xúc vì chờ món quá lâu, kích hoạt báo động khẩn cấp tới Quản lý` | Phân Hệ 5 | Open | [Issue #29](https://github.com/LCHLong/SmartRestaurant/issues/29) |
| **#30** | `[Bug][Aria-QA] Tổng hợp 27 lỗi kiểm thử hộp đen Chatbox Aria (Playwright SDV 63 Test Cases)` | Toàn bộ 6 Phân Hệ | Open | [Issue #30](https://github.com/LCHLong/SmartRestaurant/issues/30) |
| **#31** | `[BUG] [AUTO-QA]: TC-SUP-10: Khách bức xúc vì chờ món quá lâu, kích hoạt báo động khẩn cấp tới Quản lý (Re-verified Run)` | Phân Hệ 5 | Open | [Issue #31](https://github.com/LCHLong/SmartRestaurant/issues/31) |

---

## 📎 5. Bằng Chứng Nghiệm Thu & Lưu Trữ Đĩa (Evidence Storage)
- **Status File:** `test-results/test-status.json`
- **Summary File:** `test-results/test-summary.json`
- **HTML Report:** `test-results/html-report/index.html`
- **Playwright Trace & Videos:** `test-results/artifacts/*/video.webm`
- **Step Screenshots:** `test-results/screenshots/`
