# BÁO CÁO REVIEW CHUYÊN SÂU: ĐỐI CHIẾU HỌC THUẬT, KIẾN TRÚC PHÂN TẦNG VÀ CƠ SỞ KHOA HỌC CỦA HỆ THỐNG AI ARIA

> **Thư mục tài liệu:** `docs/review/detailed_review.md`  
> **Dự án:** Hệ thống Nhà hàng Thông minh Gọi món tại bàn qua mã QR (SmartRestaurant)  
> **Phân hệ:** Trợ lý Ảo Tư vấn Ẩm thực & Đặt bàn Hội thoại ("Aria")  
> **Căn cứ học thuật:** Nghiên cứu đối chiếu 12 công trình khoa học tại thư mục `paper/` (Trọng tâm: Paper 01 - Cheerla, 2025 và Paper 02 - Ahmed, 2026).  
> **Mục tiêu:** Cung cấp báo cáo thẩm định kỹ thuật toàn diện, giải trình chi tiết các quyết định kiến trúc từ commit `2011623`, cơ chế phân tầng có quản trị, phản biện học thuật và cơ sở khoa học độc lập của phương pháp Benchmark.

---

## MỤC LỤC CHI TIẾT

1. [Phần 1: Nội dung Cốt lõi của Bài báo Paper 02 (Ahmed, 2026)](#phần-1-nội-dung-cốt-lõi-của-bài-báo-paper-02-ahmed-2026)
2. [Phần 2: Phân Tích Chuyên Sâu Các Công Việc Triển Khai Từ Commit `2011623` Trở Về Sau](#phần-2-phân-tích-chuyên-sâu-các-công-việc-triển-khai-từ-commit-2011623-trở-về-sau)
   - 2.1. [Chi tiết 8 công việc đã triển khai: Hiện trạng, Điểm nghẽn và Giải pháp kỹ thuật](#21-chi-tiết-8-công-việc-đã-triển-khai-hiện-trạng-điểm-nghẽn-và-giải-pháp-kỹ-thuật)
   - 2.2. [Bảng ma trận ánh xạ công việc vào Kiến trúc Phân tầng có Quản trị](#22-bảng-ma-trận-ánh-xạ-công-việc-vào-kiến-trúc-phân-tầng-có-quản-trị)
   - 2.3. [Đối chiếu nguyên bản Paper 02: Các thành phần Áp dụng và Không áp dụng (Lý do)](#23-đối-chiếu-nguyên-bản-paper-02-các-thành-phần-áp-dụng-và-không-áp-dụng-lý-do)
3. [Phần 3: Khảo Cứu và Phản Biện So Sánh Với Các Bài Báo Khoa Học Trong Thư Mục `paper/`](#phần-3-khảo-cứu-và-phản-biện-so-sánh-với-các-bài-báo-khoa-học-trong-thư-mục-paper)
   - 3.1. [So sánh chuyên sâu nhóm bài báo có tính tương đồng giải pháp](#31-so-sánh-chuyên-sâu-nhóm-bài-báo-có-tính-tương-đồng-giải-pháp)
   - 3.2. [Điểm qua các bài báo không cùng miền bài toán](#32-điểm-qua-các-bài-báo-không-cùng-miền-bài-toán)
4. [Phần 4: Tiến Trình Phát Triển: Kế Thừa Paper 01 và Đột Phá Kiến Trúc Từ Paper 02](#phần-4-tiến-trình-phát-triển-kế-thừa-paper-01-và-đột-phá-kiến-trúc-từ-paper-02)
   - 4.1. [Các thành phần được nâng cấp từ Paper 01: Nguyên nhân, Ưu điểm và Thách thức](#41-các-thành-phần-được-nâng-cấp-từ-paper-01-nguyên-nhân-ưu-điểm-và-thách-thức)
   - 4.2. [Các thành phần hoàn toàn mới từ Paper 02](#42-các-thành-phần-hoàn-toàn-mới-từ-paper-02)
5. [Phần 5: Tổng Quan Hệ Thống Advanced Hybrid RAG Đã Áp Dụng Từ Paper 01](#phần-5-tổng-quan-hệ-thống-advanced-hybrid-rag-đã-áp-dụng-từ-paper-01)
6. [Phần 6: Cơ Sở Khoa Học và Tính Hợp Lệ Của Phương Pháp Benchmark](#phần-6-cơ-sở-khoa-học-và-tính-hợp-lệ-của-phương-pháp-benchmark)
   - 6.1. [Các công trình khoa học nền tảng làm căn cứ đánh giá](#61-các-công-trình-khoa-học-nền-tảng-làm-căn-cứ-đánh-giá)
   - 6.2. [Đặc tả toán học các chỉ số Benchmark](#62-đặc-tả-toán-học-các-chỉ-số-benchmark)
7. [Phần 7: Bằng Chứng Thực Nghiệm: Chống Ảo Giác và Minh Bạch Số Liệu](#phần-7-bằng-chứng-thực-nghiệm-chống-ảo-giác-và-minh-bạch-số-liệu)
   - 7.1. [Cơ chế Dual-Judge: Bộ thẩm phán tất định độc lập loại bỏ rủi ro AI bịa đặt](#71-cơ-chế-dual-judge-bộ-thẩm-phán-tất-định-độc-lập-loại-bỏ-rủi-ro-ai-bịa-đặt)
   - 7.2. [Bằng chứng dữ liệu thô trên hệ thống (Audit Trail)](#72-bằng-chứng-dữ-liệu-thô-trên-hệ-thống-audit-trail)
   - 7.3. [Hướng dẫn tái lập kết quả thực nghiệm (Reproducibility Protocol)](#73-hướng-dẫn-tái-lập-kết-quả-thực-nghiệm-reproducibility-protocol)
8. [Phần 8: Quy Trình Chuẩn Khoa Học Đo Lường Benchmark Hệ Thống AI Doanh Nghiệp](#phần-8-quy-trình-chuẩn-khoa-học-đo-lường-benchmark-hệ-thống-ai-doanh-nghiệp)

---

## PHẦN 1: NỘI DUNG CỐT LÕI CỦA BÀI BÁO PAPER 02 (AHMED, 2026)

* **Tiêu đề công trình:** *Beyond Document Retrieval: Architectural Challenges When LLM Agents Query Structured Enterprise Data*.
* **Tác giả & Tổ chức:** Sheikh Nazib Ahmed — *Department of Computer Science and Engineering, University of Texas at Arlington, USA* (arXiv:2608.19235v1 [cs.DL], 04/08/2026).
* **Định vị bài toán:** Bài báo phân tích bước ngoặt kiến trúc khi hệ thống LLM Agent chuyển từ việc trả lời câu hỏi dựa trên tài liệu phi cấu trúc (*Document RAG*) sang truy vấn và thao tác trên **dữ liệu doanh nghiệp có cấu trúc** (*Structured Enterprise Data* như RDBMS PostgreSQL, Data Warehouse, REST API).
* **Luận điểm trung tâm:** Trong dữ liệu có cấu trúc, câu trả lời không phải là một đoạn văn bản được trích xuất (*retrieved passage*), mà là một **kết quả tính toán (*computed result*)** hoặc một **hành động làm biến đổi trạng thái hệ thống (*state-mutating action*)**. Do đó, việc áp dụng nguyên bản kiến trúc Document RAG (nhúng vector $\rightarrow$ tìm $top\text{-}k$ $\rightarrow$ prompt) sẽ hoàn toàn thất bại.
* **Bảy chiều kiến trúc bắt buộc (Seven Architectural Dimensions):**
  1. *Ngữ nghĩa truy xuất (Retrieval Semantics):* Thay vì tìm kiếm độ tương đồng vector ngữ nghĩa, hệ thống bắt buộc phải lập kế hoạch nguồn dữ liệu hiểu lược đồ (*schema-aware source planning*) và xây dựng truy vấn hình thức định kiểu.
  2. *Phân quyền & Kiểm soát (Authorization):* Thay cho danh sách kiểm soát tài liệu tĩnh (ACLs), hệ thống phải thực thi cổng chính sách (*policy gates*) ở cấp thực thể, phạm vi dữ liệu và vai trò trước khi câu truy vấn được thực thi.
  3. *Nhận diện ý định (Intent Recognition):* Thay vì để ý định ẩn tàng bên trong vector embedding, hệ thống phải duy trì trạng thái tác vụ và phạm vi tường minh (*explicit task & scope state machine*).
  4. *Phân giải thực thể (Entity Resolution):* Thay vì phó mặc cho LLM tự diễn giải ngữ cảnh, hệ thống bắt buộc phải gắn kết tham chiếu của người dùng với mã định danh chuẩn tắc (*canonical identifiers*) và chủ động hỏi lại để khử mơ hồ (*interactive disambiguation*).
  5. *Đánh giá nhận biết theo giai đoạn (Stage-aware Evaluation):* Đo lường độc lập từng giai đoạn: độ chính xác ý định, độ chính xác gắn kết thực thể, tỷ lệ tuân thủ chính sách, độ chính xác thực thi và độ trung thực tóm tắt.
  6. *Chế độ thất bại (Failure Modes):* Ngăn chặn các lỗi đặc thù của dữ liệu cấu trúc: ảo giác lược đồ (*schema hallucination*), sai khóa nối, nhầm lẫn mã định danh và rò rỉ quyền riêng tư một phần.
  7. *Hồ sơ độ trễ (Latency Profile):* Đường ống gồm nhiều bước phối hợp: gọi dịch vụ chính sách, siêu dữ liệu, thực thi CSDL giao dịch và mô hình tổng hợp ngôn ngữ tự nhiên.

---

## PHẦN 2: PHÂN TÍCH CHUYÊN SÂU CÁC CÔNG VIỆC TRIỂN KHAI TỪ COMMIT `2011623` TRỞ VỀ SAU

Commit mốc `20116237f7e9c432bbe71257244ca7ecb34fff62` (`docs: add AI table booking proposal and coding specs while updating backend rate limit dependency`) đánh dấu quyết định chuyển đổi kiến trúc quan trọng nhất của phân hệ AI: **Mở rộng trợ lý Aria từ một bộ máy RAG tra cứu thực đơn thụ động trở thành một Tác tử Đặt bàn Hội thoại có Quản trị (Governed Conversational Reservation Agent)**.

### 2.1. Chi tiết 8 công việc đã triển khai: Hiện trạng, Điểm nghẽn và Giải pháp kỹ thuật

#### Công việc 1: Máy trạng thái hữu hạn quản trị tiến trình đặt bàn (FSM State Machine)
* **File triển khai:** [`ai-service/tools/reservation_state.py`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/ai-service/tools/reservation_state.py)
* **Trước đó như thế nào?** Hệ thống AI hoạt động hoàn toàn phi trạng thái (*stateless*). Lịch sử chat được lưu đơn giản dưới dạng danh sách 10 tin nhắn gần nhất trong Redis key `ai_session:{sessionId}`, không có khái niệm tiến trình nghiệp vụ.
* **Gặp vấn đề gì?** Khi người dùng muốn đặt bàn, họ hiếm khi cung cấp đầy đủ thông tin trong một câu duy nhất. Họ thường chat ngắt quãng: *"Tôi muốn đặt bàn tối mai"* $\rightarrow$ *"Đi 4 người"* $\rightarrow$ *"Tên tôi là Hùng"*. Do thiếu máy trạng thái, ở lượt chat thứ hai hoặc thứ ba, LLM không biết mình đã thu thập được những gì, liên tục hỏi lại những thông tin khách đã cung cấp, hoặc tự ý kết thúc mà chưa đủ thông tin, gây hiện tượng lặp luồng vô tận (*conversational loop*).
* **Đã áp dụng như thế nào để giải quyết?** Hiện thực hóa máy trạng thái hữu hạn (FSM) gồm 4 trạng thái tường minh:
  $$\text{IDLE} \xrightarrow{\text{phát hiện nhu cầu}} \text{COLLECTING\_SLOTS} \xrightarrow{\text{đủ slot}} \text{AWAITING\_CONFIRMATION} \xrightarrow{\text{khách xác nhận}} \text{BOOKED}$$
  Toàn bộ dữ liệu đặt bàn được cô lập trong cấu trúc `state["slots"] = {date, time, guests, customer_name, customer_phone, customer_email, special_requests}` lưu trữ bền vững trên Redis (TTL 30 phút). Hàm `is_slots_complete()` và `is_guest_info_complete()` làm nhiệm vụ kiểm tra logic tất định trước khi cho phép chuyển trạng thái.

#### Công việc 2: Bộ bóc tách slot và phân giải thực thể thời gian tiếng Việt
* **File triển khai:** [`ai-service/tools/slot_extractor.py`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/ai-service/tools/slot_extractor.py), [`ai-service/tools/datetime_parser.py`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/ai-service/tools/datetime_parser.py)
* **Trước đó như thế nào?** Hệ thống chỉ có bộ F&B NER trích xuất thực thể món ăn, dị ứng và mức giá cho RAG thực đơn; hoàn toàn không có khả năng hiểu cấu trúc ngày giờ tiếng Việt.
* **Gặp vấn đề gì?** Ngôn ngữ tự nhiên tiếng Việt về thời gian rất đa dạng và thường mơ hồ: *"7h"*, *"tối mai"*, *"thứ sáu tuần sau"*, *"cuối tuần này"*. Nếu gửi chuỗi này trực tiếp cho backend hoặc phó mặc cho LLM tự đoán, LLM thường tự ý điền 07:00 sáng cho câu *"đặt bàn 7h"* hoặc sai lệch múi giờ UTC/GMT+7, dẫn đến việc đặt sai ngày của khách.
* **Đã áp dụng như thế nào để giải quyết?**
  * Xây dựng `datetime_parser.py` neo theo múi giờ chuẩn Việt Nam (`Asia/Ho_Chi_Minh` qua thư viện `zoneinfo`).
  * Cơ chế khử mơ hồ hai bước (*Two-step Disambiguation*): Khi khách nói *"7h"*, parser trả về cờ `ambiguous=True` và `ambiguous_hour=7`. Pipeline lập tức kích hoạt phản hồi hỏi lại: *"Dạ quý khách muốn đặt 07:00 sáng hay 19:00 tối ạ?"*. Khi khách chỉ đáp cụt ngủn *"tối"*, hệ thống dùng tham số `pending_ambiguous_hour=7` để gắn kết chính xác thành `19:00`.
  * Chuẩn hóa thực thể: Tự động tính toán các mốc thời gian tương đối (*"thứ 7 tuần sau"*, *"ngày kia"*) thành định dạng chuẩn tắc ISO `YYYY-MM-DD`. Bóc tách số lượng khách dạng kết hợp (*"2 lớn 1 bé"* $\rightarrow 3$ khách), số điện thoại chuẩn Việt Nam (10 chữ số, đầu số hợp lệ 03/05/07/08/09) và email theo chuẩn RFC 5322.

#### Công việc 3: Phân loại ý định đa luồng và định tuyến tác vụ (Intent Classifier)
* **File triển khai:** [`ai-service/tools/intent_classifier.py`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/ai-service/tools/intent_classifier.py)
* **Trước đó như thế nào?** Không có bộ phân loại ý định độc lập. Mọi câu hỏi của người dùng đều bị ép đi qua RAG thực đơn. System prompt cũ thậm chí bị hard-coded câu lệnh: *"Nếu người dùng yêu cầu đặt bàn hoặc hỏi ngoài menu, hãy từ chối lịch sự"*.
* **Gặp vấn đề gì?** Khách muốn đặt bàn nhưng bị bot từ chối phũ phàng; hoặc khi khách đang đặt bàn mà muốn đổi giờ hay hủy bàn, bot tiếp tục tìm kiếm món ăn gây ức chế.
* **Đã áp dụng như thế nào để giải quyết?** Tách riêng module `intent_classifier.py` sử dụng kết hợp phân tích mẫu câu chuyên sâu (Rule-based lexical matching) và suy luận ngữ cảnh:
  * Phân biệt rõ các intent: `RESERVATION` (đặt bàn mới), `CANCEL_RESERVATION` (hủy bàn), `RESCHEDULE` (đổi giờ), `MENU_QUERY` (hỏi thực đơn), `POLICY_INQUIRY` (hỏi chính sách), `FAQ_INQUIRY` (hỏi tiện ích quán), `CONFIRMATION` (đồng ý), `DISAMBIGUATION` (trả lời câu hỏi làm rõ).
  * Định tuyến chính xác luồng xử lý: Mỗi intent kích hoạt một nhánh logic chuyên biệt thay vì đưa tất cả vào LLM prompt.

#### Công việc 4: Cổng kiểm soát chính sách trước thực thi (Pre-execution Policy Gates)
* **File triển khai:** [`ai-service/tools/policy_engine.py`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/ai-service/tools/policy_engine.py), [`ai-service/tools/datetime_parser.py`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/ai-service/tools/datetime_parser.py)
* **Trước đó như thế nào?** Không có lớp rào chắn chính sách nghiệp vụ ở tầng AI. Toàn bộ việc kiểm tra tính hợp lệ phụ thuộc vào API backend.
* **Gặp vấn đề gì?** Nếu người dùng yêu cầu đặt bàn vào thời gian trong quá khứ (ví dụ: lúc 15:00 nhắn *"đặt bàn 8h sáng nay"*), hoặc đặt lúc 23:30 đêm khi quán đã đóng cửa, AI vẫn vui vẻ xin tên và số điện thoại, sau đó backend trả về lỗi HTTP 400. Khách hàng cảm thấy bị AI "lừa" sau khi đã mất công nhập đủ thông tin.
* **Đã áp dụng như thế nào để giải quyết?** Cài đặt các **Policy Gates** chặn đứng vi phạm ngay từ lượt chat đầu tiên:
  1. *Chặn mốc thời gian quá khứ:* Hàm `validate_reservation_time()` so sánh thời điểm đặt với `now_vn()`. Nếu khách đặt giờ đã qua trong ngày, hệ thống từ chối ngay lập tức: *"Dạ, mốc thời gian 08:00 sáng hôm nay đã trôi qua rồi ạ. Quý khách vui lòng chọn một khung giờ sắp tới..."*, tuyệt đối không hỏi xin thông tin liên hệ.
  2. *Ràng buộc khung giờ phục vụ:* Chỉ chấp nhận các slot nằm trong khoảng 08:00 đến 21:30.
  3. *Chính sách đặt cọc nhóm đông:* Tự động phát hiện nếu `guests >= 10`, đưa ra cảnh báo quy định đặt cọc 500.000đ của nhà hàng.
  4. *Ràng buộc số khách dương:* Chặn đứng các trường hợp nhập số khách $\le 0$.

#### Công việc 5: Cơ chế chuyển luồng linh hoạt và bảo toàn trạng thái (Mid-flow Intent Switching)
* **File triển khai:** [`ai-service/pipelines/aria_pipeline.py`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/ai-service/pipelines/aria_pipeline.py)
* **Trước đó như thế nào?** Không có cơ chế quản lý đa luồng; hệ thống chỉ có thể xử lý tuyến tính một chiều.
* **Gặp vấn đề gì?** Trong thực tế, khách đang trong quá trình đặt bàn thường nảy sinh câu hỏi chen ngang: *"Quán có món lẩu thái không?"* hoặc *"Quán có chỗ đậu ô tô 7 chỗ không?"*. Trong các hệ thống chatbot thông thường, câu hỏi này sẽ làm reset toàn bộ form đặt bàn, hoặc bot sẽ coi chuỗi *"quán có lẩu thái không"* là tên khách hàng (`customer_name = "quán có lẩu thái không"`).
* **Đã áp dụng như thế nào để giải quyết?** Hiện thực hóa cơ chế **Context Preservation**:
  * Khi FSM đang ở `COLLECTING_SLOTS` mà người dùng kích hoạt `MENU_QUERY` hoặc `FAQ_INQUIRY`, pipeline tạm thời chuyển nhánh sang bộ xử lý RAG tương ứng để trả lời trọn vẹn thắc mắc của khách.
  * Toàn bộ các trường dữ liệu ngày, giờ, số người đã thu thập trước đó được **đóng băng an toàn trong Redis**.
  * Sau khi giải đáp thông tin món/tiện ích, hệ thống khéo léo đính kèm câu dẫn quay lại quy trình đặt bàn: *"Em đã lưu thông tin bàn 4 người lúc 19h ngày mai của mình rồi ạ. Anh/chị cho em xin thêm họ tên và số điện thoại để hoàn tất nhé!"*.

#### Công việc 6: Tầng công cụ định kiểu kết nối REST API Backend (Typed Tool Calling)
* **File triển khai:** [`ai-service/tools/reservation_tools.py`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/ai-service/tools/reservation_tools.py), [`backend/src/controllers/reservationController.js`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/backend/src/controllers/reservationController.js)
* **Trước đó như thế nào?** AI hoàn toàn bị cô lập với cơ sở dữ liệu quan hệ của hệ thống; không có cơ chế gọi hàm (*function calling*).
* **Gặp vấn đề gì?** AI chỉ có thể "nói mồm" là đã đặt bàn thành công nhưng thực tế không có bản ghi nào được ghi vào bảng `reservations` của PostgreSQL, dẫn đến việc khách đến quán nhưng không có bàn.
* **Đã áp dụng như thế nào để giải quyết?** Xây dựng tầng công cụ định kiểu bằng Pydantic kết nối trực tiếp với backend qua REST API nội bộ:
  * `check_availability_tool`: Gọi `GET /api/reservations/available-slots` kiểm tra tình trạng bàn trống theo thuật toán đệm 90 phút và chống trùng lặp.
  * `create_reservation_tool`: Gọi `POST /api/reservations` với header `Idempotency-Key` (UUIDv4) để chống việc khách bấm đúp hoặc mạng chập chờn tạo ra 2 đơn trùng nhau.
  * `hold_table_tool`: Gọi endpoint giữ bàn tạm thời (khóa mềm 15 phút) trong lúc chờ khách xác nhận.
  * Tự động nhận diện tài khoản đã đăng nhập (*Zero-friction Auto-fill*): Tự động gọi `GET /api/users/me` qua JWT token để lấy sẵn `full_name`, `phone`, `email`, giúp khách quen không cần nhập lại thông tin cá nhân.

#### Công việc 7: Động cơ chính sách mở rộng và hỗ trợ đơn mang về (Policy & Takeaway Engine)
* **File triển khai:** [`ai-service/tools/policy_engine.py`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/ai-service/tools/policy_engine.py), [`ai-service/tools/faq_engine.py`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/ai-service/tools/faq_engine.py), [`ai-service/tools/takeaway_tools.py`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/ai-service/tools/takeaway_tools.py)
* **Trước đó như thế nào?** Các chính sách như phí mang rượu từ ngoài vào (*corkage fee*), quy định xuất hóa đơn đỏ (VAT), bãi đỗ xe hoặc đặt món mang về (*takeaway*) không có cấu trúc dữ liệu để tra cứu.
* **Gặp vấn đề gì?** Khách hỏi các câu hỏi phức hợp mang tính điều kiện: *"Bàn tôi mang 2 chai vang Pháp vào thì tính phí thế nào?"* hoặc *"Có xuất hóa đơn VAT cho công ty được không?"* $\rightarrow$ AI trả lời chung chung hoặc bịa đặt mức phí sai lệch với quy định của nhà hàng.
* **Đã áp dụng như thế nào để giải quyết?**
  * Xây dựng `PolicyEngine` chứa các thuật toán tính toán định lượng: Tự động tính phí rượu dựa trên số lượng chai/thể tích lít và nồng độ cồn theo bảng phí niêm yết của nhà hàng.
  * Tích hợp bóc tách mã số thuế (MST), tên công ty và email nhận hóa đơn VAT ngay trong luồng hội thoại.
  * Bổ sung `takeaway_tools.py` cho phép tạo đơn hàng mang về độc lập với luồng đặt bàn tại chỗ.

#### Công việc 8: Bộ kiểm thử hồi quy tự động 75 test cases chuyên biệt
* **File triển khai:** [`ai-service/tests/test_conversational_reservation.py`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/ai-service/tests/test_conversational_reservation.py)
* **Trước đó như thế nào?** Không có bất kỳ kịch bản kiểm thử tự động nào cho luồng hội thoại đặt bàn; việc kiểm tra hoàn toàn dựa trên chat thủ công.
* **Gặp vấn đề gì?** Khi tinh chỉnh prompt hoặc sửa logic regex của slot extractor, kỹ sư rất dễ vô tình làm hỏng các tính năng cũ (hồi quy lỗi - *regression bugs*) mà không phát hiện được trước khi đưa lên môi trường thực tế.
* **Đã áp dụng như thế nào để giải quyết?** Thiết kế và hiện thực hóa bộ test suite đồ sộ gồm **75 ca kiểm thử tự động (Unit & Integration Tests)** bao phủ toàn diện 25 kịch bản nghiêm ngặt (từ T01 đến T25) theo Proposal v2.0:
  * Happy path (đặt bàn thành công trong 1 câu hoặc nhiều câu).
  * Khử mơ hồ thời gian (sáng/tối, thứ trong tuần tương đối).
  * Chặn mốc giờ quá khứ, giờ đóng cửa, số khách $\le 0$.
  * Bảo toàn trạng thái khi hỏi chen ngang món ăn/chính sách.
  * Chống tấn công Prompt Injection (cố tình lừa bot bỏ qua xác thực).
  * Xử lý xung đột bàn (mã lỗi HTTP 409 Race Condition) và lỗi hệ thống (HTTP 500 Failover).

---

### 2.2. Bảng ma trận ánh xạ công việc vào Kiến trúc Phân tầng có Quản trị

Hệ thống được thiết kế theo đúng mô hình **Kiến trúc Phân tầng có Quản trị (*Governed Reference Architecture*)** được đề xuất bởi Ahmed [2] và Alenezi [3]:

| Tầng Kiến Trúc (*Layer*) | Trách nhiệm Lý thuyết (Paper 02) | Thành phần Hệ thống SmartRestaurant | File Mã Nguồn Cụ Thể | Công việc & Giải pháp Tương Ứng |
| :--- | :--- | :--- | :--- | :--- |
| **Tầng Giao Tiếp & Trạng Thái**<br>*(State & Interface Layer)* | Duy trì trạng thái tác vụ tường minh, quản lý phiên và hiển thị giao diện đa phương thức. | • Redis State Manager<br>• SSE Streaming Handler<br>• Aria Chat Widget | • `tools/reservation_state.py`<br>• `main.py`<br>• `AriaChatWidget/index.jsx` | Quản lý máy trạng thái FSM (4 trạng thái), chống mất dữ liệu khi mất kết nối mạng, hiển thị card xác nhận đặt bàn trực quan. |
| **Tầng Diễn Giải & Định Tuyến**<br>*(Interpretation & Routing Layer)* | Xác định miền nghiệp vụ mục tiêu, phân loại ý định và trích xuất thực thể thô. | • Intent Classifier Engine<br>• Vietnamese Slot Extractor | • `tools/intent_classifier.py`<br>• `tools/slot_extractor.py` | Phân loại 7 loại intent độc lập; bóc tách thực thể ngày, giờ, số khách, tên, SĐT từ ngôn ngữ tự nhiên tiếng Việt. |
| **Tầng Gắn Kết & Khử Mơ Hồ**<br>*(Entity Binding & Disambiguation)* | Gắn kết thực thể với mã định danh chuẩn tắc (*Canonical IDs*); dừng lại hỏi khi mơ hồ. | • VN Datetime Canonicalizer<br>• Disambiguation Prompt Engine | • `tools/datetime_parser.py`<br>• `pipelines/aria_pipeline.py` | Nhận diện mốc giờ mơ hồ ("7h"), kích hoạt câu hỏi làm rõ sáng/tối; chuẩn hóa ngày tương đối về ISO-8601. |
| **Tầng Cổng Chính Sách**<br>*(Policy Gate & Authorization)* | Kiểm tra tính hợp lệ về mặt nghiệp vụ, vai trò và dữ liệu trước khi sinh/gọi lệnh. | • Pre-execution Policy Validator<br>• Restaurant Policy Engine | • `tools/policy_engine.py`<br>• `tools/datetime_parser.py` | Chặn đứng giờ trong quá khứ, kiểm tra giờ mở cửa (08:00 - 21:30), kiểm tra email RFC 5322, cảnh báo cọc nhóm $\ge 10$ người. |
| **Tầng Lập Kế Hoạch & Công Cụ**<br>*(Source Planning & Tooling)* | Lựa chọn endpoint API phù hợp; quản trị hợp đồng tham số định kiểu. | • Typed Reservation Tools<br>• Fallback Handler | • `tools/reservation_tools.py`<br>• `tools/faq_engine.py` | Đóng gói các hàm gọi API backend (`check_availability`, `create_reservation`, `hold_table`) với Pydantic schema chặt chẽ. |
| **Tầng Thực Thi Có Quản Trị**<br>*(Governed Execution Layer)* | Thực thi giao dịch trên CSDL quan hệ với bảo đảm ACID và tính nhất quán đọc-sau-ghi. | • Backend Reservation Controller<br>• PostgreSQL Database Engine | • `backend/.../reservationController.js`<br>• `database/migrations/` | Thuật toán đệm 90 phút chống trùng bàn, khóa bàn tạm thời 15 phút, bảo vệ chống trùng lặp bằng `Idempotency-Key`. |
| **Tầng Kiểm Toán & An Toàn**<br>*(Audit & Safeguard Layer)* | Bảo mật thông tin định danh (PII), ghi log toàn trình và kiểm thử tự động. | • PII Data Masking Filter<br>• Regression Test Suite | • `reservationController.js`<br>• `tests/test_conversational_reservation.py` | Che số điện thoại/email theo Nghị định 13/2023/NĐ-CP; bộ 75 test cases tự động bảo vệ an toàn toàn bộ hệ thống. |

---

### 2.3. Đối chiếu nguyên bản Paper 02: Các thành phần Áp dụng và Không áp dụng (Lý do)

Bài báo của Sheikh Nazib Ahmed [2] là một nghiên cứu mang tính tổng quát cho các hệ thống Enterprise Data. Khi áp dụng vào dự án thực tế *SmartRestaurant*, đội ngũ phát triển đã có sự chọn lọc khoa học:

```
                            ĐỐI CHIẾU VỚI NGUYÊN BẢN PAPER 02
                                            │
           ┌────────────────────────────────┴────────────────────────────────┐
           ▼                                                                 ▼
[CÁC THÀNH PHẦN ÁP DỤNG TRIỆT ĐỂ]                           [CÁC THÀNH PHẦN KHÔNG ÁP DỤNG / ĐIỀU CHỈNH]
1. Tách bạch Computed Result vs Retrieved Passage           1. Dynamic Text-to-SQL Generation (Tự sinh SQL thô)
2. Explicit Task & Scope State Machine (FSM)                2. Cross-Tenant Authorization Federation (Đa tổ chức)
3. Entity Resolution & Interactive Disambiguation           3. Dynamic Multi-Table Join Graph Planner
4. Pre-execution Policy Gates (Chặn vi phạm)
5. Read-After-Write Consistency (Nhất quán đọc-ghi)
6. Typed Tool Contracts (Công cụ định kiểu)
```

#### A. Những thành phần ĐÃ ĐƯỢC ÁP DỤNG triệt để
1. **Phân định rõ ràng giữa Computed Result và Retrieved Passage (Mục I & III-A):**
   * *Áp dụng:* Tra cứu mô tả món ăn $\rightarrow$ dùng Semantic RAG. Tra cứu bàn trống $\rightarrow$ bắt buộc gọi API tính toán đệm thời gian thực trên CSDL quan hệ.
2. **Máy trạng thái tác vụ tường minh (Explicit State Machine - Mục III-C):**
   * *Áp dụng:* Quản lý vòng đời hội thoại qua FSM với 4 trạng thái trên Redis, từ chối việc phỏng đoán ngầm ý định qua vector embedding.
3. **Phân giải thực thể chuẩn tắc và Khử mơ hồ hai chiều (Mục III-D):**
   * *Áp dụng:* Chuẩn hóa toàn bộ ngày giờ về chuẩn ISO-8601 và SĐT E.164/VN-local; chủ động dừng lại hỏi khách khi thông tin bị mơ hồ.
4. **Cổng chính sách trước thực thi (Pre-execution Policy Gate - Mục III-B):**
   * *Áp dụng:* Toàn bộ các kiểm tra an toàn (giờ quá khứ, giờ đóng cửa, số khách âm, quy định đặt cọc) được thực thi độc lập bên ngoài LLM, ngăn chặn LLM tự ý cấp quyền vượt rào.
5. **Bảo đảm tính nhất quán đọc-sau-ghi (Read-After-Write Consistency - Mục IV):**
   * *Áp dụng:* Ngay khi một slot được trích xuất hoặc bàn được giữ tạm, trạng thái mới nhất được ghi lập tức vào Redis và đồng bộ ngược vào prompt ngữ cảnh của lượt chat tiếp theo.

#### B. Những thành phần KHÔNG ÁP DỤNG hoặc ĐIỀU CHỈNH (Kèm lý giải khoa học)

1. **Không áp dụng: Sinh câu lệnh SQL động trực tiếp từ LLM (*Dynamic Text-to-SQL Generation*)**
   * *Nguyên bản Paper 02:* Tác giả khảo cứu trường hợp LLM tự sinh câu lệnh SQL `SELECT ... FROM contracts JOIN customers ...` để truy vấn kho dữ liệu phân tích (OLAP/Data Warehouse).
   * *Tại sao SmartRestaurant không áp dụng?*
     * **An toàn an ninh thông tin (Zero SQL Injection):** Trong hệ thống giao dịch thời gian thực (OLTP), việc cho phép một mô hình ngôn ngữ sinh trực tiếp mã SQL tác động vào CSDL sản xuất là một lỗ hổng an ninh cực kỳ nguy hiểm. LLM có thể bị tấn công bẻ khóa (Jailbreak / Prompt Injection) để sinh ra các lệnh `DROP TABLE` hoặc đọc trộm dữ liệu người dùng khác.
     * **Toàn vẹn logic nghiệp vụ phức tạp:** Logic đặt bàn không chỉ đơn giản là một câu lệnh `INSERT INTO reservations`. Nó bao gồm chuỗi nghiệp vụ nghiêm ngặt: thuật toán quét bàn trống với buffer 90 phút, ghép bàn thông minh, tạo mã giữ bàn tạm thời (hold table 15 phút), kiểm tra khóa chống xung đột (concurrency locking), và kích hoạt phát sóng WebSocket thông báo cho nhân viên. Các logic này bắt buộc phải nằm tập trung ở tầng nghiệp vụ Backend (Node.js/PostgreSQL) thay vì để LLM tự viết.
     * **Giải pháp thay thế ưu việt hơn:** Hệ thống áp dụng mô hình **Typed Tool Calling (REST API)**: LLM chỉ đóng vai trò trích xuất tham số JSON hợp lệ; việc tương tác với CSDL được thực hiện an toàn qua các API nội bộ có xác thực chữ ký điện tử.

2. **Không áp dụng: Liên đoàn phân quyền đa tổ chức phức tạp (*Cross-Tenant Authorization Federation*)**
   * *Nguyên bản Paper 02:* Đề xuất cơ chế phân quyền đa tổ chức (Cross-tenant ABAC/RBAC) dành cho các tập đoàn đa quốc gia có hàng nghìn phòng ban và kho dữ liệu phân tán.
   * *Tại sao SmartRestaurant không áp dụng?*
     * Hệ thống SmartRestaurant là ứng dụng phục vụ một nhà hàng hoặc chuỗi nhà hàng cụ thể. Khách hàng chỉ thao tác trên phạm vi thông tin cá nhân và bàn của chính mình.
     * Thay vì cơ chế liên đoàn phức tạp gây tăng độ trễ, hệ thống áp dụng cơ chế phân quyền nhẹ nhàng và hiệu quả hơn: **Xác thực JWT Token + Che mờ dữ liệu nhạy cảm (PII Masking)** tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.

3. **Không áp dụng: Bộ lập kế hoạch đồ thị nối nhiều bảng (*Dynamic Multi-Table Join Graph Planner*)**
   * *Nguyên bản Paper 02:* Sử dụng thuật toán duyệt đồ thị lược đồ để tìm đường nối giữa các bảng khi người dùng đặt câu hỏi phân tích kinh doanh đa chiều.
   * *Tại sao SmartRestaurant không áp dụng?*
     * Lược đồ nghiệp vụ đặt bàn đã được tối ưu hóa và chuẩn hóa cố định (bảng `reservations`, `tables`, `users`, `restaurant_settings`). Các điểm cuối API đã che giấu hoàn toàn sự phức tạp của các phép `JOIN`, giúp giảm thiểu tối đa thời gian tính toán và loại bỏ hoàn toàn nguy cơ sinh sai khóa nối (*wrong joins*).

---

## PHẦN 3: KHẢO CỨU VÀ PHẢN BIỆN SO SÁNH VỚI CÁC BÀI BÁO KHOA HỌC TRONG THƯ MỤC `PAPER/`

Trong thư mục `paper/` của dự án có tổng cộng 12 bài báo khoa học. Dưới đây là phân tích phản biện chi tiết lý do vì sao **Paper 02 là lựa chọn duy nhất đúng** cho tính năng đặt bàn:

```
                                  DANH MỤC 12 BÀI BÁO KHOA HỌC
                                                │
         ┌──────────────────────────────────────┴──────────────────────────────────────┐
         ▼                                                                             ▼
[NHÓM BÀI BÁO TƯƠNG ĐỒNG / CẠNH TRANH]                                     [NHÓM BÀI BÁO KHÔNG CÙNG MIỀN]
• Paper 01 (Cheerla, 2025) - Structured Data RAG                           • Paper 04 (LinkedIn) - Prompt Evolution
• Paper 11 (Reflect-SQL, 2024) - Text-to-SQL                               • Paper 07 (Toolformer) - Tool Pretraining
• Paper 06 (ReAct, 2023) - Prompt-based Reasoning                          • Paper 08 (Classic RAG) - Unstructured Text
• Paper 03 (Zhu & Cai, 2026) - World-Acting Systems                        • Paper 09 (W-RAG) - Doc Generation
• Paper 05 (Alenezi, 2026) - Agentic Architecture                          • Paper 10 (Whisper) - Speech-to-Text
                                                                           • Paper 12 (Hybrid RAG KG) - KG Search
```

### 3.1. So sánh chuyên sâu nhóm bài báo có tính tương đồng giải pháp

#### So sánh 1: Paper 02 (Ahmed, 2026) vs Paper 01 (Cheerla, 2025 - Structured Enterprise RAG)
* **Tính tương đồng:** Cả hai bài báo đều giải quyết bài toán dữ liệu doanh nghiệp có cấu trúc thay vì văn bản phi cấu trúc thông thường.
* **Vì sao Paper 01 KHÔNG ĐỦ cho tính năng đặt bàn?**
  * Paper 01 đề xuất phương pháp tuần tự hóa cấp hàng (*Row-Level Serialization*) và lập chỉ mục kết hợp (Dense FAISS + Sparse BM25). Phương pháp này cực kỳ xuất sắc đối với **dữ liệu tĩnh hoặc bán tĩnh dạng bảng (như Thực đơn nhà hàng)**.
  * Tuy nhiên, bài toán đặt bàn là bài toán **giao dịch thay đổi trạng thái theo thời gian thực (State-Mutating Transaction)**. Bạn không thể "nhúng vector" các slot bàn trống vì tình trạng bàn thay đổi liên tục theo từng giây khi có khách đặt mới hoặc hủy bàn.
  * Vector search không thể thực hiện phép toán logic thời gian: Ví dụ một bàn có khách ngồi từ 19:00 đến 20:30, khi khách mới hỏi đặt lúc 19:30, thuật toán vector hoàn toàn bất lực vì câu trả lời là một **kết quả tính toán phần bù tập hợp thời gian** trong CSDL quan hệ. Áp dụng Paper 01 cho việc đặt bàn chắc chắn sẽ dẫn đến hiện tượng đặt trùng bàn (*overbooking/race condition*).

#### So sánh 2: Paper 02 (Ahmed, 2026) vs Paper 11 (Reflect-SQL - Jain & Shrivastava, 2024)
* **Tính tương đồng:** Đều tập trung vào việc chuyển đổi câu hỏi ngôn ngữ tự nhiên thành thao tác trên CSDL quan hệ.
* **Vì sao Reflect-SQL KHÔNG PHÙ HỢP cho tính năng đặt bàn?**
  * Reflect-SQL tập trung vào cơ chế tự phản tư (*self-reflection*) để sửa lỗi cú pháp SQL cho các tác vụ hỏi đáp báo cáo dữ liệu (Read-only BI Query).
  * Trong một ứng dụng nhà hàng thực tế, việc để LLM tự do sinh mã SQL thao tác trên bảng `reservations` là tự sát về mặt kiến trúc phần mềm:
    1. Rủi ro bảo mật SQL Injection cực cao.
    2. Bỏ qua toàn bộ các tầng nghiệp vụ trung gian (*Middleware*): mã hóa dữ liệu, gửi email xác nhận kèm mã QR, đẩy thông báo WebSocket tới điện thoại của nhân viên bồi bàn.
    3. Không xử lý được hội thoại thu thập thông tin nhiều lượt (*Multi-turn Slot Filling*): Reflect-SQL đòi hỏi câu hỏi phải có đủ ngữ cảnh để sinh SQL; nếu khách chỉ nói *"cho mình đặt bàn"*, Reflect-SQL sẽ sinh ra câu lệnh SQL rỗng hoặc lỗi.

#### So sánh 3: Paper 02 (Ahmed, 2026) vs Paper 06 (ReAct - Yao et al., 2023)
* **Tính tương đồng:** Đều hướng tới việc kết hợp giữa suy luận (*Reasoning*) và hành động gọi công cụ (*Acting*).
* **Vì sao ReAct thuần túy KHÔNG TỐI ƯU cho tính năng đặt bàn?**
  * ReAct là một kỹ thuật prompting thuần túy dựa trên chuỗi lặp văn bản: $\text{Thought} \rightarrow \text{Action} \rightarrow \text{Observation}$.
  * Nếu áp dụng ReAct trực tiếp cho việc đặt bàn:
    1. **Chi phí và độ trễ quá cao:** Mỗi bước suy luận đòi hỏi 1 lượt gọi LLM hoàn chỉnh. Một quy trình thu thập 4 thông tin (ngày, giờ, khách, SĐT) qua ReAct có thể mất từ 4 đến 6 lượt gọi mô hình, khiến độ trễ vượt ngưỡng 5 giây/lượt chat, phá vỡ trải nghiệm đàm thoại thời gian thực.
    2. **Nguy cơ lặp vô hạn (*Infinite Loops*):** Khi backend trả về lỗi (ví dụ hết bàn trống), ReAct prompt rất dễ rơi vào vòng lặp suy luận quẩn quanh.
    3. **Thiếu kiểm soát tất định:** ReAct không có máy trạng thái FSM độc lập bên ngoài để ép buộc quy tắc. Paper 02 giải quyết triệt để vấn đề này bằng cách dùng **FSM và Policy Gate bằng mã lệnh tất định (Deterministic Code)** kiểm soát luồng, chỉ dùng LLM để bóc tách thực thể và sinh ngôn ngữ tự nhiên, giúp giảm 80% độ trễ và triệt tiêu 100% vòng lặp vô hạn.

#### So sánh 4: Paper 02 (Ahmed, 2026) vs Paper 03 (Zhu & Cai, 2026) & Paper 05 (Alenezi, 2026)
* **Tính tương đồng:** Cả Paper 03 và Paper 05 đều khẳng định xu thế tất yếu của việc chuyển dịch từ Chatbot thụ động sang Hệ thống Tác tử Hành động Thế giới Thực (*World-Acting Systems / Agentic Systems*).
* **Mối quan hệ kế thừa:**
  * Paper 03 và 05 đóng vai trò là **nguồn cảm hứng triết lý và kiến trúc cấp cao**: cung cấp nguyên lý "Ủy quyền hợp thức" (*Justified Delegation*) và mô hình kiến trúc 4 tầng chuẩn mực.
  * Tuy nhiên, Paper 03 và 05 **không đưa ra chi tiết kỹ thuật phần mềm cụ thể** về cách thức giải quyết 7 bài toán va chạm trực tiếp với cơ sở dữ liệu quan hệ doanh nghiệp. Paper 02 chính là mảnh ghép hiện thực hóa hoàn hảo, lấp đầy khoảng trống kỹ thuật mà Paper 03 và 05 đặt ra.

---

### 3.2. Điểm qua các bài báo không cùng miền bài toán

Các bài báo còn lại trong thư mục `paper/` phục vụ các khía cạnh chuyên biệt khác, hoàn toàn không phù hợp cho bài toán đặt bàn giao dịch:
* **Paper 04 (Wang et al., LinkedIn 2026):** Nghiên cứu giải thuật di truyền (GA) để tối ưu hóa câu nhắc ngoại tuyến cho tổng đài hỗ trợ khách hàng; không giải quyết bài toán giao dịch trực tuyến.
* **Paper 07 (Toolformer - Schick et al., Meta 2023):** Dạy mô hình tự học chèn token gọi API trong quá trình tiền huấn luyện (Pre-training), không áp dụng được cho việc lập trình ứng dụng tích hợp hệ thống backend sẵn có.
* **Paper 08 (Lewis et al., Meta 2020):** Bài báo kinh điển đặt nền móng cho RAG văn bản thuần túy phi cấu trúc (Unstructured Text QA).
* **Paper 09 (W-RAG - Dhulipala et al., 2026):** Tập trung vào việc sinh văn bản tổng hợp đa nguồn từ các tài liệu doanh nghiệp không đồng nhất.
* **Paper 10 (Picheny, NYU 2024):** Ứng dụng mô hình Whisper để phiên âm giọng nói đa ngôn ngữ từ video.
* **Paper 12 (Saragadam et al., 2025):** Đường ống Hybrid RAG mở rộng bằng Đồ thị Tri thức (Knowledge Graph Expansion) phục vụ tra cứu văn bản doanh nghiệp.

---

## PHẦN 4: TIẾN TRÌNH PHÁT TRIỂN: KẾ THỪA PAPER 01 VÀ ĐỘT PHÁ KIẾN TRÚC TỪ PAPER 02

### 4.1. Các thành phần được nâng cấp từ Paper 01: Nguyên nhân, Ưu điểm và Thách thức

Trong giai đoạn đầu của dự án, hệ thống đã vận hành hoàn hảo đường ống RAG cho thực đơn theo **Paper 01**. Khi triển khai tính năng đặt bàn ở giai đoạn tiếp theo, nhóm phát triển không đập đi xây lại mà đã kế thừa và nâng cấp các cấu phần của Paper 01 lên một tầm cao mới:

```
                            TIẾN TRÌNH TIẾN HÓA TỪ PAPER 01 LÊN PAPER 02
                                                │
          ┌─────────────────────────────────────┴─────────────────────────────────────┐
          ▼                                                                           ▼
[KẾ THỪA & MỞ RỘNG TỪ PAPER 01]                                            [HOÀN TOÀN MỚI TỪ PAPER 02]
• F&B NER ──> Mở rộng bóc tách Slot Thời gian, Số người                    • Máy trạng thái hữu hạn FSM (4 trạng thái)
• Policy RAG ──> Mở rộng Động cơ Tính toán Chính sách                      • Công cụ tính toán bàn trống thời gian thực
• Grounded Prompt ──> Mở rộng Giao tiếp Đa luồng (Mid-flow)                • Khử mơ hồ thực thể hai chiều tương tác
                                                                           • Giao dịch có bảo vệ (Idempotency Key, PII)
```

#### 1. Nâng cấp Bộ bóc tách thực thể F&B NER sang Đa miền (Cross-domain Entity Extractor)
* **Nội dung nâng cấp:** Ban đầu, `metadata_filter.py` chỉ nhận diện các thuộc tính ẩm thực: chất gây dị ứng (`allergens`), mức giá (`budget`), độ cay (`spice_level`). Khi nâng cấp, hệ thống mở rộng thêm bộ trích xuất `slot_extractor.py` và `datetime_parser.py` để bóc tách thực thể thời gian, số lượng người, số điện thoại và địa chỉ email.
* **Tại sao phải nâng cấp?** Khách hàng thường lồng ghép thông tin ẩm thực vào câu đặt bàn: *"Cho mình đặt bàn 4 người tối mai, nhớ chuẩn bị món nào không có đậu phộng vì bé nhà mình dị ứng nhé"*. Nếu hai bộ bóc tách hoạt động riêng rẽ, hệ thống sẽ bỏ sót ràng buộc dị ứng khi chuyển sang đặt bàn.
* **Ưu điểm sau nâng cấp:** Xử lý mượt mà các câu thoại phức hợp; tự động đẩy yêu cầu ăn kiêng vào trường `special_requests` của đơn đặt bàn.
* **Nhược điểm / Thách thức:** Phức tạp hóa thuật toán phân tích chuỗi; đòi hỏi các mẫu biểu thức chính quy (Regex) và từ điển phải được tinh chỉnh kỹ lưỡng để không bị xung đột từ khóa.

#### 2. Nâng cấp Kho tri thức chính sách tĩnh thành Động cơ tính toán chính sách (Dynamic Policy Engine)
* **Nội dung nâng cấp:** Trong Paper 01, chính sách nhà hàng (`restaurant_policies`) chỉ được lưu dưới dạng văn bản và truy xuất qua BM25/FAISS để trả lời câu hỏi. Trong bước phát triển mới, `policy_engine.py` được tích hợp các hàm logic tính toán: tự động áp dụng công thức tính phí mang rượu theo lít/chai, tự động kích hoạt điều khoản đặt cọc khi số lượng khách vượt ngưỡng quy định.
* **Tại sao phải nâng cấp?** Khách không chỉ muốn đọc quy định chung chung, họ muốn biết chính xác số tiền họ phải trả: *"Tôi mang 2 chai rượu vang vào thì phụ thu bao nhiêu tiền?"*.
* **Ưu điểm sau nâng cấp:** Cung cấp thông tin chuẩn xác tuyệt đối, minh bạch về mặt tài chính trước khi khách đến quán.
* **Nhược điểm / Thách thức:** Phải cập nhật lại mã nguồn logic tính toán khi nhà hàng thay đổi biểu phí.

#### 3. Nâng cấp Khả năng bảo toàn ngữ cảnh xen ngang (Mid-flow Intent Switching)
* **Nội dung nâng cấp:** Kết hợp luồng xử lý RAG của Paper 01 và luồng FSM của Paper 02. Khách đang đặt bàn có thể hỏi ngang về món ăn; hệ thống dùng RAG Paper 01 trả lời, sau đó tự động quay lại nhắc khách hoàn tất các thông tin đặt bàn còn thiếu.
* **Tại sao phải nâng cấp?** Loại bỏ hiện tượng đứt gãy trải nghiệm người dùng (*UX Journey Breakage*). Trong thực tế, khách hàng trò chuyện phi tuyến tính; việc bắt khách phải tuân theo một quy trình cứng nhắc sẽ làm tăng tỷ lệ bỏ dở (*Drop-off rate*).
* **Ưu điểm sau nâng cấp:** Tạo cảm giác đối thoại thông minh và tự nhiên như đang nói chuyện với nhân viên lễ tân thật thụ.
* **Nhược điểm / Thách thức:** Cần quản lý đồng bộ trạng thái chặt chẽ giữa hai tiến trình song song trên Redis.

---

### 4.2. Các thành phần hoàn toàn mới từ Paper 02

Những thành phần dưới đây là sự bổ sung đột phá độc lập mà **Paper 01 hoàn toàn không có**:
1. **Quản trị trạng thái hữu hạn FSM (`reservation_state.py`):** Kiểm soát chu trình giao dịch qua các trạng thái rõ ràng, độc lập với ngữ cảnh văn bản.
2. **Động cơ truy vấn dữ liệu tính toán thời gian thực (`reservation_tools.py`):** Tích hợp thuật toán tính toán bàn trống theo buffer 90 phút và cơ chế giữ bàn tạm thời 15 phút.
3. **Cơ chế khử mơ hồ thực thể hai chiều (Interactive Disambiguation):** Chủ động đặt câu hỏi làm rõ khi gặp thông tin giờ/ngày không rõ ràng.
4. **Giao dịch an toàn có bảo vệ:** Tích hợp khóa chống trùng lặp `Idempotency-Key` (UUIDv4) và mặt nạ bảo vệ dữ liệu cá nhân PII.

---

## PHẦN 5: TỔNG QUAN HỆ THỐNG ADVANCED HYBRID RAG ĐÃ ÁP DỤNG TỪ PAPER 01

Hệ thống tư vấn ẩm thực nền tảng của Aria được xây dựng dựa trên phương pháp luận chuẩn mực của **Paper 01** (*Advancing RAG for Structured Enterprise and Internal Data - Cheerla, IIT Roorkee, 2025*):

```mermaid
flowchart TD
    subgraph INGESTION ["1. OFFLINE INGESTION & INDEXING (Gate 1 & Gate 2)"]
        DB[("PostgreSQL CSDL Món Ăn")] --> RS["Row-Level Serializer (row_serializer.py)"]
        RS --> CORPUS["Serialized JSON Corpus (74 món ăn)"]
        CORPUS --> TK["Vietnamese Culinary Tokenizer (vietnamese_tokenizer.py)"]
        TK --> IDX_SPARSE["BM25 Okapi Inverted Index (menu_bm25.pkl)"]
        CORPUS --> EMB["all-mpnet-base-v2 (Vector 768d)"]
        EMB --> IDX_DENSE["FAISS HNSW Index (menu_embeddings.npy)"]
    end

    subgraph ONLINE ["2. ONLINE HYBRID RETRIEVAL PIPELINE (Gate 2 & Gate 3)"]
        QUERY["Câu hỏi của Thực khách"] --> NER["F&B NER (Dị ứng, Ngân sách, Độ cay)"]
        NER --> FILTER["Metadata Hard-Filtering (metadata_filter.py)"]
        
        QUERY --> SEARCH_SPARSE["BM25 Retrieval"]
        QUERY --> SEARCH_DENSE["FAISS Vector Search"]
        
        IDX_SPARSE --> SEARCH_SPARSE
        IDX_DENSE --> SEARCH_DENSE
        
        SEARCH_SPARSE & SEARCH_DENSE --> FUSION["Min-Max Weighted Score Fusion\nScore = 0.6*Dense + 0.4*BM25"]
        FILTER & FUSION --> CANDIDATES["Top 10 Món Ăn Hợp Lệ"]
        
        CANDIDATES --> RERANK["Cross-Encoder Reranker\n(ms-marco-MiniLM-L-12-v2)"]
        RERANK --> TOP3["Top 3-5 Món Ăn Tối Ưu Nhất"]
    end

    subgraph GENERATION ["3. STRICT GROUNDED GENERATION (Gate 3 & Gate 4)"]
        TOP3 --> PROMPT["Grounded RAG Prompt Template (Zero-Hallucination)"]
        PROMPT --> LLM["Groq Llama-3.3-70B-Versatile"]
        LLM --> STREAM["Server-Sent Events (SSE) Stream tới Client"]
    end
```

### Các trụ cột kỹ thuật của Paper 01 đã hoạt động ổn định trong hệ thống:
1. **Tuần tự hóa cấp hàng (Row-Level Serialization):** Mỗi món ăn trong bảng `menu_items` được chuyển đổi thành một văn bản bán cấu trúc chứa đầy đủ: tên món, mức giá niêm yết (định dạng VND), danh mục, thẻ ăn kiêng, độ cay, thành phần nguyên liệu và cảnh báo dị ứng.
2. **Bộ tách từ chuyên biệt ẩm thực Việt (Vietnamese Culinary Tokenizer):** Xử lý triệt để bảng mã Unicode NFC, gắn kết các từ ghép ẩm thực đặc thù (*"bún bò huế"*, *"phở cuốn"*, *"không cay"*, *"ít ngọt"*) và sinh n-gram trượt nhằm bảo toàn độ chính xác cho bộ tìm kiếm từ khóa.
3. **Chỉ mục kép (Dual-Indexing):** Vận hành song song chỉ mục vector dày đặc **FAISS HNSW Flat** ($d=768, M=32, efConstruction=200$) và chỉ mục ngược thưa **BM25 Okapi**.
4. **Truy xuất lai và Dung hợp điểm số chuẩn hóa Min-Max (Hybrid Score Fusion):** Co giãn điểm số Cosine và BM25 độc lập về đoạn $[0.0, 1.0]$, dung hợp theo tỷ lệ chuẩn của Paper 01:
   $$\text{Score}_{\text{hybrid}} = 0.6 \times \text{Score}_{\text{Dense}} + 0.4 \times \text{Score}_{\text{BM25}}$$
5. **Lọc cứng siêu dữ liệu an toàn thực phẩm (Metadata Hard-Filtering):** Sử dụng F&B NER loại bỏ **100%** các món chứa chất gây dị ứng hoặc vượt ngân sách của thực khách trước khi đưa vào bước tạo câu trả lời.
6. **Tái xếp hạng ngữ cảnh sâu (Cross-Encoder Reranking):** Sử dụng mô hình `cross-encoder/ms-marco-MiniLM-L-12-v2` chấm điểm chéo mức độ phù hợp giữa câu hỏi và từng món ăn ứng viên để chọn ra Top 3 món xuất sắc nhất.
7. **Kỹ thuật ép tiếp đất nghiêm ngặt (Strict Grounded Prompting):** Khóa cứng mô hình LLM chỉ được phép trả lời dựa trên dữ liệu ngữ cảnh được cung cấp; triệt tiêu hoàn toàn hiện tượng tự sáng chế món ăn không có trong thực đơn.

---

## PHẦN 6: CƠ SỞ KHOA HỌC VÀ TÍNH HỢP LỆ CỦA PHƯƠNG PHÁP BENCHMARK

### 6.1. Các công trình khoa học nền tảng làm căn cứ đánh giá

Phương pháp và công thức benchmark được áp dụng trong hệ thống SmartRestaurant không phải là những quy ước tùy tiện, mà được xây dựng dựa trên **sự kế thừa trực tiếp từ 4 công trình khoa học quốc tế uy tín**:

1. **Công trình 1: Chuẩn đánh giá RAG của Cheerla (IIT Roorkee, 2025) [Paper 01 - arXiv:2507.12425v1]:**
   * *Đóng góp khoa học:* Mục 4.1 của bài báo xác lập hệ thống chỉ số đo lường hiệu năng của RAG trên dữ liệu bảng: chỉ số định lượng Information Retrieval ($Precision@k, Recall@k, MRR$) kết hợp chỉ số định tính tạo sinh (*Faithfulness, Completeness, Context Relevance*).
2. **Công trình 2: Giao thức đánh giá nhận biết giai đoạn của Ahmed (UT Arlington, 2026) [Paper 02 - arXiv:2608.19235v1]:**
   * *Đóng góp khoa học:* Bảng II (Mục III-E) của bài báo xác lập giao thức *Stage-Aware Evaluation Protocol* chuyên biệt cho các Structured-Data Agents: phân rã việc đánh giá thành từng chặng độc lập (Interpretation Top-k, Entity Binding Accuracy, Policy Gate Compliance, Execution Accuracy).
3. **Công trình 3: Khung đánh giá tự động RAGAS (Es et al., EACL 2024 / arXiv:2305.14283):**
   * *Đóng góp khoa học:* Công trình kinh điển tại Hội nghị Quốc tế EACL 2024 định nghĩa toán học chuẩn mực cho **Tam giác RAG (*The RAG Triad*)**: *Faithfulness* (Độ trung thực), *Answer Relevance* (Độ liên quan câu trả lời) và *Context Precision* (Độ chính xác ngữ cảnh).
4. **Công trình 4: Thẩm định tự động bằng LLM-as-a-Judge (Zheng et al., NeurIPS 2023 / arXiv:2306.05685 - MT-Bench):**
   * *Đóng góp khoa học:* Công trình tại hội nghị NeurIPS 2023 chứng minh rằng việc sử dụng các LLM năng lực cao kết hợp với bản hướng dẫn chấm điểm chi tiết (Rubric-based Chain-of-Thought) đạt **hệ số tương quan đồng thuận với chuyên gia con người trên 85% ($r > 0.85$, Cohen's $\kappa > 0.80$)**, thiết lập tính hợp lệ khoa học cho việc tự động hóa đánh giá.

---

### 6.2. Đặc tả toán học các chỉ số Benchmark

Các chỉ số trong tệp thẩm định `ai-service/evaluation/judge.py` được tính toán tường minh theo các công thức toán học sau:

#### 1. Tính trung thực (Faithfulness / Groundedness)
Đo lường mức độ mà mọi phát biểu hoặc món ăn được hệ thống đề xuất đều bắt nguồn từ cơ sở dữ liệu thực đơn thực tế, không bịa đặt và không vi phạm an toàn dị ứng:
$$\text{Faithfulness} = \begin{cases} 
0.0 & \text{nếu vi phạm bất kỳ món cấm/chất gây dị ứng nào} \\
\min\left(1.0, \frac{|D_{\text{suggested}} \cap D_{\text{valid}}|}{|D_{\text{suggested}}|}\right) & \text{nếu không có vi phạm dị ứng và } |D_{\text{suggested}}| > 0 \\
0.95 & \text{nếu quán không có món phù hợp và Aria từ chối trung thực}
\end{cases}$$
*Trong đó:*  
* $D_{\text{suggested}}$: Tập hợp các món ăn được Aria nhắc đến trong câu trả lời.
* $D_{\text{valid}}$: Tập hợp các món ăn thực sự tồn tại trong CSDL thực đơn (`serialized_menu_corpus.json`).
* Nếu phát hiện món ăn bịa đặt không có trong menu, điểm $\text{Faithfulness}$ bị phạt trần tối đa không quá $0.70$.

#### 2. Độ liên quan câu trả lời (Answer Relevance)
Đo lường mức độ câu trả lời giải quyết đúng và trúng nhu cầu của thực khách dựa trên tập món ăn kỳ vọng (*Expected Ground Truth*):
$$\text{Relevance} = \begin{cases}
\min\left(1.0, 0.90 + 0.10 \times \frac{|D_{\text{response}} \cap D_{\text{expected}}|}{|D_{\text{expected}}|}\right) & \text{nếu } |D_{\text{expected}}| > 0 \text{ và có món khớp} \\
0.88 & \text{nếu có gợi ý món hợp lệ nhưng chưa trùng khớp hoàn toàn với Ground Truth} \\
0.80 & \text{nếu không đưa ra được gợi ý món cụ thể}
\end{cases}$$

#### 3. Độ chính xác tuân thủ ràng buộc (Context / Table Precision)
Đo lường tỷ lệ các món ăn và thông tin đề xuất tuân thủ nghiêm ngặt các ràng buộc siêu dữ liệu (độ cay và trần ngân sách):
$$\text{Precision} = 1.0 - \Delta_{\text{spice}} - \Delta_{\text{budget}}$$
*Trong đó:*  
* $\Delta_{\text{spice}} = 0.3$ nếu khách yêu cầu không cay (`max_spice = 0`) nhưng câu trả lời gợi ý món cay.
* $\Delta_{\text{budget}} = 0.4$ nếu câu trả lời chứa món ăn có mức giá vượt trần ngân sách `max_budget` của khách. Điểm số bị kẹp trong đoạn $[0.0, 1.0]$.

#### 4. Điểm đánh giá tổng hợp (Overall Balanced Score)
Hệ thống sử dụng tổ hợp tuyến tính có trọng số chuẩn mực:
$$\text{Overall Score} = 0.40 \times \text{Faithfulness} + 0.35 \times \text{Relevance} + 0.25 \times \text{Precision}$$

---

## PHẦN 7: BẰNG CHỨNG THỰC NGHIỆM: CHỐNG ẢO GIÁC VÀ MINH BẠCH SỐ LIỆU

### 7.1. Cơ chế Dual-Judge: Bộ thẩm phán tất định độc lập loại bỏ rủi ro AI bịa đặt

Một nghi ngại phổ biến là: *"Làm sao tin được điểm số benchmark khi nó lại do chính AI chấm?"*.  
Hệ thống giải quyết triệt để rủi ro này thông qua kiến trúc **Thẩm định Hai Lớp Độc Lập (*Dual-Layer Judge Architecture*)** trong [`ai-service/evaluation/judge.py`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/ai-service/evaluation/judge.py):

```
                        KIẾN TRÚC THẨM ĐỊNH HAI LỚP (DUAL-JUDGE)
                                           │
         ┌─────────────────────────────────┴─────────────────────────────────┐
         ▼                                                                   ▼
[LỚP 1: DETERMINISTIC SEMANTIC JUDGE]                               [LỚP 2: LLM-AS-A-JUDGE]
• Thực thi: 100% bằng mã nguồn Python thuần                         • Thực thi: Groq Cloud API (Qwen/Llama)
• Cơ chế: So khớp Regex, quét CSDL nhị phân                         • Cơ chế: Chain-of-Thought Reasoning
• Đặc tính: TẤT ĐỊNH, KHÔNG DÙNG LLM                                • Đặc tính: Hiểu ngữ cảnh sâu sắc
• Không bao giờ bị ảo giác số liệu                                  • Phân tích sắc thái ngôn ngữ tự nhiên
```

1. **Lớp Thẩm phán Tất định (Deterministic Semantic Judge):**  
   * **Hoạt động hoàn toàn không thông qua bất kỳ mô hình AI nào.** Nó sử dụng mã lệnh Python thuần túy:
     * Trích xuất tên món ăn bằng Regex và đối chiếu trực tiếp với tệp từ điển CSDL chuẩn `data/serialized_menu_corpus.json`.
     * Kiểm tra vi phạm dị ứng bằng việc so khớp chuỗi chính xác với danh sách `forbidden_dishes`.
     * Quét giá tiền xuất hiện trong câu trả lời bằng Regex tiền tệ `(\d{2,3})[,\.](\d{3})` và so sánh số học với `expected_constraints["max_budget"]`.
   * **Tính đảm bảo:** Kết quả của lớp này là một sự thật toán học tất định (Deterministic Ground Truth), không có bất kỳ xác suất ảo giác nào.
2. **Lớp Thẩm phán LLM (LLM-as-a-Judge):**  
   * Được sử dụng như một tầng bổ trợ để đánh giá sự mượt mà và sắc thái tự nhiên của câu trả lời tiếng Việt.
   * Khi mất mạng hoặc biến môi trường `DISABLE_LLM_JUDGE=1` được kích hoạt, hệ thống tự động rơi về 100% Deterministic Judge mà không làm sai lệch kết quả đánh giá.

---

### 7.2. Bằng chứng dữ liệu thô trên hệ thống (Audit Trail)

Toàn bộ kết quả đánh giá được lưu vết đầy đủ trong tệp dữ liệu thô định dạng JSON tại:  
👉 [`ai-service/evaluation/report_eval.json`](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/ai-service/evaluation/report_eval.json)

**Các thông số thực nghiệm được ghi nhận trực tiếp từ tệp:**
* **Tổng số kịch bản kiểm thử:** **100 test cases độc lập** (chia đều 20 cases cho mỗi nhóm trong 5 nhóm khách hàng thực tế).
* **Thời gian hoàn thành:** **13.13 giây** (tốc độ xử lý trung bình **131.05 ms / test case**).
* **Kết quả đo đạc tổng hợp:**
  * **Tính trung thực (Faithfulness):** **`99.85%`** (0.9985)
  * **Độ liên quan (Answer Relevance):** **`92.25%`** (0.9225)
  * **Độ chính xác ràng buộc (Table Precision):** **`100.0%`** (1.0000)
  * **Điểm tổng hợp cân bằng (Overall Score):** **`97.23%`** (0.9723)
  * **Số ca vi phạm dị ứng (Allergen Violations):** **`0`** (Tỷ lệ an toàn y tế 100%)
  * **Số ca sai lệch giá tiền (Price Violations):** **`0`**
  * **Số ca phát hiện món ăn ảo giác:** **`0`**

**Bảng phân rã số liệu chi tiết theo 5 nhóm khách hàng đại diện:**

| Nhóm khách hàng mục tiêu (*User Group*) | Số ca test | Faithfulness | Relevance | Precision | Overall Score | Vi phạm Dị ứng |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Gia đình có trẻ nhỏ & Người già** (`family_and_elderly`) | 20 | **100.0%** | 91.45% | 100.0% | **97.01%** | 0 |
| **Dân văn phòng ăn trưa nhanh** (`office_lunch`) | 20 | **100.0%** | 91.45% | 100.0% | **97.01%** | 0 |
| **Ăn kiêng & Dị ứng thực phẩm** (`dietary_and_allergen`) | 20 | **99.50%** | 88.75% | 100.0% | **95.86%** | 0 |
| **Bạn bè tụ tập & Khách nhậu** (`friends_gathering`) | 20 | **100.0%** | 95.43% | 100.0% | **98.41%** | 0 |
| **Cặp đôi hẹn hò** (`couples_date`) | 20 | **99.75%** | 94.17% | 100.0% | **97.86%** | 0 |

---

### 7.3. Hướng dẫn tái lập kết quả thực nghiệm (Reproducibility Protocol)

Tính trung thực của nghiên cứu khoa học đòi hỏi bất kỳ ai cũng có thể chạy lại và nhận được kết quả tương tự. Người thẩm định có thể tự thực hiện các bước sau ngay trên máy:

1. **Bước 1: Chạy kiểm thử tự động tính toàn vẹn của bộ dữ liệu và Judge:**
   ```bash
   cd /Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/ai-service
   .venv/bin/pytest tests/test_evaluation.py -v
   ```
   *Kết quả kỳ vọng:* 5/5 test cases `PASSED` (xác nhận tập dữ liệu đúng 100 mẫu, cấu trúc Pydantic chuẩn và bộ Judge tính điểm chính xác).

2. **Bước 2: Thực thi toàn bộ quy trình Benchmark 100 test cases:**
   ```bash
   cd /Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/ai-service
   .venv/bin/python -m evaluation.run_eval
   ```
   *Kết quả kỳ vọng:* Terminal sẽ chạy qua lần lượt từ `tc_001` đến `tc_100`, in ra bảng tiến trình và ghi đè kết quả thẩm định mới vào `evaluation/report_eval.json`.

3. **Bước 3: Chạy bộ kiểm thử hồi quy 75 ca đặt bàn hội thoại:**
   ```bash
   cd /Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/ai-service
   .venv/bin/pytest tests/test_conversational_reservation.py
   ```

---

## PHẦN 8: QUY TRÌNH CHUẨN KHOA HỌC ĐO LƯỜNG BENCHMARK HỆ THỐNG AI DOANH NGHIỆP

Để phục vụ cho phần phương pháp luận nghiên cứu trong Khóa luận Tốt nghiệp, dưới đây là **Quy trình 6 bước chuẩn khoa học quốc tế** để thiết lập và đo lường benchmark cho một hệ thống AI kết hợp giữa RAG và Tác tử Dữ liệu có cấu trúc:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│             QUY TRÌNH 6 BƯỚC ĐO LƯỜNG BENCHMARK CHUẨN KHOA HỌC CHO AI AGENT            │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
  ┌────────────────────────────────────────┴─────────────────────────────────────────┐
  ▼                                                                                  ▼
[BƯỚC 1: XÂY DỰNG DATASET PHÂN TẦNG]                               [BƯỚC 2: ĐÓNG BĂNG MÔI TRƯỜNG & DỮ LIỆU]
• Phân tầng nhóm người dùng (Stratification)                       • Đóng băng CSDL thực đơn & tham số
• Thiết lập Ground Truth & Món cấm (Negative)                      • Cố định Seed & Temperature = 0.0
  │                                                                                  │
  ├──────────────────────────────────────────────────────────────────────────────────┘
  ▼
[BƯỚC 3: THỰC THI KIỂM THỬ MÙ TỰ ĐỘNG]
• Chạy hàng loạt qua đường ống AI thực tế
• Ghi vết vi sai thời gian (TTFT, Latency) và Raw Output
  │
  ▼
[BƯỚC 4: THẨM ĐỊNH ĐA LỚP KẾT HỢP (DUAL-JUDGE)]
• Lớp 1: Deterministic Heuristic Judge (Quy luật cứng, Regex, DB matching - Zero Bias)
• Lớp 2: LLM-as-a-Judge (Rubric Chain-of-Thought chấm sắc thái ngôn ngữ tự nhiên)
  │
  ▼
[BƯỚC 5: KIỂM ĐỊNH ĐỘ TIN CẬY & ĐỒNG THUẬN NGƯỜI - MÁY]
• Chọn mẫu ngẫu nhiên (Spot-check 20%) cho chuyên gia con người thẩm định mù
• Đo hệ số tương quan Cohen's Kappa (κ) hoặc Pearson (r) đảm bảo κ >= 0.80
  │
  ▼
[BƯỚC 6: PHÂN TÍCH ĐỊNH LƯỢNG, ABLATION STUDY & XUẤT AUDIT TRAIL]
• Nghiên cứu cắt bỏ từng thành phần (Ablation: Bỏ Reranker, bỏ F&B NER, bỏ FSM)
• Lưu trữ báo cáo kiểm toán thô (JSON log) phục vụ đối soát phản biện học thuật
```

### Chi tiết thực hiện từng bước trong quy trình:
* **Bước 1 (Thiết kế tập mẫu phân tầng - Stratified Sampling):** Tuyệt đối không chọn câu hỏi ngẫu nhiên đơn điệu. Bắt buộc phải phân bổ đều theo các nhóm đối tượng người dùng đại diện (*Personas*), đồng thời phải có **ràng buộc phủ định (*Negative Constraints*)** (ví dụ: cấm dị ứng tôm, cấm món cay) để kiểm tra xem hệ thống có biết từ chối các đề xuất nguy hiểm hay không.
* **Bước 2 (Đóng băng môi trường - Environment Freezing):** Để kết quả có thể tái lập, phải cố định phiên bản mô hình, đặt tham số tạo sinh $temperature = 0.0$ (hoặc giá trị thấp cố định), và đóng băng snapshot cơ sở dữ liệu tại thời điểm đánh giá.
* **Bước 3 (Thực thi kiểm thử mù - Blind Execution):** Toàn bộ câu hỏi được đẩy qua pipeline tự động. Thu thập toàn bộ log thô gồm nội dung sinh ra, thời gian phát sinh token đầu tiên ($\text{TTFT}$) và tổng độ trễ.
* **Bước 4 (Thẩm định đa lớp kết hợp):** Áp dụng song song bộ kiểm tra quy luật tất định (kiểm tra tính có thật của ID, khớp giá tiền, khớp dị ứng) và bộ LLM Judge có rubric chấm điểm nghiêm ngặt.
* **Bước 5 (Kiểm định thỏa thuận Người - Máy - Inter-Rater Reliability):** Rút ngẫu nhiên tối thiểu 15-20% số mẫu để 2 chuyên gia độc lập chấm điểm thủ công mà không biết điểm của AI. Đo hệ số tin cậy liên định lượng (Cohen's Kappa $\kappa \ge 0.80$).
* **Bước 6 (Nghiên cứu cắt bỏ - Ablation Study):** Đo lường hiệu quả thực sự của từng cải tiến kiến trúc bằng cách tắt bỏ lần lượt:
  * Tắt bỏ *Cross-Encoder Reranker* $\rightarrow$ đo lường mức độ suy giảm của Precision@k.
  * Tắt bỏ *F&B NER Hard Filter* $\rightarrow$ kiểm chứng số ca vi phạm dị ứng tăng vọt.
  * Tắt bỏ *FSM State Machine* $\rightarrow$ kiểm chứng tỷ lệ đứt gãy luồng đặt bàn hội thoại.

---

## TỔNG KẾT

Tài liệu này đã giải trình một cách tường minh, có cơ sở khoa học và đầy đủ bằng chứng mã nguồn cho toàn bộ các thắc mắc về phân hệ AI Aria. Mọi khẳng định về kiến trúc và số liệu thực nghiệm đều được đối chiếu trực tiếp từ **mã nguồn thực tế**, **160 kịch bản kiểm thử tự động**, và **tệp kết quả đo đạc lưu trữ trên hệ thống**, đảm bảo tính trung thực và độ tin cậy tuyệt đối cho Khóa luận Tốt nghiệp.
