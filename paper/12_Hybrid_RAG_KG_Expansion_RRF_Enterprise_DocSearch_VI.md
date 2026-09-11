# Tạo sinh Tăng cường Truy xuất Lai kết hợp Mở rộng Đồ thị Tri thức, Dung hợp RRF và Đánh giá Căn cứ Theo từng Đoạn cho Tìm kiếm Tài liệu Doanh nghiệp (Hybrid Retrieval-Augmented Generation with Knowledge Graph Expansion, RRF Fusion, and Per-Chunk Grounded Evaluation for Enterprise Document Search)

**Tác giả:**
- **Harish Saragadam** – Vodafone Idea – SNOC (`harish.saragadam@vodafoneidea.com`)
- **Sudhanshu Sharma** – Vodafone Idea – SNOC (`sudhanshu.sharma@vodafoneidea.com`)
- **Meghana Pujari** – Vodafone Idea – SNOC (`meghana.pujari1@vodafoneidea.com`)

---

## Tóm tắt (Abstract)
Trích xuất các câu trả lời chính xác và có căn cứ (grounded) từ các kho tài liệu doanh nghiệp quy mô lớn là một bài toán khó. Phương pháp truy xuất vector dày đặc (dense vector retrieval) đơn lẻ thường hoạt động kém đối với các truy vấn kết hợp thuật ngữ kỹ thuật, từ viết tắt đặc thù của nhà cung cấp (vendor-specific acronyms), hoặc đòi hỏi khả năng suy luận qua nhiều phần tài liệu không liền kề. 

**DocuSearch** được xây dựng nhằm giải quyết chính xác khoảng trống này — một hệ thống trí tuệ tài liệu đa tác tử (multi-agent document intelligence), hoạt động ngoại tuyến (offline), được phát triển và đánh giá trong môi trường vận hành mạng viễn thông thực tế (telecom network operations). Thay vì dựa vào một tín hiệu truy xuất đơn lẻ, DocuSearch kết hợp ba nguồn bằng chứng bổ trợ cho nhau:
1. Tìm kiếm ngữ nghĩa (semantic search) trên kho vector **Qdrant** sử dụng mô hình embedding **BGE-Large**,
2. Tìm kiếm toàn văn **BM25** trên chỉ mục **SQLite FTS5**,
3. Mở rộng lân cận trên **Đồ thị tri thức (Knowledge Graph - KG)** từ một bảng cạnh có cấu trúc.

Ba danh sách xếp hạng này được hợp nhất thông qua phương pháp Dung hợp Hạng Nghịch đảo (**Reciprocal Rank Fusion - RRF**) với các trọng số tín hiệu $w_v = 0.50$, $w_b = 0.35$, và $w_{kg} = 0.15$:

$$s_{RRF}(d) = \sum_{i \in \{v, b, kg\}} \frac{w_i}{k + r_i(d)}, \quad k = 60$$

trong đó $r_i(d)$ là thứ hạng của đoạn $d$ trong danh sách tín hiệu $i$. Một bộ tái xếp hạng chéo (**cross-encoder**) sau đó sẽ xếp hạng lại danh sách đã hợp nhất, và thuật toán Độ liên quan Biên Tối đa (**Maximal Marginal Relevance - MMR**) với $\lambda = 0.65$ sẽ chọn lọc danh sách nhằm đảm bảo cả tính liên quan lẫn tính đa dạng.

Điểm đặc biệt tạo nên sự khác biệt của DocuSearch là **vòng lặp đánh giá theo từng đoạn (per-chunk evaluation loop)**, coi mỗi đoạn được chọn như một bài toán truy xuất thu nhỏ riêng biệt: một LLM sẽ quyết định xem đoạn văn đó có cần thêm ngữ cảnh lân cận hay không, liệu nó có thực sự đủ thông tin để trả lời truy vấn hay không, và câu trả lời mà nó sinh ra có thực sự có căn cứ (grounded) trong văn bản được truy xuất hay không. Các câu trả lời không có căn cứ sẽ bị loại bỏ; thay vào đó, hệ thống sẽ kích hoạt phương án dự phòng hợp nhất đa đoạn (multi-chunk merge). 

Trên tập ngữ liệu tài liệu viễn thông nội bộ, DocuSearch đạt **Precision@10 là 0.69**, **Recall@10 là 0.79**, và **tỷ lệ có căn cứ (grounding rate) đạt 89.6%** — tăng lần lượt 15, 16 và 18.4 điểm phần trăm so với mô hình đường cơ sở RAG chỉ dùng vector dày đặc.

**Chỉ mục thuật ngữ (Index Terms):** Retrieval-augmented generation (RAG), knowledge graph, reciprocal rank fusion, enterprise document search, agentic evaluation, BM25, cross-encoder reranking, on-premise deployment, LangGraph, telecom AI.

---

## I. Giới thiệu (Introduction)

Tại các trung tâm vận hành mạng viễn thông (telecom network operations centres), các kỹ sư thường xuyên phải tìm kiếm qua hàng trăm tài liệu hướng dẫn của nhà cung cấp để tìm một quy trình cấu hình cụ thể dưới áp lực thời gian. Những môi trường này tích lũy các kho tài liệu kỹ thuật khổng lồ — quy trình vận hành tiêu chuẩn (SOP), báo cáo phân tích nguyên nhân gốc rễ (RCA), biên bản kiểm toán, hướng dẫn cấu hình của nhiều nhà cung cấp — và khoảng cách giữa kết quả tìm kiếm từ khóa thông thường và nhu cầu thực tế của kỹ sư có thể là rất lớn. Tìm kiếm truyền thống trả về quá nhiều kết quả liên quan lỏng lẻo. Kỹ thuật Tạo sinh Tăng cường Truy xuất (RAG) tiêu chuẩn dựa trên một tín hiệu đơn lẻ [1], dù có cải tiến, vẫn gặp khó khăn với vốn từ vựng kỹ thuật chuyên ngành, các đoạn tài liệu bị phân mảnh, và thực tế là thông tin liên quan thường nằm rải rác ở các phần không liền kề từ nhiều nhà cung cấp khác nhau.

Bài báo này mô tả **DocuSearch**, một hệ thống RAG đa tác tử lai được thiết kế và triển khai trong môi trường vận hành mạng viễn thông thực tế. Thiết kế của hệ thống được thúc đẩy bởi ba hạn chế chính:
1. **Tính không hoàn chỉnh của tín hiệu (Signal incompleteness):** Một hàm truy xuất đơn lẻ sẽ bỏ sót các đoạn văn bản có liên quan đồng thời về mặt ngữ nghĩa, từ vựng và cấu trúc;
2. **Sự phân mảnh ngữ cảnh (Context fragmentation):** Một đoạn văn bản được truy xuất riêng lẻ thường chỉ chứa một nửa quy trình;
3. **Căn cứ chưa được xác minh (Unverified grounding):** Câu trả lời được sinh ra nghe có vẻ hợp lý nhưng không thực sự được hỗ trợ bởi bằng chứng được truy xuất (ảo giác).

DocuSearch giải quyết cả ba vấn đề này bằng cách kết hợp truy xuất vector dày đặc, truy xuất thưa BM25 [2], và mở rộng Đồ thị tri thức (KG) [9] thành một bảng xếp hạng hợp nhất duy nhất thông qua Reciprocal Rank Fusion (RRF) [7], tiếp theo là tái xếp hạng bằng cross-encoder, chọn lọc bằng Maximal Marginal Relevance (MMR) [3], và — đóng góp mới cốt lõi — **một vòng lặp đánh giá tác tử theo từng đoạn (per-chunk agentic evaluation loop)** nhằm xác minh tính đầy đủ của ngữ cảnh và căn cứ câu trả lời trước khi đưa ra phản hồi. Toàn bộ quy trình chạy hoàn toàn trên các mô hình được lưu trữ cục bộ (on-premise) và được điều phối qua LangGraph [5], hiển thị qua một ứng dụng web tương tác Dash với tính năng giới hạn phạm vi truy xuất theo nhà cung cấp, tải tài liệu theo phiên làm việc, cùng các mô-đun Trung tâm Tri thức và Học tập tích hợp.

Các đóng góp chính gồm:
- **Kiến trúc truy xuất lai 3 tín hiệu** được hợp nhất qua RRF có trọng số với $w_v = 0.50$, $w_b = 0.35$, $w_{kg} = 0.15$.
- **Vòng lặp đánh giá tác tử theo từng đoạn** với khả năng phát hiện nhu cầu ngữ cảnh do LLM điều khiển, chấm điểm tính đầy đủ và xác minh căn cứ (groundedness).
- **Phân định phạm vi truy xuất nhận biết nhà cung cấp (Vendor-aware retrieval scoping)** cho kho tài liệu doanh nghiệp đa nhà cung cấp.
- **Quy trình sẵn sàng cho môi trường sản xuất** được điều phối bằng LangGraph với giao diện Dash tương tác và suy luận LLM hoàn toàn cục bộ.

Phần còn lại của bài báo được tổ chức như sau: Phần II hình thức hóa bài toán, Phần III mô tả giải pháp đề xuất, Phần IV trình bày kiến trúc hệ thống, Phần V chi tiết phương pháp luận, Phần VI phân tích các đóng góp mới, Phần VII đề cập chi tiết triển khai, Phần VIII trình bày kết quả, và Phần IX kết luận.

---

## II. Phát biểu bài toán (Problem Statement)

Gọi $\mathcal{D} = \{d_1, d_2, \ldots, d_N\}$ là một tập ngữ liệu lớn, không đồng nhất gồm các tài liệu doanh nghiệp, trong đó mỗi tài liệu $d_i$ thuộc về một hoặc nhiều không gian tên nhà cung cấp (vendor namespaces) $\mathcal{V} = \{v_1, v_2, \ldots, v_M\}$. Mỗi tài liệu được tiền xử lý thành các đoạn văn bản gối đầu nhau (overlapping text chunks):

$$\mathcal{C} = \bigcup_{i=1}^{N} \{c_{i,1}, c_{i,2}, \ldots, c_{i,k_i}\}$$

trong đó $c_{i,j}$ là đoạn thứ $j$ của tài liệu $d_i$ và $k_i$ là tổng số đoạn của tài liệu đó. Với một truy vấn ngôn ngữ tự nhiên $q$, mục tiêu là truy xuất một tập con $\mathcal{E} \subset \mathcal{C}$ và sinh ra câu trả lời $a$ sao cho:

$$a = \mathcal{G}(q, \mathcal{E})$$

trong đó $\mathcal{G}$ tổng hợp câu trả lời nghiêm ngặt từ bằng chứng được truy xuất $\mathcal{E}$, không bị ảo giác (hallucinate) các nội dung không xuất hiện trong $\mathcal{E}$. Cách biểu diễn tưởng chừng đơn giản này che giấu bốn bài toán con cụ thể mà các quy trình tiêu chuẩn thường thất bại:

1. **Tính không hoàn chỉnh của tín hiệu (Signal incompleteness):** Không một hàm truy xuất đơn lẻ $f: q \rightarrow \mathcal{C}$ nào có thể bao quát toàn bộ các đoạn liên quan, bởi vì mức độ liên quan bao trùm đồng thời cả chiều ngữ nghĩa, từ vựng và cấu trúc.
2. **Sự phân mảnh ngữ cảnh (Chunk fragmentation):** Một đoạn $c_{i,j}$ được lấy riêng lẻ thường không hoàn chỉnh khi quy trình liên quan trải dài từ $c_{i,j-1}$ đến $c_{i,j+1}$.
3. **Sự dư thừa trong bằng chứng (Redundancy in evidence):** Việc chọn top-$k$ ngây thơ có xu hướng trả về các cụm đoạn văn gần như trùng lặp, làm lãng phí dung lượng cửa sổ ngữ cảnh cho các thông tin lặp lại.
4. **Căn cứ chưa được xác minh (Unverified grounding):** RAG tiêu chuẩn bàn giao các đoạn đã truy xuất cho $\mathcal{G}$ mà không hề kiểm tra xem câu trả lời $a$ được sinh ra có thực sự được chứng thực bởi $\mathcal{E}$ hay không, dẫn đến các câu trả lời tự tin nhưng sai lệch.

DocuSearch giải quyết cả bốn vấn đề trong một quy trình thống nhất, vận hành hoàn toàn trên các mô hình lưu trữ cục bộ, không phụ thuộc vào các dịch vụ API bên ngoài.

---

## III. Giải pháp đề xuất (Proposed Solution)

DocuSearch xử lý bốn bài toán con thông qua quy trình đa tác tử phân tầng chia làm hai giai đoạn, minh họa trong **Hình 1** và **Hình 2**:

```
                              [Step 1: Chọn Template (LLM)]
                                            |
                                            v
                        [Step 2: Trích xuất Từ khóa BM25 (LLM + Rule)]
                                            |
                                            v
                         [Step 2b: Phát hiện Vendor (LLM call)]
                                            |
                     +----------------------+----------------------+
                     |                      |                      |
                     v                      v                      v
            [Step 3: Vector Search] [Step 4: BM25 Search]  [Step 5: KG Expansion]
                     |                      |                      |
                     +----------------------+----------------------+
                                            |
                                            v
                              [Step 5b: Hợp nhất RRF]
                                            |
                                            v
                        [Step 6: Tái xếp hạng Cross-Encoder]
                                            |
                                            v
                             [Step 7: Chọn lọc MMR]
                                            |
                                            v
                             Danh sách đoạn văn bản MMR có thứ tự
```
*Hình 1: Giai đoạn Tiền-MMR (run_supervisor): Bước 1 — Chọn Template (gọi LLM); Bước 2 — Trích xuất từ khóa BM25 (LLM + Dựa trên quy tắc); Bước 2b — Phát hiện Vendor (gọi LLM); Bước 3/4/5 — Tìm kiếm Vector, BM25 và Mở rộng KG song song; Bước 5b — Dung hợp RRF ($w_v=0.50, w_b=0.35, w_{kg}=0.15$); Bước 6 — Tái xếp hạng Cross-Encoder; Bước 7 — Chọn lọc MMR ($\lambda=0.65$, độ liên quan + tính đa dạng). Đầu ra: danh sách đoạn văn MMR có thứ tự được chuyển sang giai đoạn Hậu-MMR.*

- **Giai đoạn Tiền-MMR (Pre-MMR Phase):** Khi truy vấn $q$ đến, tác tử Chọn Template trước tiên phân loại nó vào một trong 5 template câu trả lời $\mathcal{T}$. Tác tử Từ khóa BM25 sau đó trích xuất các thuật ngữ chuyên ngành, và tác tử Phát hiện Nhà cung cấp tùy chọn sẽ thu hẹp cả 3 tín hiệu truy xuất vào một không gian tên nhà cung cấp cụ thể $v \in \mathcal{V}$. Tìm kiếm vector dày đặc, tìm kiếm toàn văn BM25 và mở rộng lân cận KG chạy song song; kết quả xếp hạng của chúng được hợp nhất bằng weighted RRF, tái xếp hạng bằng cross-encoder và lọc bằng MMR để tạo ra tập bằng chứng $\mathcal{E}$.

```
            +---> [Bước 2: Đánh giá đoạn văn bản bằng LLM] <------------------+
            |                          |                                      |
            |                [Cần thêm ngữ cảnh?] --(Yes)--> [Lấy đoạn liền kề]
            |                          | (No)                                 |
            |                          v                                      |
            |                  [Đủ thông tin?] --(No)-------------------------+
            |                          | (Yes)                                |
            |                          v                                      |
            |             [Bước 4: LLM Sinh câu trả lời]                      |
            |                          |                                      |
            |                          v                                      |
            |            [Bước 5: Xác minh Căn cứ Grounding]                  |
            |                          |                                      |
            |                   [Có căn cứ?] --(No)---------------------------+
            |                          | (Yes)                       (Hết đoạn)
            |                          v                                      |
            |                 [KẾT THÚC: per_chunk]                           v
            |                                                      [Dự phòng Fallback:
            |                                                       Hợp nhất ngữ cảnh]
            |                                                                 |
            |                                                                 v
            |                                                      [LLM Sinh câu trả lời
            |                                                       đa đoạn Fallback]
            |                                                                 |
            |                                                                 v
            |                                                      [Xác minh Grounding
            |                                                       Fallback]
            |                                                                 |
            |                                                                 v
            +----------------------------------------------------> [Trả về: fallback_merge]
```
*Hình 2: Giai đoạn Hậu-MMR (run_per_chunk_evaluation): Vòng lặp từng đoạn — LLM đánh giá đoạn hiện tại; nếu cần thêm ngữ cảnh, các đoạn lân cận sẽ được lấy thêm (nhánh màu xanh); kiểm tra tính đầy đủ làm cổng chặn sinh câu trả lời; LLM xác minh căn cứ câu trả lời được sinh ra; nếu có căn cứ, quy trình kết thúc (method=per_chunk); nếu không sẽ thử đoạn MMR tiếp theo. Khi hết toàn bộ các đoạn MMR, cơ chế dự phòng sẽ hợp nhất tất cả các ngữ cảnh mở rộng và trả về câu trả lời tổng hợp (method=fallback_merge).*

- **Giai đoạn Hậu-MMR (Post-MMR Phase):** Mỗi đoạn $c \in \mathcal{E}$ được đánh giá độc lập qua 4 node LLM tuần tự: phát hiện nhu cầu ngữ cảnh, chấm điểm tính đầy đủ theo ngưỡng $\tau = 7$, sinh câu trả lời, và xác minh căn cứ (groundedness). Đoạn đầu tiên vượt qua cả 4 bước kiểm tra sẽ tạo ra câu trả lời cuối cùng. Khi không có đoạn đơn lẻ nào vượt qua, cơ chế dự phòng sẽ hợp nhất tất cả các ngữ cảnh mở rộng, sinh câu trả lời tổng hợp và chạy một bước kiểm tra căn cứ cuối cùng trước khi trả lời người dùng.

---

## IV. Kiến trúc mức cao (High-Level Architecture)

Hệ thống được tổ chức qua sáu tầng chức năng trải dài trên hai giai đoạn:
1. **Tầng Tiếp nhận Tài liệu (Document Ingestion Layer):** Xử lý phân tích cú pháp và cắt đoạn, tạo ra các phân đoạn gối đầu nhau ($s = 900$ ký tự, $\delta = 140$ ký tự) được lưu trữ trong cả Qdrant [6] và SQLite FTS5.
2. **Tầng Truy xuất Đa Tín hiệu (Multi-Signal Retrieval Layer):** Chạy ba tác tử song song ($k_v=40, k_b=40, k_{kg}=15$), mỗi tác tử tối ưu hóa cho một khía cạnh liên quan khác nhau.
3. **Tầng Xếp hạng và Chọn lọc (Ranking and Selection Layer):** Thực hiện dung hợp, tái xếp hạng ($k_r=12$) và chọn lọc bằng chứng ($|\mathcal{E}|=10$).
4. **Tầng Đánh giá Tác tử (Agentic Evaluation Layer):** Chạy 4 kiểm tra LLM tuần tự trên từng đoạn ứng viên, mang lại phần lớn mức tăng chất lượng được ghi nhận.
5. **Tầng Điều phối (Orchestration Layer):** Một đồ thị DAG LangGraph với 5 node: `query_analysis`, `retrieve`, `fuse_and_rank`, `evidence_select`, và `per_chunk_eval`.
6. **Tầng Giao diện Người dùng (User Interface Layer):** Một ứng dụng Plotly Dash hiển thị giao diện tìm kiếm hội thoại cùng trực quan hóa quy trình theo thời gian thực, Trung tâm Tri thức (Knowledge Hub), Trung tâm Học tập (Learning Hub) và bảng điều khiển tiếp nhận tài liệu.

---

## V. Phương pháp luận (Methodology)

### A. Phân tích Truy vấn (Query Analysis)
Trước khi truy xuất, mọi truy vấn $q$ đều trải qua phân loại template và trích xuất từ khóa. Tác tử Chọn Template ánh xạ $q$ vào một trong năm loại trong $\mathcal{T} = \{\text{procedure\_sop}, \text{concept\_explanation}, \text{comparison\_decision}, \text{parameter\_lookup}, \text{troubleshooting\_rca}\}$ sử dụng một LLM kết hợp heuristic xác định làm phương án dự phòng khi mô hình không chắc chắn. Phân loại chính xác rất quan trọng vì nó định hình cấu trúc câu trả lời sinh ra phía sau. Tác tử Từ khóa BM25 sau đó trích xuất các thuật ngữ chuyên ngành từ bộ từ vựng viễn thông được tuyển chọn, bổ sung bằng các mở rộng riêng cho từng truy vấn. Cuối cùng, tác tử Phát hiện Vendor kết hợp phân loại LLM với so khớp regex để xác định nhà cung cấp, giới hạn mọi tín hiệu truy xuất vào tài liệu của nhà cung cấp đó khi thích hợp.

### B. Truy xuất Lai (Hybrid Retrieval)
- **Truy xuất Vector Dày đặc (Dense Vector Retrieval):** Truy vấn $q$ được mã hóa bằng `BGE-Large-EN-v1.5` [4] để thu được $\mathbf{q} \in \mathbb{R}^{1024}$. Độ tương đồng cosine được tính toán đối với tất cả embedding của các đoạn trong Qdrant, trả về top $k_v = 40$ đoạn:

$$\text{score}_v(c) = \frac{\mathbf{q} \cdot \mathbf{e}_c}{\|\mathbf{q}\| \cdot \|\mathbf{e}_c\|}$$

- **Truy xuất Thưa BM25 (BM25 Sparse Retrieval):** Các từ khóa được trích xuất sẽ truy vấn chỉ mục SQLite FTS5. Điểm số BM25 tiêu chuẩn được áp dụng:

$$\text{score}_b(c, Q) = \sum_{q_i \in Q} \text{IDF}(q_i) \cdot \frac{f(q_i, c)(k_1 + 1)}{f(q_i, c) + k_1 \left(1 - b + b \cdot \frac{|c|}{\text{avgdl}}\right)}$$

với $k_1 = 1.2$, $b = 0.75$, trong đó $|c|$ là độ dài đoạn và $\text{avgdl}$ là độ dài đoạn trung bình trên toàn bộ $\mathcal{C}$. Top $k_b = 40$ đoạn được truy xuất. BM25 đặc biệt hữu ích vì các từ viết tắt kỹ thuật và mã số model không có vùng lân cận ngữ nghĩa rõ ràng vẫn tạo ra các khớp nối từ vựng rất mạnh.
- **Mở rộng Lân cận Đồ thị Tri thức (KG Neighbour Expansion):** Các đoạn hạt giống từ kết quả vector và BM25 sẽ duyệt qua bảng cạnh KG lưu trữ trong SQLite, kéo theo các đoạn có liên kết cấu trúc (top $k_{kg} = 15$). Điều này bắt trọn các nội dung liên quan về chủ đề nhưng xa về mặt từ vựng và ngữ nghĩa — ví dụ: một đoạn mã cấu hình tham chiếu đến một quy trình được mô tả ở một chương mục khác.

### C. Dung hợp Hạng Nghịch đảo (Reciprocal Rank Fusion)
Ba danh sách xếp hạng được hợp nhất theo [7]:

$$s_{RRF}(c) = \sum_{i \in \{v, b, kg\}} \frac{w_i}{k + r_i(c)}$$

$$w_v = 0.50, \quad w_b = 0.35, \quad w_{kg} = 0.15, \quad k = 60$$

Các đoạn xuất hiện trong nhiều danh sách sẽ nhận được đóng góp cộng dồn, tự nhiên nâng cao vị trí các nội dung liên quan trên nhiều góc độ tương đồng khác nhau. Hằng số làm mượt $k = 60$ ngăn các mục có thứ hạng rất cao chi phối hoàn toàn điểm hợp nhất.

### D. Tái xếp hạng bằng Cross-Encoder (Cross-Encoder Reranking)
Top $k_r = 12$ đoạn đã hợp nhất được tái xếp hạng bằng một cross-encoder [8] mã hóa đồng thời truy vấn và từng đoạn:

$$s_{\text{final}}(c) = 0.65 \cdot s_{CE}(q, c) + 0.35 \cdot s_{RRF}(c)$$

Điểm cross-encoder $s_{CE}(q, c)$ được gán trọng số cao hơn vì nó nắm bắt được các tương tác chi tiết giữa truy vấn và đoạn văn mà độ tương đồng cosine của bi-encoder không thể hiện được. Việc giữ lại thành phần RRF ngăn cross-encoder loại bỏ hoàn toàn các bằng chứng mà nhiều tín hiệu truy xuất đã cùng đồng thuận.

### E. Chọn lọc Bằng chứng bằng MMR (MMR Evidence Selection)
Danh sách tái xếp hạng được lọc lặp lại bằng MMR [3] cho đến khi $|\mathcal{E}| = 10$:

$$c^* = \arg\max_{c \in R \setminus S} \left[ \lambda \cdot s_{\text{final}}(c) - (1 - \lambda) \max_{c' \in S} \cos(\mathbf{e}_c, \mathbf{e}_{c'}) \right]$$

trong đó $S$ là tập hợp các đoạn đã chọn, $R$ là tập còn lại, và $\lambda = 0.65$ ưu tiên độ liên quan hơn một chút so với tính đa dạng. Trong thực tế, điều này loại bỏ các cụm đoạn gần như trùng lặp vốn sẽ chiếm hết cửa sổ ngữ cảnh.

### F. Vòng lặp Đánh giá Tác tử theo từng Đoạn (Per-Chunk Agentic Evaluation Loop)
Mỗi $c \in \mathcal{E}$ trải qua 4 bước kiểm tra LLM tuần tự như trong **Hình 2**:
1. **Phát hiện Nhu cầu Ngữ cảnh (Context Need Detection):** LLM đánh giá xem $c$ có phải là một mảnh rời rạc cần các đoạn lân cận $c_{prev}$ hoặc $c_{next}$ để có nghĩa hay không. Nếu có, các đoạn lân cận được truy xuất và nối thêm, tối đa qua $L = 2$ vòng lặp.
2. **Chấm điểm Tính Đầy đủ (Sufficiency Scoring):** Đoạn mở rộng $\tilde{c}$ chỉ đi tiếp nếu LLM gán điểm đầy đủ $\sigma(\tilde{c}, q) \ge \tau = 7$ trên thang điểm 1–10. Các đoạn không đạt ngưỡng này sẽ bị bỏ qua ngay lập tức.
3. **Sinh Câu trả lời (Answer Generation):** Với $\tilde{c}$, truy vấn $q$, và template đã chọn $t^*$, LLM sinh câu trả lời ứng viên $\hat{a}$ ở nhiệt độ $T = 0.0$ để đảm bảo tính tái lập.
4. **Xác minh Căn cứ (Groundedness Verification):** Một lệnh gọi LLM riêng biệt kiểm tra xem $\hat{a}$ có được hỗ trợ đầy đủ bởi $\tilde{c}$ hay không. Nếu có, $a$ được gán bằng $\hat{a}$ và quy trình kết thúc (`method=per_chunk`).

Khi không có đoạn nào vượt qua cả 4 bước, cơ chế dự phòng sẽ hợp nhất tất cả ngữ cảnh mở rộng thành $\tilde{\mathcal{E}}$, sinh câu trả lời tổng hợp (`method=fallback_merge`), và chạy một bước kiểm tra căn cứ cuối cùng trước khi trả về cho người dùng.

---

## VI. Các đóng góp mới (Novel Contributions)

Năm khía cạnh của DocuSearch tạo nên sự khác biệt so với các hệ thống RAG hiện có:
1. **Vòng lặp Đánh giá Tác tử theo từng Đoạn (Per-Chunk Agentic Evaluation Loop):** Hầu hết các quy trình RAG nối tất cả các đoạn được truy xuất và sinh một câu trả lời duy nhất. DocuSearch đánh giá độc lập từng $c \in \mathcal{E}$ qua 4 kiểm tra tuần tự. Một đoạn phải đạt $\sigma(\tilde{c}, q) \ge \tau = 7$ trước khi thử sinh câu trả lời, và câu trả lời được xác minh căn cứ rõ ràng trước khi trả về. Điều này loại bỏ hoàn toàn một lớp ảo giác phát sinh khi LLM phải tổng hợp câu trả lời từ một tập ngữ cảnh hỗn tạp chỉ liên quan một phần.
2. **Dung hợp RRF 3 Tín hiệu có Trọng số (Weighted Three-Signal RRF Fusion):** Phần lớn hệ thống RAG lai chỉ dừng ở hai tín hiệu (dense + sparse). Tín hiệu thứ ba, mở rộng lân cận KG, được thêm vào công thức RRF với các trọng số tinh chỉnh thực nghiệm $w_v = 0.50, w_b = 0.35, w_{kg} = 0.15$. Tín hiệu KG đóng góp ổn định trong việc đưa ra các đoạn có quan hệ cấu trúc mà cả cosine similarity và BM25 đều không thể xếp hạng cao.
3. **Mở rộng Ngữ cảnh Lân cận Động (Dynamic Neighbour Context Expansion):** Thay vì dùng kích thước đoạn cố định lớn hơn khi lập chỉ mục (làm giảm độ chính xác truy xuất), DocuSearch phát hiện phân mảnh tại thời điểm truy vấn. Khi một đoạn bị phân mảnh, tối đa $L=2$ mức đoạn lân cận sẽ được lấy từ cơ sở dữ liệu metadata theo thời gian thực, khôi phục các quy trình nhiều bước liền mạch mà không phải đánh đổi trong khâu tiền xử lý.
4. **Phân định Phạm vi Truy xuất Nhận biết Nhà cung cấp (Vendor-Aware Retrieval Scoping):** Một sổ đăng ký nhà cung cấp được xây dựng từ metadata tài liệu, ánh xạ mỗi $v \in \mathcal{V}$ tới tập định danh tài liệu của nó. Khi tác tử phát hiện vendor nhận diện được nhà cung cấp trong truy vấn, cả ba tín hiệu truy xuất sẽ được giới hạn trong tài liệu của vendor đó, giảm nhiễu đáng kể.
5. **Quy trình Tác tử Điều phối bằng LangGraph (LangGraph-Orchestrated Agentic Pipeline):** Toàn bộ quy trình chạy như một DAG LangGraph có trạng thái [5] với 5 node được định nghĩa rõ ràng. Mọi trạng thái trung gian đều có thể quan sát, tuần tự hóa và thay thế độc lập.

---

## VII. Chi tiết Triển khai (Implementation Details)

DocuSearch được triển khai hoàn toàn bằng Python 3 và phục vụ từ một ứng dụng duy nhất. **Bảng I** tóm tắt ngăn xếp công nghệ cốt lõi. Tài liệu đi vào hệ thống qua 3 đường: gửi đường dẫn phía máy chủ, tải lên qua trình duyệt với Dash `dcc.Upload`, hoặc tự động phát hiện qua bộ giám sát thư mục `watchdog`. Mọi định dạng đều được phân tích và cắt đoạn với $s = 900$ ký tự và độ gối $\delta = 140$ ký tự. Các giá trị này được chọn sau nhiều thử nghiệm; các đoạn nhỏ hơn làm giảm điểm đầy đủ trong khi các đoạn lớn hơn làm giảm độ chính xác truy xuất. 

**Bảng II** tóm tắt cấu hình truy xuất đầy đủ được sử dụng trong các thử nghiệm. Việc tải lên tạm thời theo phiên cũng được hỗ trợ: tài liệu tải lên trong phiên được nhúng vào bộ nhớ dưới dạng mảng NumPy cục bộ (tối đa 90.000 ký tự, top-$k_u = 8$) mà không ghi vào cơ sở tri thức cố định. Tất cả các lệnh gọi LLM đều dùng $T = 0.0$ để giữ tính xác định.

| Thành phần (Component) | Công nghệ (Technology) |
| :--- | :--- |
| Vector Store | Qdrant (tự lưu trữ - self-hosted) |
| Embedding | BGE-Large-EN-v1.5 ($d=1024$, CUDA) |
| Reranker | Cross-Encoder (CUDA) |
| FTS Index | SQLite FTS5 |
| Metadata Store | SQLite |
| LLM Inference | Local REST hoặc vLLM |
| LLM Model | Mistral [10] |
| Pipeline Graph | LangGraph |
| UI Framework | Plotly Dash |
| Doc Parsing | Docling, PyMuPDF, python-docx, openpyxl |
| Auto Ingest | watchdog directory monitor |

*Bảng I: Ngăn xếp công nghệ cốt lõi của DocuSearch (DocuSearch Core Technology Stack)*

---

## VIII. Kết quả và Phân tích (Results and Analysis)

Tất cả các đánh giá được thực hiện trên một tập ngữ liệu viễn thông doanh nghiệp bao gồm tài liệu từ nhiều nhà cung cấp thiết bị lớn — sổ tay cấu hình, SOP, báo cáo RCA và biên bản kiểm toán.

| Tham số (Parameter) | Ký hiệu (Symbol) | Giá trị (Value) |
| :--- | :---: | :---: |
| Vector top-$k$ | $k_v$ | 40 |
| BM25 top-$k$ | $k_b$ | 40 |
| KG top-$k$ | $k_{kg}$ | 15 |
| Rerank top-$k$ | $k_r$ | 12 |
| Bằng chứng cuối (Final evidence) | $|\mathcal{E}|$ | 10 |
| Làm mượt RRF (RRF smoothing) | $k$ | 60 |
| Trọng số vector RRF | $w_v$ | 0.50 |
| Trọng số BM25 RRF | $w_b$ | 0.35 |
| Trọng số KG RRF | $w_{kg}$ | 0.15 |
| MMR lambda | $\lambda$ | 0.65 |
| Ngưỡng đầy đủ (Sufficiency thresh.) | $\tau$ | 7 |
| Số vòng lặp lân cận tối đa | $L$ | 2 |
| Kích thước đoạn (Chunk size) | $s$ | 900 ký tự |
| Độ gối đoạn (Chunk overlap) | $\delta$ | 140 ký tự |
| Nhiệt độ LLM | $T$ | 0.0 |

*Bảng II: Cấu hình truy xuất và xếp hạng mặc định (Default Retrieval and Ranking Configuration)*

### A. Chất lượng Truy xuất (Retrieval Quality)
**Bảng III** so sánh Precision@$k$ và Recall@$k$ trên ba cấu hình với 120 truy vấn được gán nhãn thủ công trải rộng trên 5 loại template. Hệ thống 3 tín hiệu hoàn chỉnh vượt trội hơn cả hai đường cơ sở ở mọi chỉ số. Mức tăng rõ rệt nhất là ở Recall@10, nơi mở rộng KG liên tục khôi phục các đoạn có liên hệ cấu trúc mà cả vector lẫn BM25 không tự tìm ra — đặc biệt đối với các truy vấn khắc phục sự cố (troubleshooting).

| Cấu hình (Configuration) | P@5 | R@5 | P@10 | R@10 |
| :--- | :---: | :---: | :---: | :---: |
| Dense only (Chỉ vector) | 0.61 | 0.48 | 0.54 | 0.63 |
| Dense + BM25 | 0.68 | 0.56 | 0.61 | 0.71 |
| **DocuSearch (đầy đủ - full)** | **0.76** | **0.64** | **0.69** | **0.79** |

*Bảng III: So sánh chất lượng truy xuất (Retrieval Quality Comparison)*

### B. Căn cứ Câu trả lời (Answer Grounding)
**Bảng IV** so sánh vòng lặp đánh giá từng đoạn với RAG một lượt (single-pass) thông thường. DocuSearch đạt tỷ lệ có căn cứ là **89.6%**, cải thiện **18.4 điểm phần trăm** so với single-pass RAG, và giảm tỷ lệ ảo giác từ 21.4% xuống **6.8%**. 3.6% truy vấn còn lại đi vào luồng dự phòng (fallback).

| Hệ thống (System) | Có căn cứ (Grounded) | Ảo giác (Hallucinated) | Dự phòng (Fallback) |
| :--- | :---: | :---: | :---: |
| Single-pass RAG | 71.2% | 21.4% | — |
| **DocuSearch** | **89.6%** | **6.8%** | **3.6%** |

*Bảng IV: Tỷ lệ căn cứ và ảo giác của câu trả lời (Answer Grounding and Hallucination Rates)*

### C. Độ trễ Hệ thống (System Latency)
Độ trễ trung bình từ đầu đến cuối qua 200 truy vấn là 12.6 giây, trong đó giai đoạn đánh giá từng đoạn chiếm 8.4 giây. Bản thân khâu truy xuất hoàn thành dưới 1 giây nhờ tìm kiếm Qdrant ANN và SQLite FTS5. Đối với ứng dụng trí tuệ tài liệu nơi kỹ sư cần câu trả lời tin cậy hơn là streaming từng token, sự đánh đổi này được chấp nhận.

### D. Phân tích Triệt tiêu (Ablation Study)
**Bảng V** cho thấy tỷ lệ có căn cứ khi từng thành phần bị loại bỏ đơn lẻ. Xác minh căn cứ (groundedness check) có tác động lớn nhất (15.3 điểm phần trăm), tiếp theo là chấm điểm đầy đủ (11.5 điểm phần trăm). Cả vendor scoping (3.5 điểm) và KG expansion (4.4 điểm) đều đóng góp có ý nghĩa khi kết hợp lại, chứng minh không có thành phần nào là dư thừa.

| Cấu hình (Configuration) | Tỷ lệ có căn cứ (Grounding Rate) |
| :--- | :---: |
| **DocuSearch Đầy đủ (Full DocuSearch)** | **89.6%** |
| Không có kiểm tra căn cứ (Without groundedness check) | 74.3% |
| Không có chấm điểm đầy đủ (Without sufficiency scoring) | 78.1% |
| Không có mở rộng lân cận (Without neighbour expansion) | 82.4% |
| Không có tái xếp hạng cross-encoder (Without cross-encoder reranking) | 83.7% |
| Không có mở rộng KG (Without KG expansion) | 85.2% |
| Không có phân định vendor (Without vendor scoping) | 86.1% |

*Bảng V: Phân tích thành phần về tỷ lệ căn cứ (Ablation Study: Grounding Rate)*

---

## IX. Kết luận (Conclusion)

Bài báo này đã trình bày DocuSearch, một hệ thống RAG đa tác tử lai được xây dựng cho trí tuệ tài liệu doanh nghiệp trong môi trường viễn thông đa nhà cung cấp. Hệ thống được thiết kế xoay quanh ba dạng lỗi quan sát được trong thực tế: tính không hoàn chỉnh của tín hiệu, sự phân mảnh ngữ cảnh và câu trả lời thiếu căn cứ. Quy trình hai giai đoạn — dung hợp truy xuất lai kết hợp với đánh giá tác tử theo từng đoạn — giải quyết trực tiếp cả ba dạng lỗi này. 

Kết quả cho thấy Precision@10 đạt 0.69, Recall@10 đạt 0.79, và tỷ lệ có căn cứ đạt 89.6%, với tỷ lệ ảo giác giảm xuống 6.8%. Một phát hiện thực tiễn quan trọng là trí tuệ tài liệu đạt chất lượng sản xuất hoàn toàn có thể đạt được trên các mô hình lưu trữ cục bộ (local on-premise) mà không cần gọi API bên ngoài, đảm bảo dữ liệu cấu hình mạng nhạy cảm không rời khỏi hạ tầng của tổ chức.

### A. Hạn chế và Hướng phát triển Tương lai (Limitations and Future Work)
Các lệnh gọi LLM tuần tự trong pha đánh giá từng đoạn là điểm nghẽn độ trễ chính (trung bình 8.4 giây). Việc song song hóa quá trình đánh giá đoạn trên nhiều luồng suy luận là bước đi tự nhiên đầu tiên. Trọng số tín hiệu RRF được xác định theo thực nghiệm và có thể cần học tự động qua phản hồi liên quan của truy vấn. Mở rộng DocuSearch sang truy xuất đa phương thức (multimodal) để bao quát các sơ đồ và bảng thông số cũng là hướng đi triển vọng.

**Học Tăng cường cho Truy xuất Thích ứng (Reinforcement Learning for Adaptive Retrieval):** Một hướng đi đầy hứa hẹn là coi quy trình truy xuất nhiều bước của DocuSearch như một bài toán ra quyết định tuần tự, tương tự như demo GridWorld TD-learning của Karpathy [11]. Tác tử truy xuất có thể học khi nào nên gọi BM25, khi nào mở rộng KG và khi nào dừng lại — thích ứng động với từng truy vấn thay vì áp dụng một cấu hình cố định. 

Mỗi tương tác được mô hình hóa thành một tiến trình quyết định Markov $\mathcal{M} = (\mathcal{S}, \mathcal{A}, \mathcal{P}, \mathcal{R}, \gamma)$. Phần thưởng $\mathcal{R}$ được định hình bởi tính có căn cứ của câu trả lời, phản hồi của kỹ sư qua UI Dash, độ chính xác của trích dẫn và hình phạt độ trễ:

$$\mathcal{R} = \alpha \cdot \text{Groundedness} + \beta \cdot \text{Feedback} - \gamma_l \cdot \text{Latency}$$

Độ chính xác tổng hợp của hệ thống $\Phi$ được định nghĩa:

$$\Phi = 0.30 \cdot \text{P@10} + 0.30 \cdot \text{R@10} + 0.40 \cdot \text{Grounding}$$

Với cấu hình hiện tại:

$$\Phi_{\text{current}} = 0.30 \times 0.69 + 0.30 \times 0.79 + 0.40 \times 0.896 \approx 80.2\%$$

Một chính sách Q-Learning huấn luyện ngoại tuyến (offline) được dự báo sẽ nâng P@10 lên 0.76 (+7 điểm), R@10 lên 0.86 (+7 điểm), và tỷ lệ căn cứ lên 94.5% (+4.9 điểm), nâng độ chính xác tổng hợp lên:

$$\Phi_{\text{RL}} = 0.30 \times 0.76 + 0.30 \times 0.86 + 0.40 \times 0.945 \approx 86.4\% \quad (+6.2 \text{ điểm})$$

| Chỉ số (Metric) | Hiện tại (Current) | Dự báo với RL (Projected RL) | Mức tăng (Gain) |
| :--- | :---: | :---: | :---: |
| P@10 | 0.69 | 0.76 | +7 pp |
| R@10 | 0.79 | 0.86 | +7 pp |
| Tỷ lệ căn cứ (Grounding) | 89.6% | 94.5% | +4.9 pp |
| $\Phi$ (Tổng hợp - composite) | 80.2% | 86.4% | +6.2 pp |

*Bảng VI: Mức tăng hiệu năng dự kiến với Truy xuất Thích ứng dựa trên RL (Projected Performance Gains with RL-Based Adaptive Retrieval)*

---

## Tài liệu tham khảo (References)

[1] P. Lewis et al., “Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks,” in *Advances in Neural Information Processing Systems (NeurIPS)*, vol. 33, pp. 9459–9474, 2020.  
[2] S. Robertson and H. Zaragoza, “The Probabilistic Relevance Framework: BM25 and Beyond,” *Foundations and Trends in Information Retrieval*, vol. 3, no. 4, pp. 333–389, 2009.  
[3] J. Carbonell and J. Goldstein, “The Use of MMR, Diversity-Based Reranking for Reordering Documents and Producing Summaries,” in *Proc. ACM SIGIR*, pp. 335–336, 1998.  
[4] S. Xiao et al., “C-Pack: Packaged Resources to Advance General Chinese Embedding,” *arXiv preprint arXiv:2309.07597*, 2023.  
[5] LangChain AI, “LangGraph: Building Stateful, Multi-Actor Applications with LLMs,” `https://github.com/langchain-ai/langgraph`, 2024.  
[6] Qdrant Team, “Qdrant: Vector Database for the Next Generation of AI Applications,” `https://github.com/qdrant/qdrant`, 2023.  
[7] G. V. Cormack, C. L. A. Clarke, and S. Buettcher, “Reciprocal Rank Fusion Outperforms Condorcet and Individual Rank Learning Methods,” in *Proc. ACM SIGIR*, pp. 758–759, 2009.  
[8] N. Reimers and I. Gurevych, “Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks,” in *Proc. EMNLP*, pp. 3982–3992, 2019.  
[9] M. Edge et al., “From Local to Global: A Graph RAG Approach to Query-Focused Summarization,” *arXiv preprint arXiv:2404.16130*, 2024.  
[10] A. Q. Jiang et al., “Mistral 7B,” *arXiv preprint arXiv:2310.06825*, 2023.  
[11] A. Karpathy, “REINFORCEjs: Gridworld with Temporal Difference Learning,” `https://cs.stanford.edu/people/karpathy/reinforcejs/gridworld_td.html`, 2015.
