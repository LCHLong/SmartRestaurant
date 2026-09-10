# TỔNG HỢP & KHẢO CỨU 5 BÀI BÁO KHOA HỌC NỀN TẢNG
## HỆ THỐNG TRỢ LÝ ẢO TƯ VẤN ẨM THỰC THÔNG MINH ("ARIA") — SMART RESTAURANT

> **Cấu phần nghiên cứu:** Khóa luận Tốt nghiệp (KLTN) — Hệ thống Nhà hàng Thông minh Gọi món tại bàn qua mã QR.  
> **Phân hệ thực hiện:** Trợ lý ảo AI Consultant ("Aria") tích hợp RAG, Agentic Control Loops & Structured Data Querying.  
> **Cổng tra cứu trực tuyến toàn bộ dự án:** [https://2c80a67d.ht-ml.app/](https://2c80a67d.ht-ml.app/)

---

## BẢNG TỔNG HỢP 5 BÀI BÁO KHOA HỌC & LIÊN KẾT BẢN DEPLOY WEB

| STT | Mã Paper & Tiêu Đề Bài Báo | Tác Giả & Tổ Chức | Định Danh Học Thuật | Bản Deploy Trực Tuyến (Live HTML) | Tài Liệu Nội Bộ (.md / .pdf) |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **[1]** | **Advancing Retrieval-Augmented Generation for Structured Enterprise and Internal Data** | Chaitanya Cheerla<br>*(IIT Roorkee)* | arXiv:2507.12425v1<br>(07/2025) | [🌐 **94461fc7.ht-ml.app**](https://94461fc7.ht-ml.app/) | [VI Markdown](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/paper/01_Advancing_RAG_Structured_Enterprise_Data_VI.md)<br>[PDF Gốc](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/paper/01_Advancing_RAG_Structured_Enterprise_Data.pdf) |
| **[2]** | **Beyond Document Retrieval: Architectural Challenges When LLM Agents Query Structured Enterprise Data** | Syed Naveed Ahmed<br>*(University of Texas at Arlington)* | arXiv:2608.19235v1<br>(08/2026) | [🌐 **ba566610.ht-ml.app**](https://ba566610.ht-ml.app/) | [VI Markdown](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/paper/02_Beyond_Document_Retrieval_Structured_Data_VI.md)<br>[PDF Gốc](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/paper/02_Beyond_Document_Retrieval_Structured_Data.pdf) |
| **[3]** | **From Language Models to World-Acting Systems: Progress and Limits of Agentic AI** | Liang Zhu, Mengting Cai<br>*(Independent Research)* | arXiv:2609.04894v1<br>(09/2026) | [🌐 **f68e8834.ht-ml.app**](https://f68e8834.ht-ml.app/) | [VI Markdown](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/paper/03_From_Language_Models_to_World_Acting_Systems_VI.md)<br>[PDF Gốc](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/paper/03_From_Language_Models_to_World_Acting_Systems.pdf) |
| **[4]** | **Self-evolving Agentic Customer Support System at LinkedIn** | Chih Hui Wang, Mengdie Tu, Qianyun Zhang et al.<br>*(LinkedIn Corporation)* | arXiv:2608.10224v1<br>(08/2026) | [🌐 **e7a6b96e.ht-ml.app**](https://e7a6b96e.ht-ml.app/) | [VI Markdown](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/paper/04_Self_Evolving_Agentic_Customer_Support_LinkedIn_VI.md)<br>[PDF Gốc](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/paper/04_Self_Evolving_Agentic_Customer_Support_LinkedIn.pdf) |
| **[5]** | **From Prompt–Response to Goal-Directed Systems: The Evolution of Agentic AI Software Architecture** | Mamdouh Alenezi<br>*(Tahakom, Saudi Arabia)* | arXiv:2602.10479v1<br>(02/2026) | [🌐 **ee140d88.ht-ml.app**](https://ee140d88.ht-ml.app/) | [VI Markdown](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/paper/05_Evolution_of_Agentic_AI_Software_Architecture_VI.md)<br>[PDF Gốc](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/paper/05_Evolution_of_Agentic_AI_Software_Architecture.pdf) |

---

## MA TRẬN KẾ THỪA & ÁNH XẠ VÀO KHÓA LUẬN TỐT NGHIỆP

```
                                  KIẾN TRÚC TRỢ LÝ ẢO "ARIA" (SMARTRESTAURANT)
                                                        │
         ┌───────────────────────┬──────────────────────┼───────────────────────┬───────────────────────┐
         ▼                       ▼                      ▼                       ▼                       ▼
   [PAPER 1]               [PAPER 2]              [PAPER 3]               [PAPER 4]               [PAPER 5]
   Cheerla (2025)          Ahmed (2026)           Zhu & Cai (2026)        LinkedIn (2026)         Alenezi (2026)
  Advanced RAG for       Beyond Document        From Language Models    Self-evolving Agent     Software Architecture
  Structured Data           Retrieval           to World-Acting Sys.      at LinkedIn           for Agentic AI
         │                       │                      │                       │                       │
         ▼                       ▼                      ▼                       ▼                       ▼
  • Row-Level Indexing    • Computed Result      • Thao tác giỏ hàng     • Không fine-tuning     • 4 Tầng Quản Trị
  • Hybrid Dense+BM25       vs. Retrieved          thế giới thực         • GA Prompt Evolution   • Router-Solver
  • Cross-Encoder         • Read-After-Write     • Justified Delegation  • Versioned Snapshot    • Budgeted Autonomy
  • Khóa chặt giá &         Consistency          • Nhận thức kép         • Ảo giác < 0.1%        • Circuit Breakers
    nguyên liệu thực đơn  • Ambiguity Resolution   System 1 / System 2   • A/B test +9.0 pp      • Typed Tool Schemas
```

---

## NỘI DUNG CHI TIẾT TỪNG BÀI BÁO KHOA HỌC

### 1. Paper [1]: Advancing Retrieval-Augmented Generation for Structured Enterprise and Internal Data
* **Tác giả:** Chaitanya Cheerla (Indian Institute of Technology - IIT Roorkee)
* **Xuất bản:** arXiv:2507.12425v1 [cs.CL], 16 Jul 2025
* **Liên kết bản deploy trực quan:** 👉 [https://94461fc7.ht-ml.app/](https://94461fc7.ht-ml.app/)
* **File tài liệu cục bộ:**
  - Bản dịch chi tiết tiếng Việt: `paper/01_Advancing_RAG_Structured_Enterprise_Data_VI.md`
  - PDF gốc: `paper/01_Advancing_RAG_Structured_Enterprise_Data.pdf`
  - Giao diện HTML chuẩn hóa: `.lavish/paper_01_advancing_rag_summary.html`

#### Tóm tắt (Abstract)
Thế hệ Mô hình Ngôn ngữ Lớn (LLM) đối mặt với thách thức nghiêm trọng khi xử lý dữ liệu doanh nghiệp có cấu trúc và bán cấu trúc nội bộ (bảng biểu, cơ sở dữ liệu quan hệ, thực đơn). Các kỹ thuật RAG truyền thống thường làm phẳng dữ liệu thành văn bản phi cấu trúc, gây mất mát các mối quan hệ hàng-cột và dẫn đến ảo giác nghiêm trọng về số liệu. Bài báo đề xuất một đường ống Advanced RAG toàn diện gồm:
1. **Lập chỉ mục cấp độ hàng (Row-Level Indexing):** Biến đổi từng hàng dữ liệu thành một khối đối tượng JSON độc lập mang đầy đủ siêu dữ liệu ngữ cảnh (metadata-aware chunking).
2. **Truy xuất lai (Hybrid Search):** Dung hợp điểm số giữa Dense Semantic Embedding (`all-mpnet-base-v2`) và Sparse Keyword Search (BM25) theo tỷ lệ trọng số tối ưu $0.6 \cdot \text{Dense} + 0.4 \cdot \text{BM25}$.
3. **Tái xếp hạng ngữ cảnh (Contextual Reranking):** Sử dụng mô hình Cross-Encoder (`ms-marco-MiniLM-L-12-v2`) chấm điểm tương đồng trực tiếp giữa câu hỏi và danh sách ứng viên.
4. **Mẫu câu nhắc ép tiếp đất nghiêm ngặt (Strict Grounded Prompting):** Khóa chặt mô hình chỉ được phép trả lời dựa trên các dữ kiện được truy xuất.

#### Đóng góp thực tiễn cho SmartRestaurant:
* Đảm bảo tra cứu thực đơn tuyệt đối chính xác: Tên món, phân loại, giá tiền, định lượng calo và thành phần dị ứng.
* Triệt tiêu hoàn toàn hiện tượng AI tự "bịa" ra món ăn không có trong nhà bếp hoặc báo sai giá niêm yết.

---

### 2. Paper [2]: Beyond Document Retrieval: Architectural Challenges When LLM Agents Query Structured Enterprise Data
* **Tác giả:** Syed Naveed Ahmed (Department of Computer Science and Engineering, University of Texas at Arlington)
* **Xuất bản:** arXiv:2608.19235v1 [cs.DL], 22 Aug 2026
* **Liên kết bản deploy trực quan:** 👉 [https://ba566610.ht-ml.app/](https://ba566610.ht-ml.app/)
* **File tài liệu cục bộ:**
  - Bản dịch chi tiết tiếng Việt: `paper/02_Beyond_Document_Retrieval_Structured_Data_VI.md`
  - PDF gốc: `paper/02_Beyond_Document_Retrieval_Structured_Data.pdf`
  - Giao diện HTML chuẩn hóa: `.lavish/paper_02_beyond_retrieval_summary.html`

#### Tóm tắt (Abstract)
Việc LLM Agent tương tác với dữ liệu có cấu trúc trong doanh nghiệp đòi hỏi một kiến trúc khác biệt hoàn toàn so với việc tìm kiếm tài liệu thông thường. Bài báo khảo cứu và xác lập **7 chiều kiến trúc cốt lõi**:
1. *Ngữ nghĩa truy xuất (Retrieval Semantics):* Phân biệt rõ rệt giữa **Kết quả tính toán định lượng (*Computed Result*)** thông qua SQL/API xác thực và **Đoạn văn bản trích xuất (*Retrieved Passage*)** qua RAG ngữ nghĩa.
2. *Tính nhất quán Đọc-Sau-Ghi (Read-After-Write Consistency):* Khi Agent thực hiện một thao tác ghi (ví dụ: thêm món vào giỏ hàng), trạng thái bộ nhớ đệm ngữ cảnh phải được làm mới tức thì để câu hỏi tiếp theo không bị đọc dữ liệu lỗi thời.
3. *Phân giải sự mơ hồ định danh (Ambiguity Resolution):* Agent phải biết chủ động hỏi lại làm rõ khi khách hàng chỉ định thực thể chung chung (ví dụ: *"Cho tôi 1 đĩa bò"* khi thực đơn có 3 loại bò với mức giá khác nhau).
4. *Phân quyền và bảo mật (Row-Level Security & Authorization).*
5. *Nhận diện ý định phức hợp (Intent Recognition).*
6. *Các chế độ lỗi đặc thù (Failure Modes).*
7. *Độ trễ vận hành (Latency).*

#### Đóng góp thực tiễn cho SmartRestaurant:
* Khi khách hỏi: *"Bàn tôi hết bao nhiêu tiền?"* $\rightarrow$ Kích hoạt SQL/API lấy tổng tiền chính xác 100%, không dùng Vector RAG để đoán mò.
* Ngay sau khi thêm món vào giỏ, giỏ hàng được cập nhật đồng bộ vào session của Aria, tránh việc khách hỏi lại giỏ hàng bị sót món vừa gọi.

---

### 3. Paper [3]: From Language Models to World-Acting Systems: Progress and Limits of Agentic AI
* **Tác giả:** Liang Zhu, Mengting Cai (Independent Research)
* **Xuất bản:** arXiv:2609.04894v1 [cs.AI], 05 Sep 2026
* **Liên kết bản deploy trực quan:** 👉 [https://f68e8834.ht-ml.app/](https://f68e8834.ht-ml.app/)
* **File tài liệu cục bộ:**
  - Bản dịch chi tiết tiếng Việt: `paper/03_From_Language_Models_to_World_Acting_Systems_VI.md`
  - PDF gốc: `paper/03_From_Language_Models_to_World_Acting_Systems.pdf`
  - Giao diện HTML chuẩn hóa: `.lavish/paper_03_world_acting_systems_summary.html`

#### Tóm tắt (Abstract)
Bài tổng quan phê phán làm rõ bước tiến hóa mang tính bước ngoặt: chuyển từ các mô hình sinh ngôn ngữ thụ động (LLM) sang các **Hệ thống Tác động Thế giới (*World-Acting Systems*)** có khả năng thay đổi trạng thái của môi trường số, môi trường ảo và vật lý. Nhóm tác giả thiết lập khung phân tích 3 chiều độc lập:
1. **Thẩm quyền được ủy nhiệm (Delegated Authority):** Ranh giới những hành động nào hệ thống được phép tự động kích hoạt.
2. **Tính bền bỉ theo thời gian (Temporal Persistence):** Trạng thái bộ nhớ và mục tiêu được duy trì xuyên suốt chu trình tương tác.
3. **Sự gắn kết môi trường (Environmental Coupling):** Mức độ tác động qua lại chặt chẽ với thế giới bên ngoài.

Bài báo đồng thời đề xuất nguyên tắc **"Ủy quyền Hợp thức" (*Justified Delegation*)** — chỉ trao quyền tự động cho các hành vi có thể đảo ngược hoặc hoàn tác được; và mô hình nhận thức kép **System 1 (phản xạ nhanh, streaming văn bản)** song hành cùng **System 2 (tính toán suy luận, kiểm tra rào chắn an toàn)**.

#### Đóng góp thực tiễn cho SmartRestaurant:
* Chuyển hóa Aria từ chatbot hỏi đáp thụ động thành một **World-Acting Agent** thực thụ: Có thể tự động thêm món vào giỏ, cập nhật số lượng, bắn thông báo vào màn hình nhà bếp (KDS) và phát chuông gọi nhân viên phục vụ.
* Nguyên tắc an toàn: Mọi thao tác giỏ hàng đều cho phép khách hàng sửa đổi hoặc hủy bỏ trước khi gửi bếp chính thức.

---

### 4. Paper [4]: Self-evolving Agentic Customer Support System at LinkedIn
* **Tác giả:** Chih Hui Wang, Mengdie Tu, Qianyun Zhang, Wei Wu, Lili Zhou, Mingqi Shen, Changshuai Wei (LinkedIn Corporation)
* **Xuất bản:** arXiv:2608.10224v1 [cs.AI], 11 Aug 2026
* **Liên kết bản deploy trực quan:** 👉 [https://e7a6b96e.ht-ml.app/](https://e7a6b96e.ht-ml.app/)
* **File tài liệu cục bộ:**
  - Bản dịch chi tiết tiếng Việt: `paper/04_Self_Evolving_Agentic_Customer_Support_LinkedIn_VI.md`
  - PDF gốc: `paper/04_Self_Evolving_Agentic_Customer_Support_LinkedIn.pdf`
  - Giao diện HTML chuẩn hóa: `.lavish/paper_04_linkedin_self_evolving_agent_summary.html`

#### Tóm tắt (Abstract)
Trong môi trường doanh nghiệp quy mô lớn, chính sách dịch vụ và giao diện người dùng thay đổi liên tục. Việc tinh chỉnh trọng số mô hình (**Fine-tuning**) quá chậm, tốn kém tài nguyên và dễ gây ra hiện tượng *Thảm họa quên lãng (Catastrophic Forgetting)*. Đội ngũ kỹ sư LinkedIn đề xuất kiến trúc **Tự tiến hóa 3 tầng tạo tác độc lập mà không cần fine-tuning**:
1. **Kiến trúc hai vòng lặp (Two-Loop Architecture):**
   - *Vòng lặp thực thi (Inner Loop):* Chạy thời gian thực (`GPT-4o-mini`), hoàn toàn phi trạng thái tiềm ẩn xuyên phiên (stateless), phục vụ người dùng ở mức mili-giây.
   - *Vòng lặp tiến hóa (Outer Loop):* Chạy ngoại tuyến hàng tuần, tiêu thụ dữ liệu đo từ xa (telemetry stream) để tự động tối ưu hóa câu nhắc và cấu hình truy xuất.
2. **Động cơ Auto-Prompt di truyền (Genetic Algorithm):** Lai ghép ngữ nghĩa (*SemanticBlend Crossover*), đột biến có định hướng (*Mutation*) kết hợp các rào chắn kinh doanh cứng (*Hard Constraints*).
3. **Agentic RAG & Versioned Content Lake:** Coi RAG như một công cụ suy luận có kiểm soát; quản lý chỉ mục tri thức bằng Snapshot Pointers, cho phép khôi phục tức thì khi chỉ mục bị ô nhiễm.
4. **Kết quả kiểm chứng A/B trên lưu lượng thực tế (N > 65,000 hội thoại):**
   - Tự phục vụ QA tăng **+9.0 điểm phần trăm** ($33.7\% \rightarrow 42.7\%$, $z=27.6$).
   - Tự phục vụ hủy gói tăng **+4.8 điểm phần trăm** ($61.9\% \rightarrow 66.6\%$, $z=10.0$).
   - Độ chính xác định tuyến tăng **+30.6 điểm phần trăm** ($38.2\% \rightarrow 68.8\%$, $z=8.2$).
   - Tỷ lệ ảo giác giảm xuống dưới **< 0.1%**.

#### Đóng góp thực tiễn cho SmartRestaurant:
* Áp dụng nguyên lý *Strict Grounding Constraint* để triệt tiêu ảo giác về chất gây dị ứng thực phẩm xuống dưới 0.1%.
* Quản lý thực đơn linh hoạt bằng *Snapshot Pointers* — khi hết món hoặc đổi menu theo mùa, cập nhật con trỏ tri thức tức thì mà không cần khởi động lại chatbot hay fine-tune mô hình.
* Tự động tiến hóa câu nhắc gợi ý món bán kèm (upselling/cross-selling) định kỳ dựa trên log gọi món thực tế của thực khách.

---

### 5. Paper [5]: From Prompt–Response to Goal-Directed Systems: The Evolution of Agentic AI Software Architecture
* **Tác giả:** Mamdouh Alenezi (The Saudi Technology and Security Comprehensive Control Company - Tahakom)
* **Xuất bản:** arXiv:2602.10479v1 [cs.SE], 11 Feb 2026
* **Liên kết bản deploy trực quan:** 👉 [https://ee140d88.ht-ml.app/](https://ee140d88.ht-ml.app/)
* **File tài liệu cục bộ:**
  - Bản dịch chi tiết tiếng Việt: `paper/05_Evolution_of_Agentic_AI_Software_Architecture_VI.md`
  - PDF gốc: `paper/05_Evolution_of_Agentic_AI_Software_Architecture.pdf`
  - Giao diện HTML chuẩn hóa: `.lavish/paper_05_agentic_ai_software_architecture_summary.html`

#### Tóm tắt (Abstract)
Agentic AI đại diện cho sự trưởng thành của phần mềm AI tương tự như quá trình phát triển của Dịch vụ Web (Web Services). Bài báo thiết lập nền tảng công nghệ phần mềm vững chắc cho các hệ thống tác tử cấp sản xuất:
1. **Kiến trúc Tham chiếu 4 Tầng có Quản trị (Governed Reference Architecture):**
   - *Agent Core Layer:* Nhân nhận thức (Planning, ReAct, Reflexion).
   - *Control Layer:* Bộ định tuyến ý định (Intent Router), thực thi chính sách và cổng kiểm duyệt.
   - *Memory Layer:* Phân tầng bộ nhớ làm việc ngắn hạn và bộ nhớ ngữ nghĩa dài hạn.
   - *Tooling Layer:* Giao diện thực thi định kiểu, môi trường cô lập sandbox.
2. **Bảng phân loại Topologies Đa Tác Tử:** So sánh chuyên sâu giữa *Router-Solver, Orchestrator-Worker, Peer-to-Peer* và *Blackboard*, chỉ rõ các chế độ thất bại (vòng lặp vô hạn, thất bại dây chuyền, bế tắc) và chiến lược giảm thiểu.
3. **Danh mục Kiểm tra Độ vững chắc cho Doanh nghiệp (Enterprise Hardening Checklist):**
   - *Budgeted Autonomy:* Khóa cứng số bước suy luận tối đa ($K_{\max}$).
   - *Circuit Breakers:* Bộ ngắt mạch tự động cô lập API bên ngoài khi gặp sự cố mạng liên tiếp.
   - *Typed Tool Contracts:* Định kiểu dữ liệu vào/ra nghiêm ngặt bằng JSON Schema / Pydantic.
   - *Runtime Observability:* Truy vết (tracing) chi tiết từng bước suy luận.

#### Đóng góp thực tiễn cho SmartRestaurant:
* Định hình kiến trúc phân tầng chuẩn mực cho Aria với cấu trúc liên kết **Router-Solver** (phân luồng: Tư vấn món vs Thao tác giỏ hàng vs Gọi nhân viên).
* Khống chế giới hạn suy luận tối đa $K_{\max} = 5$ bước lặp, đảm bảo phản hồi tức thì và không bao giờ bị treo bot làm phiền thực khách.
* Trang bị Bộ ngắt mạch (Circuit Breaker) cho các kết nối tới máy in bếp và hệ thống POS.

---

## TỔNG KẾT QUY TRÌNH QUẢN LÝ TÀI LIỆU VÀ TRUY CẬP

1. **Cổng thông tin trực tuyến (Live Web Hub):** [https://2c80a67d.ht-ml.app/](https://2c80a67d.ht-ml.app/)
2. **Cấu trúc lưu trữ tệp tin đã chuẩn hóa:**
   - Thư mục học thuật: `paper/01_...` đến `paper/05_...` (bao gồm đầy đủ file PDF gốc và bản dịch Markdown tiếng Việt).
   - Thư mục giao diện HTML: `.lavish/paper_01_...` đến `.lavish/paper_05_...` (sử dụng Light Theme, Tailwind v4, DaisyUI v5 và sơ đồ Mermaid).
   - Nhật ký mã nguồn dự án: `01_ai_consultant_proposal.html`, `02_framework_architecture.html`, `03_ai_service_evaluation_roadmap.html`, `04_summary_commits.html`.

*Tài liệu tổng hợp này là cơ sở học thuật chính thức phục vụ thuyết minh và bảo vệ Khóa luận Tốt nghiệp.*
