# CHIẾN LƯỢC CHỌN PAPER TRỤC CHÍNH VÀ PHÂN TÍCH ƯU - NHƯỢC ĐIỂM ỨNG DỤNG CHO KHÓA LUẬN TỐT NGHIỆP

> **Đề tài Khóa luận:** Hệ thống Nhà hàng Thông minh Gọi món tại bàn và Đặt bàn qua mã QR (SmartRestaurant)  
> **Phân hệ Trọng tâm:** Trợ lý Ảo AI Tư vấn Ẩm thực & Hỗ trợ Đặt bàn Thông minh (*Aria AI Consultant*)  
> **Mục đích tài liệu:** Xác định Paper trục chính dựa trên thực tế mã nguồn demo, phân tích chi tiết Ưu điểm & Nhược điểm của từng kỹ thuật khi áp dụng vào Khóa luận, và xây dựng khung kế thừa học thuật chặt chẽ để bảo vệ trước Hội đồng chấm KLTN.

---

## MỤC LỤC
1. [Phân Tích Thực Trạng Demo Mã Nguồn SmartRestaurant](#1-phân-tích-thực-trạng-demo-mã-nguồn-smartrestaurant)
2. [Lựa Chọn Paper Trục Chính Phù Hợp Nhất (Core Papers)](#2-lựa-chọn-paper-trục-chính-phù-hợp-nhất-core-papers)
3. [Luận Điểm Kết Nối Đặc Biệt: Paper [6] (ReAct) và Paper [7] (Toolformer)](#3-luận-điểm-kết-nối-đặc-biệt-paper-6-react-và-paper-7-toolformer)
4. [Dòng Chảy Kế Thừa: Từ Paper Cổ Điển Đến Paper Hiện Đại](#4-dòng-chảy-kế-thừa-từ-paper-cổ-điển-đến-paper-hiện-đại)
5. [Bảng Phân Tích Chi Tiết Ưu - Nhược Điểm Của Từng Paper Khi Ứng Dụng](#5-bảng-phân-tích-chi-tiết-ưu---nhược-điểm-của-từng-paper-khi-ứng-dụng)
6. [Mô Hình Kiến Trúc Hợp Nhất Đề Xuất Cho Khóa Luận](#6-mô-hình-kiến-trúc-hợp-nhất-đề-xuất-cho-khóa-luận)
7. [Khung Đề Cương Chi Tiết Cho Chương 2 và Chương 3 Của Luận Văn](#7-khung-đề-cương-chi-tiết-cho-chương-2-và-chương-3-của-luận-văn)

---

## 1. Phân Tích Thực Trạng Demo Mã Nguồn SmartRestaurant

Qua khảo sát toàn bộ mã nguồn của dự án tại thư mục `SmartRestaurant` (đặc biệt là `ai-service/` và `backend/`), phân hệ AI hiện tại đang sở hữu hai thành phần cốt lõi:

1. **Động cơ RAG Dữ liệu Thực đơn (`ai-service/processors/` & `pipelines/`):**
   - **Tuần tự hóa thực đơn cấp hàng (`row_serializer.py`):** Biến đổi bản ghi bảng cơ sở dữ liệu thành văn bản bán cấu trúc chứa tên món, giá, calo, độ cay, thành phần, và thẻ dị ứng.
   - **Chỉ mục kép kết hợp (`index_manager.py`):** FAISS HNSW vector dày đặc ($d=768$) và BM25 Okapi thưa thớt cho tiếng Việt chuyên biệt ngành ẩm thực (`vietnamese_tokenizer.py`).
   - **Truy xuất lai và Dung hợp điểm số (`hybrid_retriever.py`):** Chuẩn hóa Min-Max và kết hợp theo tỷ lệ trọng số cố định ($0.6 \text{ Dense} + 0.4 \text{ BM25}$).
   - **Tiền lọc cứng siêu dữ liệu (`metadata_filter.py`):** Loại trừ 100% món ăn vi phạm chất gây dị ứng hoặc vượt ngân sách khách yêu cầu trước khi tạo ngữ cảnh.
   - **Tái xếp hạng ngữ cảnh (`cross_encoder_reranker.py`):** Dùng Cross-Encoder (`ms-marco-MiniLM-L-12-v2`) để chọn ra Top-K món tối ưu.
   - **Nhắc lệnh tiếp đất chống ảo giác (`grounded_rag_prompt.py`):** Khóa chặt mô hình chỉ được tư vấn món có trong ngữ cảnh.

2. **Cơ Chế Điều Phối Hội Thoại & Đặt Bàn (`aria_pipeline.py` & `tools/`):**
   - Trích xuất thực thể, quản lý máy trạng thái đặt bàn (`reservation_state.py`).
   - Tích hợp các công cụ chuyên biệt: tra cứu menu, kiểm tra bàn trống, tạo đơn đặt bàn, giải đáp chính sách nhà hàng (`policy_engine.py`, `faq_engine.py`).
   - Vòng lặp nhận diện ý định $\to$ gọi công cụ $\to$ nhận kết quả $\to$ phản hồi hoặc leo thang nhân viên phục vụ con người (`fallback_handler.py`).

---

## 2. Lựa Chọn Paper Trục Chính Phù Hợp Nhất (Core Papers)

Khi viết Khóa luận tốt nghiệp kỹ thuật, bạn **không nên chỉ chọn 1 paper đơn độc** vì một chatbot AI nhà hàng thông minh không thể chỉ có "truy xuất" (RAG) hoặc chỉ có "suy luận suông" (Agent loop). 

Cấu trúc hoàn hảo nhất là xác lập **CẶP ĐÔI TRỤC CHÍNH SONG HÀNH (DUAL-PILLAR FOUNDATION)**:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│              KHÓA LUẬN TỐT NGHIỆP: HỆ THỐNG AI CONSULTANT "ARIA"                 │
├────────────────────────────────────────┬─────────────────────────────────────────┤
│  TRỤC 1: ĐỘNG CƠ DỮ LIỆU & RAG LAI     │   TRỤC 2: KIẾN TRÚC TÁC TỬ & SUY LUẬN   │
│  (Data & Retrieval Engine)             │   (Cognitive Agent Loop & Actions)      │
├────────────────────────────────────────┼─────────────────────────────────────────┤
│  ★ PAPER CHÍNH: Paper [1]               │   ★ PAPER CHÍNH: Paper [6]               │
│  (Cheerla, 2025)                       │   (Yao et al., ICLR 2023 - ReAct)       │
│                                        │                                         │
│  • Đã hiện thực 100% trong mã nguồn    │   • Định hình phương pháp luận tư duy:  │
│    demo (`ai-service/processors/`).    │     Thought → Action → Observation.     │
│  • Giải quyết bài toán dữ liệu thực    │   • Biến LLM từ bộ sinh chữ thụ động    │
│    đơn có cấu trúc, loại bỏ ảo giác.   │     thành tác tử thực thi tác vụ.       │
└────────────────────────────────────────┴─────────────────────────────────────────┘
```

- **Paper [1] (Cheerla, 2025) là Paper Trục Chính về Kỹ Thuật Dữ Liệu:** Toàn bộ thuật toán từ Row-Level Serialization, Hybrid Search (Dense + BM25), Metadata Filtering đến Cross-Encoder Reranking trong mã nguồn demo đều lấy từ paper này.
- **Paper [6] (ReAct - Yao et al., 2023) là Paper Trục Chính về Kiến Trúc Vận Hành:** Đóng vai trò là phương pháp luận bao bọc bên ngoài. Mỗi lượt chat của khách hàng được xử lý như một quy trình ReAct: Suy nghĩ nhu cầu khách $\to$ Kích hoạt Action gọi RAG (Paper 1) hoặc Tool kiểm tra bàn $\to$ Quan sát dữ liệu trả về $\to$ Tổng hợp câu trả lời tư vấn.

---

## 3. Luận Điểm Kết Nối Đặc Biệt: Paper [6] (ReAct) và Paper [7] (Toolformer)

Đây là điểm nhấn phản biện sắc bén giúp nâng tầm học thuật của Khóa luận:

### 3.1. Dùng Paper [7] (Toolformer - Meta AI 2023) để Đặt Vấn Đề & Lý Giải "Tại Sao Cần Công Cụ":
- **Vấn đề của LLM tham số thuần túy:** LLM không có khả năng tự tính toán số học chính xác (cộng tiền giỏ hàng), không thể cập nhật thông tin động (bàn nào đang trống, món nào hết hàng), và thường xuyên bịa đặt thông tin thực đơn.
- **Đóng góp của Toolformer:** Paper [7] đặt nền móng chứng minh rằng: *Mô hình ngôn ngữ bắt buộc phải được kết nối với các công cụ/API bên ngoài thì mới có thể giải quyết được các bài toán thực tế*. Nhờ gọi API máy tính, API tìm kiếm, LLM nhỏ (6.7B) có thể đánh bại các LLM khổng lồ (175B).

### 3.2. Chỉ Ra Giới Hạn Của Paper [7] Để Khẳng Định Sự Cần Thiết Của Paper [6] (ReAct):
- **Hạn chế cố hữu của Toolformer:**
  1. *Cơ chế gọi công cụ tĩnh một chiều (Greedy Generation):* Toolformer được huấn luyện để chèn token gọi API ngay trong chuỗi sinh văn bản. Nó chỉ phù hợp cho lời gọi đơn lẻ (single-turn).
  2. *Thiếu khả năng lập luận đa bước:* Nếu API trả về dữ liệu rỗng (ví dụ: món khách hỏi đã hết), Toolformer không có cơ chế dừng lại để "suy nghĩ" tìm phương án thay thế.
  3. *Chi phí fine-tune lớn:* Cần can thiệp vào trọng số mô hình để học cú pháp gọi API, khó thích nghi khi nhà hàng bổ sung API mới.
- **Tại sao Paper [6] (ReAct) là lời giải vượt trội được chọn:**
  - ReAct mở rộng không gian hành động thành $\hat{\mathcal{A}} = \mathcal{A} \cup \mathcal{L}$ (hành động gọi tool kết hợp không gian ngôn ngữ suy nghĩ nội tâm).
  - Vòng lặp `Thought → Action → Observation` giúp hệ thống:
    - **Lập kế hoạch trước khi làm:** "Khách yêu cầu món cay dưới 80k, mình cần lọc món trước rồi mới kiểm tra xem còn suất không".
    - **Tự sửa sai và thích ứng (Self-correction):** Nếu tìm không thấy món theo từ khóa, suy nghĩ nội tâm sẽ điều chỉnh từ khóa tìm kiếm hoặc gọi tool gợi ý món tương đồng.
    - **Minh bạch hóa quá trình ra quyết định (Explainability):** Dễ dàng ghi log kiểm toán từng bước suy luận, đảm bảo an toàn cho nhà hàng.

---

## 4. Dòng Chảy Kế Thừa: Từ Paper Cổ Điển Đến Paper Hiện Đại

Khóa luận cần phân tích rõ tính kế thừa lịch sử để hội đồng thấy rõ sinh viên nắm vững nguồn gốc công nghệ:

```
[NHÁNH TRI THỨC & DỮ LIỆU]
Paper [8] (NeurIPS 2020) ──────► Giới hạn: Chỉ xử lý text phẳng Wikipedia ──────► Paper [1] (arXiv 2025)
RAG Cổ Điển (Lewis et al.)       Làm mất cấu trúc bảng & thuộc tính món ăn         Advanced Structured RAG
                                                                                   (Row-level + Hybrid + Reranker)

[NHÁNH HÀNH ĐỘNG & TÁC TỬ]
LLM Prompt-Response thụ động ──► Paper [7] (Meta 2023) ──► Paper [6] (ICLR 2023) ──► Paper [5] & [3] (2026)
(Sinh chữ không hành động)       Toolformer (Cần công cụ)   ReAct (Hiệp đồng Suy     Kiến trúc Quản trị &
                                                            luận và Hành động)       Ủy quyền Hợp thức
```

1. **Từ Paper [8] (RAG gốc - Lewis 2020) đến Paper [1] (RAG Nâng cao - Cheerla 2025):**
   - Paper [8] khai sinh ra RAG nhưng chỉ tập trung vào tài liệu văn bản phi cấu trúc lớn (Wikipedia). Khi mang vào nhà hàng, thực đơn là bảng quan hệ phức tạp. Áp dụng RAG gốc sẽ cắt xén đoạn văn làm tách rời tên món và giá tiền, dẫn đến ảo giác nghiêm trọng.
   - Paper [1] kế thừa nguyên lý lấy dữ liệu ngoài của Paper [8], nhưng phát triển thành giải pháp chuyên dụng cho dữ liệu dạng bảng doanh nghiệp (Row-Level Serialization, Metadata Hard Filtering).

2. **Từ Paper [7] (Toolformer 2023) & [6] (ReAct 2023) đến Paper [3] & [5] (Kiến trúc 2026):**
   - ReAct [6] giải quyết vòng lặp suy luận - hành động ở mức độ thuật toán.
   - Nhưng để đưa vào ứng dụng thực tế của đồ án, Paper [5] (Alenezi 2026) cung cấp *Kiến trúc tham chiếu phần mềm có quản trị (Governed Architecture)*, và Paper [3] (Zhu & Cai 2026) cung cấp *Nguyên lý ủy quyền hợp thức (Justified Delegation)* để kiểm soát rủi ro an toàn thực phẩm.

---

## 5. Bảng Phân Tích Chi Tiết Ưu - Nhược Điểm Của Từng Paper Khi Ứng Dụng

Dưới đây là bảng phân tích toàn diện ưu điểm, nhược điểm và giải pháp khắc phục cụ thể khi đưa các công trình này vào Khóa luận tốt nghiệp của bạn:

| Mã Paper & Tác giả | Kỹ thuật / Điểm hay kế thừa vào KLTN | ƯU ĐIỂM khi áp dụng vào SmartRestaurant | NHƯỢC ĐIỂM & RỦI RO thực tế | Giải pháp khắc phục trong Khóa luận |
| :--- | :--- | :--- | :--- | :--- |
| **Paper [1]**<br>*(Cheerla, 2025)*<br>**[TRỤC CHÍNH RAG]** | • Tuần tự hóa cấp hàng (Row-Level Indexing)<br>• Truy xuất lai ($0.6 \text{ Dense} + 0.4 \text{ BM25}$)<br>• Tiền lọc cứng siêu dữ liệu (NER Filter)<br>• Tái xếp hạng Cross-Encoder | • Giữ toàn vẹn cấu trúc món ăn (tên, giá, calo, độ cay).<br>• Triệt tiêu 100% rủi ro dị ứng nhờ lọc cứng trước khi RAG.<br>• Tìm kiếm chính xác cả từ khóa tên món lẫn ngữ nghĩa khẩu vị. | • Cross-Encoder làm tăng độ trễ tính toán.<br>• Khi thực đơn cập nhật thường xuyên, việc rebuild vector index có thể tốn tài nguyên. | • Sử dụng mô hình nhẹ `ms-marco-MiniLM-L-12-v2` hoặc ONNX Runtime để giảm độ trễ $< 50\text{ms}$.<br>• Lưu chỉ mục nhị phân tĩnh trên đĩa (`.bin`, `.pkl`) và chỉ re-index khi có món mới. |
| **Paper [6]**<br>*(Yao et al., ICLR 2023)*<br>**[TRỤC CHÍNH TÁC TỬ]** | • Vòng lặp Thought → Action → Observation<br>• Kết hợp suy luận lập luận với gọi công cụ động. | • Tác tử có khả năng tự sửa lỗi (nếu tool 1 không ra kết quả thì suy nghĩ để gọi tool 2).<br>• Dễ debug, minh bạch toàn bộ vết suy luận.<br>• Không cần fine-tune mô hình nền tảng. | • Tốn nhiều token vì context tích lũy qua các bước lặp.<br>• Có nguy cơ rơi vào vòng lặp vô tận (infinite loop) nếu mô hình bị bế tắc suy luận. | • Kết hợp giải pháp từ Paper [5]: Áp dụng cơ chế **Budgeted Autonomy** khóa cứng tối đa 5 bước lặp ($K_{\max}=5$). Quá 5 bước tự động chuyển fallback. |
| **Paper [7]**<br>*(Schick et al., Meta AI 2023)*<br>**[CƠ SỞ LÝ THUYẾT]** | • Nguyên lý tích hợp API bên ngoài vào LLM.<br>• Động lực chứng minh LLM cần công cụ để tính toán và tra cứu. | • Cung cấp luận điểm học thuật vững chắc: chứng minh tại sao chatbot nhà hàng không thể chỉ dựa vào prompt suông. | • Phương pháp fine-tune chèn token của Toolformer quá cứng nhắc, tốn kém chi phí và chỉ gọi được đơn bước. | • Sử dụng Paper [7] làm công trình đối chiếu, lý giải nguyên nhân và hạn chế của nó để làm nổi bật việc chọn ReAct (Paper [6]) làm giải pháp thay thế. |
| **Paper [2]**<br>*(Ahmed, UT Arlington 2026)* | • Phân định 7 chiều giữa Structured Query và Semantic RAG.<br>• Nhất quán Đọc-Sau-Ghi (Read-After-Write Consistency).<br>• Phân giải sự mơ hồ (Ambiguity Resolution). | • Ngăn ngừa nhầm lẫn: Hỏi giá/tổng tiền $\to$ gọi API SQL; Hỏi tư vấn khẩu vị $\to$ gọi RAG.<br>• Cập nhật giỏ hàng tức thì vào ngữ cảnh, tránh việc khách vừa thêm món nhưng AI nói chưa có. | • Đòi hỏi bộ định tuyến ý định (Intent Classifier) phải cực kỳ chính xác để không điều hướng nhầm luồng. | • Xây dựng bộ `IntentClassifier` kết hợp luật cứng (Regex/Keyword) và Few-shot classifier để đảm bảo độ chính xác phân luồng $> 98\%$. |
| **Paper [3]**<br>*(Zhu & Cai, 2026)* | • Nguyên lý "Ủy quyền Hợp thức" (Justified Delegation).<br>• Mô hình nhận thức kép System 1 (nhanh) vs System 2 (kiểm soát an toàn). | • Đảm bảo an toàn vận hành: Aria chỉ có quyền thao tác giỏ hàng tạm, **tuyệt đối không** tự ý thanh toán thẻ của khách.<br>• Tránh các khiếu nại pháp lý và rủi ro đặt món nhầm. | • Cần nhiều bước xác nhận với khách hàng hơn, có thể làm giảm tính "tự động hoàn toàn" của AI. | • Thiết kế giao diện có nút bấm tương tác nhanh (Action Buttons/Cards) trên web để khách chỉ cần 1 chạm xác nhận giỏ hàng. |
| **Paper [4]**<br>*(LinkedIn, 2026)* | • Kiến trúc Hai vòng lặp (Two-Loop Architecture): Inner Loop (phục vụ trực tiếp) và Outer Loop (tiến hóa ngoại tuyến).<br>• Quản lý Prompt như phần mềm có phiên bản. | • Hệ thống có thể tự hoàn thiện lời nhắc tư vấn (System Prompt) dựa trên lịch sử chốt đơn thành công mà không cần lập trình viên sửa code. | • Thuật toán tối ưu tiến hóa (GA) cần tập dữ liệu log hội thoại đủ lớn mới phát huy hiệu quả. | • Trong phạm vi KLTN, ứng dụng kiến trúc 2 vòng lặp ở mức độ thu thập log đánh giá (LLM-as-a-judge) và đề xuất cập nhật phiên bản prompt định kỳ (`v1.0`, `v1.1`). |
| **Paper [5]**<br>*(Alenezi, 2026)* | • Kiến trúc tham chiếu có quản trị (Governed Architecture - 4 tầng).<br>• Quyền tự chủ có ngân sách (Budgeted Autonomy).<br>• Bộ ngắt mạch (Circuit Breakers). | • Đưa hệ thống lên chuẩn công nghiệp cấp doanh nghiệp.<br>• Bảo vệ server không bị sập khi API nhà hàng gặp sự cố; ngắt mạch kịp thời khi lỗi lặp lại. | • Kiến trúc nhiều tầng lớp middleware có thể làm tăng độ phức tạp khi thiết kế mã nguồn. | • Hiện thực bộ ngắt mạch đơn giản: Nếu gọi API đặt bàn lỗi 2 lần liên tiếp, lập tức ngắt mạch và gọi Human Handoff (gọi phục vụ). |
| **Paper [8]**<br>*(Lewis et al., NeurIPS 2020)*<br>**[NỀN TẢNG CỔ ĐIỂN]** | • Cơ sở lý thuyết kết hợp Parametric Memory và Non-Parametric Memory. | • Là công trình kinh điển đặt nền móng cho RAG, bắt buộc phải trích dẫn để khẳng định tính học thuật trong KLTN. | • Hoàn toàn không phù hợp nếu áp dụng trực tiếp cho thực đơn nhà hàng vì làm phẳng dữ liệu bảng gây mất ngữ cảnh giá/món. | • Sử dụng làm mốc so sánh (Baseline) trong phần Thực nghiệm (Ablation Study) để chứng minh giải pháp của Paper [1] vượt trội hơn RAG cổ điển. |
| **Paper [10]**<br>*(Picheny, 2024)* *(Mở rộng)* | • Cơ chế nhận diện và phiên âm giọng nói Whisper trong môi trường đa ngôn ngữ và tạp âm. | • Hỗ trợ mở rộng tính năng **Gọi món bằng giọng nói (Voice Ordering)** tại bàn cho khách hàng. | • Tốn tài nguyên GPU khi chạy nhận dạng giọng nói cục bộ. | • Sử dụng Whisper API hoặc WhisperX nhẹ để xử lý audio tiếng Việt qua WebSocket. |
| **Paper [11]**<br>*(Jain, 2024)* *(Mở rộng)* | • Khung Text-to-SQL tự suy ngẫm (Reflect-SQL). | • Cho phép nhân viên quản lý quán hỏi đáp doanh thu, tồn kho nguyên liệu bằng ngôn ngữ tự nhiên. | • Tiềm ẩn rủi ro SQL Injection hoặc xóa nhầm dữ liệu nếu sinh câu truy vấn sai. | • Chỉ cấp quyền Read-Only (SELECT) và ràng buộc schema view cố định cho AI. |

---

## 6. Mô Hình Kiến Trúc Hợp Nhất Đề Xuất Cho Khóa Luận

Từ việc tổng hợp các paper trên, đây là sơ đồ kiến trúc tổng thể mà bạn nên đưa vào Khóa luận để thể hiện sự tích hợp hoàn hảo của các công trình nghiên cứu:

```
                                 [ KHÁCH HÀNG TẠI BÀN (QR CODE) ]
                                                │
                                    (Gửi yêu cầu hội thoại / Voice)
                                                ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│               KIẾN TRÚC PHÂN TẦNG CÓ QUẢN TRỊ (Kế thừa Paper [3] & [5])                   │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. TẦNG ĐIỀU PHỐI & PHÂN TÁCH Ý ĐỊNH (Intent Router - Kế thừa Paper [2])                  │
│    • Phân định: Truy vấn Cấu trúc (Giỏ hàng/Bàn) VS Truy vấn Ngữ nghĩa (Ẩm thực/Tư vấn)    │
│    • Nhận thức kép: System 1 (Chào hỏi/Phản xạ nhanh) vs System 2 (Suy luận an toàn)      │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ 2. TẦNG BỘ NÃO SUY LUẬN TÁC TỬ (Cognitive Core - Áp dụng Paper [6] ReAct)                 │
│    • Vòng lặp: THOUGHT ──► ACTION ──► OBSERVATION ──► THOUGHT                             │
│    • Kiểm soát: Budgeted Autonomy (K_max = 5 bước) & Circuit Breakers (Ngắt mạch an toàn) │
│    • Biện giải động lực sử dụng công cụ dựa trên Paper [7] (Toolformer)                   │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ 3. TẦNG KHÔNG GIAN CÔNG CỤ & TRUY XUẤT (Tooling & Data Engine)                            │
│    ┌────────────────────────────────────────┬────────────────────────────────────────┐    │
│    │  ĐỘNG CƠ ADVANCED RAG (Paper [1] & [8])│  DỮ LIỆU CẤU TRÚC & NGHIỆP VỤ (Paper [2])│    │
│    │  • Row-Level Serialization             │  • Quản lý Máy trạng thái đặt bàn      │    │
│    │  • Hybrid Search (Dense 0.6 + BM25 0.4)│  • Thao tác giỏ hàng thế giới thực     │    │
│    │  • NER Metadata Hard-Filtering (Dị ứng)│  • Đồng bộ Read-After-Write            │    │
│    │  • Cross-Encoder Contextual Reranking  │  • Escalation: Gọi phục vụ (Fallback)  │    │
│    └────────────────────────────────────────┴────────────────────────────────────────┘    │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ 4. TẦNG ĐÁNH GIÁ & TIẾN HÓA (Evaluation & Governance - Kế thừa Paper [4])                 │
│    • Inner Loop: Trả lời qua Server-Sent Events (SSE) theo thời gian thực                 │
│    • Outer Loop: Đánh giá Groundedness / Faithfulness (LLM-as-a-Judge) & Tinh chỉnh Prompt │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Khung Đề Cương Chi Tiết Cho Chương 2 và Chương 3 Của Luận Văn

Khi viết báo cáo khóa luận, bạn hãy trình bày theo dàn ý học thuật mẫu mực sau:

### CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ TỔNG QUAN CÁC NGHIÊN CỨU LIÊN QUAN
* **2.1. Tiến trình phát triển của Kỹ thuật Tạo sinh Tăng cường Truy xuất (RAG)**
  * *2.1.1. Khởi nguyên của RAG cho dữ liệu phi cấu trúc:* Khảo sát công trình Lewis et al. (NeurIPS 2020) [8].
  * *2.1.2. Thách thức kiến trúc khi LLM tương tác với dữ liệu có cấu trúc doanh nghiệp:* Phân tích 7 chiều kiến trúc của Ahmed (2026) [2].
  * *2.1.3. Khung RAG nâng cao cho dữ liệu bảng và doanh nghiệp:* Kế thừa phương pháp luận của Cheerla (2025) [1] *(Paper trục chính RAG)*.
* **2.2. Sự dịch chuyển từ Mô hình Ngôn ngữ thụ động sang Tác tử Hành động Thế giới (Agentic AI)**
  * *2.2.1. Giới hạn của LLM thuần và Động lực tích hợp công cụ:* Khảo cứu Toolformer (Meta AI 2023) [7].
  * *2.2.2. Kiến trúc hiệp đồng giữa Suy luận và Hành động (ReAct):* Phân tích mô hình Yao et al. (ICLR 2023) [6] *(Paper trục chính Tác tử)*; so sánh và biện giải lý do vượt trội so với Toolformer.
  * *2.2.3. Không gian hành động và Nguyên lý Ủy quyền Hợp thức:* Phân tích khung lý thuyết của Zhu & Cai (2026) [3].
* **2.3. Khung Quản trị, Độ vững chắc và Tự tiến hóa của Hệ thống Tác tử Cấp Sản xuất**
  * *2.3.1. Kiến trúc tham chiếu có quản trị, Quyền tự chủ có ngân sách và Bộ ngắt mạch:* Kế thừa từ Alenezi (2026) [5].
  * *2.3.2. Mô hình hai vòng lặp tự tiến hóa (Two-Loop Architecture):* Phương pháp luận tối ưu từ Wang et al. (LinkedIn 2026) [4].

### CHƯƠNG 3: THIẾT KẾ VÀ HIỆN THỰC PHÂN HỆ AI CONSULTANT "ARIA"
* **3.1. Thiết kế Kiến trúc Tổng thể Hệ thống Phân Tầng có Quản trị**
* **3.2. Hiện thực Động cơ Advanced Hybrid RAG cho Thực đơn Nhà hàng (Dựa trên Paper [1])**
  * *3.2.1. Tuần tự hóa thực đơn cấp hàng (Row-Level Serialization).*
  * *3.2.2. Chỉ mục kép kết hợp FAISS HNSW và BM25 Okapi tiếng Việt ẩm thực.*
  * *3.2.3. Chuẩn hóa Min-Max và Dung hợp điểm số ($0.6 \text{ Dense} + 0.4 \text{ BM25}$).*
  * *3.2.4. Tiền lọc cứng an toàn thực phẩm và chất gây dị ứng (F&B NER Filter).*
  * *3.2.5. Tái xếp hạng ngữ cảnh chuyên sâu bằng Cross-Encoder.*
* **3.3. Hiện thực Bộ Não Tác Tử và Không Gian Hành Động Thực Tế (Dựa trên Paper [6], [7], [2], [5])**
  * *3.3.1. Định nghĩa không gian công cụ (Tool Definitions & Pydantic Schemas).*
  * *3.3.2. Vòng lặp suy luận ReAct và cơ chế tự phục hồi lỗi.*
  * *3.3.3. Quản lý trạng thái đặt bàn và tính nhất quán Đọc-Sau-Ghi (Read-After-Write).*
  * *3.3.4. Rào chắn an toàn: Giới hạn ngân sách suy luận ($K_{\max}=5$) và Bộ ngắt mạch.*
* **3.4. Đánh giá Thực nghiệm và Nghiên cứu Cắt bỏ (Ablation Study)**
  * *3.4.1. So sánh hiệu năng giữa RAG cơ bản [8] và Advanced Structured RAG [1] (Đo lường Precision@K, MRR, Faithfulness).*
  * *3.4.2. So sánh tỷ lệ hoàn thành tác vụ giữa Prompt đơn thuần, Toolformer-style [7] và ReAct [6].*

---
*Tài liệu được lập trình viên trợ lý Antigravity biên soạn dựa trên khảo sát chi tiết mã nguồn dự án SmartRestaurant.*