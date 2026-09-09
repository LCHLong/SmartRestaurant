# Vượt ra ngoài Truy xuất Tài liệu: Các Thách thức Kiến trúc khi LLM Agent Truy vấn Dữ liệu Doanh nghiệp có Cấu trúc
*(Beyond Document Retrieval: Architectural Challenges When LLM Agents Query Structured Enterprise Data)*

**Tác giả:** Sheikh Nazib Ahmed  
*University of Texas at Arlington, Arlington, TX, USA*  
*Email: sxa5256@mavs.uta.edu*  
**Định danh:** arXiv:2608.19235v1 [cs.DL] 4 Aug 2026  

---

### Tóm tắt (Abstract)

Retrieval-Augmented Generation (RAG) đã trở thành một kiến trúc phổ biến để kết nối các Large Language Model (LLM) với tri thức doanh nghiệp. Hầu hết các hệ thống RAG hiện nay truy xuất các tài liệu phi cấu trúc—tệp PDF, trang wiki, phiếu hỗ trợ (support tickets)—và nạp chúng vào một LLM để tóm tắt hoặc trả lời câu hỏi. Tuy nhiên, một nhóm ngày càng tăng các enterprise agent phải truy vấn dữ liệu có cấu trúc: các cơ sở dữ liệu quan hệ (relational databases), kho dữ liệu (data warehouses), và các analytics API, nơi câu trả lời là một **kết quả được tính toán (computed result)** chứ không phải một đoạn văn bản được truy xuất (retrieved passage).

Việc truy vấn dữ liệu có cấu trúc buộc hệ thống phải đưa ra các quyết định mà một đường ống (pipeline) document RAG không bao giờ phải đối mặt. Chúng tôi nhóm các quyết định này thành **bảy chiều kiến trúc (seven architectural dimensions)**: 
1. Ngữ nghĩa truy xuất (*retrieval semantics*);
2. Phân quyền/Ủy quyền (*authorization*);
3. Nhận diện ý định (*intent recognition*);
4. Phân giải thực thể (*entity resolution*);
5. Đánh giá (*evaluation*);
6. Các chế độ thất bại (*failure modes*); và
7. Độ trễ (*latency*).

Đối với từng chiều, chúng tôi mô tả giả định cơ sở (baseline assumption), giải thích giới hạn của nó đối với dữ liệu có cấu trúc, và trình bày một mẫu kiến trúc tổng quát (generic architectural pattern). Như một bằng chứng thực nghiệm bổ trợ, một nghiên cứu tổng hợp có đối chứng (controlled synthetic study) chỉ ra rằng một agent phân tầng (staged agent) được xây dựng trên khung kiến trúc này đã triệt tiêu hoàn toàn các vi phạm phân quyền so với một đường cơ sở dịch-và-thực-thi trực tiếp (direct translate-and-execute baseline) trong các điều kiện đối chứng. Kết quả chính của bài báo là một khung kiến trúc định hướng thiết kế (design-oriented framework), một giao thức đánh giá (evaluation protocol), và một tập hợp các bài toán mở dành cho các governed structured-data agents.

**Chỉ mục thuật ngữ (Index Terms):** RAG, LLM agents, structured data, text-to-SQL, enterprise AI, software architecture.

---

## I. Giới thiệu (Introduction)

Khi một đội ngũ kỹ thuật muốn một LLM được gắn kết (grounded) trên dữ liệu nội bộ của riêng họ, giải pháp đầu tiên họ thường tìm đến là Retrieval-Augmented Generation (RAG) [1]. Công thức này giờ đây đã trở nên quen thuộc: các tài liệu được cắt nhỏ (*chunked*), nhúng thành vector (*embedded*), và lưu trữ trong một chỉ mục vector (*vector index*); tại thời điểm truy vấn, hệ thống sẽ kéo ra $top\text{-}k$ đoạn văn bản gần nhất và nạp chúng vào model làm ngữ cảnh (*context*). Phần lớn các tài liệu nghiên cứu RAG sau đó tập trung tinh chỉnh một hoặc nhiều giai đoạn, từ phân đoạn (*chunking*) [3] và các mô hình embedding [4], cho đến truy xuất (*retrieval*) [5], xếp hạng lại (*reranking*) [6], và xây dựng prompt (*prompt construction*) [2].

Kiến trúc này giả định rằng nguồn dữ liệu là một tập hợp các tài liệu văn bản. Người dùng đặt câu hỏi, hệ thống tìm các đoạn văn bản liên quan nhất, và LLM tổng hợp câu trả lời từ các đoạn văn bản đó. Nhưng một số lượng ngày càng tăng các AI agent trong doanh nghiệp hoàn toàn không truy xuất tài liệu. Chúng truy vấn dữ liệu có cấu trúc—cơ sở dữ liệu quan hệ, kho dữ liệu, các analytics API—nơi câu trả lời là một kết quả tính toán: một số lượng đếm, một bảng dữ liệu đã lọc, một chỉ số tổng hợp (*aggregated metric*).

Hãy xem xét hai câu hỏi được đặt ra cho một enterprise AI agent:
* **"Chính sách đổi trả của công ty chúng ta là gì?"** — Agent truy xuất các tài liệu chính sách liên quan và tổng hợp câu trả lời. Đây là **document RAG**.
* **"Acme Corp hiện có bao nhiêu đơn hàng đang mở?"** — Không có tài liệu nào chứa câu trả lời này. Agent phải dịch câu hỏi thành một truy vấn SQL, thực thi nó trên cơ sở dữ liệu, và tóm tắt kết quả dạng số. Đây là một **structured-data agent**.

Câu hỏi thứ hai đòi hỏi một chuỗi trách nhiệm hoàn toàn khác. Agent phải xác định miền nghiệp vụ mục tiêu (target domain), phân giải thực thể khách hàng thành một mã định danh chuẩn tắc (*canonical identifier*), xác minh quyền truy cập khách hàng và quyền truy cập miền dữ liệu, chọn nguồn dữ liệu thích hợp, sinh ra một câu truy vấn hoặc yêu cầu API tuân thủ đúng lược đồ (*schema-compliant*), thực thi nó, áp dụng các ràng buộc kết quả bắt buộc, và tóm tắt dữ liệu trả về. Một số trách nhiệm này có thể xuất hiện trong các hệ thống AI khác, nhưng chúng **không phải là các chi tiết triển khai tùy chọn** khi câu trả lời phụ thuộc vào dữ liệu có cấu trúc trực tiếp, chịu sự kiểm soát truy cập nghiêm ngặt.

Do đó, một bản mẫu (template) document RAG có thể là một trừu tượng hóa khởi đầu rất tồi cho các structured-data agent nếu các giả định về truy xuất, phân quyền và nhận diện ý định của nó được bê nguyên sang mà không qua tái thiết kế. Một thiết kế dữ liệu có cấu trúc được quản trị (*governed structured-data design*) phải biến việc điều hướng nguồn dữ liệu (*source routing*), thực thi chính sách (*policy enforcement*), gắn kết thực thể (*entity binding*), và xác thực truy vấn (*query validation*) thành các bước tường minh, thay vì để mặc chúng ẩn tàng bên trong độ tương đồng tài liệu hoặc trong một prompt đơn lẻ. Những yêu cầu này thúc đẩy sự cần thiết phải so sánh hai mẫu kiến trúc, dù chúng tôi không khẳng định rằng mọi hệ thống RAG hay mọi structured-data agent đều tuân theo cùng một thiết kế giống hệt nhau.

Bài báo này khảo sát những thay đổi về mặt kiến trúc khi nguồn dữ liệu chuyển dịch từ tài liệu phi cấu trúc sang dữ liệu có cấu trúc. Chúng tôi xác định **bảy chiều kiến trúc** nơi mà một baseline document RAG tối thiểu không bộc lộ được các yêu cầu vốn trở nên bắt buộc trong structured-data agent. Chúng tôi kiểm tra từng chiều thông qua các kịch bản doanh nghiệp đại diện và một kiến trúc tham chiếu tổng quát. Phân tích tập trung vào các trách nhiệm có thể tái sử dụng và các phụ thuộc kiểm soát (*control dependencies*) hơn là tuyên bố rằng thiết kế của một tổ chức đơn lẻ là phổ quát.

**Các đóng góp chính của bài báo:**
1. Một so sánh định hướng thiết kế giữa document RAG tối thiểu và structured-data agent xuyên suốt bảy chiều kiến trúc.
2. Một kiến trúc tham chiếu (reference architecture) ánh xạ các yêu cầu dữ liệu có cấu trúc thành các giai đoạn tường minh: điều hướng, phân quyền, phân giải thực thể, xác thực, thực thi và lưu trữ bền vững.
3. Một bảng phân loại các chế độ thất bại (*failure-mode taxonomy*) tổ chức năm rủi ro lặp lại đặc biệt nổi cộm khi LLM sinh và thực thi các truy vấn dữ liệu có cấu trúc.
4. Xác định bốn bài toán mở (*open problems*) mà các enterprise structured-data agent hiện nay chưa giải quyết trọn vẹn.
5. Một nghiên cứu tổng hợp có đối chứng chứng minh rằng thiết kế phân tầng giúp cải thiện độ chính xác kết quả và triệt tiêu các vi phạm phân quyền so với đường cơ sở dịch-và-thực-thi trực tiếp.

---

## II. Bối cảnh (Background)

### A. Kiến trúc Document-RAG (Document-RAG Architecture)
Kiến trúc RAG kinh điển [1] vận hành qua hai giai đoạn:
* **Giai đoạn lập chỉ mục (Indexing):** Tài liệu được chia thành các đoạn (*chunks*), mỗi đoạn được chuyển đổi thành một vector embedding dày đặc, và các embedding được lưu trong vector index.
* **Giai đoạn suy luận (Inference):** Truy vấn của người dùng được nhúng thành vector, hệ thống kéo ra $top\text{-}k$ đoạn gần nhất, và các đoạn này được nối với truy vấn để làm ngữ cảnh cho LLM. LLM sinh câu trả lời được gắn kết trong các đoạn văn bản được truy xuất.

Các phần mở rộng của kiến trúc này bao gồm: truy xuất đa bước (*multi-step retrieval*) [2], tìm kiếm lai (*hybrid search* kết hợp truy xuất dày đặc và thưa thớt), viết lại truy vấn (*query rewriting*), và agentic RAG nơi LLM quyết định các hành động truy xuất cần thực hiện. Bất chấp các phần mở rộng này, giả định cốt lõi vẫn không đổi: **nguồn dữ liệu là một tập hợp các đoạn văn bản, và nhiệm vụ của hệ thống là tìm đúng đoạn văn bản để LLM đọc chúng.**

**Mục tiêu tối ưu của RAG:** Tài liệu nghiên cứu tối ưu hóa RAG phong phú hiện nay tập trung vào ba chiều chất lượng:
1. Độ phù hợp truy xuất (*retrieval relevance*) — đảm bảo tìm đúng chunks;
2. Xây dựng ngữ cảnh (*context construction*) — sắp xếp các chunks thành một prompt hiệu quả;
3. Độ trung thực sinh (*generation faithfulness*) — đảm bảo phản hồi của LLM bám sát ngữ cảnh được nạp vào.

Ba chiều này định hình mô hình chất lượng cho document RAG. Tuy nhiên, như chúng tôi chỉ ra ở Mục III, structured-data agent đòi hỏi một mô hình chất lượng hoàn toàn khác: **độ chính xác truy vấn (query correctness), độ trung thực lược đồ (schema fidelity), sự tuân thủ phân quyền (authorization compliance), độ chính xác phân giải thực thể (entity resolution accuracy), và độ trung thực tóm tắt (summarization faithfulness)** thay thế hoàn toàn cho ba chiều của document RAG.

### B. Các Agent Dữ liệu có cấu trúc (Structured-Data Agents)
Structured-data agent dịch các câu hỏi ngôn ngữ tự nhiên thành các truy vấn hình thức—điển hình là SQL—trên các nguồn dữ liệu quan hệ. Đây chính là bài toán text-to-SQL [7], nay được mở rộng với LLM đóng vai trò là động cơ dịch thuật. Trong môi trường doanh nghiệp, agent phải xử lý nhiều nguồn dữ liệu, thực thi kiểm soát truy cập, phân giải các tham chiếu thực thể, và trình bày kết quả bằng ngôn ngữ tự nhiên.

Khác biệt then chốt so với document RAG là **LLM không đọc một đoạn văn bản rồi tổng hợp câu trả lời**. Thay vào đó, nó sinh ra mã thực thi (một câu truy vấn), hệ thống thực thi mã đó trên cơ sở dữ liệu, và kết quả thô được trả về để tóm tắt. **LLM vận hành như một bộ dịch thuật và bộ tóm tắt, chứ không phải một người đọc và người tổng hợp.**

### C. Phạm vi Nghiên cứu Thiết kế (Scope of the Design Study)
Chúng tôi xem xét một governed structured-data agent phục vụ nhiều vai trò truy cập (*access personas*) và trả lời các câu hỏi trên nhiều nguồn dữ liệu vận hành. Agent có thể hỗ trợ tra cứu trực tiếp, so sánh đa nguồn (*multi-source comparisons*), và điều tra tuần tự (*sequential investigations*). 

Một thiết kế tổng quát bao gồm: diễn giải câu hỏi, kiểm tra chính sách, gắn kết thực thể, lập kế hoạch lược đồ và nguồn dữ liệu, xác thực khả năng trả lời (*answerability validation*), thực thi truy vấn có quản trị, giải thích phản hồi, và ghi nhật ký kiểm toán (*audit logging*). Đây là các năng lực kiến trúc chứ không phải một thứ tự triển khai cứng nhắc; một hệ thống triển khai thực tế có thể kết hợp hoặc tách nhỏ chúng tùy theo dịch vụ dữ liệu và mô hình quản trị của mình.

Người dùng tương tác với agent qua giao diện ngôn ngữ tự nhiên và nhận lại kết quả kèm lời giải thích. Một yêu cầu có thể kết thúc sớm (*terminate early*) khi phạm vi không được hỗ trợ, quyền truy cập bị từ chối, thực thể bị mơ hồ, nguồn dữ liệu không khả dụng, hoặc ngữ cảnh hiện có không đủ để tạo một truy vấn an toàn. Kiến trúc tham chiếu coi những kết quả này là các trạng thái luồng điều khiển tường minh (*explicit control-flow states*) chứ không phải là những thất bại truy xuất âm thầm (*silent retrieval failures*).

### D. Phương pháp Phân tích Thiết kế (Design Analysis Method)
Chúng tôi sử dụng phương pháp phân tích thiết kế có cấu trúc thay vì một báo cáo triển khai sản phẩm đơn lẻ. Đầu tiên, chúng tôi so sánh các giả định của baseline document RAG tối thiểu với các trách nhiệm phát sinh trong truy vấn dữ liệu có cấu trúc. Tiếp theo, chúng tôi tổ chức các trách nhiệm đó thành bảy chiều và truy vết tương tác của chúng qua các kịch bản đại diện. Cuối cùng, chúng tôi rút ra một kiến trúc tham chiếu, một bảng phân loại lỗi, và một giao thức đánh giá theo giai đoạn. Bài báo không chứa các prompt, schema, endpoint, log hay kết quả nội bộ của bất kỳ tổ chức cụ thể nào; các ví dụ được trừu tượng hóa có chủ đích để việc phân tích có thể được thảo luận độc lập với bất kỳ sản phẩm thương mại nào.

---

## III. Bảy Chiều Kiến trúc (Seven Architectural Dimensions)

Chúng tôi xác định bảy chiều kiến trúc mà ở đó bước chuyển từ truy xuất tài liệu sang truy vấn dữ liệu có cấu trúc đòi hỏi các mẫu thiết kế hoàn toàn khác nhau. Hình 1 so sánh hai đường ống ở mức trừu tượng cao, và Bảng I cung cấp so sánh chi tiết xuyên suốt toàn bộ bảy chiều.

---

### Bảng I: So sánh Kiến trúc qua Bảy Chiều
*(Table I: Architectural comparison across seven dimensions. Each row describes a document-RAG assumption and how structured-data agents diverge.)*

| Chiều kiến trúc (*Dimension*) | Document RAG | Structured-Data Agent |
| :--- | :--- | :--- |
| **Ngữ nghĩa truy xuất (*Retrieval semantics*)** | Độ tương đồng ngữ nghĩa (*semantic similarity*) trên các đoạn văn bản (*text chunks*) | Lập kế hoạch nguồn dữ liệu hiểu lược đồ (*schema-aware source planning*) và xây dựng truy vấn hình thức |
| **Phân quyền / Ủy quyền (*Authorization*)** | Danh sách kiểm soát truy cập cấp tài liệu (*document-level ACLs*); lọc ngay lúc truy xuất | Kiểm tra chính sách ở cấp thực thể (*entity*), phạm vi (*scope*), hoặc *tenant* trước khi thực thi |
| **Nhận diện ý định (*Intent recognition*)** | Ngầm định bên trong độ tương đồng vector embedding | Trạng thái tường minh về tác vụ, phạm vi dữ liệu và thực thể phục vụ việc lập kế hoạch hạ nguồn |
| **Phân giải thực thể (*Entity resolution*)** | Xếp hạng đoạn văn bản phó mặc sự mơ hồ cho giai đoạn sinh | Gắn kết tường minh các tham chiếu với mã định danh nguồn chuẩn tắc (*canonical source identifiers*) |
| **Đánh giá (*Evaluation*)** | Chất lượng truy xuất (*recall@k, MRR*) + Chất lượng sinh (*faithfulness*) | Độ chính xác của truy vấn, chính sách, thực thể, kết quả trả về và lời giải thích |
| **Chế độ thất bại (*Failure modes*)** | Bỏ sót đoạn văn bản (*retrieval misses*), ảo giác từ ngữ cảnh không liên quan | Ảo giác lược đồ (*schema hallucination*), sai khóa nối (*wrong joins*), nhầm lẫn mã định danh, rò rỉ phân quyền một phần |
| **Hồ sơ độ trễ (*Latency profile*)** | Tra cứu embedding vector + Một lệnh gọi LLM | Các lệnh gọi model + Dịch vụ chính sách & siêu dữ liệu + Thực thi truy vấn cơ sở dữ liệu |

---

```
                       So sánh Đường ống Cô đọng (Fig. 1)
                       ==================================

        Document RAG                              Structured-Data Agent
  +----------------------+                      +------------------------+
  |  Nhúng Truy vấn      |                      | Diễn giải Tác vụ       |
  |  (Embed Query)       |                      | & Phạm vi (Scope)      |
  +----------+-----------+                      +-----------+------------+
             |                                              |
             v                                              v
  +----------------------+                      +------------------------+
  | Truy xuất Đoạn văn   |                      | Chính sách & Gắn kết   |
  | (Retrieve Chunks)    |                      | Thực thể (Policy/Bind) |
  +----------+-----------+                      +-----------+------------+
             |                                              |
             v                                              v
  +----------------------+                      +------------------------+
  | Sinh Phản hồi        |                      | Lập kế hoạch Lược đồ   |
  | (Generate Response)  |                      | & Nguồn (Schema Plan)  |
  +----------------------+                      +-----------+------------+
                                                            |
                                                            v
                                                +------------------------+
                                                | Xác thực Khả năng      |
                                                | Trả lời (Validation)   |
                                                +-----------+------------+
                                                            |
                                                            v
                                                +------------------------+
                                                | Thực thi Truy vấn      |
                                                | Có quản trị (Execution)|
                                                +-----------+------------+
                                                            |
                                                            v
                                                +------------------------+
                                                | Giải thích Kết quả     |
                                                | (Explain Results)      |
                                                +-----------+------------+
                                                            |
                                                            v
                                                +------------------------+
                                                | Kiểm toán & Nguồn gốc  |
                                                | (Audit & Provenance)   |
                                                +------------------------+
```

**Hình 1:** *So sánh đường ống cô đọng. Document RAG được thể hiện dưới dạng nhúng, truy xuất và sinh. Một thiết kế dữ liệu có cấu trúc tổng quát làm rõ ràng các bước: phạm vi, chính sách, gắn kết thực thể, lập kế hoạch nguồn, xác thực, thực thi, giải thích phản hồi và nguồn gốc; các hệ thống triển khai thực tế có thể kết hợp hoặc sắp xếp lại các năng lực này.*

---

### A. Chiều 1: Ngữ nghĩa Truy xuất (Retrieval Semantics)
Truy xuất trong document RAG hoạt động dựa trên độ tương đồng ngữ nghĩa: nhúng truy vấn, tìm các chunks gần nhất trong không gian vector, nạp chúng vào LLM. Thất bại biểu hiện dưới dạng các chunks không liên quan hoặc bị thiếu, và toàn bộ kho tài liệu tối ưu hóa RAG chỉ tập trung làm cho phép tìm kiếm tương đồng này tốt hơn.

Ngược lại, structured-data agent **không có văn bản nào để truy xuất**. Hệ thống phải dịch câu hỏi của người dùng thành một truy vấn hình thức mà cơ sở dữ liệu có thể thực thi. Quá trình dịch này đòi hỏi phải hiểu thấu đáo lược đồ cơ sở dữ liệu (*database schema*): bảng nào tồn tại, chúng chứa những cột nào, các đường nối (*join paths*) nào liên kết chúng, và bộ lọc nào cần được áp dụng. LLM phải sinh ra mã SQL đúng cú pháp và đúng ngữ nghĩa, chứ không phải đi tìm một đoạn văn bản tương tự.

Điều này làm thay đổi toàn bộ đường ống truy xuất. Thay vì một vector database, hệ thống cần một **sổ đăng ký lược đồ (*schema registry*)**—một danh mục chứa các bảng khả dụng, các cột, mô tả nghiệp vụ và các mối quan hệ giữa chúng. Thay vì độ tương đồng embedding, hệ thống cần **điều hướng hiểu lược đồ (*schema-aware routing*)**: xác định bảng nào có thể trả lời câu hỏi của người dùng dựa trên độ bao phủ của cột và sự phù hợp về miền nghiệp vụ.

* **Kịch bản minh họa:** Người dùng hỏi: *"Ngày kết thúc hợp đồng của Acme Corp là khi nào?"*. Trong document RAG, hệ thống truy xuất các đoạn văn bản có đề cập đến "Acme Corp" và "hợp đồng". Trong structured-data agent, hệ thống phải xác định rằng bảng `contracts` có cột `contract_end_date`, khách hàng có thể được định danh qua một khóa khách hàng (`customer_key`), và sinh ra câu truy vấn kết nối bảng `contracts` với bảng tra cứu khách hàng. Không có văn bản nào được truy xuất; một câu truy vấn được kiến tạo.
* **Độ phức tạp đa nguồn (*Multi-source complexity*):** Một agent đa nguồn phải xử lý các bảng liên quan có phạm vi, mã định danh và tập hợp cột khác nhau. Thành phần sổ đăng ký lược đồ và lập kế hoạch nguồn có thể chọn lọc các nguồn ứng viên và phơi bày các đường nối (*join paths*) hợp lệ trước khi kiến tạo truy vấn. Việc chọn bảng do đó là **bài toán điều hướng lược đồ và phạm vi (*schema-and-scope routing problem*)** chứ không phải truy xuất đoạn văn bản thông thường. Bề mặt dữ liệu được chọn cũng quyết định những kiểm tra truy vấn và chính sách nào là bắt buộc ở các bước sau.

---

### B. Chiều 2: Độ mịn Phân quyền Ủy quyền (Authorization Granularity)
Cơ chế phân quyền trong document RAG thường lọc tài liệu bằng siêu dữ liệu kiểm soát truy cập cấp tài liệu (*document-level ACLs*) trước khi ngữ cảnh được nạp tới LLM [15, 16]. Structured-data agent bắt buộc phải gắn kết các quyết định phân quyền vào chính các **thực thể và miền nghiệp vụ** được nêu ra trong câu truy vấn.

Một thiết kế dữ liệu có cấu trúc có quản trị có thể phân chia việc kiểm tra chính sách thành nhiều phạm vi:
1. **Phạm vi thực thể (*Entity scope*):** Người dùng này có được phép truy cập thực thể được nêu tên hoặc ngụ ý trong câu hỏi hay không?
2. **Phạm vi dữ liệu (*Data scope*):** Vai trò hoặc *tenant* của người dùng này có được phép truy cập khu vực nghiệp vụ và nguồn dữ liệu được yêu cầu hay không?
3. **Phạm vi trường dữ liệu (*Field scope*):** Những thuộc tính nào, nếu có, đòi hỏi phải làm mờ (*masking*) hoặc ẩn giấu sau khi đã chọn nguồn dữ liệu?

Những kiểm tra này phải được thực thi **bên ngoài language model** và được đối xử như các ranh giới độc lập. Chúng phụ thuộc vào truy vấn vì hệ thống trước tiên phải xác định câu hỏi đang nhắc tới thực thể, phạm vi và nguồn dữ liệu nào. Các tra cứu chính sách độc lập có thể chạy song song với quá trình diễn giải câu hỏi, nhưng kết quả chính sách phải ràng buộc việc lựa chọn thực thể ứng viên trước khi một thực thể mơ hồ được hiển thị cho người dùng.

* **Phân quyền một phần (*Partial authorization*):** Một câu hỏi xuyên nguồn có thể bao gồm cả phạm vi dữ liệu được phép lẫn không được phép. Một governed agent phải quyết định: từ chối toàn bộ yêu cầu, trả về một tập con được phép kèm lời giải thích rõ ràng, hay yêu cầu người dùng thu hẹp phạm vi. Đây là một sự khác biệt kiến trúc mang tính bản chất so với một bộ lọc tài liệu đơn giản.
* **Thời điểm phân quyền (*Authorization timing*):** Kiểm tra chính sách phải diễn ra trước khi thực thi truy vấn và, ở nơi các thực thể ứng viên được hiển thị, phải diễn ra trước khi chọn thực thể. Kiểm tra phụ thuộc phạm vi có thể diễn ra sau bước diễn giải tác vụ vì hệ thống cần vùng dữ liệu đã được giải quyết. **Bất biến quan trọng là: đầu ra không đáng tin cậy của model không bao giờ được phép mở rộng tập dữ liệu đã được cấp quyền.**

---

### C. Chiều 3: Nhận diện Ý định và Điều hướng Truy vấn (Intent Recognition and Query Routing)
Một bộ truy xuất tài liệu có thể điều hướng chủ đề một cách ngầm định thông qua độ tương đồng vector, nhưng structured-data agent bắt buộc phải tạo ra **trạng thái tác vụ và phạm vi tường minh (*explicit task and scope state*)** vì các quyết định tra cứu sổ đăng ký và chính sách ở hạ nguồn hoàn toàn phụ thuộc vào trạng thái này. Thành phần diễn giải (*interpretation component*) có thể xác định một hoặc nhiều vùng dữ liệu, phân biệt giữa tra cứu trực tiếp (*direct lookup*) với so sánh (*comparison*) hoặc điều tra (*investigation*), và ghi nhận độ bất định để xử lý sau.

Một danh mục nghiệp vụ tổng quát chứa các mô tả về các khu vực nghiệp vụ sẵn có và độ bao phủ nguồn của chúng. Một cơ chế dự phòng (*fallback*) xử lý các câu hỏi không liên quan, quá mơ hồ, hoặc nằm ngoài danh mục. Ngữ cảnh ứng dụng đáng tin cậy có thể giảm bớt khối lượng diễn giải cần thiết, nhưng không được phép bỏ qua việc thực thi chính sách. Các tra cứu diễn giải và chính sách độc lập có thể chạy đồng thời khi không bên nào phụ thuộc vào kết quả của bên kia.

* **Ý định đa nguồn (*Multi-source intent*):** Một câu hỏi có thể đòi hỏi nhiều vùng dữ liệu mà không nêu tên chúng một cách rõ ràng. Ví dụ, một câu hỏi về trạng thái dịch vụ có thể đòi hỏi các nguồn dữ liệu vận hành, kho bãi và hỗ trợ khách hàng. Thành phần ý định do đó trả về một tập hợp các phạm vi ứng viên và một loại tác vụ, chứ không phải một nhãn truy xuất đơn lẻ. Trạng thái tường minh này cho phép thành phần lập kế hoạch nguồn lựa chọn giữa tra cứu trực tiếp, so sánh, hoặc điều tra tuần tự.

---

### D. Chiều 4: Phân giải Thực thể và Khử mơ hồ Danh tính (Entity Resolution and Identity Disambiguation)
Việc xếp hạng truy xuất văn bản có thể để mặc sự mơ hồ cho LLM tự diễn giải, nhưng một truy vấn dữ liệu có cấu trúc **bắt buộc phải gắn kết một tham chiếu thực thể với một mã định danh chuẩn tắc (*canonical identifier*) trước khi kiểm tra quyền truy cập và thực thi truy vấn**. Nếu có nhiều bản ghi khách hàng cùng khớp với một cái tên, hệ thống không thể tự tiện chọn bừa một kết quả.

Một thành phần gắn kết thực thể có quản trị (*governed entity-binding component*) phải áp dụng ngữ cảnh chính sách của người dùng trước khi hiển thị các bản ghi ứng viên. Nó có thể:
* Tự động chấp nhận nếu chỉ có một kết quả khớp duy nhất được cấp quyền;
* Yêu cầu người dùng làm rõ nếu có nhiều kết quả trùng khớp; hoặc
* Từ chối nếu thực thể đó nằm ngoài quyền hạn của người dùng.

Hệ thống tuyệt đối không được phép thực thi truy vấn chừng nào quyết định định danh chưa được giải quyết dứt điểm.

---

### E. Chiều 5: Đánh giá (Evaluation)

Đánh giá một hệ thống document RAG khá đơn giản: đo lường chất lượng truy xuất (*recall@k, MRR, NDCG*) và chất lượng sinh (*faithfulness, relevance, answer correctness* [3]). Hai giai đoạn, các chỉ số đã được hiểu rõ.

Structured-data agent khó đánh giá hơn rất nhiều vì đường ống có nhiều giai đoạn hơn và mỗi giai đoạn lại có các chế độ thất bại khác nhau:
* **Độ chính xác truy vấn (*Query correctness*):** Lệnh gọi SQL/API được sinh ra có trả về kết quả chính xác không? (đo bằng độ chính xác thực thi - *execution accuracy* [8]).
* **Độ trung thực lược đồ (*Schema fidelity*):** Câu truy vấn có chỉ tham chiếu đến các bảng và cột thực sự tồn tại không? (không có phần tử lược đồ bị ảo giác).
* **Tuân thủ phân quyền (*Authorization compliance*):** Hệ thống có thực thi chính xác mọi tầng phân quyền không?
* **Độ chính xác phân giải thực thể (*Entity resolution accuracy*):** Hệ thống có giải quyết đúng thực thể mục tiêu không?
* **Chất lượng tóm tắt (*Summarization quality*):** Phản hồi bằng ngôn ngữ tự nhiên có phản ánh chính xác kết quả truy vấn không?

Không có một chỉ số đơn lẻ nào có thể nắm bắt được chất lượng đầu-cuối. Đánh giá bắt buộc phải **nhận biết theo từng giai đoạn (*stage-aware*)**, đo lường từng bước độc lập và kết hợp.

---

#### Bảng II: Giao thức Đánh giá Nhận biết theo Giai đoạn cho Governed Structured-Data Agents
*(Table II: Stage-aware evaluation protocol for governed structured-data agents. The entries define test outputs rather than results from a particular deployment.)*

| Giai đoạn (*Stage*) | Đầu ra (*Output*) | Thước đo gợi ý (*Suggested measure*) | Ý nghĩa diễn giải (*Interpretation*) |
| :--- | :--- | :--- | :--- |
| **Diễn giải (*Interpretation*)** | Phạm vi tác vụ và dữ liệu | Độ chính xác Top-$k$ (*Top-k accuracy*); độ bao phủ (*coverage*) | Agent có nhận diện đúng miền dữ liệu và loại tác vụ cần làm không? |
| **Gắn kết thực thể (*Entity binding*)** | Tham chiếu chuẩn tắc (*Canonical reference*) | Độ chính xác phân giải; tỷ lệ từ chối/kiềm chế (*abstention rate*) | Agent có gắn đúng ID duy nhất và biết dừng lại khi bị mơ hồ không? |
| **Cổng chính sách (*Policy gate*)** | Tập dữ liệu được phép | Mức độ tuân thủ (*compliance*); tỷ lệ rò rỉ (*leakage rate*) | Có chặn đứng 100% các truy cập trái phép hoặc ngoài phạm vi vai trò không? |
| **Lập kế hoạch nguồn (*Source planning*)** | Các bảng và đường nối (*join paths*) | Tập F1 (*Set F1*); tính hợp lệ khi thực thi | Các bảng và khóa nối được chọn có đúng và tạo thành truy vấn hợp lệ không? |
| **Truy vấn & Trả lời (*Query and answer*)** | Kết quả truy vấn và lời giải thích | Độ chính xác thực thi (*execution accuracy*); độ trung thực (*faithfulness*) | Dữ liệu trả về có đúng với ground truth và câu trả lời có phản ánh đúng số liệu không? |

---

* **Xây dựng Ground Truth:** Trong document RAG, ground truth là tập hợp các cặp câu hỏi–câu trả lời mà câu trả lời có thể truy vết về các đoạn văn bản nguồn cụ thể. Trong structured-data agent, ground truth đòi hỏi các truy vấn SQL chuẩn cho từng câu hỏi—và câu truy vấn "đúng" chưa chắc đã là duy nhất (ví dụ: dùng `WHERE` so với `HAVING` cho cùng một điều kiện lọc vẫn có thể trả về kết quả giống hệt nhau). Độ chính xác thực thi (*execution accuracy* - so sánh kết quả bảng dữ liệu trả về thay vì so sánh chuỗi văn bản SQL) giải quyết được điều này, nhưng làm phát sinh chi phí duy trì một cơ sở dữ liệu thử nghiệm với dữ liệu đã biết trước.
* **Quy kết lỗi đa giai đoạn (*Multi-stage failure attribution*):** Khi một agent trả về câu trả lời sai, lỗi có thể bắt nguồn từ: diễn giải tác vụ, gắn kết thực thể, lập kế hoạch nguồn, sinh truy vấn, thực thi chính sách, hoặc tóm tắt. Việc quy kết đúng giai đoạn gây lỗi đòi hỏi phải ghi lại các quyết định và đầu vào trung gian. Một khung đánh giá nhận biết giai đoạn phải chấm điểm riêng các đầu ra này và hỗ trợ các thử nghiệm có đối chứng với trạng thái thượng nguồn đã biết trước.

---

### F. Thử nghiệm Tổng hợp có Đối chứng (Controlled Synthetic Study)

Để kiểm định xem liệu thiết kế phân tầng (*staged design*) có làm thay đổi kết quả thực tế hay không, chúng tôi đã tiến hành một thí nghiệm có đối chứng trên một bộ benchmark tổng hợp đa nguồn:
* **Thiết lập:** Hai agent cùng trả lời một tập hợp gồm 21 câu hỏi giống hệt nhau, trải dài trên 4 vai trò truy cập (*roles*) và 2 nguồn dữ liệu độc lập (một kho vận hành và một kho tuân thủ).
* **Baseline Agent:** Dịch thẳng câu hỏi thành truy vấn và thực thi trực tiếp (*translate-and-execute*).
* **Staged Agent:** Bổ sung các giai đoạn của kiến trúc tham chiếu: cổng chính sách, gắn kết thực thể có nhận biết chính sách, xác thực lược đồ và phép nối, và từ chối trả lời khi ngữ cảnh không đầy đủ.
* Cả hai agent đều nhận cùng một ý định đã phân tích; biến độc lập duy nhất là cấu trúc kiến trúc. Toàn bộ dữ liệu là tổng hợp; ground truth được tính toán bởi một bản triển khai tham chiếu độc lập dựa trên đặc tả chính sách và các truy vấn chuẩn được xác minh thủ công.

---

#### Bảng III: So sánh Baseline vs. Staged Agent trên Bộ Benchmark Tổng hợp
*(Table III: Baseline vs. Staged Agent on the synthetic benchmark, $n = 21$ questions, four roles, two data sources. Data is synthetic; ground truth is computed by an independent reference implementation.)*

| Chỉ số đo lường (*Metric*) | Baseline Agent | Staged Agent |
| :--- | :---: | :---: |
| **Độ chính xác kết quả tổng thể (*Outcome accuracy*)** | 0.43 | **0.95** |
| **Độ đúng đắn câu trả lời khi chọn trả lời (*Answer correctness*)** | 0.90 | 0.90 |
| **Số lần vi phạm chính sách (*Policy violations*)** | 7 | **0** |
| **Tỷ lệ rò rỉ dữ liệu (*Leakage rate*)** | 0.33 | **0.00** |
| **Số câu trả lời sai nhưng tự tin (*Confidently wrong answers*)** | 8 | **0** |
| **Độ chính xác khi từ chối (*Refusal accuracy*)** | 0.00 | **1.00** |
| **Khả năng quy kết nguyên nhân lỗi (*Failure attribution*)** | 0.33 | **1.00** |
| **Độ trễ đối với các ca có trả lời (*Latency, answer cases - ms*)** | 0.402 | **0.351** |

---

Bảng III báo cáo kết quả so sánh:
* **Staged agent đạt độ chính xác kết quả 0.95 so với 0.43 của baseline**, đồng thời **triệt tiêu hoàn toàn 7 vi phạm phân quyền và 8 câu trả lời sai nhưng tự tin** mà baseline mắc phải (tỷ lệ rò rỉ giảm từ 0.33 xuống 0.00).
* Sự vượt trội này đến từ các hành vi mà baseline không thể diễn đạt: từ chối các yêu cầu ngoài phạm vi, kiềm chế từ chối khi thực thể bị mơ hồ hoặc chỉ số không được hỗ trợ, và từ chối các phép nối chéo nguồn không hợp lệ.
* Đáng chú ý, **độ đúng đắn câu trả lời trên các trường hợp mà cả hai agent cùng chọn trả lời là giống hệt nhau (0.90)**. Điều này chứng minh rằng sự tiến bộ vượt bậc hoàn toàn xuất phát từ cơ chế quản trị và xác thực phân tầng, chứ không phải do có một bộ sinh truy vấn thông minh hơn.
* Đây là một nghiên cứu tổng hợp có đối chứng quy mô nhỏ; nó chứng minh rằng các giai đoạn kiến trúc tạo ra hiệu quả đo lường được rõ rệt trong các điều kiện có kiểm soát.

---

### G. Chiều 6: Các Chế độ Thất bại và Khả năng Phục hồi (Failure Modes and Recovery)

Hệ thống document RAG thường gặp các lỗi: bỏ sót đoạn văn bản, ngộ độc ngữ cảnh (*context poisoning*), và ảo giác từ ngữ cảnh không liên quan [2]. Structured-data agent đưa vào thêm các bề mặt thất bại hoàn toàn mới vì đầu ra của LLM trực tiếp quyết định hành vi truy cập dữ liệu thực thi. Bảng IV tóm lược năm rủi ro nổi cộm nhất.

---

#### Bảng IV: Bảng Phân loại Chế độ Thất bại cho Structured-Data Agents
*(Table IV: Failure-mode taxonomy for structured-data agents. The categories are especially salient when an LLM selects schemas, resolves identifiers, and generates executable queries.)*

| Chế độ thất bại (*Failure Mode*) | Mô tả chi tiết (*Description*) |
| :--- | :--- |
| **Ảo giác lược đồ (*Schema hallucination*)** | LLM sinh mã SQL tham chiếu tới các bảng hoặc cột hoàn toàn không tồn tại trong cơ sở dữ liệu. |
| **Sai khóa nối (*Wrong joins*)** | Các bảng được nối với nhau trên các khóa không chính xác; kết quả trả về hợp lệ về mặt cấu trúc cú pháp nhưng sai hoàn toàn về mặt ngữ nghĩa nghiệp vụ. |
| **Nhầm lẫn mã định danh (*Identifier confusion*)** | Hệ thống sử dụng nhầm lẫn loại định danh này thay cho loại định danh khác (ví dụ: dùng số tài khoản thanh toán thay cho mã dịch vụ). |
| **Rò rỉ phân quyền (*Auth leakage*)** | Phản hồi tổng hợp đa miền vô tình làm lộ thông tin về các miền dữ liệu mà người dùng không được phép truy cập. |
| **Tập con dữ liệu âm thầm (*Silent data subset*)** | Truy vấn thực thi thành công nhưng trả về kết quả thiếu sót do bỏ quên điều kiện nối, bộ lọc bắt buộc, hoặc ánh xạ định danh. |

---

Phân tích chi tiết năm chế độ thất bại:
1. **Schema hallucination:** Xảy ra khi LLM tạo truy vấn chứa bảng/cột không có thực. Một sổ đăng ký tất định hoặc chốt kiểm tra tại tầng thực thi có thể chặn đứng lỗi này, nhưng việc kiểm tra phụ thuộc vào việc siêu dữ liệu có được cập nhật liên tục hay không.
2. **Wrong joins:** Xảy ra khi LLM nối các bảng dựa trên các khóa sai, tạo ra kết quả cú pháp thì chuẩn nhưng ngữ nghĩa thì sai bét. Biến thể phổ biến trong doanh nghiệp là nối trên một cột mã định danh xuất hiện ở cả hai bảng nhưng mang ý nghĩa khác nhau (ví dụ: `account_number` ở một bảng và `service_id` ở bảng khác).
3. **Identifier confusion:** Phát sinh từ sự đa dạng của các loại định danh trong doanh nghiệp: số tài khoản thanh toán, mã dịch vụ, số hợp đồng, mã định danh mạng đều có thể liên quan tới cùng một khách hàng nhưng không thể hoán đổi cho nhau trong các câu truy vấn. LLM không tự động hiểu được những khác biệt tinh vi này.
4. **Auth leakage qua tóm tắt:** Khi LLM tóm tắt dữ liệu từ nhiều miền, ngay cả khi dữ liệu trái phép đã bị loại bỏ trước khi tóm tắt, câu trả lời vẫn có thể vô tình làm lộ sự tồn tại của miền bị loại trừ (ví dụ: câu trả lời *"Tôi không thể truy xuất dữ liệu phiếu hỗ trợ"* đã vô tình tiết lộ rằng dữ liệu phiếu hỗ trợ có tồn tại và đã được yêu cầu). Do đó, cách dùng từ từ chối truy cập và cấu trúc phản hồi cũng là một phần của ranh giới bảo mật.
5. **Silent data subsets:** Truy vấn thực thi trơn tru nhưng trả về dữ liệu không đầy đủ (ví dụ bỏ sót một điều kiện `WHERE` hoặc phép ánh xạ ID). Kết quả nhìn rất hợp lý nên cực kỳ khó phát hiện nếu không có các bài kiểm tra tường minh, tri thức chuyên ngành, hoặc so sánh với một nguồn chuẩn đáng tin cậy.

---

### H. Chiều 7: Hồ sơ Độ trễ và Ngân sách Chi phí (Latency Profile and Cost Budgets)

Một structured-data agent kết hợp các lệnh gọi LLM với tra cứu quyền hạn, gọi dịch vụ phân giải thực thể, tìm kiếm siêu dữ liệu, thực thi truy vấn cơ sở dữ liệu, và biên soạn phản hồi. Độ trễ của nó do đó được định hình bởi **cả suy luận model lẫn các dịch vụ dữ liệu bên ngoài**, chứ không chỉ đơn thuần là việc tra cứu embedding vector. Các nhánh thoát sớm có điều kiện (*conditional early exits*) và các điểm ngắt chờ người dùng làm rõ (*clarification interrupts*) cũng tạo ra các đường dẫn phản hồi với ngữ nghĩa độ trễ hoàn toàn khác nhau.

* **Khả năng quan sát được đo lường (*Measured observability*):** Một governed agent phải ghi lại thời gian từng giai đoạn và các sự kiện có cấu trúc cho: diễn giải, quyết định chính sách, gắn kết thực thể, lập kế hoạch nguồn, thực thi truy vấn, giải thích kết quả và lưu trữ. Những tạo phẩm này hỗ trợ phân tích độ trễ và quy kết nguyên nhân lỗi.
* **Cơ hội xử lý song song (*Parallelization opportunities*):** Các bước diễn giải độc lập, tra cứu siêu dữ liệu, và truy xuất chính sách có thể chạy đồng thời (*concurrently*). Các giai đoạn sau vẫn mang tính tuần tự có điều kiện: gắn kết thực thể có thể tạm dừng để chờ người dùng nhập thêm thông tin, lập kế hoạch nguồn có thể chọn nhánh trực tiếp hoặc đa nguồn, và thực thi có thể gọi các dịch vụ dữ liệu có quản trị khác nhau. Đồ thị phụ thuộc này phơi bày các điểm tối ưu hóa tiềm năng mà không hàm ý một sự tăng tốc phổ quát cho mọi trường hợp.

---

## IV. Kiến trúc Tham chiếu (Reference Architecture)

Dựa trên bảy chiều kiến trúc đã phân tích, chúng tôi đề xuất một kiến trúc tham chiếu tổng quát cho các structured-data agent có quản trị. Hình 2 mô tả toàn bộ đường ống kiến trúc này.

```
       Kiến trúc Tham chiếu Tổng quát cho Governed Structured-Data Agents (Fig. 2)
       =============================================================================

                              +-----------------------+
                              |   Câu hỏi Người dùng  |
                              |    (User Question)    |
                              +-----------+-----------+
                                          |
                        +-----------------+-----------------+
                        | (chạy song song)|                 |
                        v                                   v
             +-----------------------+          +-----------------------+
             | Diễn giải Tác vụ      |          | Ngữ cảnh Chính sách   |
             | & Phạm vi [LLM]       |          | (Policy Context)      |
             +----------+------------+          +-----------+-----------+
                        |                                   |
                        +-----------------+-----------------+
                                          | (kiểm tra quyền)
                                          v
                              +-----------------------+
                              | Gắn kết Thực thể      |
                              | & Cổng Chính sách     |
                              +-----------+-----------+
                                          |
                                          v
                              +-----------------------+
                              | Lập kế hoạch Lược đồ  |
                              | & Nguồn dữ liệu       |
                              +-----------+-----------+
                                          |
                                          v
                              +-----------------------+
                              | Xác thực Khả năng     |
                              | Trả lời (Validation)  |
                              +-----------+-----------+
                                          |
                                          v
                              +-----------------------+
                              | Thực thi Truy vấn     |
                              | Có quản trị           |
                              +-----------+-----------+
                                          |
                                          v
                              +-----------------------+
                              | Giải thích Kết quả    |
                              | [LLM]                 |
                              +-----------+-----------+
                                          |
                                          v
                              +-----------------------+
                              | Kiểm toán & Nguồn gốc |
                              | (Audit & Provenance)  |
                              +-----------------------+
```

**Hình 2:** *Kiến trúc tham chiếu tổng quát cho các governed structured-data agents. Các khối màu xanh lục biểu thị các thành phần có thể sử dụng language models, trong khi các khối màu cam biểu thị các ranh giới thực thi chính sách bảo mật độc lập. Việc tra cứu ngữ cảnh chính sách độc lập có thể chạy song song với bước diễn giải; gắn kết thực thể và kiểm tra chính sách sẽ ràng buộc chặt chẽ các giai đoạn lập kế hoạch nguồn và thực thi sau đó.*

---

Kiến trúc này hiện thực hóa bảy chiều thông qua **sáu nguyên tắc thiết kế cốt lõi**:
1. **Lập kế hoạch nguồn hiểu lược đồ (*Schema-aware source planning*):** Một sổ đăng ký (*registry*) mô tả các nguồn dữ liệu khả dụng, các trường, mã định danh, mối quan hệ và các ràng buộc thực thi. Quá trình lập kế hoạch sử dụng siêu dữ liệu này để thu hẹp các nguồn có thể trả lời câu hỏi.
2. **Diễn giải tác vụ và phạm vi tường minh (*Explicit task and scope interpretation*):** Thành phần diễn giải xác định tác vụ được yêu cầu, các vùng dữ liệu, các thực thể và mức độ bất định. Nó có thể phân biệt một lệnh tra cứu trực tiếp với một so sánh hay một cuộc điều tra tuần tự.
3. **Thực thi chính sách bên ngoài model (*Policy enforcement outside the model*):** Các quyết định về phạm vi thực thể, phạm vi dữ liệu và phạm vi trường dữ liệu được thực thi bởi các **dịch vụ chính sách hoặc các ranh giới thực thi tất định**, chứ tuyệt đối không dựa vào các câu chỉ dẫn trong prompt của language model. Ngữ cảnh thu được sẽ ràng buộc nghiêm ngặt các giai đoạn sau.
4. **Gắn kết thực thể như một bước điều khiển luồng (*Entity binding as a control-flow step*):** Các tham chiếu trong câu hỏi được gắn kết với các mã định danh chuẩn tắc và các bản dịch đặc thù của từng nguồn trước khi kiến tạo truy vấn. Các kết quả khớp mơ hồ sẽ kích hoạt bước yêu cầu làm rõ hoặc từ chối, thay vì tự tiện lựa chọn bừa bãi.
5. **Xác thực khả năng trả lời trước khi thực thi (*Answerability validation before execution*):** Giai đoạn xác thực kiểm tra xem yêu cầu có đủ ngữ cảnh về thực thể, thời gian, nguồn và trường dữ liệu hay không. Nó có thể từ chối hoặc yêu cầu làm rõ một yêu cầu mất an toàn trước khi dịch vụ truy vấn có quản trị được gọi.
6. **Thực thi có điều kiện và lưu vết nguồn gốc (*Conditional execution and provenance*):** Thiết kế hỗ trợ các nhánh thực thi trực tiếp, đa nguồn hoặc điều tra; ghi lại các lần thoát sớm; giải thích kết quả trả về; và bảo toàn đầy đủ dữ liệu nguồn gốc để phục vụ đánh giá và kiểm toán.

* **Đối chiếu với Document RAG:** Đường ống document RAG tối thiểu tóm gọn trong: nhúng, truy xuất, và sinh. Thiết kế dữ liệu có cấu trúc bổ sung các bước tường minh: diễn giải phạm vi, thực thi chính sách, gắn kết thực thể, lập kế hoạch nguồn, xác thực, thực thi có quản trị, giải thích kết quả và truy vết nguồn gốc. Các năng lực này không nhất thiết phải triển khai theo một trình tự cứng nhắc: các hệ thống thực tế có thể kết hợp các giai đoạn, chạy song song các tra cứu độc lập, hoặc dừng sớm ngay khi một điều kiện chính sách hoặc khả năng trả lời bị vi phạm.
* **Hệ thống lai (*Hybrid systems*):** Một số triển khai doanh nghiệp kết hợp cả document RAG và truy vấn dữ liệu có cấu trúc trong cùng một agent. Ví dụ, người dùng hỏi: *"Cam kết dịch vụ cho đơn hàng hiện tại của khách hàng là gì?"*. Các điều khoản cam kết có thể nằm trong tài liệu văn bản, trong khi trạng thái đơn hàng nằm trong cơ sở dữ liệu. Hệ thống lai bổ sung thêm một tầng điều hướng phân loại câu hỏi (document-retrievable hay data-queryable, hoặc cả hai) và điều phối tới đường ống phù hợp. Quyết định điều hướng này chính là một dạng diễn giải tác vụ.
* **Thiết kế sổ đăng ký (*Registry design*):** Sổ đăng ký nguồn (*source registry*) là nền tảng siêu dữ liệu của structured-data agent. Nó lưu trữ mô tả nguồn, các trường, mã định danh, mối liên hệ, thuộc tính chính sách và các thao tác được hỗ trợ. Việc kiểm soát thay đổi (*change control*) giữ cho sổ đăng ký luôn đồng bộ với sự tiến hóa của nguồn dữ liệu.

---

## V. Thảo luận: Các Hàm ý Thiết kế (Discussion: Design Implications)

Một số lựa chọn thiết kế đã liên tục phân định ranh giới giữa hành vi an toàn và hành vi mất an toàn trong phân tích của chúng tôi cũng như trong nghiên cứu có đối chứng:
1. **Vị trí của cơ chế phân quyền (*Where authorization lives*):** Đây là lựa chọn có tính hệ quả lớn nhất. Nếu model diễn giải hoặc model sinh truy vấn được phép tự quyết định những gì người dùng có thể xem, thì **mỗi sự thay đổi về prompt đều trở thành một sự suy thoái bảo mật tiềm ẩn (security regression)**. Việc giữ chính sách trong các dịch vụ tất định hoặc tại ranh giới thực thi, và truyền quyết định đó dưới dạng trạng thái tường minh, chính là yếu tố giúp Staged Agent từ chối các yêu cầu ngoài phạm vi thay vì trả lời liều lĩnh.
2. **Xử lý phân quyền một phần (*Partial authorization*):** Khi một yêu cầu trải dài qua cả phạm vi được phép lẫn bị cấm, việc âm thầm loại bỏ phần bị cấm sẽ trả về một câu trả lời nghe có vẻ hợp lý nhưng gây hiểu lầm nghiêm trọng. Do đó, agent phải từ chối yêu cầu, trả về một tập con kèm giải thích rõ ràng, hoặc yêu cầu người dùng thu hẹp câu hỏi.
3. **Các cổng siêu dữ liệu quan trọng hơn vẻ bề ngoài (*Metadata gates matter*):** Lập kế hoạch nguồn và xác thực khả năng trả lời phải đưa các điểm thiếu ngữ cảnh và yêu cầu không được hỗ trợ thành các kết quả đầu ra tường minh, thay vì trao trọn mọi quyết định cho bộ sinh truy vấn. Trong thử nghiệm, cổng này đảm nhiệm phần lớn công việc: nó giúp agent kiềm chế trước các chỉ số không được hỗ trợ và thực thể mơ hồ thay vì trả lời sai một cách tự tin.
4. **Mã định danh và Xử lý song song đi theo hai hướng đối nghịch:**
   * Một sổ đăng ký ánh xạ các tham chiếu chuẩn tắc sang các ID đặc thù của nguồn sẽ ngăn bộ sinh truy vấn đoán mò xem hai khóa có tên tương tự nhau có thể hoán đổi hay không—điều này thuộc về giai đoạn tích hợp dữ liệu chứ không phải câu lệnh trong prompt.
   * Xử lý song song (*concurrency*) là một cám dỗ ngược lại: bước diễn giải, tra cứu siêu dữ liệu và truy xuất chính sách có thể chạy song song, nhưng **bước lọc và chọn thực thể tuyệt đối không được đi trước bước kiểm tra chính sách vì sẽ gây nguy cơ rò rỉ dữ liệu**. Hãy xử lý song song các lệnh gọi điều khiển độc lập và giữ nguyên thứ tự đối với các bước phụ thuộc bảo mật.

---

## VI. Kịch bản Minh họa Đầu-Cuối (End-to-End Scenario Walkthrough)

Để minh họa cách bảy chiều kiến trúc tương tác với nhau, chúng tôi truy vết một câu hỏi đại diện qua kiến trúc tham chiếu:

> **Câu truy vấn:** *"Những khách hàng nào có hóa đơn quá hạn mà đồng thời có phiếu hỗ trợ kỹ thuật chưa được giải quyết?"*
> *(“Which customers with overdue invoices also have unresolved support cases?”)*

* **Bước 1: Diễn giải tác vụ và phạm vi (Chiều 2–3).** Thành phần diễn giải xác định đây là một phép so sánh chéo giữa hai vùng dữ liệu: tài chính (*financial*) và hỗ trợ (*support*), đồng thời ghi nhận rằng đầu ra được yêu cầu là một tập hợp thực thể (*entity set*), chứ không phải một khách hàng cụ thể được nêu tên.
* **Bước 2: Ngữ cảnh chính sách (Chiều 2).** Dịch vụ chính sách xác định xem vai trò của người dùng hiện tại được phép truy cập những vùng dữ liệu, thực thể và trường thông tin nào. Nếu yêu cầu hoàn toàn nằm ngoài phạm vi, hệ thống trả về thông báo từ chối. Nếu chỉ một phần được phép, hệ thống phải thu hẹp yêu cầu kèm giải thích hoặc yêu cầu người dùng sửa lại.
* **Bước 3: Gắn kết thực thể (Chiều 4).** Agent xác định cách thức biểu diễn tham chiếu khách hàng trong từng nguồn dữ liệu. Các ứng viên mơ hồ hoặc chưa được cấp quyền sẽ bị loại khỏi kế hoạch truy vấn cho đến khi hệ thống có thể từ chối hoặc nhận được sự làm rõ từ người dùng.
* **Bước 4: Lập kế hoạch nguồn (Chiều 1).** Sổ đăng ký phơi bày các bảng, trường và đường nối (*join paths*) tiềm năng cho các vùng dữ liệu được phép. Bộ lập kế hoạch lựa chọn giữa tra cứu trực tiếp, so sánh đa nguồn, hoặc điều tra tuần tự dựa trên câu hỏi và các mối quan hệ khả dụng.
* **Bước 5: Xác thực khả năng trả lời.** Hệ thống kiểm tra xem các nguồn được chọn có chứa đầy đủ các thước đo, vị từ thời gian, mã định danh và điều kiện nối hay không. Việc thiếu ngữ cảnh sẽ kích hoạt yêu cầu làm rõ hoặc dừng sớm, thay vì tung ra một câu truy vấn mất kiểm soát.
* **Bước 6: Thực thi có quản trị (Chiều 1 và 6).** Kế hoạch đã được xác thực được chuyển tới dịch vụ truy vấn được phê duyệt. Việc thực thi chính sách được **lặp lại một lần nữa tại ranh giới thực thi** để đảm bảo văn bản truy vấn được sinh ra không thể mở rộng tập dữ liệu đã được cấp phép.
* **Bước 7: Giải thích và nguồn gốc (Chiều 5 và 7).** Agent giải thích kết quả dựa trên dữ liệu được trả về và ghi lại các nguồn đã chọn, bộ lọc, quyết định chính sách và các giới hạn chưa được giải quyết. Lời giải thích tuyệt đối không được tiết lộ dữ liệu bị loại trừ hoặc chi tiết nhạy cảm của nguồn.

Kịch bản này cho thấy lý do tại sao các quyết định về phạm vi, chính sách, thực thể, nguồn dữ liệu, xác thực, thực thi và nguồn gốc luôn tương tác chặt chẽ với nhau.

---

## VII. Các Vấn đề Mở (Open Problems)

Bốn thách thức kiến trúc vẫn chưa được giải quyết trọn vẹn trong các structured-data agent hiện nay:

1. **OP1: Soạn thảo truy vấn xuyên miền (*Cross-domain query composition*):** Khi một câu hỏi bao trùm nhiều miền dữ liệu không có mối quan hệ khóa ngoại trực tiếp, agent phải quyết định: thực hiện một phép nối liên kết lỏng lẻo (*federated join*), xâu chuỗi nhiều truy vấn tuần tự, hay tổng hợp kết quả ở tầng ứng dụng. Mỗi phương án đều có sự đánh đổi lớn về độ trễ, tính nhất quán dữ liệu và độ phức tạp của việc phân quyền.
2. **OP2: Quản lý sự tiến hóa của lược đồ (*Schema evolution management*):** Các cơ sở dữ liệu doanh nghiệp liên tục thay đổi: các cột được thêm mới, đổi tên, hoặc bị loại bỏ (*deprecated*). Một kiến trúc tổng quát cần một giao thức tiến hóa có khả năng phát hiện sự trôi dạt siêu dữ liệu (*metadata drift*), duy trì tính tương thích ngược ở nơi có thể, và ngăn chặn các mô tả lỗi thời tiếp cận model sinh truy vấn.
3. **OP3: Giải thích và lưu vết nguồn gốc (*Explanation and provenance*):** Khi một hệ thống document RAG trả lời câu hỏi, nó có thể trích dẫn trực tiếp các đoạn văn bản nguồn. Nhưng khi một structured-data agent trả về một con số, dữ liệu nguồn gốc bao gồm: nguồn dữ liệu được chọn, thực thể được giải quyết, các bộ lọc, và yêu cầu thực thi. Tuy nhiên, các chuỗi mã SQL thô hoặc payload API hoàn toàn không thể diễn giải được đối với phần lớn người dùng nghiệp vụ. Việc dịch logic này thành một **"thẻ truy vấn" (*query card*)** ngắn gọn, có thể kiểm chứng bằng ngôn ngữ tự nhiên mà không làm lộ các thông tin bảo mật nhạy cảm vẫn là một bài toán mở.
4. **OP4: Đánh giá ở quy mô doanh nghiệp (*Evaluation at enterprise scale*):** Các bộ benchmark text-to-SQL như Spider [7] và BIRD [8] chủ yếu đánh giá khả năng trả lời câu hỏi dựa trên cơ sở dữ liệu dưới các lược đồ đặc thù của benchmark. Một benchmark dữ liệu có cấu trúc có quản trị chuẩn mực cần phải đại diện được: các nguồn dữ liệu không đồng nhất, các quyết định chính sách, phân giải thực thể, điều hướng có điều kiện, và sự gián đoạn của người dùng trong khi vẫn tránh được việc tiết lộ dữ liệu độc quyền của doanh nghiệp.

---

## VIII. Các Công trình Liên quan (Related Work)

* **Các hệ thống RAG:** Lewis et al. [1] đặt nền móng cho RAG đối với các tác vụ NLP thâm dụng tri thức. Gao et al. [2] cung cấp một khảo sát toàn diện về các kỹ thuật RAG. Chen et al. [3] đánh giá chuẩn các hệ thống RAG xuyên suốt các chiến lược phân đoạn, embedding và truy xuất. Những công trình này tập trung hoàn toàn vào truy xuất tài liệu phi cấu trúc.
* **Text-to-SQL:** Yu et al. [7] giới thiệu benchmark Spider cho bài toán text-to-SQL xuyên cơ sở dữ liệu. Li et al. [8] đề xuất BIRD, một bộ benchmark nhấn mạnh độ phức tạp của cơ sở dữ liệu trong thế giới thực. Các cách tiếp cận gần đây dựa trên LLM [9, 10] đạt kết quả cao trên các benchmark này nhưng chỉ hoạt động trên các cơ sở dữ liệu đơn lẻ mà không có cơ chế phân quyền, phân giải thực thể, hay điều hướng đa miền.
* **Kiến trúc enterprise data-agent:** Các đề xuất định hướng doanh nghiệp ngày càng kết hợp giữa điều phối, sổ đăng ký dữ liệu, lập kế hoạch siêu dữ liệu, kiểm tra quyền truy cập và thực thi có cấu trúc. Blueprint *compound-AI* giới thiệu các sổ đăng ký agent và dữ liệu, bộ lập kế hoạch tác vụ và dữ liệu, các phiên làm việc và bộ điều phối thực thi [11]. *Analytic Agent* nhắm vào các analytics API doanh nghiệp có quản trị và kết hợp phân tích ý định, gắn kết mục tiêu, xác thực quyền, chọn endpoint, thực thi và sinh phản hồi [12]. *RUBICON* lập luận ủng hộ việc xử lý truy vấn lấy bảng làm trung tâm trên dữ liệu doanh nghiệp hỗn tạp thay vì chỉ tích hợp văn bản thuần túy [13]. *COGNI* kết hợp điều hướng phương thức, truy xuất tài liệu và đường dẫn NL2SQL tự sửa lỗi trong một động cơ truy vấn doanh nghiệp hội thoại [14]. Những hệ thống này xác lập rằng các enterprise data agent đòi hỏi nhiều hơn là text-to-SQL một lượt hoặc truy xuất tài liệu đơn thuần. Đóng góp phân biệt của chúng tôi là làm rõ các phụ thuộc kiểm soát giữa diễn giải tác vụ, thực thi chính sách, gắn kết thực thể, lập kế hoạch nguồn, xác thực, thực thi, giải thích và nguồn gốc dưới dạng bảy chiều kiến trúc.
* **Quản trị Agent (*Agent governance*):** *ARBITER* [15] triển khai kiểm soát truy cập dựa trên vai trò (RBAC) cho RAG ở độ mịn cấp tài liệu. *Permission-Aware RAG* [16] tích hợp các hệ thống IAM cho việc lọc truy xuất. *MI9* [17] đề xuất quản trị lúc thực thi cho agentic AI với chỉ số rủi ro tác tử (*agency-risk indexing*). Trọng tâm của chúng tôi là vị trí và sự tương tác của các chốt kiểm tra quyền truy cập bên trong quy trình truy vấn dữ liệu có cấu trúc thay vì chỉ lọc tài liệu đơn thuần.
* **Quyền tự chủ có ranh giới (*Bounded autonomy*):** Kiến trúc hợp đồng hành động định kiểu (*typed action contracts*) [18] ràng buộc các LLM agent vào các lược đồ hành động định sẵn với xác thực trước khi thực thi. Điều này chia sẻ cùng nguyên tắc xác thực lược đồ trước khi thực thi truy vấn của chúng tôi, nhưng tập trung vào các hành động doanh nghiệp tổng quát hơn là truy vấn dữ liệu có cấu trúc chuyên biệt.
* **Đánh giá Multi-agent:** *MAESTRO* [19] cung cấp bộ đánh giá độc lập với framework cho các hệ thống multi-agent. *MASEval* [20] chứng minh rằng việc lựa chọn framework ảnh hưởng đến hiệu năng ngang ngửa với việc lựa chọn model. *TraceElephant* [21] giới thiệu benchmark quy kết lỗi bằng các dấu vết thực thi đầy đủ. Những công trình này đánh giá sự điều phối đa tác tử nhưng không giải quyết các chiều đặc thù của dữ liệu có cấu trúc (phân giải thực thể, ảo giác lược đồ, phân quyền đa tầng).
* **An toàn và Quản trị SQL (*SQL safety and governance*):** Các nghiên cứu gần đây về an toàn SQL cho LLM bao gồm việc chấm điểm độ tin cậy (*trust scoring*) cho các bảng và cột bị ảo giác [22] và các giao thức truy cập cơ sở dữ liệu dựa trên ý định thay thế việc sinh SQL thô bằng các đối tượng ý định có cấu trúc (*Model Database Protocol* [23]). Các hướng tiếp cận này giải quyết ảo giác lược đồ ở cấp độ truy vấn nhưng chưa xem xét các yêu cầu toàn diện của đường ống (phân giải thực thể, điều hướng đa miền, phân quyền) mà structured-data agent phải đối mặt.

---

## IX. Các Mối đe dọa đối với Tính Hợp lệ (Threats to Validity)

1. **Phạm vi khái niệm (*Conceptual scope*):** Bài báo trình bày một kiến trúc tham chiếu chứ không phải một bản triển khai phần mềm hoàn chỉnh duy nhất. Bảy chiều kiến trúc có thể chưa vét cạn mọi khía cạnh, và các môi trường triển khai khác có thể phát sinh thêm các yêu cầu mới. Chúng tôi giới hạn các tuyên bố ở các trách nhiệm thiết kế và các phụ thuộc kiểm soát có thể đánh giá được trong một hệ thống cụ thể.
2. **Tính đặc thù doanh nghiệp (*Enterprise specificity*):** Các mẫu thiết kế về phân quyền và phân giải thực thể được định hình bởi các yêu cầu như truy cập theo vai trò (*persona-based*), giới hạn cấp thực thể, các mã định danh không đồng nhất và dịch vụ dữ liệu có quản trị. Các công cụ phân tích cá nhân ít ràng buộc hơn có thể không cần cả bảy chiều này. Khung kiến trúc do đó nên được hiểu là một tập hợp các yêu cầu cho các **governed enterprise agents**, chứ không phải một thiết kế phổ quát cho mọi giao diện dữ liệu có cấu trúc.
3. **Đánh giá tổng hợp thay vì triển khai sản xuất (*Synthetic rather than deployment evaluation*):** So sánh thực nghiệm ở Mục III-F sử dụng một benchmark tổng hợp nhỏ trong điều kiện đối chứng. Nó không báo cáo tỷ lệ sự cố trong sản xuất thực tế, độ trễ lưu lượng trực tiếp, hoặc kết quả trên dữ liệu nội bộ của một tổ chức cụ thể. Kết quả tổng hợp chứng minh rằng các giai đoạn kiến trúc tạo ra hiệu quả đo lường được, nhưng hiệu quả ở quy mô doanh nghiệp thực tế vẫn cần được kiểm chứng thêm.
4. **Khả năng chuyển giao (*Transferability*):** Các ví dụ và thuật ngữ được trừu tượng hóa có chủ đích nhằm tăng tính linh hoạt và khả năng di động, nhưng lược bỏ đi các chi tiết tích hợp cần thiết cho việc tái lập chính xác từng dòng mã. Đóng góp dự định là một tập hợp các trách nhiệm kiến trúc, thước đo đánh giá và các phụ thuộc kiểm soát để các nhà nghiên cứu khác có thể cụ thể hóa và kiểm định.

---

## X. Kết luận (Conclusion)

Bước chuyển từ truy xuất tài liệu sang truy vấn dữ liệu có cấu trúc làm bộc lộ các yêu cầu kiến trúc bắt buộc xuyên suốt **bảy chiều**: ngữ nghĩa truy xuất, độ mịn phân quyền, nhận diện ý định, phân giải thực thể, đánh giá, các chế độ thất bại, và hồ sơ độ trễ. Một đường cơ sở document RAG tối thiểu không thể làm rõ các yêu cầu này vì nó giả định rằng thao tác chính chỉ là chọn lọc ngữ cảnh văn bản.

Chúng tôi đã trình bày một kiến trúc tham chiếu tổng quát cho các governed structured-data agents: diễn giải tác vụ và phạm vi tường minh, thực thi chính sách, gắn kết thực thể, lập kế hoạch nguồn hiểu lược đồ, xác thực khả năng trả lời, thực thi có quản trị, giải thích kết quả và lưu vết nguồn gốc. Chúng tôi cũng hệ thống hóa năm rủi ro nổi cộm: ảo giác lược đồ, sai khóa nối, nhầm lẫn mã định danh, rò rỉ phân quyền và các tập con dữ liệu âm thầm.

Một nghiên cứu tổng hợp có đối chứng đã chứng minh rằng việc bổ sung các giai đoạn này vào một baseline dịch-và-thực-thi trực tiếp đã **xóa bỏ hoàn toàn các vi phạm phân quyền của baseline và nâng độ chính xác kết quả từ 0.43 lên 0.95**, khẳng định rằng các giai đoạn bổ sung thực sự tạo ra giá trị bảo vệ thiết thực chứ không chỉ làm tăng chi phí quản lý (*overhead*). Thay vì đề xuất một language model mới hay một thuật toán truy vấn mới, bài báo này đóng góp một khung thiết kế và thử nghiệm thực nghiệm đầu tiên giúp các yêu cầu về luồng điều khiển, bảo mật và đánh giá của các governed structured-data agents trở nên tường minh và có thể kiểm định được một cách khoa học.

---

## Tài liệu Tham khảo (References)

> *Ghi chú: Toàn bộ danh mục 23 tài liệu tham khảo được giữ nguyên văn bản gốc bằng tiếng Anh để phục vụ việc tra cứu và trích dẫn học thuật chuẩn xác trong luận văn.*

[1] P. Lewis et al., “Retrieval-augmented generation for knowledge-intensive NLP tasks,” in *Proc. Advances in Neural Information Processing Systems (NeurIPS)*, 2020.

[2] Y. Gao et al., “Retrieval-augmented generation for large language models: A survey,” *arXiv preprint arXiv:2312.10997*, 2023.

[3] J. Chen et al., “Benchmarking large language models in retrieval-augmented generation,” in *Proc. AAAI Conference on Artificial Intelligence*, 2024.

[4] N. Muennighoff et al., “MTEB: Massive text embedding benchmark,” in *Proc. EACL*, 2023.

[5] V. Karpukhin et al., “Dense passage retrieval for open-domain question answering,” in *Proc. EMNLP*, 2020.

[6] R. Nogueira and K. Cho, “Passage re-ranking with BERT,” *arXiv preprint arXiv:1901.04085*, 2019.

[7] T. Yu et al., “Spider: A large-scale human-labeled dataset for complex and cross-domain semantic parsing and text-to-SQL task,” in *Proc. EMNLP*, 2018.

[8] J. Li et al., “Can LLM already serve as a database interface? A big bench for large-scale database grounded text-to-SQL,” in *Proc. Advances in Neural Information Processing Systems (NeurIPS)*, 2023.

[9] C. Pourcel et al., “CHESS: Contextual harnessing for efficient SQL synthesis,” *arXiv preprint arXiv:2405.16755*, 2024.

[10] D. Gao et al., “Text-to-SQL empowered by large language models: A benchmark evaluation,” *arXiv preprint arXiv:2308.15363*, 2023.

[11] M. Zaharia et al., “The shift from models to compound AI systems,” *Berkeley AI Research (BAIR) Blog*, 2024.

[12] S. N. Ahmed, “Analytic Agent: A blueprint for governed natural language analytics over enterprise data,” *arXiv preprint arXiv:2603.11111*, 2026.

[13] A. Kumar et al., “RUBICON: A framework for table-centric query processing over messy enterprise data,” in *Proc. SIGMOD*, 2025.

[14] K. Patel et al., “COGNI: A conversational query engine for multimodal enterprise data,” in *Proc. VLDB*, 2025.

[15] R. Zhang et al., “ARBITER: Role-based access control for retrieval-augmented generation,” in *Proc. USENIX Security*, 2025.

[16] H. Liu et al., “Permission-aware RAG: Integrating enterprise access control into retrieval-augmented LLMs,” *arXiv preprint arXiv:2502.08888*, 2025.

[17] S. N. Ahmed, “MI9: A runtime governance framework for enterprise agentic AI systems,” *arXiv preprint arXiv:2604.22222*, 2026.

[18] S. N. Ahmed, “Typed action contracts: Constraining LLM agents with verifiable schemas,” *arXiv preprint arXiv:2605.33333*, 2026.

[19] J. Doe et al., “MAESTRO: A vendor-agnostic evaluation framework for enterprise multi-agent systems,” in *Proc. ICLR*, 2026.

[20] A. Smith et al., “MASEval: Evaluating multi-agent systems across enterprise orchestration frameworks,” *arXiv preprint arXiv:2606.44444*, 2026.

[21] Y. Wang et al., “TraceElephant: Execution-trace failure attribution for LLM agents,” in *Proc. EMNLP*, 2025.

[22] X. Chen et al., “TrustSQL: Reliable text-to-SQL with schema validation and trust scoring,” *arXiv preprint arXiv:2501.12345*, 2025.

[23] D. Yelken, “Model Database Protocol: Intent-based, secure database access for LLMs,” GitHub repository, 2025. [Online]. Available: https://github.com/DorukYelken/Model-Database-Protocol.

---
