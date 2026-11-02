# NGHIÊN CỨU ÁP DỤNG CÁC BÀI BÁO KHOA HỌC VÀ PHÁT TRIỂN TÍNH NĂNG TƯƠNG LAI CHO HỆ THỐNG AI ARIA

> **Kính gửi:** Giảng viên Hướng dẫn  
> **Dự án:** Hệ thống Nhà hàng Thông minh SmartRestaurant  
> **Phân hệ:** Trợ lý Ảo Tư vấn Ẩm thực & Đặt bàn Hội thoại ("Aria")  
> **Tài liệu đính kèm:** Báo cáo Kỹ thuật Toàn văn (`report.md`)

---

## 1. TỔNG QUAN MỤC TIÊU BÁO CÁO

Báo cáo kỹ thuật của phân hệ AI **Aria** được xây dựng nhằm giải quyết trọn vẹn chu trình nghiên cứu và phát triển phần mềm theo hướng tiếp cận **AI có Quản trị (*Governed AI Architecture*)**, tập trung vào **2 vấn đề cốt lõi**:

1. **Định hướng và phản biện học thuật việc áp dụng các bài báo khoa học (Papers) cho hệ thống hiện tại và tương lai:** Phân tích đối chiếu và chấm điểm định lượng (thang điểm $10$) đối với **18 công trình khoa học** (gồm 5 bài báo cốt lõi lưu trữ trong thư mục `paper/` từ Paper 01 đến Paper 05 và 13 bài báo mở rộng từ ICLR, NeurIPS, arXiv giai đoạn 2023–2026). Báo cáo làm rõ lý do vì sao một số kỹ thuật không phù hợp cho luồng giao dịch đặt bàn hiện tại nhưng lại là nền tảng lý tưởng cho các tính năng mở rộng trong tương lai.
2. **Phát triển 9 tính năng tương lai ($\text{F1} \rightarrow \text{F9}$) dựa trên các Paper đã khảo cứu:** Chuyển hóa toàn bộ các đóng góp lý thuyết từ 18 bài báo thành **9 bản thiết kế kỹ thuật hoàn chỉnh**, phân tách rõ các module kế thừa từ mã nguồn sẵn có của dự án và các thành phần AI cần xây dựng mới, kèm theo sơ đồ luồng dữ liệu và lộ trình ưu tiên triển khai ($\text{P1} \rightarrow \text{P4}$).

---

## 2. TÓM TẮT NỀN TẢNG HIỆN TẠI: KẾT QUẢ ÁP DỤNG PAPER 01 & PAPER 02 (MỤC 1 – MỤC 7)

Trước khi mở rộng sang các tính năng tương lai, hệ thống AI Aria đã hoàn thành việc triển khai và kiểm chứng thực nghiệm hai bài báo nền tảng cho hai luồng nghiệp vụ chính:

### 2.1. Luồng Tư vấn Thực đơn Ngữ nghĩa — Áp dụng Paper 01 (Cheerla, IIT Roorkee, 2025)
* **Kỹ thuật cốt lõi:** Áp dụng tuần tự hóa dữ liệu bảng cấp hàng (*Row-Level Serialization*), truy xuất lai ghép kết hợp tìm kiếm ngữ nghĩa (**FAISS Dense $768\text{d}$**) và tìm kiếm từ khóa (**BM25 Okapi**), xếp hạng lại bằng **Cross-Encoder Reranker**.
* **An toàn thực phẩm tuyệt đối:** Tách riêng bộ lọc cứng siêu dữ liệu (*Metadata Hard-Filtering*) bằng mã lệnh Python trước khi đưa vào LLM (`Llama-3.3-70B`), giúp loại bỏ $100\%$ các món ăn chứa chất gây dị ứng hoặc vượt ngân sách của thực khách.

### 2.2. Luồng Đặt bàn Hội thoại có Quản trị — Áp dụng Paper 02 (Ahmed, UT Arlington, 2026)
* **Chuyển dịch kiến trúc:** Giải quyết sự đứt gãy của RAG truyền thống khi tương tác với cơ sở dữ liệu giao dịch (OLTP) bằng **Kiến trúc Phân tầng có Quản trị (*Governed Reference Architecture*)**.
* **Cơ chế kiểm soát:**
  1. **Máy trạng thái hữu hạn (FSM 4 trạng thái):** Quản lý tiến trình (`IDLE` $\rightarrow$ `COLLECTING_SLOTS` $\rightarrow$ `AWAITING_CONFIRMATION` $\rightarrow$ `BOOKED`) bền vững trên Redis ($\text{TTL } 30\text{ phút}$).
  2. **Khử mơ hồ thực thể thời gian hai chiều:** Tự động phát hiện các mốc giờ mơ hồ trong tiếng Việt (*"7h"*, *"tối mai"*) để hỏi làm rõ và chuẩn hóa về định dạng ISO-8601 theo múi giờ `Asia/Ho_Chi_Minh`.
  3. **Cổng kiểm soát chính sách trước thực thi (*Pre-execution Policy Gates*):** Chặn ngay tại tầng hội thoại các yêu cầu đặt giờ trong quá khứ, ngoài khung giờ mở cửa ($08\text{:}00 - 21\text{:}30$) hoặc số lượng khách không hợp lệ.
  4. **Chuyển luồng bảo toàn ngữ cảnh (*Mid-flow Switching*):** Cho phép khách đang đặt bàn hỏi chen ngang về thực đơn/chính sách phụ thu mà không làm mất các thông tin đặt bàn đã thu thập.
  5. **Hợp đồng API định kiểu (*Typed Tool Calling*):** Quét bàn trống theo thời gian thực ($\text{buffer } 90\text{ phút}$), khóa mềm giữ bàn $15\text{ phút}$ và tạo bản ghi PostgreSQL an toàn với `Idempotency-Key`.

### 2.3. Kết quả Đo lường Thực nghiệm (Benchmark & Testing)
* **Kiểm thử hồi quy:** Vượt qua trọn vẹn **75 test cases tự động** bao phủ 25 kịch bản nghiệp vụ và bảo mật (chống Prompt Injection, xung đột bàn, khử mơ hồ).
* **Đánh giá Benchmark độc lập (100 test cases trên 5 nhóm khách hàng qua cơ chế Dual-Judge):**
  * **Tính trung thực (*Faithfulness*):** Đạt **$99.85\%$** (mục tiêu $\ge 95.0\%$).
  * **Độ chính xác ràng buộc bảng (*Table Precision*):** Đạt **$100.0\%$** (tuân thủ tuyệt đối ngân sách và độ cay).
  * **Độ liên quan câu trả lời (*Answer Relevance*):** Đạt **$92.25\%$** (mục tiêu $\ge 85.0\%$).
  * **Điểm tổng hợp cân bằng (*Overall Balanced Score*):** Đạt **$97.23\%$** (với **$0/100$ ca vi phạm dị ứng**, độ trễ xử lý trung bình **$131.05\text{ ms/ca}$**).

---

## 3. TRỌNG TÂM 1: ĐỊNH HƯỚNG & PHẢN BIỆN ÁP DỤNG CÁC PAPER CHO TÍNH NĂNG TƯƠNG LAI (MỤC 3 & MỤC 8)

Điểm cốt lõi trong phương pháp luận của báo cáo là **không áp dụng máy móc một mô hình AI cho mọi bài toán**, mà phân tích phản biện ưu/nhược điểm của từng công trình khoa học để định tuyến vào đúng tính năng tương lai:

### 3.1. Tư duy Phản biện & Tái định hướng Kỹ thuật
1. **Tại sao không dùng ReAct thuần túy (Paper 06 - ICLR 2023) cho Đặt bàn, nhưng lại áp dụng cho Gợi ý bán thêm (Tính năng F5)?**
   * Ở luồng đặt bàn cần tính tất định cao, vòng lặp tự do `Thought -> Action -> Observation` của ReAct khiến mỗi lượt thoại phải gọi LLM từ $4 - 6$ lần (độ trễ $> 5\text{s}$) và dễ rơi vào vòng lặp vô tận khi hết bàn ($47\%$ lỗi của ReAct là lặp suy luận). Do đó, luồng đặt bàn bắt buộc dùng **FSM tất định của Paper 02**.
   * Tuy nhiên, ở bài toán **Gợi ý bán thêm (Upsell — Tính năng F5)**, việc dùng **ReAct giới hạn tối đa 2 vòng** lại phát huy tối đa khả năng suy luận linh hoạt trên giỏ hàng thực tế để đưa ra lời mời gọi món kèm tự nhiên.
2. **Tại sao loại bỏ Text-to-SQL tự do (Paper 11 - Reflect-SQL) và tận dụng các Paper Kiến trúc (Paper 03, 04, 05)?**
   * Sinh SQL trực tiếp từ LLM gây rủi ro SQL Injection và bỏ qua tầng logic nghiệp vụ ở Backend (bắn sự kiện WebSocket cho nhân viên, gửi email QR).
   * Ngược lại, các bài báo **Paper 03 (World-Acting Systems)**, **Paper 04 (LinkedIn Self-Evolving Agent)** và **Paper 05 (Agentic Software Architecture)** cung cấp khung lý thuyết chuẩn mực để mở rộng hệ thống sang **điều phối bếp thời gian thực (F8)**, **tự động học từ lỗi đặt bàn hàng tuần (F1)** và **cô lập tác tử quản trị nội bộ với tác tử khách hàng (F7)**.

### 3.2. Bảng Tổng hợp Đánh giá & Định hướng 18 Bài báo Khoa học

| Nhóm Định Hướng | Bài Báo Khoa Học Căn Cứ | Nguồn Tài Liệu | Điểm (/10) | Vai Trò & Định Hướng Áp Dụng Trong Hệ Thống |
| :--- | :--- | :--- | :---: | :--- |
| **1. Tối ưu Đặt bàn & Ghép chỗ động ($\text{F1}$)** | • **Paper 02:** *Beyond Document Retrieval* (Ahmed, 2026)<br>• **EpisodeSim** (Stanford, *arXiv:2409.11394*)<br>• **Genie Worksheets** (Stanford, *arXiv:2407.05677*)<br>• **Paper 04:** *Self-Evolving Agent* (LinkedIn, 2026) | • Thư mục `paper/`<br>• Mở rộng arXiv<br>• Mở rộng arXiv<br>• Thư mục `paper/` | **`9.5`**<br>**`9.0`**<br>**`8.5`**<br>**`8.0`** | Kế thừa FSM hiện tại; bổ sung *Symbolic Scaffolding* để giải bài toán ghép bàn động, quản lý bảng phụ thuộc (tự tính lại cọc/VIP khi đổi số khách) và tinh chỉnh trọng số ghép bàn hàng tuần từ log lỗi. |
| **2. Tư vấn Món ăn & Đồ thị Tri thức ($\text{F2}$)** | • **ChefMind:** *Chain-of-Exploration* (*arXiv:2409.10237*)<br>• **Paper 01:** *Structured Enterprise RAG* (Cheerla, 2025)<br>• **SwissFKG & Graph-RAG** (*arXiv:2407.10156*)<br>• **Paper 12:** *Hybrid RAG with KG & RRF* (2025) | • Mở rộng arXiv<br>• Thư mục `paper/`<br>• Mở rộng arXiv<br>• Tham chiếu mở rộng | **`9.5`**<br>**`9.0`**<br>**`8.8`**<br>**`8.2`** | Mở rộng bộ truy xuất lai của Paper 01 bằng Đồ thị Tri thức Ẩm thực (*Food KG*), giải quyết các câu hỏi cảm xúc/thời tiết mơ hồ và đề xuất nguyên liệu/gia vị thay thế an toàn khi khách bị dị ứng. |
| **3. Gọi món Giọng nói Thời gian thực ($\text{F3}$)** | • **Gemini Live & Full-Duplex Speech** (*arXiv:2403.05530*)<br>• **Paper 10:** *Whisper for Hospitality* (NYU, 2024) | • Mở rộng arXiv<br>• Tham chiếu mở rộng | **`9.2`**<br>**`8.8`** | Giao tiếp giọng nói hai chiều độ trễ thấp ($< 500\text{ ms}$), hỗ trợ ngắt lời (*barge-in*) và nhận diện chính xác tên món ăn tiếng Việt đa phương ngữ trong môi trường nhà hàng. |
| **4. Bộ nhớ Dài hạn Khách quen ($\text{F4}$)** | • **MemGPT:** *LLMs as Operating Systems* (UC Berkeley, *arXiv:2310.08560*) | • Mở rộng arXiv | **`9.3`** | Tổ chức bộ nhớ phân tầng (*Working, Recall, Archival Memory*) để ghi nhớ bền vững hồ sơ dị ứng, khẩu vị và bàn ngồi yêu thích của khách quen qua nhiều lần ghé quán. |
| **5. Gợi ý Bán thêm Thông minh ($\text{F5}$)** | • **Paper 06:** *ReAct: Reasoning and Acting* (Princeton, ICLR 2023) | • Tham chiếu mở rộng | **`8.5`** | Chạy chu trình suy luận ReAct giới hạn 2 bước để phân tích giỏ hàng hiện tại và gợi ý món tráng miệng/đồ uống cân bằng vị giác. |
| **6. Nhận diện Món ăn bằng Ảnh ($\text{F6}$)** | • **Qwen2-VL:** *Vision-Language Model* (Alibaba, *arXiv:2409.12191*) | • Mở rộng arXiv | **`8.7`** | Phân tích hình ảnh món ăn do khách tải lên để tìm món tương đồng trong thực đơn và cảnh báo sớm các nguyên liệu gây dị ứng tiềm ẩn trong ảnh. |
| **7. Phân công Ca trực Tự động ($\text{F7}$)** | • **OptiMUS:** *LLMs & Solvers* (Stanford, *arXiv:2402.10172*)<br>• **Paper 05:** *Agentic Architecture* (Alenezi, 2026)<br>• **LLM4OR:** *Operations Research Survey* (*arXiv:2410.03519*) | • Mở rộng arXiv<br>• Thư mục `paper/`<br>• Mở rộng arXiv | **`9.8`**<br>**`8.5`**<br>**`8.0`** | Tách biệt tác tử nội bộ (`StaffRosterAgent`) theo Paper 05; dùng LLM dịch yêu cầu tự nhiên của quản lý sang bộ giải toán học Google OR-Tools CP-SAT để xếp lịch trực tự động chuẩn luật lao động $100\%$. |
| **8. Điều phối Bếp Thời gian thực ($\text{F8}$)** | • **Paper 03:** *From LMs to World-Acting Systems* (Zhu & Cai, 2026) | • Thư mục `paper/` | **`8.0`** | Đồng bộ trạng thái vật lý hai chiều qua sự kiện giữa màn hình bếp (KDS) và trợ lý Aria; chủ động nhắn báo cho khách ngay khi món ăn vừa nấu xong. |
| **9. Trợ lý Đa ngôn ngữ Quốc tế ($\text{F9}$)** | • **Paper 01 & Paper 02** (*Zero-shot Cross-lingual Architecture*) | • Thư mục `paper/` | **`9.0`** | Tận dụng tính độc lập ngôn ngữ của kiến trúc Paper 01 & 02, nâng cấp vector đa ngôn ngữ chuẩn $768\text{d}$ và tự động bổ sung chú thích văn hóa ẩm thực Việt Nam cho khách quốc tế. |

---

## 4. TRỌNG TÂM 2: THIẾT KẾ PHÁT TRIỂN 9 TÍNH NĂNG TƯƠNG LAI DỰA TRÊN CÁC PAPER (MỤC 9)

Từ định hướng ở Bảng 8, Mục 9 của báo cáo đã thiết kế chi tiết kiến trúc kỹ thuật cho từng tính năng (**$\text{F1} \rightarrow \text{F9}$**), đảm bảo **kế thừa trực tiếp các thành phần đã có sẵn trong mã nguồn dự án** và xác định rõ các module AI cần phát triển mới:

### 4.1. Tính năng F1 — Ghép Bàn Động & Tối ưu Công suất (RevPASH)
* **Vấn đề giải quyết:** Hệ thống hiện chỉ tìm từng bàn đơn lẻ; khi đoàn khách 8 người đặt chỗ mà quán chỉ còn 2 bàn 4 chỗ (hoặc 4 bàn đôi) trống nằm kề nhau, hệ thống vẫn báo hết bàn.
* **Áp dụng Paper:** Dùng *Symbolic Scaffolding* (**EpisodeSim**) kết hợp bộ giải CP-SAT để tìm tổ hợp bàn ghép hợp lệ; dùng bảng khai báo phụ thuộc (**Genie Worksheets**) để tự động tính lại tiền cọc/phòng VIP khi khách đổi số người; dùng vòng lặp phản tư ngoại tuyến (**Paper 04**) đọc bảng `chat_feedbacks` hàng tuần để tối ưu trọng số ghép bàn.
* **Kiến trúc kỹ thuật:** Kế thừa `tableController.js`, `TableMapPage.jsx`, `reservationController.js`; xây mới `TableCombinationSolver`, `ReservationWorksheet`, `RevPASH_Optimizer` và `OfflineRefinementJob`.

### 4.2. Tính năng F2 — Tư vấn Món ăn bằng Đồ thị Tri thức Ẩm thực (Food KG)
* **Vấn đề giải quyết:** Truy xuất vector phẳng + BM25 hiện tại chưa giải quyết tốt các câu hỏi mang tính cảm xúc hoặc thời tiết mơ hồ (*"trời mưa lạnh muốn ăn gì ấm áp, nhẹ bụng?"*).
* **Áp dụng Paper:** Áp dụng chuỗi khám phá *Chain-of-Exploration* (**ChefMind**) ánh xạ cảm xúc sang hồ sơ hương vị (`FlavorProfile`); dùng đồ thị **SwissFKG** liên kết `Dish -> Ingredient -> Allergen -> SubstituteIngredient` để gợi ý thay thế gia vị/sốt an toàn (kết hợp bảng `modifiers`); hợp nhất kết quả bằng công thức $\text{RRF}(0.50 \cdot \text{FAISS} + 0.35 \cdot \text{BM25} + 0.15 \cdot \text{KG})$ và lọc đa dạng món bằng MMR ($\lambda = 0.65$) theo **Paper 12**.
* **Kiến trúc kỹ thuật:** Kế thừa `hybrid_retriever.py`, `metadata_filter.py` và migration `20_add_modifiers.sql`; xây mới `FoodKnowledgeGraph`, `EmotionContextExtractor`, `CoEChainPlanner`, `HybridFusionRanker` và `IngredientSubstitutor`.

### 4.3. Tính năng F3 — Gọi Món Bằng Giọng Nói Thời Gian Thực
* **Vấn đề giải quyết:** Hệ thống đã có sẵn module khung `pipecatClient.js` ở Backend nhưng giao diện thực khách vẫn chỉ hỗ trợ nhập văn bản thuần túy.
* **Áp dụng Paper:** Tinh chỉnh mô hình **Whisper (Paper 10)** chuyên biệt cho từ vựng ẩm thực tiếng Việt 3 miền; kết hợp kiến trúc đàm thoại song công (**Full-duplex Speech Agents**) qua WebRTC/WebSocket với độ trễ $< 500\text{ ms}$ và hỗ trợ ngắt lời (*barge-in*) khi khách đổi ý.
* **Kiến trúc kỹ thuật:** Kế thừa `pipecatClient.js`, `socket.js`, `CartContext.jsx` và `aria_pipeline.py`; xây mới `VoiceGateway`, `WhisperASRService` (xử lý chunk $250\text{ ms}$), `VoiceIntentBridge`, `TTSResponseEngine` và `BargeinDetector` (VAD).

### 4.4. Tính năng F4 — Bộ Nhớ Dài Hạn Khách Quen
* **Vấn đề giải quyết:** Redis Session hiện tại tự xóa sau $30\text{ phút}$, khiến Aria quên khẩu vị, lịch sử dị ứng và vị trí bàn yêu thích của khách quen ở các lần ghé sau.
* **Áp dụng Paper:** Áp dụng kiến trúc bộ nhớ 3 tầng của **MemGPT**: *Working Memory* (Redis hiện tại), *Recall Memory* (vector search lịch sử đơn hàng bằng `pgvector`) và *Archival Memory* (bảng hồ sơ `guest_profiles`), tự động cập nhật sở thích cuối mỗi phiên qua cơ chế `memory_edit`.
* **Kiến trúc kỹ thuật:** Kế thừa tiện ích `pgvector` (`28_add_rag_vector_columns.sql`), `authMiddleware.js`, `userController.js`; xây mới bảng `guest_profiles`, `RecallMemoryIndex`, `MemoryLoadHook` (nạp vào `system_prompt_builder.py`) và `SessionSummaryJob`.

### 4.5. Tính năng F5 — Gợi ý Bán Thêm Thông Minh (Smart Upsell)
* **Vấn đề giải quyết:** Gợi ý món hiện tại (`RecommendedItems.jsx`) mới chỉ hiển thị danh sách tĩnh, chưa chủ động mời thêm đồ uống/tráng miệng dựa trên các món khách vừa bỏ vào giỏ.
* **Áp dụng Paper:** Áp dụng chu trình suy luận và hành động của **Paper 06 (ReAct)** nhưng **giới hạn tối đa 2 vòng lặp** và thực thi song song hai công cụ phân tích giỏ hàng + tìm kiếm đồ thị hương vị để vừa đảm bảo lời mời tự nhiên vừa giữ độ trễ thấp.
* **Kiến trúc kỹ thuật:** Kế thừa `CartContext.jsx`, `recommendationController.js` và `recommendation_engine.py`; xây mới `UpsellTriggerDetector`, `CartAnalyzerTool`, `UpsellKGSearchTool` và `UpsellSuggestTool`.

### 4.6. Tính năng F6 — Nhận Diện Món Ăn Bằng Ảnh
* **Vấn đề giải quyết:** Khách hàng muốn tìm món ăn thông qua hình ảnh chụp từ mạng xã hội nhưng khung chat `AriaChatWidget` chưa hỗ trợ phân tích thị giác.
* **Áp dụng Paper:** Ứng dụng mô hình thị giác **Qwen2-VL** để trích xuất mô tả món ăn, cách chế biến và các nguyên liệu gây dị ứng tiềm ẩn từ ảnh, sau đó đối chiếu Zero-shot với chỉ mục FAISS + BM25 hiện có.
* **Kiến trúc kỹ thuật:** Kế thừa `uploadController.js`, cột ảnh (`18_add_images_column.sql`), `hybrid_retriever.py` và `metadata_filter.py`; xây mới `ChatImageUploadButton` ($\le 5\text{ MB}$), `Qwen2VLAnalyzer`, `VisualMenuMatcher` và `AllergenVisualAlert`.

### 4.7. Tính năng F7 — Phân Công Ca Trực Nhân Viên Tự Động
* **Vấn đề giải quyết:** Hệ thống đã có bảng `shifts` (migration 30) và giao diện `ShiftManagement.jsx`, nhưng việc xếp ca hiện vẫn là thao tác gán tay thủ công (manual CRUD), dễ dẫn đến quá tải giờ làm hoặc thiếu nhân sự giờ cao điểm.
* **Áp dụng Paper:** Áp dụng mô hình *Router-Solver* của **Paper 05** để tách biệt hoàn toàn `StaffRosterAgent` (chỉ dành cho Admin) với Aria công khai; áp dụng kiến trúc Neuro-Symbolic của **OptiMUS** và **LLM4OR** dùng LLM dịch yêu cầu ngôn ngữ tự nhiên của quản lý sang mô hình toán học và giải bằng **Google OR-Tools CP-SAT** (cam kết $100\%$ đúng luật lao động: tối đa $48\text{h/tuần}$, nghỉ giữa ca $\ge 11\text{h}$).
* **Kiến trúc kỹ thuật:** Kế thừa bảng `shifts`, `shiftController.js`, `roleMiddleware.js`, `ShiftManagement.jsx` và `MyShiftsPage.jsx`; xây mới `StaffRosterAgent`, `ConstraintNLPExtractor`, `CPSATScheduler` và `FairnessExplainer`.

### 4.8. Tính năng F8 — Điều Phối Bếp Thời Gian Thực (KDS Sync)
* **Vấn đề giải quyết:** Nhà hàng đã có màn hình bếp `KitchenDisplayPage.jsx` và `socket.js`, nhưng trợ lý Aria hiện đứng ngoài luồng sự kiện của bếp nên không thể trả lời chính xác tiến độ nấu hoặc chủ động báo cho khách khi món ăn hoàn tất.
* **Áp dụng Paper:** Áp dụng nguyên lý đồng bộ trạng thái thế giới thực qua sự kiện (*Event-driven World-State Synchronization*) và hành động chủ động (*Proactive World-Acting*) của **Paper 03**.
* **Kiến trúc kỹ thuật:** Kế thừa `KitchenDisplayPage.jsx`, `kitchenController.js`, `socket.js` và cột `prep_time` (`24_add_prep_time.sql`); xây mới `AriaKitchenListener`, `OrderStatusQueryTool` và `ProactiveNotifier`.

### 4.9. Tính năng F9 — Trợ Lý Đa Ngôn Ngữ cho Khách Quốc Tế
* **Vấn đề giải quyết:** Giao diện tĩnh đã có `i18n.js` nhưng tầng xử lý ngôn ngữ tự nhiên và vector search của `ai-service` hiện mới tối ưu cho tiếng Việt.
* **Áp dụng Paper:** Khai thác tính độc lập ngôn ngữ của khung kiến trúc **Paper 01 & Paper 02**; nâng cấp mô hình nhúng lên `paraphrase-multilingual-mpnet-base-v2` (hỗ trợ hơn 50 ngôn ngữ và **giữ nguyên chuẩn vector $768\text{ chiều}$**, tương thích $100\%$ với chỉ mục FAISS $768\text{d}$ hiện tại) kết hợp tự động chèn ghi chú văn hóa ẩm thực Việt Nam (*Cultural Note*).
* **Kiến trúc kỹ thuật:** Kế thừa `i18n.js`, `FAISS 768d Index` (`28_add_rag_vector_columns.sql`) và `reservation_state.py`; xây mới `LanguageDetector` (`lingua-py` $< 5\text{ ms}$) và nâng cấp `system_prompt_builder.py`.

---

## 5. MA TRẬN ƯU TIÊN & LỘ TRÌNH TRIỂN KHAI (MỤC 10)

Dựa trên đánh giá định lượng giữa **Giá trị kinh doanh (*Business Impact*)**, **Độ khó kỹ thuật (*Technical Effort*)** và mức độ sẵn sàng của mã nguồn hiện tại, 9 tính năng tương lai được phân bổ vào lộ trình 4 giai đoạn:

| Giai Đoạn | Mức Ưu Tiên | Các Tính Năng Triển Khai | Thời Lượng Dự Kiến | Lý Do Ưu Tiên & Nền Tảng Kế Thừa |
| :--- | :---: | :--- | :---: | :--- |
| **Quý 1: Nền tảng Mở rộng** | **P1 (Cao nhất)** | • **F9:** Đa ngôn ngữ quốc tế<br>• **F4:** Bộ nhớ dài hạn khách quen | $2\text{ tuần}$<br>$3\text{ tuần}$ | Chi phí thay đổi kiến trúc thấp nhất nhưng mang lại giá trị trải nghiệm tức thì; tái sử dụng trực tiếp `FAISS 768d`, `pgvector` và `i18n.js` đã có sẵn. |
| **Quý 2: Tư vấn & Tối ưu Thông minh** | **P2 (Cao)** | • **F2:** Đồ thị ẩm thực (Food KG)<br>• **F5:** Gợi ý bán thêm (ReAct)<br>• **F1:** Ghép bàn động (RevPASH) | $4\text{ tuần}$<br>$2\text{ tuần}$<br>$3\text{ tuần}$ | Gia tăng trực tiếp doanh thu nhà hàng (tối ưu công suất ghế và giá trị đơn hàng); F5 kế thừa trực tiếp đồ thị hương vị từ F2. |
| **Quý 3: Đa phương tiện & Thời gian thực** | **P3 (Trung bình - Cao)** | • **F3:** Gọi món giọng nói WebRTC<br>• **F6:** Nhận diện món bằng ảnh<br>• **F8:** Điều phối bếp KDS thời gian thực | $6\text{ tuần}$<br>$3\text{ tuần}$<br>$4\text{ tuần}$ | Mở rộng kênh tương tác đa phương thức (Voice, Vision) và khép kín chu trình phục vụ từ bàn ăn đến màn hình bếp `KitchenDisplayPage.jsx`. |
| **Quý 4: Tự động hóa Vận hành Nội bộ** | **P4 (Chiến lược)** | • **F7:** Phân công ca trực tự động | $5\text{ tuần}$ | Hoàn thiện hệ sinh thái quản trị nội bộ thông minh trên nền `ShiftManagement.jsx` sau khi các tính năng phục vụ thực khách đã vận hành ổn định. |

---

## 6. KẾT LUẬN

Báo cáo tổng hợp đã chứng minh một quy trình nghiên cứu và phát triển hệ thống AI bài bản, xuyên suốt:
1. **Hiện tại vững chắc:** Áp dụng thành công **Paper 01** và **Paper 02** để giải quyết triệt để bài toán ảo giác thực đơn, kiểm soát an toàn dị ứng $100\%$ và quản trị giao dịch đặt bàn đa lượt với điểm số thực nghiệm **$97.23\%$ Overall Score**.
2. **Định hướng tương lai rõ ràng, có căn cứ khoa học:** Đánh giá phản biện **18 công trình nghiên cứu quốc tế** để thiết kế chi tiết **9 tính năng mở rộng ($\text{F1} \rightarrow \text{F9}$)**, kết nối chặt chẽ giữa lý thuyết học thuật hiện đại và kiến trúc mã nguồn thực tế của hệ thống **SmartRestaurant**.