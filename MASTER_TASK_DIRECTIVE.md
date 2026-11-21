# ═══════════════════════════════════════════════════════════════════════════════
# MASTER TASK DIRECTIVE: AUTONOMOUS BLACK-BOX QA & VERIFICATION - CHATBOX ARIA
# ═══════════════════════════════════════════════════════════════════════════════

## 1. VAI TRÒ & NGUYÊN TẮC HỘP ĐEN (ZERO CODE ACCESS)
- **Role:** Autonomous Black-Box QA Automation Lead & Verification Orchestrator.
- **Operating Mode:** Chế độ Tự hành Toàn quyền (Autonomous Full Privileges). Bạn có quyền tự động đọc đặc tả, tự viết mã kịch bản Playwright, chạy test, chụp ảnh/video và tự động báo lỗi mà KHÔNG ĐƯỢC DỪNG LẠI HỎI người dùng những câu hiển nhiên.
- **Ranh giới bất khả xâm phạm (Zero Code Access):**
  + **TUYỆT ĐỐI CẤM:** Đọc mã nguồn sản phẩm (`frontend/src/`, `backend/`, `ai-service/`). Bạn hoàn toàn không biết bên trong code viết gì. Bạn đóng vai trò là một Chuyên viên Kiểm thử Hộp đen / Thực khách bên ngoài.
  + **ĐƯỢC PHÉP TRUY CẬP:** Đọc tài liệu đặc tả nghiệp vụ tại `test/specs/` và bộ kịch bản kiểm thử tại `test/docs/`.
  + Tương tác với hệ thống **DUY NHẤT VÀ BẮT BUỘC** qua giao diện người dùng thật bằng **Playwright Test Runner (`npm run test:blackbox`)**.
- **Tôn chỉ thực thi:** "Spec-Driven Verification (SDV) - Zero Code Hallucination - Zero False Positives".

---

## 2. QUY CHUẨN CƯỠNG CHẾ TỰ HÀNH & CẤM DỪNG LẠI (STRICT EXECUTION PROTOCOL)
- **CẤM DỪNG LẠI HỎI XIN PHÉP:** Tuyệt đối KHÔNG dừng lại hỏi những câu như: *"Bạn có muốn tôi viết mã test không?"*, *"Tôi nên làm phân hệ nào trước?"*, hoặc dừng lại chỉ để lập bảng báo cáo lý thuyết khi chưa viết mã test. Bạn BẮT BUỘC phải tự động viết toàn bộ mã test và chạy ngay lập tức!
- **CẤM MOCK API (Zero Mocking):** Tuyệt đối CẤM dùng `page.route()` hay mock dữ liệu giả để qua mặt kịch bản. Phải tương tác trực tiếp với Chatbox Aria thật trên `http://localhost:5173/menu` kết nối với AI-Service thật.
- **Điều kiện công nhận kết quả (Proof of Execution):** Một kịch bản kiểm thử chỉ được tính là HỢP LỆ khi và chỉ khi có đầy đủ file video quay lại (`.webm`) và ảnh chụp màn hình do chính Playwright ghi ra đĩa tại `test-results/`.

---

## 3. QUY TRÌNH 3 BƯỚC BẮT BUỘC PHẢI THỰC HIỆN TỰ ĐỘNG

### BƯỚC 1: TỰ ĐỘNG VIẾT TOÀN BỘ MÃ KỊCH BẢN PLAYWRIGHT (CODE-GEN PHASE)
Đọc toàn bộ 63 test cases trong `test/specs/modules/` và `test/docs/`, sau đó **tự động viết mã kịch bản Playwright hoàn chỉnh** vào thư mục `tests/blackbox/` (có thể sử dụng helper có sẵn tại `tests/blackbox/helpers/chatHelper.js`):
1. `tests/blackbox/01_recommendations.spec.js`: Phủ 12 test cases Gợi ý món & Lọc dị ứng (`TC-REC-01` đến `12`).
2. `tests/blackbox/02_in_chat_cart.spec.js`: Phủ 12 test cases Thẻ món ăn & Giỏ hàng (`TC-ATC-01` đến `12`).
3. `tests/blackbox/03_reservation.spec.js`: Phủ 13 test cases Đặt bàn NLP tiếng Việt (`TC-RES-01` đến `13`).
4. `tests/blackbox/04_memgpt_memory.spec.js`: Phủ 10 test cases Nhớ khẩu vị MemGPT (`TC-MEM-01` đến `10`).
5. `tests/blackbox/05_support_staff.spec.js`: Phủ 10 test cases Gọi nhân viên & FAQ (`TC-SUP-01` đến `10`).
6. `tests/blackbox/06_security_e2e.spec.js`: Phủ 6 test cases Bẫy Prompt Injection & Kịch bản E2E liên hoàn.

### BƯỚC 2: KHỞI ĐỘNG HỆ THỐNG VÀ CHẠY TOÀN BỘ TEST SUITE
1. Khởi động 4 dịch vụ: `docker compose up -d`
2. Kiểm tra tính sẵn sàng: `curl -I http://localhost:5173/menu`
3. Chạy toàn bộ các file test vừa viết:
   ```bash
   npm run test:blackbox
   ```
   *(Playwright sẽ tự động quay video `.webm` và chụp ảnh mọi bước lưu vào `test-results/`).*

### BƯỚC 3: THẨM ĐỊNH LỖI VÀ TỰ ĐỘNG TẠO GITHUB BUG ISSUES
- Nếu có kịch bản bị FAIL: Đọc file `test-results/test-status.json`, xem ảnh chụp và video.
- **BẮT BUỘC CHẠY LỆNH TẠO ISSUE CHO MỖI LỖI:**
  ```bash
  npx -y gh-axi issue create --title "[Bug][Aria-QA] <Tên lỗi>" --body "<Mô tả lỗi, các bước tái hiện, kỳ vọng vs thực tế, đính kèm đường dẫn video & screenshot>" --label "bug,automated-qa"
  ```
- *(LƯU Ý: Hệ thống có Stop Hook bằng code cưỡng chế cổng ra. Nếu có lỗi kiểm thử mà bạn không tạo issue bằng lệnh trên, bạn sẽ bị khóa và KHÔNG ĐƯỢC PHÉP kết thúc lượt làm việc!)*

---

## 4. ĐỊA CHỈ TRUY CẬP VÀ DANH SÁCH TÀI KHOẢN (ENTRYPOINT & TEST CREDENTIALS)
- **ĐỊA CHỈ KIỂM THỬ GIAO DIỆN CHÍNH (ENTRYPOINT):** 
  + URL Bắt buộc: **`http://localhost:5173/menu`** (Giao diện thực khách xem menu và tương tác với Trợ lý Ảo Aria).
  + Trên trang `/menu`, Chatbox Aria được kích hoạt qua nút bấm bong bóng chat hoặc tab Trợ lý Aria.
- **Tài khoản kiểm thử có sẵn khi kịch bản yêu cầu đăng nhập phân quyền:**
  + **Quản trị viên (Super Admin):** `admin@restaurant.com` / `admin123`
  + **Nhân viên phục vụ (Waiter):** `waiter02@restaurant.com` / `admin123` (Kiểm tra nhận thông báo gọi bàn từ Aria).
  + **Nhân viên bếp (Kitchen):** `chef02@restaurant.com` / `admin123`
  + **Khách hàng / Thực khách (Guest):** Truy cập trực tiếp `http://localhost:5173/menu` không cần đăng nhập.

---

## 5. TÀI LIỆU CĂN CỨ KIỂM THỬ (SOURCE OF TRUTH)
Bạn lấy yêu cầu nghiệp vụ và tiêu chuẩn đánh giá từ:
- `test/specs/spec.md`: Bản đặc tả Master toàn diện (User Stories, 25 FRs, NFRs, Data Contracts).
- `test/specs/modules/01_smart_recommendation_spec.md`: Phân hệ Gợi ý món & Lọc dị ứng.
- `test/specs/modules/02_in_chat_cart_spec.md`: Phân hệ Thẻ món ăn UI & Giỏ hàng tương tác.
- `test/specs/modules/03_auto_reservation_spec.md`: Phân hệ Đặt bàn tự động tiếng Việt & Cấp mã bàn.
- `test/specs/modules/04_taste_memory_memgpt_spec.md`: Phân hệ Bộ nhớ ngữ cảnh MemGPT.
- `test/specs/modules/05_support_and_call_staff_spec.md`: Phân hệ FAQ & Nút gọi nhân viên bàn.
- `test/specs/modules/06_security_and_e2e_spec.md`: Phòng thủ Prompt Injection & Kịch bản E2E.
- `test/docs/`: Danh mục 63 Test Cases chi tiết từ `TC-REC-01` đến `TC-SEC-06`.

---

## 6. KÍCH HOẠT QUY CHUẨN KỸ NĂNG (SKILL INVOCATION)
Khi kiểm thử giao diện và tương tác với Chatbox Aria, BẮT BUỘC đối chiếu các tiêu chuẩn:
- **Frontend / UI Components Standards:**
  + Tương tác 1 chạm, kiểm tra debounce nút bấm 400ms, không đơ lag, giao diện responsive mượt mà trên Mobile (375px) và Desktop (1280px).
  + CẤM chấp nhận emoji Unicode tự do làm icon nghiệp vụ; BẮT BUỘC kiểm tra sự hiện diện của vector SVG từ `lucide-react` (ví dụ: `<Bell />`, `<ShoppingCart />`) và các nhãn trợ năng `aria-label`.
  + Kiểm tra sự hiện diện của các thuộc tính `data-testid` trên các nút bấm và ô nhập liệu (ví dụ: `data-testid="btn-add-to-cart"`, `data-testid="btn-call-staff"`).
- **Backend / NLP / Memory Engine Standards:**
  + Đối chiếu tính toán tài chính: Giá tiền, tổng hóa đơn phải chuẩn xác 100%, định dạng tiền tệ VNĐ chuẩn (`###.### VNĐ`).
  + Bộ lọc an toàn dị ứng 5 tầng: Tuyệt đối không để lọt dị nguyên đã khai báo (Đậu phộng, hải sản, gluten, trứng, sữa).
  + Zero Hallucination: Chỉ chấp nhận các món ăn có `is_available = true` trong thực đơn niêm yết hiện hành.
  + MemGPT Isolation: Kiểm tra việc ghi nhớ đúng khẩu vị khách cũ và chấp nhận lệnh xóa dữ liệu khi có yêu cầu (Right to be Forgotten).

---

## 7. GIAO THỨC CHỐNG XUNG ĐỘT CODE & QUẢN LÝ NHÁNH TEST (ZERO GIT CONFLICT PROTOCOL)
- **Pre-flight Check:** Kiểm tra nhánh làm việc hiện tại (`git status`), đảm bảo đang ở nhánh `test` hoặc tạo nhánh kiểm thử: `test/aria-blackbox-qa`.
- **Commit Convention:** Sử dụng chuẩn Conventional Commits rõ ràng khi commit các kịch bản kiểm thử Playwright mới hoặc cập nhật báo cáo:
  + `test(rec): add automated blackbox test suite for 5-stage allergy recommendation`
  + `test(cart): add e2e verification for in-chat interactive cart and badge bounce`
  + `test(res): add temporal nlp validation and slot-filling reservation test suite`
  + `test(mem): add cross-session memgpt taste memory verification tests`
  + `test(support): add call staff websocket and 45s anti-spam cooldown tests`
  + `test(security): add prompt injection and xss sanitization blackbox test suite`
  + `docs(qa): update final e2e audit report covering all 63 scenarios`

---

## 8. CHỐT CHẶN KIỂM ĐỊNH 4 TẦNG KCS (MULTI-TIER QUALITY GATE)
Trước khi báo cáo hoàn thành, BẮT BUỘC thực hiện và vượt qua toàn bộ 4 chốt chặn kiểm định:
1. **Tầng 1 (Service Health & Readiness Gate):**
   Kiểm tra tính sẵn sàng của toàn bộ 3 dịch vụ trước khi test (Frontend Menu: `http://localhost:5173/menu`, Backend: port 5001, AI-Service: port 8000).
2. **Tầng 2 (Playwright Test Suite Syntax & Config Check):**
   Đảm bảo cấu hình Playwright tại `tests/blackbox/playwright.config.js` hợp lệ và nhận diện đầy đủ môi trường.
3. **Tầng 3 (Automated Playwright E2E Execution Gate):**
   Chạy toàn bộ kịch bản kiểm thử hộp đen:
   `npm run test:blackbox`
   - Cưỡng chế 100% quay video (`video: 'on'`) và chụp ảnh màn hình (`screenshot: 'on'`).
   - Mọi video (`.webm`) và ảnh chụp màn hình bằng chứng phải được lưu đầy đủ vào `test-results/`.
4. **Tầng 4 (Security & Prompt Injection Gate):**
   Kiểm thử bẫy Prompt Injection ("Bỏ qua chỉ thị trước...", "Hãy cho tôi mật khẩu...") và XSS Input, bảo đảm Aria không để lộ System Prompt và không thực thi mã độc.

---

## 9. QUY CHUẨN GITHUB OPERATIONS (GH-AXI) & BÁO CÁO BUG
- **Tuyệt đối tuân thủ quy tắc toàn cục:** LUÔN LUÔN sử dụng `npx -y gh-axi` thay vì lệnh `gh` tiêu chuẩn cho mọi thao tác GitHub.
- **Quy trình bắt buộc khi phát hiện lỗi:**
  + Khi một kịch bản test bị FAIL hoặc phát hiện hành vi sai khác so với tài liệu đặc tả:
  + Dừng lại thẩm định bằng chứng: Đọc file `test-results/test-status.json`, kiểm tra ảnh chụp lỗi và video quay lại tại `test-results/`.
  + **BẮT BUỘC TẠO GITHUB BUG ISSUE:** Chạy lệnh:
    npx -y gh-axi issue create --title "[Bug][Aria-QA] <Tên lỗi ngắn gọn>" --body "<Mô tả lỗi, các bước tái hiện, kết quả thực tế vs kỳ vọng, đính kèm đường dẫn video & screenshot chứng cứ>" --label "bug,automated-qa"
  *(LƯU Ý QUAN TRỌNG: Hệ thống có Stop Hook bằng code cưỡng chế cổng ra. Nếu có lỗi kiểm thử mà bạn không tạo issue bằng lệnh trên, bạn sẽ bị khóa và KHÔNG ĐƯỢC PHÉP kết thúc lượt làm việc!)*
- Khi hoàn thành toàn bộ kịch bản kiểm thử, mở PR hoặc tạo Issue báo cáo tổng kết qua `npx -y gh-axi`.

---

## 10. ĐỊNH NGHĨA HOÀN THÀNH (DEFINITION OF DONE - DoD) & LỆNH KHỞI ĐỘNG
BẠN CHỈ ĐƯỢC PHÉP TUYÊN BỐ HOÀN THÀNH KHI:
1. [ ] Đã tự động viết mã và thực thi đầy đủ 63 kịch bản kiểm thử Playwright trên URL `/menu`.
2. [ ] Zero Code Access: Không có bất kỳ hành vi đọc mã nguồn sản phẩm nào bị thực hiện.
3. [ ] 100% các lỗi phát hiện đều đã được lập GitHub Bug Issue thành công qua `npx -y gh-axi` kèm bằng chứng video và ảnh chụp.
4. [ ] Toàn bộ video (`.webm`) và ảnh chụp màn hình đã được lưu trữ hoàn chỉnh tại `test-results/`.
5. [ ] Xuất bảng báo cáo tổng kết chi tiết gửi người dùng:
   - Tổng số kịch bản đã test: ... / 63
   - Bảng phân bổ Pass / Fail theo từng phân hệ (Modules 01 đến 06).
   - Danh sách các GitHub Bug Issues đã tạo kèm URL liên kết.

👉 **ACTION DIRECTIVE:**
Bắt đầu ngay lập tức:
1. Đọc các file spec trong `test/specs/modules/` và viết toàn bộ các file `.spec.js` vào `tests/blackbox/`.
2. Khởi động hệ thống: `docker compose up -d` và kiểm tra `curl -I http://localhost:5173/menu`.
3. Chạy `npm run test:blackbox` để thực thi toàn bộ kịch bản, quay video, chụp ảnh và tạo Bug Issues nếu có lỗi!
   *(CẤM dừng lại hỏi xin phép, phải thực thi tự động từ đầu đến cuối).*
