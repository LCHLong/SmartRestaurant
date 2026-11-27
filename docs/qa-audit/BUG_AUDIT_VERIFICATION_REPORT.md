Các# BÁO CÁO KIỂM TOÁN & TÁI THẨM ĐỊNH LỖI, CHỐNG HARDCODE VÀ TỐI ƯU LƯU TRỮ MEDIA (`BUG_AUDIT_VERIFICATION_REPORT.md`)

- **Dự án:** SmartRestaurant (`LCHLong/SmartRestaurant`)
- **Nhánh kiểm toán:** `audit/bug-verification-anti-hardcode-cleanup` (tách từ `test` @ `8b2b820`, merge `main` @ `31c6a11`)
- **Ngày thực hiện:** 2026-11-26
- **Phạm vi:** Toàn bộ 11 GitHub Issues (`#21–#31`, phân bổ thành 8 nhóm lỗi nghiệp vụ cốt lõi `#21–#28` và 3 sub-issue/meta-issue `#29–#31`), 11 commit vá lỗi (`f52f749..31c6a11`), các tồn đọng từ Phase 6 & Kiểm toán Độc lập (`PHASE6_AUDIT_REPORT.md`, `FULL_PROJECT_INDEPENDENT_CODE_AUDIT.md`), kiểm thử phản chứng thực nghiệm (isolated counter-tests), chất lượng test suites, và tối ưu hóa kho media `test-results/`.
- **Phương pháp:** Zero-Trust Code Inspection kết hợp thực thi counter-test cô lập (`probe_ai_countertests.py`, `probe_be_countertests.js`) và xác minh GitHub Issues qua `npx -y gh-axi`.

---

## 1. Tổng quan Nghiệm thu (Executive Summary)

Qua thanh tra mã nguồn thực thi từng dòng và chạy kiểm thử phản chứng thực nghiệm trên `ai-service/`, `backend/`, `frontend/`, và `tests/`, kết quả kiểm toán phân định rõ: bên cạnh một số thành phần nghiệp vụ được xây dựng nghiêm túc (như `FoodCard`, `CallStaffCard`, Socket.io `ai_handoff_alert`, `AllergySafetyLatch`, `guestProfileController`, `datetime_parser.py`, `cart_tools` trích xuất giỏ hàng), **phần lớn các bản vá cho loạt lỗi Aria-QA (`#22–#26`, `#29–#31`) đã lạm dụng câu trả lời hardcode (canned responses), nhánh `if/elif` chặn trước LLM/RAG, mock trạng thái sửa/hủy đặt bàn không chạm DB, pseudo-embedding MD5-sin, và test suite tự kiểm chứng chính mình (tautology tests)**.

### 1.1. Thống kê Tỷ lệ trên 11 GitHub Issues (`#21–#31`, phân bổ thành 8 Nhóm Nghiệp Vụ Cốt Lõi)

| Nhóm Thẩm Định | Số Lượng Issues | Tỷ Lệ (%) | Danh Sách Mã Issue | Ghi Chú Tổng Hợp |
|---|---:|---:|---|---|
| **`[x] RESOLVED (VERIFIED PASS)`** | **2 / 8** | **25.0%** | `#27`, `#28` | Giải quyết bằng logic UI/API/Socket thật; còn caveat UX/rate-limit nhỏ (`CallStaffCard` ẩn tag ban đầu, tag chưa kích hoạt cooldown 45s). |
| **`[!] FAKE-PASS / HARDCODED (REJECTED)`** | **5 / 8** | **62.5%** | `#22`, `#23`, `#24`, `#25` (kèm `#30`, `#31`), `#26` (kèm `#29`) | Chứa hardcode persona `"Chú Hùng"` (`#23`), giả lập sửa/hủy `#RES-` (`#24`), short-circuit trước LLM với text đóng khung & thực đơn tĩnh (`#25`, `#30`, `#31`, `#26`, `#29`), hoặc hardcode nhánh offline + test tautology + hổng lọc gia vị ẩn (`#22`). |
| **`[ ] UNRESOLVED / PENDING`** | **1 / 8** | **12.5%** | `#21` | Đã sửa mask internal URL và logic tính slot DB thật, nhưng `DEFAULT_FALLBACK_TABLES` trả HTTP 200 giả khi DB lỗi, `aria_pipeline.py:1828-1839` che giấu lỗi kiểm tra bàn, và Test 5 trong `reservationSlots.test.js` không giả lập lỗi mạng. |
| **Tổng cộng GH Issues** | **8 / 8 Nhóm** (11 Issues) | **100.0%** | `#21–#31` | Cả 11 issue đã có commit vá lỗi (`f52f749..31c6a11`) nhưng **6/8 nhóm nghiệp vụ (75.0%) chưa đạt chuẩn nghiệm thu thực chất**. |

### 1.2. Thống kê Tổng Hợp Toàn Diện (14 Hạng Mục Kiểm Toán: 8 Nhóm GH Issues #21–#31 + 6 Tồn Đọng Phase 6 / Audit Độc Lập)

| Nhóm Thẩm Định | Số Hạng Mục | Tỷ Lệ (%) | Chi Tiết Hạng Mục |
|---|---:|---:|---|
| **`[x] RESOLVED (VERIFIED PASS)`** | **3 / 14** | **21.4%** | `#27`, `#28`, và Nhóm Phase 6 Backend IDOR/VisitCount/Cache (`verifyInternalOrUserAuth`, `SET NX`, `ProfilePage.jsx`). |
| **`[!] FAKE-PASS / HARDCODED (REJECTED)`** | **7 / 14** | **50.0%** | `#22`, `#23`, `#24`, `#25` (`#30/#31`), `#26` (`#29`), Pseudo-embedding MD5-sin (`embedding_helper.py` / `pipecatClient.js`), và 6 test suite Tautology/Mock-Self. |
| **`[ ] UNRESOLVED / PENDING`** | **4 / 14** | **28.6%** | `#21` (fallback masking), `aria_pipeline.py:339-358` rơi `guest_profile` trong `_handle_reservation_turn` (CRITICAL SAFETY), `POST /api/reservations/cancel-by-code` không auth + `.ilike('%...%')`, và Lệch quyền `/mock-deposit` + `/mock` trên UI khách + Migration 32 Supabase. |

---

## 2. Bảng Phân Tích & Xác Minh Chi Tiết

| Mã Bug / Issue | Tiêu đề Lỗi | Phân hệ | Kết quả Thẩm định | Có Hardcode Không? | Bằng chứng (File, Dòng Code & Test Log) |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **`#21`** (`TC-RES-05`) | Backend 500 Internal Server Error when querying available reservation slots | `backend`, `ai-service`, `frontend` | **`[ ] UNRESOLVED / PENDING`** *(Sửa một phần, còn che giấu lỗi DB & test giả)* | **Có (Fallback tĩnh)** | `reservationController.js:130-259` validate và query DB thật; nhưng `lines 53-70, 176-180, 260-285` dùng `DEFAULT_FALLBACK_TABLES` (15 bàn tĩnh) trả HTTP 200 khi DB lỗi (`CT-BE-01b`: `status=200, tables.length=15`). `reservation_tools.py:89-123` mask URL tốt, song `aria_pipeline.py:1828-1839` che lỗi bằng câu `"Hệ thống đang kết nối kiểm tra giữ chỗ..."`. `reservationSlots.test.js:98-115` (Test 5) không mock lỗi Supabase. |
| **`#22`** (`TC-REC-06`) | Severe Allergy Safety Breach: Aria ignores fish allergy query & hidden seasonings | `ai-service`, `backend` | **`[!] FAKE-PASS / HARDCODED (REJECTED)`** *(Online có prompt 5 tầng, nhưng Offline hardcode + Lọc dị ứng mù gia vị ẩn)* | **Có (Offline hardcode + PolicyEngine tĩnh)** | `aria_pipeline.py:753-764` nạp system prompt 5 tầng khi online; nhưng `_stream_offline_grounded` (`aria_pipeline.py:2008-2025`) hardcode nguyên văn 2 đoạn `"dầu hào... nước mắm... muối tinh... xì dầu"`. `test_aria_pipeline.py:205-231` patch `_get_client -> None` để chỉ test nhánh hardcode. **Lỗi nghiêm trọng:** `metadata_filter.py:78-86, 376-394` (`CT-ALLERGY-01`) không có `"nước mắm"`/`"dầu hào"` trong `ALLERGEN_GROUPS["cá"]=['cá', 'ca']` nên để lọt món `"Cải thìa xào tỏi"` nêm nước mắm + dầu hào. `aria_pipeline.py:661-668` cũng bỏ rơi `guest_profile["allergies"]` khi `menu_context` rỗng. |
| **`#23`** (`TC-MEM-01..10`) | MemGPT Memory Engine Non-Functional: greeting, taste storage, gout, GDPR purge | `ai-service`, `backend` | **`[!] FAKE-PASS / HARDCODED (REJECTED)`** | **Có (Hardcode toàn phần Persona `"Chú Hùng"`)** | `memory_engine.py:25-120` bắt đúng từ khóa đề thi (`"chú hùng đây"`, `"bị gout"`, `"tiếp khách"`, `"combo ăn trưa như tuần trước"`, `"ngán bò"`). `get_memory_response` (`123-259`) nhận `guest_profile` và `order_history` nhưng **không đọc bao giờ**: luôn trả `"Dạ chú Hùng..."`, `"4 lần"`, `"Mì xào bò giòn"`, `"kiêng hoàn toàn thịt bò và hải sản"` mà không ghi/đọc DB (`CT-MEM-01a/b`). `aria_pipeline.py:365-371` nuốt ngoại lệ `purge_remote_profile` (`except Exception: pass`) và bỏ qua khi `user_id=None` nhưng vẫn báo xóa thành công. |
| **`#24`** (`TC-RES-01..12`) | Reservation Business Rules Bypassed (2 AM, 500 guests, relative NLP, edit/cancel `#RES-`) | `ai-service`, `backend` | **`[!] FAKE-PASS / HARDCODED (REJECTED)`** *(NLP & Rule 2AM/500 khách là thật; Sửa & Hủy `#RES-` là giả lập)* | **Có (Mock Edit/Cancel & Hardcode fallback slot/giờ text)** | `datetime_parser.py:19-274` & `slot_extractor.py:82-203` xử lý NLP tương đối (`"tối mốt tầm bảy giờ kém mười lăm"` -> `18:45`), `02:00`, `500` khách, `0` khách là thật (chỉ lệch text `"10:00 đến 22:30"` tại `datetime_parser.py:405-419` so với default `08:00-22:00`). **Tuy nhiên**, `aria_pipeline.py:901-934` giả lập sửa `#RES-` không tra DB, không check bàn trống, tự điền cứng `"20:00"` / `6` người (`CT-RES-01b/c`); `aria_pipeline.py:876-899` + `reservation_tools.py:367-386` trả `status: "cancelled"` kể cả khi backend trả HTTP 404 (`CT-RES-01a`). |
| **`#25`** (kèm `#30`, `#31`, `TC-ATC-02..11`, `TC-REC-02..10`) | Chatbot Intent Classification Loop (cart actions, competitor, bargaining, low budget) | `ai-service`, `backend`, `frontend` | **`[!] FAKE-PASS / HARDCODED (REJECTED)`** *(Cart parser thật; Competitor/Bargain/Budget chặn cứng trước LLM)* | **Có (Short-circuit trước LLM & Món tĩnh)** | `cart_tools.py:118-580` parse thêm/xóa giỏ hàng & modifiers đối chiếu corpus là thật. Nhưng `aria_pipeline.py:398-444` & `aiController.js:312-382` chặn trước LLM/RAG: `get_competitor_refusal` (`cart_tools.py:76-84`) trả cứng 3 món tĩnh (`Gà Nướng Cơm Lam`, `Cơm Chiên Hải Sản Hoàng Kim`, `Bò Lúc Lắc Khoai Tây Chiên`); `check_unrealistic_budget_query` (`cart_tools.py:582-644`) fail-open với `1 người 10k` nhưng chặn sai `"2 người uống trà đá ngân sách 40k"` bằng văn mẫu `"bàn tiệc no nê"` (`CT-REC-01`, `CT-BE-01c`). |
| **`#26`** (kèm `#29`, `TC-SEC-02`, `TC-SUP-10`) | Toxicity Moderation & Emergency Manager Escalation Bypassed | `ai-service`, `backend`, `frontend` | **`[!] FAKE-PASS / HARDCODED (REJECTED)`** *(Socket `RED_ALERT` thật; Nhận diện & câu trả lời chặn cứng trước LLM)* | **Có (Canned Text & Regex quá rộng)** | `aiController.js:245-310` phát Socket.io `ai_handoff_alert` / `manager_escalation_alert` / `priority_alert` tới room `waiter`, `admin` là thật. Nhưng `aria_pipeline.py:197-239`, `moderation_tools.py:12-166`, `aiController.js:245-310` dùng keyword chặn trước LLM và trả chuỗi đóng khung (`TOXICITY_MODERATION_ANSWER`, `MANAGER_ESCALATION_ANSWER`). Luật `quản lý + gấp` kích hoạt nhầm `RED_ALERT` cho lời khen + tính tiền (`CT-REC-01`, `CT-BE-01c`). |
| **`#27`** (`TC-ATC-01..05`) | Missing In-Chat Food Cards & 1-click Add to Cart | `frontend`, `backend`, `ai-service` | **`[x] RESOLVED (VERIFIED PASS)`** | **Không** *(Chỉ có fallback regex phụ từ `cached_menu_catalog`)* | `entity_extractor.py:16-120` đối chiếu khép kín với catalog thật từ DB/RAG. `aiController.js:462-505` dùng Redis/Supabase menu cache. `ChatMessage.jsx:101-200` (`FoodCard`) render ảnh, tên, giá VND, stepper `[-][1][+]`, nút `[+ Thêm vào giỏ]` gọi `useCart().addToCart` thật. (Caveat nhỏ: fallback tạo ID `dish-...`/`item-...` khi món không khớp catalog). |
| **`#28`** (`TC-SUP-06..08`) | Call Staff Button Pointer Interception, Cooldown & Quick Reason Tags | `frontend`, `backend` | **`[x] RESOLVED (VERIFIED PASS)`** *(Đạt core; còn 2 lỗi UX/rate-limit nhỏ)* | **Không** | `ChatMessage.jsx:396-577` thêm `relative z-20 pointer-events-auto`, cooldown 45s qua `sessionStorage`, và gọi `POST /api/ai/call-staff` + Socket.io `ai_handoff_alert` thật (`aiController.js:780-811`). **Caveat tồn đọng:** `showReasons` khởi tạo `false` (`line 409`) làm tag ẩn trước lần bấm đầu (vướng `TC-SUP-07`), và `handleReasonClick` (`lines 464-481`) không kiểm tra/đặt cooldown 45s. |
| **`AUDIT-P6-01`** | `AriaConversationPipeline.process()` làm rơi `guest_profile` trước `_handle_reservation_turn` | `ai-service` | **`[ ] UNRESOLVED / PENDING` (CRITICAL SAFETY)** | **Không (Lỗi thiếu tham số)** | `aria_pipeline.py:870-871` đã sửa chữ ký `_handle_reservation_turn` để nhận `guest_profile` & `recall_memories`, nhưng **`aria_pipeline.py:339-358` vẫn gọi mà KHÔNG truyền 2 tham số này**. `CT-SAFETY-01` chứng minh `_handle_reservation_turn` luôn nhận `[None]`, vô hiệu hóa lọc dị ứng trong luồng đặt bàn thực tế. |
| **`AUDIT-P6-02`** | Pseudo-Embedding bằng MD5 + Sóng Sin (`768-D`) | `ai-service`, `backend` | **`[!] FAKE-PASS / HARDCODED (REJECTED)`** | **Có (Giả lập toán học vô nghĩa ngữ nghĩa)** | `embedding_helper.py:12-29`, `hybrid_retriever.py:287-306`, `pipecatClient.js:228-249` sinh vector `sin(idx * freq + phase)` từ hash MD5. `CT-VEC-01` đo thực nghiệm: `cos("Tôi bị dị ứng hải sản", "Không ăn được tôm cua cá") = 0.005909` (gần bằng 0, chỉ nhỉnh hơn câu không liên quan `0.000314`). |
| **`AUDIT-BE-SEC-01`** (`#32`) | Endpoint `POST /api/reservations/cancel-by-code` mở tự do & `.ilike('%...%')` | `backend` | **`[ ] UNRESOLVED / PENDING` (HIGH SECURITY)** | **Không (Lỗ hổng bảo mật)** | Issue [#32](https://github.com/LCHLong/SmartRestaurant/issues/32). `reservationRoutes.js:69-70` không gắn `verifyToken`, rate limit hay `x-internal-secret`. `reservationController.js:984` dùng `.ilike('booking_code', '%cleanCode%')` nên `CT-BE-01a` gửi `booking_code: "A"` đã khớp wildcard `%A%` và hủy nhầm `RES-ABC123`. |
| **`AUDIT-FE-PAY-01`** (`#33`) | Trang khách gọi `/mock-deposit` & `/mock` đã bị khóa quyền Staff/Admin | `frontend`, `backend` | **`[ ] UNRESOLVED / PENDING`** | **Không (Lệch phân quyền FE/BE)** | Issue [#33](https://github.com/LCHLong/SmartRestaurant/issues/33). `reservationRoutes.js:94-105` & `paymentRoutes.js:173-195` chặn `/mock-deposit` & `/mock` với role `waiter/admin/superadmin` (và 403 ở prod), nhưng `ReservationPage.jsx:221` & `CustomerCheckoutPage.jsx:35` vẫn gọi 2 endpoint này cho khách hàng (sẽ nhận 401/403). |
| **`AUDIT-P6-03`** | Phase 6 Backend IDOR, `visit_count` Lock, `ProfilePage.jsx`, Migration 32 Supabase | `backend`, `frontend` | **`[x] RESOLVED (VERIFIED PASS)`** *(Code BE/FE hoàn chỉnh; cần xác minh Migration 32 trên cloud DB)* | **Không** | `guestProfileRoutes.js:29-38` & `authMiddleware.js:190-216` dùng `crypto.timingSafeEqual`; `guestProfileController.js:287-323` dùng Redis `SET NX`; `ProfilePage.jsx` kết nối `GET/PUT /api/guest-profile/me` thật. (Chưa có chứng cứ Migration 32 `match_guest_memories` đã chạy trên Supabase cloud). |
| **`AUDIT-TEST-01`** | Test Tautology, Mock-Self & Bỏ Qua Lỗi Integration ở BE & AI Test Suites | `backend/tests`, `ai-service/tests`, `tests/blackbox` | **`[!] FAKE-PASS / HARDCODED (REJECTED)`** | **Có (Test tự assert hàm cục bộ / mock tĩnh)** | 6 file test (`guestProfile.test.js:114-208`, `test_guest_profiles_memgpt.js:998-1101` Tier 5, `reservationSlots.test.js:98-115` Test 5, `test_memgpt_memory.py:250-306`, `test_aria_pipeline.py:166,212`, `test_cart_and_intent_classifier.py:273`) tạo kết quả xanh giả trong khi code thật còn lỗi. |

---

## 3. Danh mục Chi Tiết Các Điểm Phát Hiện Hardcode (Nếu có)

### 3.1. Bộ Máy Giả Lập MemGPT & Persona `"Chú Hùng"` (`#23`)
- **Vị trí:** `ai-service/tools/memory_engine.py:25-259` và `ai-service/pipelines/aria_pipeline.py:362-395`
- **Cơ chế hardcode:**
  - `MemoryEngine.detect_memory_intent()` (`memory_engine.py:25-120`) dò chuỗi thô trùng khớp chính xác các câu test trong `04_memgpt_memory.spec.js`: `"chú hùng đây"` / `"tôi là chú hùng"` (`line 97`), `"aria đang nhớ những thông tin gì"` (`line 59`), `"bị gout"` (`line 68`), `"tiếp khách"` + `"siêu cay"` (`lines 75-76`), `"combo ăn trưa như tuần trước"` (`line 84`), `"ngán bò"` (`line 111`).
  - `MemoryEngine.get_memory_response(cls, sub_intent, message, guest_profile=None, order_history=None)` (`lines 123-259`) khai báo tham số `guest_profile` và `order_history` nhưng **không hề đọc một trường nào từ 2 biến này**:
    ```python
    # ai-service/tools/memory_engine.py:212-222
    text = (
        "Dạ, theo hồ sơ sở thích ăn uống và khẩu vị mà Aria đang ghi nhớ về quý khách:\n"
        "- Tên xưng hô: Chú Hùng\n"
        "- Thói quen gia vị: Ăn ít cay (Cấp 1), không hành lá\n"
        "- Món quen yêu thích: Bò bít tết sốt tiêu, Mì xào giòn\n"
        "- Lưu ý sức khỏe / kiêng khem: Kiêng thịt bò và hải sản (bệnh gout)\n"
        "- Lịch sử ghé thăm: 4 lần\n\n"
        ...
    )
    ```
  - Tương tự, `mem_seasoning_habit` (`156-175`) hardcode `mi-xao-bo-gion` (`85000`), `mem_reorder` (`178-190`) hardcode `Combo ăn trưa đặc biệt` (`Cơm sườn nướng mật ong` 85k, `Canh chua cá lóc` 65k, `Trà đào ít đá` 35k), `mem_taste_discovery` (`243-257`) và `aria_pipeline.py:2026-2034` hardcode 3 món (`Gà Hấp Lá Chanh` 85k, `Vịt Quay Sốt Mận` 125k, `Nấm Đùi Gà Hấp Gừng Sả` 65k) bất chấp thực đơn thật.
  - Ở `aria_pipeline.py:365-371` (`mem_purge`), lời gọi `await MemoryEngine.purge_remote_profile(effective_user_id)` bị bọc trong `try: ... except Exception: pass` và bỏ qua giá trị trả về `bool`; nếu khách chưa đăng nhập (`user_id=None`) hoặc DB lỗi, Aria vẫn trả lời `"đã xóa sạch hoàn toàn mọi thông tin"`.
- **Bằng chứng thực nghiệm (`CT-MEM-01`):**
  ```text
  [PASS PROBE] CT-MEM-01a: guest_profile ignored -> returned hardcoded Chú Hùng / 4 lần
  [PASS PROBE] CT-MEM-01b: mem_update hardcoded -> fabricated hải sản restriction without DB write
  ```
- **Lý do đây là lời giải giả tạo:** Mọi tài khoản thật (như `"Cô Lan"`, dị ứng `"đậu phộng"`, `visit_count=2`) đều bị đánh tráo thành `"Chú Hùng"` và `"4 lần"`, không hề lưu hay xóa dữ liệu thật trong Supabase/Redis.

### 3.2. Giả Lập Sửa & Hủy Đặt Bàn `#RES-` (`#24`)
- **Vị trí:** `ai-service/pipelines/aria_pipeline.py:876-934, 1828-1839` và `ai-service/tools/reservation_tools.py:367-386`
- **Cơ chế hardcode / mock:**
  - **Sửa bàn (`aria_pipeline.py:901-934`):** Khi tin nhắn có `#RES-...` và từ khóa `"đổi"` / `"chỉnh sửa"`, code **không kiểm tra mã bàn có tồn tại trong DB**, **không gọi `check_availability`**, và **không gọi API `PATCH`/`PUT` nào sang backend**. Thay vào đó, gán giá trị mặc định khớp bài test `TC-RES-08` (`"đổi sang 20:00 và đi 6 người"`):
    ```python
    # ai-service/pipelines/aria_pipeline.py:906-907, 924
    new_time = extracted_slots.get("time") or "20:00"
    new_guests = extracted_slots.get("guests") or 6
    # ...
    "Bàn trong khung giờ này vẫn còn chỗ, Aria đã cập nhật thành công thông tin đặt bàn mới cho quý khách nhé!"
    ```
  - **Hủy bàn (`aria_pipeline.py:876-899`, `reservation_tools.py:367-386`):** `cancel_reservation_by_code` chỉ trả dữ liệu thật khi HTTP 200/201; nếu backend trả HTTP 404 (`NOT_FOUND`), 500 hoặc lỗi mạng, dòng `386` vẫn trả `return {"booking_code": clean_code, "status": "cancelled"}`. Tại `aria_pipeline.py:882-885`, kết quả bị bỏ qua kèm `except Exception: pass` và luôn stream `"Dạ, Aria đã xác nhận hủy thành công mã đặt bàn #..."`.
- **Bằng chứng thực nghiệm (`CT-RES-01`):**
  ```text
  [PASS PROBE] CT-RES-01a: cancel_reservation_by_code returned cancelled despite HTTP 404
  [PASS PROBE] CT-RES-01b: fake edit confirmed #RES-999999 without DB lookup or availability check
  [PASS PROBE] CT-RES-01c: omitted edit slots fell back to hardcoded 20:00 / 6 guests
  ```
- **Lý do đây là lời giải giả tạo:** Khách sửa hay hủy một mã không tồn tại (`#RES-999999`) vẫn nhận thông báo thành công 100% trong khi dữ liệu Supabase hoàn toàn không đổi (đối với sửa) hoặc báo thành công giả khi backend 404 (đối với hủy).

### 3.3. Nhánh Chặn Trước LLM, Món Đối Thủ Tĩnh & Văn Mẫu Ngân Sách (`#25`, `#26`, `#29`, `#30`, `#31`)
- **Vị trí:** `ai-service/pipelines/aria_pipeline.py:197-239, 398-444`, `ai-service/tools/cart_tools.py:33-115, 582-644`, `ai-service/tools/moderation_tools.py:12-166`, `backend/src/controllers/aiController.js:209, 245-382`
- **Cơ chế hardcode:**
  - **Từ chối đối thủ (`cart_tools.py:76-84`):** Không truy vấn menu DB/RAG mà trả cứng 3 món `**Gà Nướng Cơm Lam**`, `**Cơm Chiên Hải Sản Hoàng Kim**`, `**Bò Lúc Lắc Khoai Tây Chiên**` dù khách dị ứng hay không thích gà nướng.
  - **Mặc cả giá (`cart_tools.py:87-115`):** Trả chuỗi cố định `BARGAIN_REFUSAL`.
  - **Ngân sách thấp (`cart_tools.py:582-644`, `aiController.js:312-382`):** Chặn ngay khi `guestCount >= 2 && budget / guestCount < 25000` để trả chuỗi đóng khung `"chi phí trung bình .../khách sẽ khó để có một bàn tiệc no nê trọn vẹn"`. Quy tắc này bỏ lọt hoàn toàn câu `"1 người ngân sách 10k ăn gì?"` (`False`) và chặn nhầm `"2 người uống trà đá ngân sách 40k"` (`True`).
  - **Kiểm duyệt & Leo thang Quản lý (`moderation_tools.py:12-166`, `aiController.js:245-310`):** Dùng danh sách từ khóa kích hoạt `TOXICITY_MODERATION_ANSWER` và `MANAGER_ESCALATION_ANSWER` trước khi gọi LLM. Luật `has_mgr_keyword and has_urgency` biến câu `"Tôi muốn gặp quản lý để khen món ăn và cần tính tiền gấp!"` thành báo động khẩn `RED_ALERT` (`priority_alert` gửi 2 lần tới `waiter` và `admin`).
  - **A/B Testing vô hiệu hóa (`aiController.js:209`):** `const abVariant = 'variant_a_advanced';` gán cứng thay vì chia nhánh A/B thực.
- **Bằng chứng thực nghiệm (`CT-REC-01` & `CT-BE-01c`):**
  ```text
  [PASS PROBE] CT-REC-01: Competitor hardcode, 1p/tea budget flaw, and compliment false-positive RED_ALERT confirmed
  [PASS PROBE] CT-BE-01c: aiController.consult bypassed Pipecat and fired priority_alert on compliment
  ```

### 3.4. Nhánh Offline Dị Ứng Gia Vị Ẩn (`#22` / `TC-REC-06`)
- **Vị trí:** `ai-service/pipelines/aria_pipeline.py:2008-2025` & `ai-service/tools/policy_engine.py:41-48, 82-86, 108-112`
- **Cơ chế hardcode:** Khi `_get_client()` trả về `None` (offline mode), `_stream_offline_grounded` bắt `IntentClassifier.is_seasoning_allergy_inquiry(query)` và stream cứng 2 đoạn text có sẵn về `"dầu hào (chiết xuất từ hàu biển)"`, `"nước mắm truyền thống cốt cá"`, `"muối tinh"`, `"xì dầu"`, `"chảo và dụng cụ nấu riêng biệt"`.
- **Lý do đây là lời giải giả tạo:** Trong unit test `test_10_seasoning_allergy_protocol_tc_rec_06` (`test_aria_pipeline.py:205-231`), bài test cố tình ép `_get_client -> None` để kiểm tra đúng chuỗi hardcode này mà không kiểm chứng RAG/MetadataFilter hay LLM thật.

### 3.5. Pseudo-Embedding Giả Lập bằng MD5 + Sóng Sin (`Phase 6 Carryover`)
- **Vị trí:** `ai-service/tools/embedding_helper.py:12-29`, `ai-service/processors/hybrid_retriever.py:287-306`, `backend/src/services/pipecatClient.js:228-249`
- **Cơ chế giả lập:** Lấy 8 ký tự hex đầu của `hashlib.md5(text)` làm tần số và pha rồi tính `sin(idx * (freq / 100.0) + phase)` trên 768 chiều, chuẩn hóa L2. Kết quả vượt qua mọi bài kiểm tra hình học (`len == 768`, `||v|| == 1.0`), nhưng **hai câu đồng nghĩa tiếng Việt có độ tương đồng cosine ≈ 0**.
- **Bằng chứng thực nghiệm (`CT-VEC-01`):**
  ```text
  [PASS PROBE] CT-VEC-01: cos(synonym)=0.005909, cos(unrelated)=0.000314
  ```

### 3.6. Danh Mục Test Suites Tự Kiểm Chứng & Đánh Lừa (Tautology & Mock-Self Tests)
1. **`backend/tests/guestProfile.test.js:114-208`:** Tự định nghĩa hàm cục bộ `normalizeList` (`lines 115-173`) và `simulateCheckpoint` (`lines 175-208`) ngay trong file test rồi assert kết quả của chính hàm cục bộ đó — **không import hay gọi `guestProfileController`**.
2. **`backend/tests/test_guest_profiles_memgpt.js:998-1101` (Tier 5):** Các ca `TC-T5-01`..`TC-T5-06` tự dựng object `pipecatPayload` giả (`1011-1023`), gán biến cục bộ `userId = null` (`1027-1033`), và copy-paste hàm `evaluateCheckpoint()` (`1038-1081`) thay vì gọi `aiController.js`. *(Tiers 1–4 & 6 có test thật vào controller/middleware với harness in-memory.)*
3. **`backend/tests/reservationSlots.test.js:98-115` (Test 5):** Tiêu đề `"Tự động phục hồi qua Fallback Tables khi xảy ra sự cố mạng"`, nhưng **không hề mock Supabase hay tạo lỗi mạng** — chỉ gọi `getAvailableSlots` y hệt Test 1.
4. **`ai-service/tests/test_memgpt_memory.py:250-306`:** Gọi trực tiếp `pipeline._handle_reservation_turn(..., guest_profile=guest_profile)` trong khi mock `_handle_consultation_flow`, nên vẫn xanh dù entry point thực tế `pipeline.process()` làm rơi `guest_profile` (`CT-SAFETY-01`).
5. **`ai-service/tests/test_aria_pipeline.py:166, 212`:** Patch `pipelines.aria_pipeline._get_client` thành `return_value=None`, chỉ test văn mẫu `_stream_offline_grounded`.
6. **`ai-service/tests/test_cart_and_intent_classifier.py:273`:** Assert nguyên văn chuỗi hardcode `"chi phí trung bình 10.000đ/khách sẽ khó để có một bàn tiệc no nê trọn vẹn"` từ `cart_tools.py:638`.
7. **`tests/blackbox/04_memgpt_memory.spec.js:15-100` & `03_reservation.spec.js:101-121`:** Gửi prompt đóng vai `"chú Hùng"` không đăng nhập và sửa/hủy `#RES-2026-8891` không kiểm chứng DB, vô tình chấp nhận các bản vá hardcode.

---

## 4. Danh mục Bug Chưa Hoàn Thành & Hồi Quy (Unresolved / Pending)

### 4.1. [CRITICAL SAFETY] `pipeline.process()` Đánh Rơi `guest_profile` Khi Vào Luồng Đặt Bàn (`aria_pipeline.py:339-358`)
- **Nguyên nhân gốc rễ:** `_handle_reservation_turn` đã được bổ sung tham số `guest_profile` và `recall_memories` (`lines 870-871`), nhưng tại điểm gọi bên trong `AriaConversationPipeline.process()` (`lines 339-358`), hai tham số này vẫn bị bỏ quên.
- **Bằng chứng thực nghiệm (`CT-SAFETY-01`):** `pipeline.process(..., guest_profile={"allergies": ["tôm"]})` truyền `[None]` vào `_handle_reservation_turn`.
- **Ảnh hưởng hệ thống:** Bất kỳ khách hàng có hồ sơ dị ứng nào hỏi thêm về món ăn trong lúc đặt bàn đều bị tắt hoàn toàn lá chắn `AllergySafetyLatch` / `MetadataFilter`.
- **Đề xuất khắc phục:** Truyền tường minh `guest_profile=guest_profile, recall_memories=recall_memories` tại `aria_pipeline.py:339-358`, và viết integration test đi qua `pipeline.process()` (không gọi tắt `_handle_reservation_turn`).

### 4.2. [CRITICAL SAFETY] `MetadataFilter` Mù Gia Vị Ẩn (`"nước mắm"`, `"dầu hào"`) & Bỏ Quên Dị Ứng Khi `menu_context` Rỗng (`#22` `TC-REC-06`)
- **Nguyên nhân gốc rễ:**
  1. `CulinaryEntityExtractor.ALLERGEN_GROUPS` (`ai-service/processors/metadata_filter.py:78-86`) định nghĩa `'cá': ['cá', 'ca']` và `'hải sản'` có `'hàu', 'hau'`, nhưng **thiếu hoàn toàn `'nước mắm'`, `'nuoc mam'`, `'dầu hào'`, `'dau hao'`, `'mắm tôm'`, `'mắm cá'`** (tương tự ở `backend/src/services/ragService.js:165-167`).
  2. Trong `aria_pipeline.py:661-668`, nhánh `if not menu_context:` gọi `self.retriever.retrieve(...)` mà không hợp nhất `guest_profile["allergies"]` (chỉ nhánh `else:` tại `lines 674-678` mới hợp nhất).
- **Bằng chứng thực nghiệm (`CT-ALLERGY-01`):**
  ```text
  [PASS PROBE] CT-ALLERGY-01: MetadataFilter.filter_items(allergens=['cá', 'hải sản']) kept=['Cải thìa xào tỏi'], excluded=['Cá thu sốt cà']; ALLERGEN_GROUPS['cá']=['cá', 'ca']
  ```
- **Ảnh hưởng hệ thống:** Món xào có mô tả `"nêm nước mắm và dầu hào"` vượt qua bộ lọc dị ứng cá/hải sản và được đề xuất cho khách dị ứng nặng.
- **Đề xuất khắc phục:** Mở rộng `ALLERGEN_GROUPS["cá"]` (thêm `"nước mắm"`, `"mắm cá"`, `"cốt cá"`) và `ALLERGEN_GROUPS["hải sản"]` (thêm `"dầu hào"`, `"mắm tôm"`, `"mắm ruốc"`, `"tép"`), đồng thời gộp `guest_profile["allergies"]` trước khi gọi `retriever.retrieve()` ở cả hai nhánh `menu_context`.

### 4.3. [HIGH SECURITY] `POST /api/reservations/cancel-by-code` Không Xác Thực & Dùng Wildcard `.ilike('%...%')`
- **Nguyên nhân gốc rễ:** `backend/src/routes/reservationRoutes.js:69-70` mở public không có `verifyToken`, rate limit, hay xác minh số điện thoại; `reservationController.js:984` truy vấn `.ilike('booking_code', '%${cleanCode}%')`.
- **Bằng chứng thực nghiệm (`CT-BE-01a`):** Gửi `booking_code: "A"` tạo pattern `%A%` và hủy nhầm đặt bàn `RES-ABC123` với HTTP 200.
- **Ảnh hưởng hệ thống:** Kẻ tấn công chưa đăng nhập có thể dò hoặc hủy hàng loạt đơn đặt bàn của khách khác chỉ bằng 1 ký tự chung (`"RES"`, `"A"`, `"2026"`).
- **Đề xuất khắc phục:** Đổi sang khớp chính xác `.eq('booking_code', cleanCode)`, bắt buộc xác minh JWT chủ sở hữu hoặc 4 số cuối SĐT (`phone_last_4` như `/lookup`) hoặc `x-internal-secret` (timing-safe), kèm rate limiter.

### 4.4. [HIGH INTEGRITY] `DEFAULT_FALLBACK_TABLES` Che Giấu Lỗi DB (`#21`) & Che Lỗi Check Bàn Trong Chat
- **Nguyên nhân gốc rễ:** `reservationController.js:53-70, 176-180, 260-285` trả HTTP 200 kèm 15 bàn tĩnh (`A1..C5`, `is_available: true`) khi Supabase lỗi (`CT-BE-01b`). Song song đó, `aria_pipeline.py:1828-1839` nuốt ngoại lệ `check_availability()` và mời khách xác nhận đặt bàn khi chưa kiểm tra được chỗ.
- **Ảnh hưởng hệ thống:** Nhà hàng có thể nhận đặt bàn ảo khi hệ thống DB mất kết nối hoặc khi tất cả bàn thực tế đã kín.
- **Đề xuất khắc phục:** Trả HTTP `503 Service Unavailable` (hoặc `500` chuẩn hóa không lộ stack/URL) khi DB lỗi ở `/available-slots`; sửa `aria_pipeline.py:1828-1839` thông báo rõ tạm thời không kiểm tra được bàn trống và đề xuất gọi hotline/nhân viên; viết lại Test 5 trong `reservationSlots.test.js` với mock lỗi DB thực tế.

### 4.5. [MEDIUM UX / LOGIC] Các Tồn Đọng Khác (`#28`, `#24`, `#25`, Frontend Mock Payment, Vector Search)
1. **Call Staff Quick Tags & Cooldown (`#28`, `ChatMessage.jsx:409, 464-483`):** `showReasons` mặc định `false` khiến quick tags bị ẩn trước khi bấm nút chính (lệch `TC-SUP-07`); `handleReasonClick` chưa kiểm tra và kích hoạt cooldown 45s (cho phép spam vô hạn); chưa có rate limit Redis phía backend trên `/api/ai/call-staff`.
2. **Lệch cấu hình giờ mở/đóng cửa (`#24`, `datetime_parser.py:405-419`, `slot_extractor.py:672`):** `slot_extractor.py:672` gọi `validate_reservation_time` không truyền `open_time`/`close_time` nên đối chiếu mặc định `08:00–22:00`, trong khi chuỗi báo lỗi lại hardcode `"10:00 sáng đến 22:30 tối"`.
3. **Frontend Customer Mock Payment (`ReservationPage.jsx:221`, `CustomerCheckoutPage.jsx:35`):** Vẫn gọi `/api/reservations/:id/mock-deposit` và `/api/payment/mock` dù Backend đã khóa 2 route này cho role Staff/Admin (`reservationRoutes.js:103`, `paymentRoutes.js:182`), dẫn tới lỗi `401/403` cho khách hàng.
4. **Vector Search & Migration 32 (`embedding_helper.py`, `pipecatClient.js`, Supabase):** Cần thay thế MD5 sine-wave bằng model embedding ngữ nghĩa thật (ví dụ `text-embedding-004` / `paraphrase-multilingual-MiniLM-L12-v2`) và kiểm tra Migration 32 (`match_guest_memories`) đã được áp dụng trên Supabase cloud.

---

## 5. Báo cáo Tối Ưu Lưu Trữ Media (Storage Optimization Summary)

### 5.1. Chính Sách Bảo Vệ Tài Sản Ứng Dụng (Safeguarded Assets)
Toàn bộ 6 tệp tài nguyên giao diện chính thức trong `frontend/public/` được bảo vệ tuyệt đối, **0 byte bị xóa hay chỉnh sửa** (đã xác minh `stat` trước và sau dọn dẹp):
- `frontend/public/apple-touch-icon.png` (`12,098 B`)
- `frontend/public/logo.png` (`6,802 B`)
- `frontend/public/favicon.ico` (`5,381 B`)
- `frontend/public/favicon.svg` (`2,016 B`)
- `frontend/public/favicon-32x32.png` (`1,746 B`)
- `frontend/public/favicon-16x16.png` (`780 B`)
- *(Tổng: 6 files, `28,823 B` nguyên vẹn 100%; mã nguồn `frontend/src/`, `backend/`, `ai-service/`, `tests/`, `test/specs/`, `test/docs/` không bị chạm tới).*

### 5.2. Thống Kê Trước và Sau Khi Dọn Dẹp `test-results/`

| Trạng Thái | Số File | Dung Lượng Chính Xác (Bytes) | Dung Lượng (MB) | Ghi Chú |
|---|---:|---:|---:|---|
| **Trước dọn dẹp** | **265** | **650,324,009 B** | **620.20 MB** | Gồm `html-report/` (127 file), 27 thư mục `artifacts/*` (mỗi mục có `.webm`, `.png`, `trace.zip`, `error-context.md`), 25 `screenshots/*.png`, `.last-run.json`, 4 file metadata gốc. |
| **Đã xóa** | **245** | **637,656,664 B** | **608.11 MB** | Giảm **98.05%** dung lượng `test-results/`. |
| **Sau dọn dẹp** | **20** | **12,667,345 B** | **12.08 MB** | **8 cặp media tiêu biểu** (8 `video.webm` + 8 `test-failed-1.png` = `12,557,601 B`) + **4 file metadata gốc** (`109,744 B`). |

### 5.3. Chi Tiết Các Hạng Mục Đã Xóa

| Hạng Mục Bị Xóa | Đường Dẫn | Số File | Dung Lượng Giải Phóng (Bytes) | Dung Lượng (MB) | Lý Do Xóa |
|---|---|---:|---:|---:|---|
| **Báo cáo HTML trùng lặp 100%** | `test-results/html-report/**` | 127 | 321,107,079 B | 306.23 MB | Chứa bản sao MD5 trùng hệt 81 file `.png`/`.webm`/`.zip` từ `artifacts/` cùng bundle JS/HTML Playwright. |
| **File Trace Playwright nặng** | `test-results/artifacts/*/trace.zip` | 27 | 274,311,291 B | 261.60 MB | Trace tự động ~9–13 MB/file, vượt chuẩn giữ lại tối đa 1 video + 1 ảnh. |
| **19 thư mục TC dư thừa / trùng issue** | `test-results/artifacts/<19 non-rep TCs>/{video.webm,test-failed-1.png}` | 38 | 31,467,799 B | 30.01 MB | Giữ đúng 1 đại diện cho mỗi Bug Issue (thay vì nhiều TC trùng lặp cho `#23`, `#24`, `#25`, `#27`, `#28`). |
| **Ảnh chụp trùng lặp trong `screenshots/`** | `test-results/screenshots/*.png` | 25 | 10,074,757 B | 9.61 MB | Ảnh trùng góc với `test-failed-1.png` đã giữ theo cặp cùng `video.webm` trong `artifacts/`. |
| **Metadata lỗi tạm Playwright** | `test-results/artifacts/*/error-context.md` (27) + `.last-run.json` (1) | 28 | 695,738 B | 0.66 MB | Tệp tạm Playwright không phải bằng chứng media. |
| **Tổng đã xóa** | `test-results/...` | **245** | **637,656,664 B** | **608.11 MB** | |

### 5.4. Danh Sách 8 Cặp Bằng Chứng Tiêu Biểu Được Giữ Lại (+ 4 Metadata Gốc)
*(Ghi chú: Issue `#21` / `TC-RES-05` không có thư mục trong `test-results/artifacts/` trên nhánh `test` vì đã pass trong lần chạy lại `2026-11-21`; cặp ảnh/video gốc `issue-21-res-05-backend-500.{png,webm}` được lưu trên nhánh `media-assets`.)*

| Issue | TC Đại Diện | Thư Mục (`test-results/artifacts/...`) | `video.webm` | `test-failed-1.png` | Tổng Cặp |
|---|---|---|---|---:|---:|
| **`#22`** | `TC-REC-06` | `01_recommendations-Phân-Hệ-a4c13-ắm-và-dầu-hào-trong-món-xào-chromium` | 1,161,565 B | 407,486 B | 1,569,051 B |
| **`#23`** | `TC-MEM-03` | `04_memgpt_memory-Phân-Hệ-4-8c65b-n-gia-vị-không-hành-ít-cay--chromium` | 1,163,061 B | 413,738 B | 1,576,799 B |
| **`#24`** | `TC-RES-11` | `03_reservation-Phân-Hệ-3-Đ-1fee7-a-hoặc-đã-đóng-cửa-2h-sáng--chromium` | 1,080,146 B | 379,419 B | 1,459,565 B |
| **`#25` / `#30`** | `TC-REC-02` | `01_recommendations-Phân-Hệ-7e49d-nê-với-ngân-sách-50-000-VNĐ-chromium` | 1,222,476 B | 408,052 B | 1,630,528 B |
| **`#26`** | `TC-SEC-02` | `06_security_e2e-Phân-Hệ-6--3dfe0--hoặc-mang-tính-khiêu-khích-chromium` | 1,237,523 B | 411,447 B | 1,648,970 B |
| **`#29`** (sub-issue `#26`) | `TC-SUP-10` | `05_support_staff-Phân-Hệ-5-5e749-o-động-khẩn-cấp-tới-Quản-lý-chromium` | 862,142 B | 402,680 B | 1,264,822 B |
| **`#27`** | `TC-ATC-03` | `02_in_chat_cart-Phân-Hệ-2--fc2c6--ly-nước-chanh-dây-qua-chat-chromium` | 1,152,533 B | 409,126 B | 1,561,659 B |
| **`#28`** | `TC-SUP-08` | `05_support_staff-Phân-Hệ-5-ab0cb--liên-tục-kiểm-tra-cooldown-chromium` | 1,461,288 B | 384,919 B | 1,846,207 B |
| **Metadata gốc** | — | `test-results/{.gitkeep, master_bug_report.md, test-status.json, test-summary.json}` | — | — | 109,744 B |
| **Tổng còn lại** | **8 cặp + 4 file** | **20 files** | **9,340,734 B** | **3,216,867 B** | **12,667,345 B** |

---

## 6. Kết Quả Chốt Chặn Kiểm Định (Quality Gates)

| Phân Hệ | Lệnh Thực Thi | Mã Thoát | Kết Quả Thực Tế |
|---|---|---:|---|
| **Frontend Build** | `cd /workspaces/SmartRestaurant/frontend && npm run build` | `0` | Build thành công 100% (`vite v7.3.1`, `885 modules transformed`, `13.88s`, `dist/` nằm trong `.gitignore`), không thiếu bất kỳ asset ảnh/icon nào. |
| **Backend Tests** | `cd /workspaces/SmartRestaurant/backend && npm test` | `0` | Toàn bộ 3 suite trong `npm test` (`15` node:test + `38` ca IEEE 829) chạy qua; lưu ý các ca tautology trong `guestProfile.test.js`, `reservationSlots.test.js` Test 5 và `test_guest_profiles_memgpt.js` Tier 5 đã được chỉ rõ ở Mục 3.6. |
| **AI Service Pytest** | `cd /workspaces/SmartRestaurant/ai-service && pytest` | `2` | `/usr/local/py-utils/bin/pytest` (`9.2.0`, Python `3.14.2`) dừng ở bước thu thập (12 lỗi import) do môi trường không có `ai-service/.venv` và thiếu `numpy`, `fastapi`, `groq`, `pytz`, `pydantic`. Bù lại, toàn bộ counter-test cô lập (`CT-MEM-01`, `CT-RES-01`, `CT-SAFETY-01`, `CT-REC-01`, `CT-VEC-01`, `CT-ALLERGY-01`) đã chạy thành công với mã thoát `0` bằng stub thư viện chuẩn Python. |
| **Counter-Tests (BE)** | `NODE_PATH=/workspaces/SmartRestaurant/backend/node_modules node probe_be_countertests.js` | `0` | Xác nhận thực nghiệm `CT-BE-01a`, `CT-BE-01b`, `CT-BE-01c` (đã dọn dẹp thư mục tạm sau khi thu thập log). |
