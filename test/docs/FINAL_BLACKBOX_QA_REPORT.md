# BÁO CÁO TOÀN DIỆN KIỂM THỬ HỘP ĐEN (AUTONOMOUS BLACK-BOX QA AUDIT REPORT)
## Trợ Lý Ảo Chatbox Aria - SmartRestaurant System

- **Ngày thực thi:** 21/11/2026
- **Môi trường thử nghiệm:** Docker Compose Live Stack (Redis :6379, AI Service :8000, Backend :5001, Frontend :5173/menu)
- **Phương pháp tiếp cận:** Zero Code Access Black-Box Testing qua Playwright E2E Test Runner (`npm run test:blackbox`)
- **Tổng số kịch bản kiểm thử:** 63 Test Cases (Phủ 100% SPEC-MOD-01 đến SPEC-MOD-06)
- **Kết quả tổng thể:** 
  - **ĐẠT (PASSED):** 38 / 63 (60.3%)
  - **LỖI (FAILED):** 25 / 63 (39.7%)
- **Trạng thái GitHub Bug Issues:** 6 Issues đã tạo (#60, #61, #62, #63, #64, #65)

---

## 1. TỔNG KẾT THEO PHÂN HỆ ĐẶC TẢ

| Phân Hệ | Mã Phân Hệ | Tổng Số TC | Đạt (Pass) | Lỗi (Fail) | Tỷ Lệ Đạt |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Phân Hệ 1: Gợi Ý Món Ăn Thông Minh & Lọc Dị Ứng** | SPEC-MOD-01 | 12 | 8 | 4 | 66.7% |
| **Phân Hệ 2: Thẻ Món Ăn & Giỏ Hàng Trong Chat** | SPEC-MOD-02 | 12 | 9 | 3 | 75.0% |
| **Phân Hệ 3: Đặt Bàn Tự Động Qua NLP Tiếng Việt** | SPEC-MOD-03 | 13 | 6 | 7 | 46.2% |
| **Phân Hệ 4: Nhớ Khẩu Vị Khách Quen MemGPT** | SPEC-MOD-04 | 10 | 3 | 7 | 30.0% |
| **Phân Hệ 5: Hỗ Trợ Thực Khách & Nút Gọi Nhân Viên** | SPEC-MOD-05 | 10 | 9 | 1 | 90.0% |
| **Phân Hệ 6: Bảo Mật, Prompt Injection & E2E** | SPEC-MOD-06 | 6 | 3 | 3 | 50.0% |
| **TỔNG CỘNG** | | **63** | **38** | **25** | **60.3%** |

---

## 2. DANH SÁCH GITHUB BUG ISSUES ĐÃ MỞ TỰ ĐỘNG

| Issue ID | Tiêu đề Issue | Mức độ nghiêm trọng | Test Cases liên quan |
| :---: | :--- | :---: | :--- |
| **#60** | `[Bug][Aria-QA] Backend 500 Internal Server Error when querying available reservation slots (TC-RES-05)` | **Fatal / Blocker** | `TC-RES-05` |
| **#61** | `[Bug][Aria-QA] Severe Allergy Safety Breach: Aria ignores fish allergy query and recommends irrelevant dishes (TC-REC-06)` | **Critical / Safety** | `TC-REC-06` |
| **#62** | `[Bug][Aria-QA] MemGPT Memory Engine Non-Functional: Fails customer greeting, taste storage, gout restriction, and GDPR memory purge (TC-MEM-01..10)` | **High / Functional** | `TC-MEM-01`, `03`, `06`, `07`, `08`, `09`, `10` |
| **#63** | `[Bug][Aria-QA] Reservation Business Rules Bypassed: Aria accepts 2 AM after-hours booking and mishandles party size & temporal NLP (TC-RES-01..12)` | **High / Business** | `TC-RES-01`, `03`, `06`, `08`, `09`, `11`, `12` |
| **#64** | `[Bug][Aria-QA] Chatbot Intent Classification Loop: Bot recommends random food when adding/removing cart items, bargaining, or requesting external brands (TC-ATC-02..11, TC-REC-02..10)` | **Medium / UX** | `TC-ATC-02`, `10`, `11`, `TC-REC-02`, `03`, `09`, `10` |
| **#65** | `[Bug][Aria-QA] Toxicity Moderation & Emergency Manager Escalation Bypassed with Food Suggestions (TC-SEC-02, TC-SUP-10)` | **Medium / Policy** | `TC-SEC-02`, `TC-SUP-10` |

---

## 3. PHÂN TÍCH NGUYÊN NHÂN GỐC TỪ GÓC NHÌN HỘP ĐEN

1. **Lỗi sụp đổ Backend 500 (`TC-RES-05`):**
   - Khi chatbot gửi yêu cầu kiểm tra chỗ trống tới `GET /api/reservations/available-slots`, backend trả về mã `500 Internal Server Error`. Lỗi này ngăn cản hoàn toàn việc xác nhận đặt bàn tự động và tạo mã bàn `#RES-`.
2. **Lỗi An Toàn Dị Ứng Cá Biển (`TC-REC-06`):**
   - Khi thực khách hỏi về nước mắm/dầu hào trong món xào do dị ứng cá biển nặng, bot không kích hoạt cờ kiểm tra dị nguyên mà lại gợi ý món nước uống (Cà phê đen đá). Đây là lỗi đe dọa trực tiếp an toàn sức khỏe thực khách.
3. **Phân hệ MemGPT không liên kết (`SPEC-MOD-04`):**
   - Không có bằng chứng cho thấy Aria lưu hoặc truy xuất hồ sơ khẩu vị dài hạn từ Redis/MemGPT. Mọi câu hỏi về khẩu vị cũ, lời chào khách quen, hay yêu cầu xóa lịch sử đều bị đối xử như một câu hỏi tư vấn món ăn mới.
4. **Vòng lặp Phân loại Ý định (Intent Classification Fallback Loop):**
   - Các hành vi: Khách mặc cả gán giá sai, thêm/xóa giỏ hàng bằng text, hoặc hỏi đồ ăn thương hiệu đối thủ đều bị bot phân loại nhầm thành ý định "cần gợi ý món ăn", dẫn đến việc bot trả về template đề xuất món ăn bất kể ngữ cảnh.
5. **Thiếu cơ chế ràng buộc khung giờ & quy mô đặt bàn:**
   - Bot nhận yêu cầu đặt bàn 2:00 sáng mà không từ chối; không chặn số lượng khách 500 người hoặc số khách bằng 0.

---

## 4. BẰNG CHỨNG KIỂM THỬ (TEST ARTIFACTS)
- Toàn bộ video quay lại (`.webm`) và ảnh chụp màn hình (`.png`) được lưu tự động tại thư mục `test-results/artifacts/`.
- File tổng hợp trạng thái: `test-results/test-status.json` và `test-results/test-summary.json`.
- Mã nguồn kiểm thử hộp đen: `tests/blackbox/01_recommendations.spec.js` đến `tests/blackbox/06_security_e2e.spec.js`.
