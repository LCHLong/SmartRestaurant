# 📌 Note Bug Issue #21 (TC-RES-05: Lỗi Tra Cứu Đặt Bàn)

- **Lỗi gốc:** Endpoint `/api/reservations/available-slots` sập HTTP 500 khi tra cứu bàn trống; Aria lộ URL nội bộ (`http://backend:5001/...`) lên chat.
- **Đã sửa được:**
  - Thêm validate tham số (trả HTTP 400 chuẩn, không còn crash 500).
  - Chuẩn hóa mã đặt bàn dạng `#RES-XXXXXX`.
  - Ẩn hoàn toàn URL nội bộ trên giao diện chat.
- **Tồn đọng nghiêm trọng (Hardcode):**
  - Khi CSDL Supabase lỗi/mất mạng, backend **trả về HTTP 200 OK giả mạo kèm 15 bàn tĩnh (`DEFAULT_FALLBACK_TABLES`)**.
  - *Hậu quả:* Quán hết sạch bàn hoặc sập DB nhưng khách vẫn được báo còn 15 bàn và nhận đặt bàn ảo.
- **Tình trạng Test Suite:**
  - Test 5 cũ là test ngụy tạo (không hề ngắt mạng).
  - Đã sửa code test mock lỗi kết nối DB thật sự, xác minh đúng cơ chế fallback, test đã pass 5/5.
- **Cần làm tiếp:** Khi DB lỗi phải trả `HTTP 503 Service Unavailable`; Aria hướng dẫn khách gọi hotline giữ bàn thay vì tiếp tục đặt ảo.

---

# 📌 Note Bug Issue #22 (TC-REC-06: Lỗ Hổng Dị Ứng Gia Vị Ẩn)

- **Lỗi gốc:** Khách dị ứng cá hỏi về nước mắm/dầu hào trong món xào; Aria phớt lờ câu hỏi gia vị, gợi ý món chay đóng gói sẵn, gây rủi ro sốc phản vệ / ngộ độc.
- **Đã sửa được:** Bổ sung System Prompt 5 tầng (Allergy Protocol) hướng dẫn LLM từ chối gia vị mặn có nguồn gốc cá/hàu khi chạy online.
- **Tồn đọng nghiêm trọng (Hardcode & Mù gia vị ẩn):**
  - **Mù gia vị ẩn trong bộ lọc:** `MetadataFilter` chỉ lọc từ khóa `'cá'` (`cá, ca`), **hoàn toàn thiếu `"nước mắm"`, `"dầu hào"`, `"mắm tôm"`**. Món xào nêm nước mắm/dầu hào (như *Cải thìa xào tỏi*) vẫn bị lọt qua và gợi ý cho khách dị ứng nặng.
  - **Hardcode văn mẫu offline:** Nhánh offline (`_stream_offline_grounded`) hardcode nguyên văn 2 đoạn text trả lời có sẵn về dầu hào, nước mắm thay vì xử lý logic động.
- **Tình trạng Test Suite:** Unit test `test_10_seasoning_allergy_protocol` cố tình ép `_get_client -> None` để chỉ assert văn bản hardcode offline, không test RAG/LLM thật (test ngụy tạo).
- **Cần làm tiếp:** Mở rộng từ khóa nhóm dị ứng trong `MetadataFilter` (thêm nước mắm, dầu hào, mắm tôm...); tích hợp `guest_profile["allergies"]` vào RAG ở mọi nhánh.

---

# 📌 Note Bug Issue #23 (TC-MEM-01..10: Lỗi Bộ Nhớ MemGPT & Khách Quen)

- **Lỗi gốc:** Aria không nhận diện khách quen, không nhớ thói quen gia vị (ít cay, không hành), không lưu bệnh lý (gout kiêng bò/hải sản), và không thực thi xóa dữ liệu GDPR.
- **Thực tế chạy Test:** Test Playwright E2E thực tế **chạy XANH 100% (PASS)**, bot phản hồi đúng mọi kịch bản.
- **Vấn đề Hardcode (Không cần thiết & Sai lầm):**
  - **Sai lầm & Không cần thiết:** Hệ thống thực tế (Phase 6) vốn đã có sẵn khung logic MemGPT (nạp hồ sơ, Redis cache, prompt builder 3 tầng). Việc dev trước đó chèn `if/else` hardcode văn mẫu `"chú Hùng"` vào `memory_engine.py` là **hoàn toàn sai và không cần thiết**, vô tình làm tê liệt logic động thật của AI.
  - **Bản chất hardcode:** Bắt thô từ khóa (`"chú hùng đây"`, `"bị gout"`, `"như tuần trước"`) rồi trả thẳng văn bản tĩnh có sẵn, bỏ xó tham số `guest_profile` và `order_history`, không hề tương tác với CSDL.
  - **Minh chứng vô lý:** Khách **chưa hề đăng nhập (`userId = null`)** nhưng bot vẫn "nhớ" vanh vách; khách khác (cô Lan, anh Nam) bị đánh đồng thành chú Hùng; lệnh xóa GDPR không có user để xóa nhưng vẫn báo thành công.
- **Cần làm tiếp:** Gỡ bỏ các nhánh hardcode tĩnh trong `memory_engine.py`, để AI chạy bằng logic MemGPT động thật sự kết hợp luồng đăng nhập tài khoản khách hàng.

---

# 📌 Note Bug Issue #24 (TC-RES-01..12: Ràng Buộc Đặt Bàn & Sửa/Hủy Mã Bàn)

- **Lỗi gốc:** Aria nhận khách lúc 2h sáng (ngoài giờ hoạt động), nhận đoàn tiệc 500 khách, sai lệch thời gian tương đối NLP, và không có cơ chế sửa/hủy mã đặt bàn.
- **Phần đã sửa THẬT (Logic Python/NLP chuẩn):**
  - **Xử lý thời gian tương đối NLP (`TC-RES-03`):** Nhận diện chuẩn câu phức tạp (*"tối mốt tầm bảy giờ kém mười lăm"* -> `18:45`).
  - **Chặn thời gian ngoài giờ (`TC-RES-11` - file evidence 2h sáng):** Thuật toán `datetime_parser.py` phát hiện và từ chối yêu cầu đặt lúc `2h sáng` chuẩn xác.
  - **Chặn số khách bất thường (`TC-RES-12`):** Từ chối số khách `<= 0`; đoàn tiệc `500 người` (> 30 khách) được chuyển tiếp sang hotline VIP/Quản lý sự kiện.
- **Phần bị HARDCODE / GIẢ LẬP (Làm giả để qua bài test):**
  - **Sửa bàn ảo (`TC-RES-08`):** Khách nhắn đổi mã `#RES-` thì bot **không tra CSDL, không check bàn trống thật**, tự gán cứng mặc định `20:00` / `6 khách` và luôn báo thành công ảo.
  - **Hủy bàn ảo (`TC-RES-09`):** Bất kể mã có tồn tại hay không (backend trả 404), bot **luôn báo hủy thành công**.
  - **Lệch cấu hình giờ:** Câu thông báo lỗi bị hardcode cứng chữ *"10:00 đến 22:30"* thay vì lấy từ cấu hình động của nhà hàng (`08:00 - 22:00`).
- **Cần làm tiếp:** Tích hợp API Backend tra cứu và cập nhật/hủy thật mã `#RES-` trong CSDL Supabase; kết nối giờ mở cửa động từ `get_restaurant_settings()`.

---

# 📌 Note Bug Issue #25 (TC-ATC-02..11, TC-REC-02..10: Giỏ Hàng, Món Đối Thủ & Ngân Sách)

- **Lỗi gốc:** Bot gợi ý món ăn ngẫu nhiên khi khách thêm/xóa giỏ hàng, mặc cả giá hoặc hỏi sản phẩm thương hiệu đối thủ.
- **Phần đã sửa THẬT (Logic Parser giỏ hàng chuẩn):**
  - **NLP giỏ hàng (`TC-ATC-03`..`11`):** Bóc tách chính xác số lượng, tên món theo catalog thật, modifiers (đường/đá/không hành) và đồng bộ trực tiếp vào Context giỏ hàng trên giao diện (`cartCount` tăng thật).
- **Phần bị HARDCODE / CHẶN TRƯỚC AI (Short-circuit trước LLM):**
  - **Món đối thủ tĩnh (`TC-REC-09`):** Bắt từ khóa đối thủ (*KFC, Pizza Company...*), không truy vấn menu thật mà **trả cứng 3 món tĩnh** (*Gà nướng cơm lam, Cơm chiên hải sản hoàng kim, Bò lúc lắc*). Người ăn chay trường hay dị ứng hải sản vẫn bị ép ăn gà, bò và tôm cá!
  - **Mặc cả giá (`TC-REC-10`):** Trả chuỗi text đóng khung `BARGAIN_REFUSAL`, không đàm thoại tự nhiên.
  - **Ngân sách thấp cứng ngắc (`TC-REC-02`):** Bắt công thức `guest >= 2` và `ngân sách/khách < 25k` để ném văn mẫu *"khó để có một bàn tiệc no nê trọn vẹn"*. Hậu quả: Bỏ lọt câu 1 người 10k, nhưng chặn nhầm câu *"2 người vào uống trà đá ngân sách 40k"*.
- **Cần làm tiếp:** Để LLM tiếp nhận câu hỏi đối thủ/ngân sách kết hợp RAG thực đơn động thay vì chặn regex; phân biệt rõ nhu cầu ăn tiệc với nhu cầu uống nước.

---

# 📌 Note Bug Issue #26 (TC-SEC-02, TC-SUP-10: Kiểm Duyệt & Báo Động Quản Lý)

- **Lỗi gốc:** Khách chửi thề hoặc khiếu nại chờ món quá lâu (40 phút), Aria lại gợi ý món ăn ngẫu nhiên thay vì xử lý khủng hoảng.
- **Phần đã sửa THẬT (Hạ tầng Socket & UI):**
  - Socket.io phát tín hiệu thật (`priority_alert`, `ai_handoff_alert`) tới màn hình Phục vụ và Admin.
  - Giao diện render thẻ cảnh báo đỏ `PriorityAlertCard` trực quan.
  - Bộ từ điển lọc từ ngữ thô tục, chửi thề (`TOXIC_KEYWORDS`) hoạt động tốt.
- **Phần bị HARDCODE (Văn mẫu & Regex thô):**
  - **Văn bản đóng khung tĩnh:** Cả lời xin lỗi và phản hồi kiểm duyệt đều là 2 chuỗi string gán cứng trong `moderation_tools.py`, hoàn toàn không qua AI suy nghĩ.
  - **Báo động giả (False-Positive thực tế):** Bắt thô 2 từ khóa `"quản lý"` + `"gấp"` trước khi gọi AI.
  - *Hậu quả bộc lộ:* Khách khen ngon và xin tính tiền gấp để ra sân bay $\rightarrow$ Bot không hiểu ngữ cảnh, tự động kích hoạt **Cảnh Báo Đỏ (Red Alert)** và xin lỗi rối rít vì *"sự chậm trễ và trải nghiệm phục vụ không tốt"*!
- **Cần làm tiếp:** Dùng LLM phân tích cảm xúc (Sentiment Analysis) để hiểu đúng ý đồ khách thay vì bắt thô từ khóa Regex.


---

# 📌 Note Bug Issue #27 (TC-ATC-01..05: Thẻ Món Ăn & Thao Tác Giỏ Hàng Trong Chat)

- **Lỗi gốc:** Khung chat Aria chỉ render text Markdown thô khi tư vấn món, hoàn toàn không hiển thị `ProductCard` tương tác (thiếu ảnh, giá, mô tả, nút thêm giỏ và bộ tăng giảm số lượng).
- **Đã sửa THẬT 100% (Component UI & State React):**
  - **Render Dish Card đầy đủ (`TC-ATC-01`):** Tích hợp component `DishCard` trực tiếp vào bong bóng chat của Aria, hiển thị đầy đủ ảnh món ăn, giá niêm yết, nhãn Signature, và mô tả ngắn.
  - **Nút 1-chạm [+ Thêm vào giỏ] (`TC-ATC-02`):** Bấm nút trên thẻ lập tức kích hoạt action giỏ hàng thật (`addToCart`), cập nhật số lượng và tổng tiền trên header.
  - **Thêm món qua NLP (`TC-ATC-03`):** Bóc tách chính xác số lượng và tên món từ câu chat của khách để đẩy vào giỏ hàng.
  - **Modifiers & Ghi chú (`TC-ATC-04`):** Ghi nhận ghi chú hương vị, tùy biến đường đá vào sản phẩm trong giỏ.
  - **Bộ nút tăng/giảm số lượng (`TC-ATC-05`):** Cung cấp cụm nút `[-] [số lượng] [+]` ngay trên thẻ món để khách tùy chỉnh trước khi bấm thêm.
- **Tình trạng nghiệm thu:** **VERIFIED PASS (ĐẠT CHUẨN)** - Code React/Tailwind sạch, không hardcode, kết nối mượt mà với `CartContext`.

---

# 📌 Note Bug Issue #28 (TC-SUP-06..08: Nút Gọi Nhân Viên Bàn & Cooldown 45s)

- **Lỗi gốc:** Chatbot không có nút bấm gọi nhân viên; hoặc khi có nút thì bị phần tử nền che chắn con trỏ (Pointer Interception), click không gửi được tín hiệu socket, thiếu khay chọn nhanh lý do và thiếu cooldown chống spam.
- **Đã sửa THẬT (UI Component & Socket.io):**
  - **Sửa triệt để Pointer Events (`TC-SUP-06`):** Thêm class `relative z-20 pointer-events-auto` cho `CallStaffCard` và nút `[🛎️ Gọi nhân viên bàn]`, bảo đảm click ăn ngay 100%.
  - **Bắn tín hiệu Socket & Toast:** Khi click, hệ thống emit socket `call_staff` kèm `tableId` về màn hình phục vụ và hiện Toast thông báo thành công.
  - **Bộ đếm Cooldown 45s (`TC-SUP-08`):** Khóa nút và đếm ngược 45s lưu trong `sessionStorage`, chống khách spam liên tục.
  - **Khay Quick Reason Tags (`TC-SUP-07`):** Mở 4 thẻ chọn nhanh (*Xin đá*, *Chén đĩa*, *Thanh toán*, *Xin thêm đá*).
- **Lưu ý nghiệp vụ (Caveat):**
  - Thẻ `CallStaffCard` chỉ xuất hiện khi khách gọi phục vụ thông thường. Nếu khách dùng từ ngữ khẩn cấp gặp Quản lý, hệ thống sẽ ưu tiên hiển thị Cảnh Báo Đỏ (Bug #26) và chủ động ẩn nút này.
- **Tình trạng nghiệm thu:** **VERIFIED PASS (ĐẠT CHUẨN CỐT LÕI)**.


---

# 📌 Note Bug Issue #34 (UI: DishCard chèn ép chữ thành 'N.' và 'H..')
- **Lỗi:** Trên khung chat nhỏ gọn (360px), component DishCard dùng `sm:flex-row` gộp cả ảnh, chữ, stepper và nút thêm giỏ lên 1 hàng ngang, khiến tên và mô tả bị co rúm thành `N.` và `H..`.
- **Nguyên nhân:** Breakpoint viewport `sm:flex-row` tại `ChatMessage.jsx:126` không phù hợp với container chat hẹp.
- **Khắc phục:** Bỏ `sm:flex-row`, chuyển sang layout dòng trên (ảnh + tên + giá) và dòng dưới (stepper + nút bấm).

---

# 📌 Note Bug Issue #35 (Safety: Mâu thuẫn & Đặt nhầm món dị ứng Bún chả/Bún bò)
- **Lỗi:** Khách báo dị ứng nước mắm, AI nói "không đề xuất Bún chả và Bún bò Huế", nhưng ngay dưới lại render 2 thẻ DishCard cho 2 món này kèm nút thêm giỏ!
- **Nguyên nhân:** Hybrid Retriever nạp 2 món vào `suggestedItems`. Frontend chỉ kiểm tra độ dài mảng rồi render mà không đối soát nội dung từ chối dị ứng.
- **Khắc phục:** Thêm bộ lọc Post-generation an toàn, cấm render `suggestedItems` nếu món nằm trong danh sách loại trừ dị ứng của câu trả lời.

---

# 📌 Note Bug Issue #36 (State: Đặt bàn thành công nhưng số bàn hoạt động không đổi)
- **Lỗi:** Khách chốt bàn thành công nhưng sơ đồ bàn của Thu ngân/Phục vụ không đổi trạng thái sang `reserved` và số bàn hoạt động không tăng.
- **Nguyên nhân:** `reservationController.js` chỉ `INSERT` vào bảng `reservations`, không cập nhật trường `status` ở bảng `tables`, thiếu socket `table_status_updated`.
- **Khắc phục:** Cập nhật bảng `tables.status = 'reserved'` và emit socket cập nhật sơ đồ bàn real-time.

---

# 📌 Note Bug Issue #37 (Policy: Thiếu cơ chế xử lý đặt bàn quá hạn / No-Show)
- **Lỗi:** Khách đặt bàn nhưng quá giờ hẹn không đến, bàn bị giữ vô thời hạn (trong 90 phút buffer) khiến khách khác không đặt được.
- **Nguyên nhân:** Backend thiếu Background Cron Job quét các đơn đặt bàn quá 15 phút để chuyển trạng thái `no_show` và tự động giải phóng bàn.
- **Khắc phục:** Viết Cron Job định kỳ 5 phút quét và hủy đơn quá hạn, giải phóng bàn và thông báo cho nhân viên.

---

# 📌 Note Bug Issue #38 (MemGPT: Khách quen quay lại nhưng AI không chào được tên)
- **Lỗi:** Khách thân thiết có lịch sử ghé quán nhiều lần nhưng AI chỉ chào chung chung "Chào quý khách", không gọi được tên thật.
- **Nguyên nhân:** `getGuestProfile` tại `aiController.js:92` chỉ query bảng `guest_profiles` (chỉ có `visit_count`, `allergies`), không `JOIN` với bảng `users` nên thiếu trường tên `full_name`.
- **Khắc phục:** `JOIN` bảng `users` để lấy `full_name` và nạp vào prompt cho Aria chào đúng tên thân mật.

---

# 📌 Note Bug Issue #39 (FSM: Kẹt vòng lặp xác nhận, chat 'Huỷ đặt bàn' không thoát)
- **Lỗi:** Ở bước xác nhận đặt bàn, khách nhắn "Huỷ đặt bàn", AI không hủy mà tiếp tục lặp lại câu hỏi xác nhận chốt bàn.
- **Nguyên nhân:** `aria_pipeline.py:1024-1250` trong state `AWAITING_CONFIRMATION` thiếu bộ nhận diện ý định hủy (`is_cancel_intent`), rơi vào nhánh fallback lặp lại lời nhắc.
- **Khắc phục:** Bổ sung `is_cancel_intent(message)`, reset FSM state về `IDLE` hoặc `CANCELLED` khi khách yêu cầu hủy.

---

# 📌 Note Bug Issue #40 (Prompt: Suy thoái năng lực, AI từ chối nhận là trợ lý ẩm thực)
- **Lỗi:** Khách nhắn "Tôi muốn đặt bàn", Aria từ chối thẳng thừng: "Aria là trợ lý tư vấn ẩm thực nên không thể thực hiện thao tác đặt bàn trực tiếp...".
- **Nguyên nhân:** File `backend/src/services/prompts/ariaSystemPrompt.js:9` bị thiếu vai trò số 2 (Conversational Booking) so với bản Python, khiến Node.js LLM tự nhận mình không biết đặt bàn.
- **Khắc phục:** Bổ sung vai trò đặt bàn vào `ariaSystemPrompt.js` và đảm bảo Intent Classifier bắt chuẩn câu "Tôi muốn đặt bàn".

---

# 📌 Note Bug Issue #41 (UI: Rò rỉ mã '(SPEC-MOD-05)' và lặp chuông '🛎️ 🛎️')
- **Lỗi:** Tiêu đề hiển thị mã kỹ thuật nội bộ `🛎️ Hỗ Trợ Tại Bàn (SPEC-MOD-05)` và nút gọi bị lặp hai biểu tượng chuông `🛎️ 🛎️ Gọi nhân viên bàn`.
- **Nguyên nhân:** Dev hardcode chuỗi `(SPEC-MOD-05)` tại `ChatMessage.jsx:500` và lặp thẻ icon `<span>🛎️</span>` kèm emoji chuông tại dòng 532.
- **Khắc phục:** Xóa bỏ `(SPEC-MOD-05)` và xóa 1 emoji chuông bị lặp.
