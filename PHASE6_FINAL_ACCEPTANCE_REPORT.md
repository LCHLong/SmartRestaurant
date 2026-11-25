# 🏆 BÁO CÁO NGHIỆM THU CUỐI CÙNG (FINAL ACCEPTANCE AUDIT REPORT)
# GIAI ĐOẠN 6: BỘ NHỚ DÀI HẠN KHÁCH QUEN (MEMGPT - TÍNH NĂNG F4)

> **Dự án:** SmartRestaurant — Hệ thống Quản trị & Trợ lý Ảo Nhà hàng Thông minh  
> **Hội đồng Kiểm định:** Senior Software Architect, Senior QA Engineer & AI Engineer  
> **Căn cứ kế hoạch:** [`docs/plan/Phase6_MemGPT.md`](file:///home/hung/KLTN/demo_res/SmartRestaurant/docs/plan/Phase6_MemGPT.md)  
> **Căn cứ kiểm toán trước:** [`PHASE6_AUDIT_REPORT.md`](file:///home/hung/KLTN/demo_res/SmartRestaurant/PHASE6_AUDIT_REPORT.md) & [`PHASE6_FIX_REPORT.md`](file:///home/hung/KLTN/demo_res/SmartRestaurant/PHASE6_FIX_REPORT.md)  
> **Thời điểm thẩm định:** 13/11/2026  
> **Nguyên tắc thẩm định:** Độc lập, khách quan, xác minh trực tiếp mã nguồn, cơ sở dữ liệu cloud Supabase thực tế, kiểm tra phân tầng API và chạy thực thi kiểm thử. Tuyệt đối không giả định hoàn thành khi thiếu bằng chứng môi trường thật.

---

## 1. EXECUTIVE SUMMARY (TỔNG QUAN KẾT QUẢ NGHIỆM THU)

Đợt kiểm định cuối cùng (**Final Acceptance Audit**) được thực hiện nhằm đánh giá độc lập xem Phase 6 đã thực sự hoàn thành **100% yêu cầu trong tài liệu gốc `Phase6_MemGPT.md`** hay chưa, đồng thời kiểm tra tính triệt để của các bản sửa lỗi được ghi nhận trong `PHASE6_FIX_REPORT.md`.

### 1.1. Những đột phá then chốt đã được xác minh thành công
1. **Rào chắn An toàn Dị ứng (Allergy Safety Latch - Tuyệt đối 100%):**
   - Đã xử lý triệt để lỗ hổng đứt gãy tham số tại [ai-service/pipelines/aria_pipeline.py](file:///home/hung/KLTN/demo_res/SmartRestaurant/ai-service/pipelines/aria_pipeline.py#L613-L614). Toàn bộ 3 vị trí side-queries trong FSM đặt bàn hiện đã truyền đầy đủ `guest_profile` và `recall_memories` sang `_handle_consultation_flow`.
   - Thuật toán phép Hợp ($A_{\text{new}} = A_{\text{current}} \cup A_{\text{detected}}$) và hàm kiểm tra bất biến `verify_no_allergy_loss` hoạt động chuẩn xác.
   - Đã bổ sung cơ chế **Explicit Overwrite** tại Backend [guestProfileController.js](file:///home/hung/KLTN/demo_res/SmartRestaurant/backend/src/controllers/guestProfileController.js#L18-L60) và Frontend [ProfilePage.jsx](file:///home/hung/KLTN/demo_res/SmartRestaurant/frontend/src/pages/customer/ProfilePage.jsx#L97-L129): cho phép khách hàng chủ động gỡ bỏ các dị ứng bị AI gán nhầm với cảnh báo xác nhận rõ ràng.
2. **Khắc phục triệt để lỗ hổng bảo mật P0 (IDOR / Unauthenticated Write):**
   - Tuyến đường `POST /api/guest-profile/session-summary` đã được bảo vệ kép bởi middleware `verifyInternalOrUserAuth` tại [authMiddleware.js](file:///home/hung/KLTN/demo_res/SmartRestaurant/backend/src/middleware/authMiddleware.js#L72-L102).
   - Cơ chế so khớp `INTERNAL_SERVICE_SECRET` sử dụng `crypto.timingSafeEqual` chống tấn công Timing Attack. Fallback sang JWT Token bắt buộc `req.body.userId === req.user.id`, triệt tiêu hoàn toàn nguy cơ IDOR.
3. **Hoàn thiện Giao diện Người dùng Khẩu vị & Dị ứng (Frontend Profile UI):**
   - Đã xây dựng card chuyên biệt *"Sở thích Ẩm thực & Dị ứng (Aria Memory)"* tại [ProfilePage.jsx](file:///home/hung/KLTN/demo_res/SmartRestaurant/frontend/src/pages/customer/ProfilePage.jsx#L460-L720) với tính năng thêm/xóa tag dị ứng (nút `x`), chọn 4 mức độ cay, vị trí bàn yêu thích, ghi chú đặc biệt và modal xác nhận an toàn trước khi lưu.
4. **Trải nghiệm Hội thoại & Huy hiệu Khách quen chuẩn xác:**
   - [AiChatContext.jsx](file:///home/hung/KLTN/demo_res/SmartRestaurant/frontend/src/contexts/AiChatContext.jsx#L67-L80) và [AriaChatWidget/index.jsx](file:///home/hung/KLTN/demo_res/SmartRestaurant/frontend/src/components/AriaChatWidget/index.jsx#L133-L138) chỉ hiển thị huy hiệu `Khách quen • Đã lưu khẩu vị` và lời chào tái ngộ khi `visit_count > 1`.
   - Idempotency kiểm soát phiên trên Redis (`session_counted:${userId}:${sessionId}`, TTL 24h) giải quyết dứt điểm lỗi tăng vọt số lần ghé thăm.

### 1.2. Các điểm nghẽn kỹ thuật được phát hiện trong đợt Final Audit
1. **Migration 32 chưa được thực thi trên CSDL Supabase Production:**
   - File [32_add_match_guest_memories_rpc.sql](file:///home/hung/KLTN/demo_res/SmartRestaurant/database/migrations/32_add_match_guest_memories_rpc.sql) đã được tạo trên Git, nhưng kiểm tra trực tiếp trên cloud database `mhkwzfkywfkkokhodqgz.supabase.co` cho thấy hàm RPC `match_guest_memories` **chưa tồn tại trong schema cache** (mã lỗi `PGRST202`).
   - Hậu quả: Khi `aiController.getRecallMemories` thực hiện tìm kiếm ngữ nghĩa, câu lệnh RPC luôn trả về lỗi và tự động kích hoạt fallback sang truy vấn theo thời gian (`ORDER BY created_at DESC LIMIT 5`).
2. **Bản chất của Vector Generator hiện tại là Hàm băm (Hash-based Pseudo-Embedding):**
   - Module [embedding_helper.py](file:///home/hung/KLTN/demo_res/SmartRestaurant/ai-service/tools/embedding_helper.py) và [pipecatClient.js](file:///home/hung/KLTN/demo_res/SmartRestaurant/backend/src/services/pipecatClient.js) đang sinh vector 768 chiều dựa trên MD5 băm chuỗi kết hợp hàm sin sóng toán học thay vì sử dụng mô hình ngôn ngữ ngữ nghĩa thực thụ (như `SentenceTransformer all-mpnet-base-v2` hoặc Google Embedding).
   - Hai câu có cùng ý nghĩa nhưng khác từ vựng (vd: *"dị ứng tôm"* và *"không ăn được hải sản tôm"*) sẽ có vector gần như trực giao (độ tương đồng Cosine $\approx 0$).
3. **Chỉ số Personalization Accuracy ($P_{\text{pers}} = 97.5\%$) chưa có Golden Dataset đo đạc:**
   - Repository chưa có file benchmark script hoặc tập dữ liệu mẫu chuẩn (Golden Dataset) để đo lường tự động chỉ số này.

---

## 2. TỔNG HỢP TỶ LỆ HOÀN THÀNH THỰC TẾ

Dựa trên việc kiểm định đối chiếu trực tiếp từng tiêu chí kỹ thuật:

| Phân hệ / Nhóm nhiệm vụ | Trọng số kế hoạch | Trạng thái trước Fix | Trạng thái sau Final Audit | Đánh giá kiến trúc |
| :--- | :---: | :---: | :---: | :--- |
| **Developer 1: AI Core Service** | **50%** | 94.0% | **97.0%** | Giải quyết xong đứt gãy Safety Latch trong side-query đặt bàn. Sinh vector 768 chiều hoạt động ổn định nhưng là giải thuật toán băm giả lập. |
| **Developer 2: Fullstack Infra, API & UI** | **50%** | 68.0% | **88.0%** | Hoàn tất Frontend Profile UI, bảo mật IDOR, chuẩn hóa dữ liệu, idempotency. Còn tồn tại việc Migration 32 chưa chạy trên Supabase thật. |
| **TỔNG THỂ DỰ ÁN PHASE 6** | **100%** | **81.0%** | **92.5%** | **PARTIAL – CONDITIONALLY ACCEPTED** |

```
TIẾN ĐỘ THỰC TẾ PHASE 6: [██████████████████░░] 92.5%
- AI Core Service:       [███████████████████░] 97.0%
- Fullstack Infra & UI:  [█████████████████░░░] 88.0%
```

> [!IMPORTANT]
> Theo quy định nghiêm ngặt tại **Mục 5 của Yêu cầu Nghiệm thu**: *"Nếu có bất kỳ yêu cầu nào ở trạng thái PARTIAL, FAIL hoặc NOT VERIFIED thì không được kết luận đã nghiệm thu 100%."*  
> Do RPC `match_guest_memories` chưa được nạp vào Supabase Production và mô hình embedding ngữ nghĩa đang ở dạng pseudo-vector, Phase 6 **CHƯA ĐƯỢC CÔNG NHẬN 100% ACCEPTED** mà được xếp hạng **PARTIAL – CONDITIONALLY ACCEPTED (92.5%)**.

---

## 3. BẢNG ĐỐI CHIẾU TOÀN BỘ YÊU CẦU GỐC (FULL REQUIREMENTS MATRIX)

| STT | Yêu cầu gốc (`Phase6_MemGPT.md`) | File / Module liên quan | Cách kiểm chứng thực tế | Kết quả kiểm tra | Trạng thái |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **1** | Pydantic Model `GuestProfile` (10 trường) | `ai-service/tools/guest_profile_store.py:13-24` | Kiểm tra định nghĩa schema Python & validation | Khai báo đủ 10 trường, gán default value an toàn | **PASS** |
| **2** | `GuestProfileStore` in-memory store | `ai-service/tools/guest_profile_store.py:53-122` | Kiểm tra code deepcopy và các hàm getter/setter | Quản lý bộ đệm in-memory, chống race-condition | **PASS** |
| **3** | `AllergySafetyLatch.merge_allergies` (Union) | `ai-service/tools/guest_profile_store.py:35-40` | Chạy unit test phép hợp, lowercase, strip | Hợp nhất tập hợp không trùng lặp, giữ chữ thường | **PASS** |
| **4** | `AllergySafetyLatch.verify_no_allergy_loss` | `ai-service/tools/guest_profile_store.py:43-50` | Chạy unit test kiểm tra $A_{\text{old}} \subseteq A_{\text{new}}$ | Bắt ngoại lệ nếu phát hiện mất dị ứng | **PASS** |
| **5** | `MemGPTMemoryLoader` nạp 3 tầng bộ nhớ | `ai-service/processors/memory_loader.py:22-79` | Kiểm tra logic phân tầng Working, Recall, Archival | Nạp đúng 3 tầng, tính `is_returning_customer` | **PASS** |
| **6** | `format_for_prompt` tiêm System Prompt | `ai-service/processors/memory_loader.py:81-125` | Kiểm tra cấu trúc Markdown format tiêm vào Layer 2 | Định dạng in hoa dị ứng kèm icon ⚠️ cảnh báo | **PASS** |
| **7** | `SessionSummarizer` bóc tách tiếng Việt | `ai-service/processors/session_summarizer.py:21-92` | Chạy test regex với tiếng Việt có dấu/không dấu | Nhận diện chuẩn 15 chất dị ứng, độ cay, khu vực | **PASS** |
| **8** | `summarize_and_merge` bảo toàn dị ứng | `ai-service/processors/session_summarizer.py:94-142` | Chạy test kết hợp summarizer và Safety Latch | Hợp nhất an toàn trước khi trả về backend | **PASS** |
| **9** | Nhúng ngữ cảnh vào `system_prompt_builder.py` | `ai-service/processors/system_prompt_builder.py:99-126` | So khớp nội dung dynamic context sinh ra | Tạo 2 khối `BỘ NHỚ DÀI HẠN` và `KÝ ỨC HỒI TƯỞNG` | **PASS** |
| **10** | Nạp dị ứng hồ sơ vào `MetadataFilter` (Luồng chính) | `ai-service/pipelines/aria_pipeline.py:414-421` | Kiểm tra filter items trong `_handle_consultation_flow` | Tự động loại bỏ 100% món vi phạm dị ứng đã lưu | **PASS** |
| **11** | Nạp dị ứng hồ sơ trong side-queries đặt bàn | `ai-service/pipelines/aria_pipeline.py:613, 878, 1227` | Rà soát 3 vị trí gọi sang consultation flow | Đã truyền đầy đủ `guest_profile` & `recall_memories` | **PASS** |
| **12** | Endpoint `POST /api/memory/summarize-session` | `ai-service/main.py:164-187` | Kiểm tra routing FastAPI và schema request/response | Endpoint hoạt động, xử lý JSON hợp lệ | **PASS** |
| **13** | Endpoint sinh embedding `POST /api/memory/embedding` | `ai-service/main.py:196-220` | Kiểm tra routing và hàm sinh vector 768 chiều | Trả về vector 768 chiều chuẩn hóa $L_2$ | **PASS** |
| **14** | Test suite AI MemGPT | `ai-service/tests/test_memgpt_memory.py` | Chạy `pytest ai-service/tests/test_memgpt_memory.py` | **9/9 tests passed (0.37s)** | **PASS** |
| **15** | Regression test FSM Đặt bàn | `ai-service/tests/test_conversational_reservation.py` | Chạy `pytest ai-service/tests/test_conversational_reservation.py` | **75/75 tests passed (3.88s)** | **PASS** |
| **16** | Toàn bộ AI test suite (169 tests) | `ai-service/tests/` | Chạy `pytest ai-service/tests/ -q` | **169/169 tests passed in 101.74s** | **PASS** |
| **17** | Migration CSDL `31_add_guest_profiles_and_memories.sql` | `database/migrations/31_add_guest_profiles_and_memories.sql` | Truy vấn trực tiếp CSDL Supabase Production | Bảng `guest_profiles` và `guest_memories` đã tồn tại | **PASS** |
| **18** | Cột `embedding vector(768)` lưu trữ trên Supabase | `database/migrations/31_add_guest_profiles_and_memories.sql:45` | Thử nghiệm INSERT bản ghi vector và SELECT kiểm tra | Supabase chấp nhận và lưu đúng vector(768) | **PASS** |
| **19** | Migration CSDL `32_add_match_guest_memories_rpc.sql` | `database/migrations/32_add_match_guest_memories_rpc.sql` | Gọi `supabase.rpc('match_guest_memories')` | **Lỗi PGRST202:** Hàm chưa được chạy trên Supabase | **PARTIAL** |
| **20** | `getMyProfile` (Cache Redis + Supabase) | `backend/src/controllers/guestProfileController.js:47-97` | Kiểm tra logic tra cứu cache và fallback DB | Cache key `guest_profile:{userId}`, TTL 3600s | **PASS** |
| **21** | `updateMyProfile` (Explicit Overwrite) | `backend/src/controllers/guestProfileController.js:103-176` | Chạy unit test người dùng gỡ bỏ dị ứng | Cho phép ghi đè chủ động, xóa bỏ dị ứng nhầm | **PASS** |
| **22** | `getMyMemories` (Lịch sử tương tác) | `backend/src/controllers/guestProfileController.js:200-224` | Kiểm tra query Supabase `guest_memories` | Lấy 20 ký ức gần nhất theo `created_at DESC` | **PASS** |
| **23** | `ingestSessionSummary` (Idempotent `visit_count`) | `backend/src/controllers/guestProfileController.js:256-277` | Chạy unit test nhiều checkpoint trong 1 session | Redis `SETNX` bảo đảm visit_count chỉ tăng 1 lần/phiên | **PASS** |
| **24** | Chuẩn hóa chuỗi dị ứng tại Backend | `backend/src/controllers/guestProfileController.js:9-25` | Hàm `normalizeList` (trim, lowercase, deduplicate) | Loại bỏ hoàn toàn trùng lặp `"Tôm"` vs `"tôm"` | **PASS** |
| **25** | Bảo vệ tuyến đường `POST /session-summary` | `backend/src/routes/guestProfileRoutes.js:28` | Kiểm tra middleware `verifyInternalOrUserAuth` | Chặn đứng request không secret hoặc IDOR | **PASS** |
| **26** | Chống tấn công Timing Attack trên secret | `backend/src/middleware/authMiddleware.js:80` | Kiểm tra `crypto.timingSafeEqual` | So khớp độ dài và timing-safe an toàn | **PASS** |
| **27** | Đăng ký route `/api/guest-profile` | `backend/src/index.js:79` | Kiểm tra mount route Express | Đã đăng ký vào ứng dụng | **PASS** |
| **28** | Invalidate Redis Cache khi cập nhật profile | `backend/src/controllers/guestProfileController.js:181, 320` | Kiểm tra gọi `redis.del(cacheKey)` | Đã gọi xóa cache sau update hoặc ingest | **PASS** |
| **29** | Nạp song song Profile & Memories tại Gateway | `backend/src/controllers/aiController.js:220-226` | Kiểm tra `Promise.all` trong `consult()` | Nạp đồng thời Profile và Recall Memories | **PASS** |
| **30** | Gửi Profile & Memories sang AI Service qua SSE | `backend/src/controllers/aiController.js:240-241` | Kiểm tra cấu trúc payload gửi sang Pipecat | Có `guestProfile` và `recallMemories` trong payload | **PASS** |
| **31** | Checkpoint ngầm khi thêm món tại bàn | `backend/src/controllers/orderController.js:140-155` | Kiểm tra hàm `addItemsToExistingOrder` | Đã bổ sung `triggerBackgroundSummarizer` | **PASS** |
| **32** | Truyền `sessionId` từ Web Reservation | `frontend/src/pages/customer/ReservationPage.jsx:107` | Kiểm tra payload gửi `POST /api/reservations` | Đã đính kèm `sessionStorage.getItem('aria_session_id')` | **PASS** |
| **33** | Truyền `sessionId` từ Web Order & Cart | `frontend/src/pages/customer/CartPage.jsx:255, 266` | Kiểm tra payload gửi `POST /api/orders` | Đã đính kèm `sessionStorage.getItem('aria_session_id')` | **PASS** |
| **34** | Giao diện quản lý hồ sơ ẩm thực (Profile UI) | `frontend/src/pages/customer/ProfilePage.jsx:460-720` | Kiểm tra JSX, state management, API integration | Card "Sở thích Ẩm thực & Dị ứng", tag manager đầy đủ | **PASS** |
| **35** | Modal xác nhận an toàn trước khi lưu profile | `frontend/src/pages/customer/ProfilePage.jsx:707-745` | Kiểm tra dialog xác nhận Explicit Overwrite | Cảnh báo rõ ràng danh sách dị ứng sẽ ghi đè | **PASS** |
| **36** | Lời chào cá nhân hóa cho returning guest | `frontend/src/contexts/AiChatContext.jsx:67-80` | Kiểm tra logic điều kiện `visit_count > 1` | Khách mới chào tiêu chuẩn, khách cũ chào thân thiết | **PASS** |
| **37** | Huy hiệu "Khách quen" trên Widget | `frontend/src/components/AriaChatWidget/index.jsx:133-138` | Kiểm tra điều kiện render badge | Chỉ render khi `user && isReturningGuest` | **PASS** |
| **38** | Production Frontend Build | Vite Build | Chạy `cd frontend && npm run build` | **Vite build SUCCESS trong 5.28s (0 errors)** | **PASS** |
| **39** | Backend Automated Tests | `backend/tests/guestProfile.test.js` | Chạy `npm test` trong `backend` | **8/8 tests passed (0 fail)** | **PASS** |
| **40** | Mô hình nhúng ngữ nghĩa thực tế (NLP Model) | `ai-service/tools/embedding_helper.py` | Kiểm tra thuật toán sinh vector | Đang dùng thuật toán băm sin/MD5, chưa dùng mô hình NLP | **PARTIAL** |
| **41** | Personalization Accuracy ($P_{\text{pers}} \ge 95\%$) | Benchmark Golden Dataset | Tìm kiếm script đo đạc trong repository | Chưa có Golden Dataset đo đạc thực nghiệm | **NOT VERIFIED** |

---

## 4. KẾT QUẢ KIỂM TRA CHUYÊN SÂU TỪNG PHÂN HỆ

### 4.1. Phân hệ AI Microservice (`ai-service/`)
- **Điểm đánh giá:** **97.0 / 100**
- **Bằng chứng kiểm tra mã nguồn:**
  - `ai-service/pipelines/aria_pipeline.py`:
    - Dòng 613–614: Đã truyền `guest_profile=guest_profile, recall_memories=recall_memories` trong side-query khi khách tạm dừng đặt bàn để hỏi thực đơn.
    - Dòng 878–879: Đã truyền trong side-query khi khách từ chối xác nhận để hỏi món.
    - Dòng 1227–1228: Đã truyền trong side-query khi khách hỏi món trong lúc thu thập thông tin đặt bàn.
    - Dòng 414–421: Khối nạp dị ứng hồ sơ vào `entities.allergens` của `MetadataFilter` hoạt động chuẩn xác.
- **Thực thi kiểm thử tự động:**
  - Lệnh: `ai-service/.venv/bin/pytest ai-service/tests/ -q`
  - Kết quả: **169 passed, 2 warnings in 101.74s**. Không có bất kỳ ca kiểm thử nào thất bại hoặc bị bỏ qua.

### 4.2. Phân hệ Backend Express (`backend/`)
- **Điểm đánh giá:** **88.0 / 100**
- **Bằng chứng kiểm tra mã nguồn:**
  - `backend/src/routes/guestProfileRoutes.js`: Tuyến đường `POST /session-summary` đã được áp dụng middleware `verifyInternalOrUserAuth`.
  - `backend/src/middleware/authMiddleware.js`: Hàm `verifyInternalOrUserAuth` kiểm tra độ dài `a.length === b.length` kết hợp `crypto.timingSafeEqual(a, b)` để so khớp `x-internal-secret` với `INTERNAL_SERVICE_SECRET`. Khi người dùng gửi request, bắt buộc `req.body.userId === req.user.id`, triệt tiêu lỗ hổng IDOR.
  - `backend/src/controllers/guestProfileController.js`:
    - `updateMyProfile`: Chấp nhận mảng `allergies` từ body request để thực hiện Explicit Overwrite, lưu trữ thông qua Supabase `upsert` và xóa Redis cache.
    - `ingestSessionSummary`: Dùng Redis `SETNX` với key `session_counted:${userId}:${sessionId}` (TTL 24 giờ). Khi cùng 1 session gửi nhiều checkpoint, `visit_count` được giữ nguyên.
- **Thực thi kiểm thử tự động:**
  - Lệnh: `cd backend && npm test`
  - Kết quả: **8/8 passed in 742ms** (Bao gồm các test case: Từ chối unauth 401, từ chối sai secret 403, chấp nhận đúng secret 200, Union dị ứng, Explicit Overwrite dị ứng, Idempotent `visit_count`, và vector 768 chiều).

### 4.3. Phân hệ CSDL PostgreSQL / Supabase
- **Điểm đánh giá:** **80.0 / 100**
- **Bằng chứng kiểm tra trực tiếp trên CSDL Cloud Supabase (`mhkwzfkywfkkokhodqgz.supabase.co`):**
  - Bảng `guest_profiles`: Đã tồn tại trong CSDL, schema đúng chuẩn.
  - Bảng `guest_memories`: Đã tồn tại trong CSDL. Thử nghiệm INSERT bản ghi vector 768 chiều: Supabase nhận diện đúng kiểu dữ liệu `vector(768)` và lưu trữ thành công.
  - **Hàm RPC `match_guest_memories`:**
    ```json
    {
      "code": "PGRST202",
      "message": "Could not find the function public.match_guest_memories(match_count, match_threshold, p_user_id, query_embedding) in the schema cache"
    }
    ```
    Hàm RPC này chưa được khởi tạo trên Supabase thật. Do đó, tính năng Semantic Search thông qua pgvector trên môi trường Production hiện đang bị ngắt và tự động chuyển về Fallback sắp xếp thời gian.

### 4.4. Phân hệ Giao diện Frontend React (`frontend/`)
- **Điểm đánh giá:** **95.0 / 100**
- **Bằng chứng kiểm tra mã nguồn:**
  - `frontend/src/pages/customer/ProfilePage.jsx`:
    - Nạp hồ sơ khẩu vị từ API `GET /api/guest-profile/me`.
    - Thẻ quản lý Dị ứng: Hiển thị badge màu đỏ, nút xóa `x`, ô input thêm mới và 7 chip gợi ý nhanh.
    - 4 cấp độ cay và 4 khu vực ngồi với giao diện trực quan.
    - Nút bấm *"Lưu Hồ Sơ Khẩu Vị & Dị Ứng"* mở Modal xác nhận an toàn trước khi gọi `PUT /api/guest-profile/me`.
  - `frontend/src/contexts/AiChatContext.jsx` & `frontend/src/components/AriaChatWidget/index.jsx`:
    - Chỉ gán huy hiệu `Khách quen` và câu chào quay lại khi `Number(profile.visit_count) > 1`.
  - `frontend/src/pages/customer/ReservationPage.jsx` & `CartPage.jsx`:
    - Truyền `sessionId` lấy từ `sessionStorage.getItem('aria_session_id')` khi tạo đơn hoặc đặt bàn.
- **Thực thi kiểm thử đóng gói:**
  - Lệnh: `cd frontend && npm run build`
  - Kết quả: **Vite build SUCCESS trong 5.28s** (Assets: `index-BMiiwOwX.js` 1,662.99 kB, `index-D8paL6La.css` 83.59 kB).
  - Lệnh: `cd frontend && npm run lint`
  - Kết quả: **0 errors**, 232 warnings (chỉ có warning biến chưa dùng).

---

## 5. KẾT QUẢ KIỂM THỬ THỰC TẾ (AUTOMATED TEST LOGS)

### 5.1. Log Kiểm thử AI Microservice (Pytest)
```
$ ai-service/.venv/bin/pytest ai-service/tests/ -q
........................................................................ [ 42%]
........................................................................ [ 85%]
.........................                                                [100%]
169 passed, 2 warnings in 101.74s (0:01:41)
```

### 5.2. Log Kiểm thử Backend Express (Node Test Runner)
```
$ cd backend && npm test
> backend@1.0.0 test
> node --test tests/**/*.test.js

▶ Phase 6: MemGPT & Allergy Safety Latch Backend Test Suite
  ▶ 1. Bảo mật & Chống IDOR (P0 Defect 1)
    ✔ Phải từ chối request không có token và không có internal secret (401) (1.935995ms)
    ✔ Phải từ chối request có internal secret sai (403) (0.276954ms)
    ✔ Phải chấp nhận request có internal secret chính xác (200) (0.228253ms)
  ✔ 1. Bảo mật & Chống IDOR (P0 Defect 1) (3.448418ms)
  ▶ 2. Chuẩn hóa Dị ứng & Allergy Safety Latch Union (P2 Defect 7)
    ✔ Mô phỏng phép Hợp (Union) chuẩn hóa chữ thường và loại bỏ trùng lặp (1.466939ms)
  ✔ 2. Chuẩn hóa Dị ứng & Allergy Safety Latch Union (P2 Defect 7) (1.594874ms)
  ▶ 3. Explicit Overwrite cho phép xóa dị ứng khi người dùng chủ động sửa (P1 Defect 4)
    ✔ Người dùng xóa dị ứng "cua" khỏi ["tôm", "cua", "đậu phộng"] -> kết quả phải là ["tôm", "đậu phộng"] (0.342988ms)
  ✔ 3. Explicit Overwrite cho phép xóa dị ứng khi người dùng chủ động sửa (P1 Defect 4) (0.525768ms)
  ▶ 4. Idempotency chống tăng vọt visit_count (P1 Defect 3.2)
    ✔ Nhiều checkpoint trong cùng 1 sessionId không được tăng visit_count liên tục (0.38498ms)
  ✔ 4. Idempotency chống tăng vọt visit_count (P1 Defect 3.2) (0.620054ms)
  ▶ 5. Semantic Memory & pgvector 768 chiều (P1 Defect 3.3)
    ✔ Hàm generateLocalEmbedding phải sinh đúng vector 768 chiều chuẩn hóa L2 (1.655164ms)
    ✔ getEmbedding phải xử lý chuỗi rỗng an toàn không gây crash (0.22857ms)
  ✔ 5. Semantic Memory & pgvector 768 chiều (P1 Defect 3.3) (2.087935ms)
✔ Phase 6: MemGPT & Allergy Safety Latch Backend Test Suite (9.65337ms)
ℹ tests 8
ℹ suites 6
ℹ pass 8
ℹ fail 0
```

### 5.3. Log Build Frontend Production (Vite)
```
$ cd frontend && npm run build
> frontend@0.0.0 build
> vite build

✓ 885 modules transformed.
dist/index.html                     0.92 kB │ gzip:   0.46 kB
dist/assets/index-D8paL6La.css     83.59 kB │ gzip:  12.90 kB
dist/assets/index-BMiiwOwX.js   1,662.99 kB │ gzip: 456.87 kB
✓ built in 5.28s
```

---

## 6. DANH SÁCH LỖI VÀ KHOẢNG TRỐNG CÒN TỒN TẠI

| Mã | Phân loại | Mô tả chi tiết | Vị trí ảnh hưởng | Mức độ nghiêm trọng | Khuyến nghị giải pháp |
| :---: | :---: | :--- | :--- | :---: | :--- |
| **GAP-01** | **Database** | Hàm RPC `match_guest_memories` chưa được nạp lên CSDL Supabase Production (lỗi `PGRST202`). | Supabase Schema Cache | **P1 (High)** | Đăng nhập Supabase SQL Editor và chạy nội dung file [32_add_match_guest_memories_rpc.sql](file:///home/hung/KLTN/demo_res/SmartRestaurant/database/migrations/32_add_match_guest_memories_rpc.sql). |
| **GAP-02** | **AI / NLP** | Hàm sinh vector nhúng hiện tại sử dụng thuật toán băm (MD5 + hàm sin) thay vì mô hình ngôn ngữ ngữ nghĩa (SentenceTransformer). | `ai-service/tools/embedding_helper.py` | **P2 (Medium)** | Tích hợp mô hình `sentence-transformers/all-mpnet-base-v2` hoặc API `text-embedding-004` của Google/OpenAI để vector phản ánh đúng ngữ nghĩa tiếng Việt. |
| **GAP-03** | **Benchmark** | Chưa có script tự động đo lường độ chính xác cá nhân hóa $P_{\text{pers}}$ trên tập Golden Dataset. | `docs/plan/Phase6_MemGPT.md` | **P3 (Low)** | Xây dựng file `ai-service/tests/benchmark_personalization.py` với 50 kịch bản hội thoại mẫu để đo lường định lượng trong giai đoạn UAT. |

---

## 7. ĐÁNH GIÁ RỦI RO KHI VẬN HÀNH (RESIDUAL RISK ASSESSMENT)

1. **Rủi ro An toàn Thực phẩm (Allergy Safety):** **THẤP NHẤT (NEGLIGIBLE)**  
   - Đã được bảo vệ ở cả 2 tầng: Tầng 1 (Toán học Union tại Database/Controller) và Tầng 2 (Lọc cứng `MetadataFilter` trong toàn bộ các luồng tư vấn và đặt bàn). Khách hàng có quyền chủ động gỡ bỏ qua UI với modal xác nhận.
2. **Rủi ro Bảo mật & Quyền riêng tư (Security & Privacy):** **THẤP NHẤT (NEGLIGIBLE)**  
   - Lỗ hổng IDOR đã được khắc phục hoàn toàn. Không thể đọc/ghi hồ sơ của người dùng khác nếu không có JWT Token chính chủ hoặc `INTERNAL_SERVICE_SECRET`.
3. **Rủi ro Trải nghiệm Tìm kiếm Ngữ nghĩa (Semantic Search Degradation):** **TRUNG BÌNH (ACCEPTABLE / DEGRADED)**  
   - Do RPC chưa chạy trên Supabase và vector là hash-sine, hệ thống hiện đang truy xuất ký ức hồi tưởng theo thứ tự thời gian gần nhất (`ORDER BY created_at DESC LIMIT 5`). Điều này **không làm sập hệ thống** và **không làm mất an toàn**, nhưng làm giảm độ thông minh ngữ nghĩa của ký ức hồi tưởng cho đến khi chạy Migration 32 và kết nối mô hình NLP.

---

## 8. KẾT LUẬN NGHIỆM THU (ACCEPTANCE VERDICT)

Căn cứ theo các tiêu chuẩn thẩm định độc lập và quy định tại **Mục 5 & Mục 6 của Yêu cầu Nghiệm thu**:

- **Toàn bộ các lỗi P0 (Critical) và rủi ro an toàn thực phẩm** đã được giải quyết triệt để $100\%$.
- **Toàn bộ giao diện người dùng, phân quyền và kiểm soát phiên** đã hoạt động mượt mà và vượt qua mọi bài kiểm thử.
- Tuy nhiên, do tính năng truy xuất ngữ nghĩa pgvector thực tế trên Supabase vẫn đang chạy ở chế độ Fallback (do Migration 32 chưa được áp dụng lên Cloud Supabase) và vector generator đang ở dạng hàm băm giả lập:

### XẾP HẠNG CHÍNH THỨC:
$$\mathbf{PARTIAL\ –\ CONDITIONALLY\ ACCEPTED\ (92.5\%) }$$

### Điều kiện để đạt mức 100% – ACCEPTED:
1. Thực thi file SQL [32_add_match_guest_memories_rpc.sql](file:///home/hung/KLTN/demo_res/SmartRestaurant/database/migrations/32_add_match_guest_memories_rpc.sql) trên giao diện Supabase SQL Editor.
2. Cài đặt mô hình `sentence-transformers` hoặc kết nối API Embedding chuẩn để thay thế hàm băm sin trong [embedding_helper.py](file:///home/hung/KLTN/demo_res/SmartRestaurant/ai-service/tools/embedding_helper.py).
3. Chạy kiểm thử nghiệm thu trực tiếp kết quả Cosine Similarity trên Cloud Supabase đạt $similarity \ge 0.7$ cho các câu đàm thoại đồng nghĩa.
