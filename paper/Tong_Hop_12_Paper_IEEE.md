# Tổng Hợp Nội Dung 12 Bài Báo Khoa Học
## Chủ đề: Hệ thống AI Tư vấn — RAG, Agentic AI và Các Công nghệ Nền tảng

**Người tổng hợp:** *(Sinh viên KLTN)*  
**Ngày:** 15 tháng 9 năm 2026  
**Mục đích:** Tài liệu tổng hợp phục vụ Khoá luận Tốt nghiệp — Hệ thống AI Tư vấn (SmartRestaurant)

---

## Mục Lục

1. [Tổng Quan Nhóm Bài Báo](#1-tổng-quan-nhóm-bài-báo)
2. [Nền tảng RAG — Cơ sở lý thuyết](#2-nền-tảng-rag--cơ-sở-lý-thuyết)
3. [RAG cho Dữ liệu Doanh nghiệp và Dữ liệu Có cấu trúc](#3-rag-cho-dữ-liệu-doanh-nghiệp-và-dữ-liệu-có-cấu-trúc)
4. [Kiến trúc và Hành vi Agentic AI](#4-kiến-trúc-và-hành-vi-agentic-ai)
5. [Công nghệ Sử dụng Công cụ — Tool Use](#5-công-nghệ-sử-dụng-công-cụ--tool-use)
6. [Ứng dụng Triển khai Thực tế](#6-ứng-dụng-triển-khai-thực-tế)
7. [Công nghệ Xử lý Ngôn ngữ Nói](#7-công-nghệ-xử-lý-ngôn-ngữ-nói)
8. [Phân tích Tổng hợp và Liên kết với KLTN](#8-phân-tích-tổng-hợp-và-liên-kết-với-kltn)
9. [Danh Mục Tài Liệu Tham Khảo (IEEE)](#9-danh-mục-tài-liệu-tham-khảo-ieee)

---

## 1. Tổng Quan Nhóm Bài Báo

Mười hai bài báo khoa học được tổng hợp trong tài liệu này tạo thành một khung lý thuyết và thực nghiệm toàn diện cho việc xây dựng hệ thống **AI Tư vấn** thông minh, đặc biệt là trong bối cảnh doanh nghiệp nhà hàng thông minh (SmartRestaurant). Các bài báo có thể được phân nhóm như sau:

| Nhóm chủ đề | Số bài báo | Bài báo liên quan |
|:---|:---:|:---|
| Nền tảng RAG | 1 | [8] |
| RAG nâng cao cho doanh nghiệp | 4 | [1], [2], [9], [12] |
| Kiến trúc Agentic AI | 2 | [3], [5] |
| Suy luận và Hành động | 1 | [6] |
| Sử dụng công cụ tự động | 1 | [7] |
| Hệ thống thực tế | 2 | [4], [11] |
| Xử lý ngôn ngữ nói | 1 | [10] |

---

## 2. Nền Tảng RAG — Cơ Sở Lý Thuyết

### 2.1 Retrieval-Augmented Generation cho Các Tác vụ NLP Thâm dụng Tri thức [8]

**Paper:** P. Lewis et al., "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks," *NeurIPS 2020*.  
**arXiv:** 2005.11401

#### Vấn đề và Động lực

Các mô hình ngôn ngữ tiền huấn luyện quy mô lớn có khả năng lưu trữ tri thức thực tế trong tham số của mình và đạt kết quả tốt trên nhiều tác vụ NLP. Tuy nhiên, chúng có những hạn chế nghiêm trọng: không thể cập nhật tri thức sau khi huấn luyện, không thể cung cấp nguồn gốc xuất xứ cho câu trả lời, và thường xuyên tạo ra "ảo giác" — thông tin sai sự thật nhưng đầy tự tin. Lewis et al. [8] nhận thấy rằng các tác vụ *knowledge-intensive* (thâm dụng tri thức) như trả lời câu hỏi miền mở đòi hỏi một cơ chế truy cập tri thức bên ngoài linh hoạt hơn.

#### Đóng góp và Phương pháp

Bài báo đề xuất mô hình **RAG** kết hợp hai thành phần:
1. **Bộ nhớ tham số (Parametric Memory):** Mô hình seq2seq **BART** đóng vai trò bộ sinh ngôn ngữ.
2. **Bộ nhớ phi tham số (Non-Parametric Memory):** Chỉ mục vector dày đặc của toàn bộ Wikipedia (21 triệu đoạn văn bản 100 từ), được truy cập qua bộ truy xuất **DPR (Dense Passage Retriever)**.

Hai biến thể được so sánh:
- **RAG-Sequence:** Điều kiện hóa toàn bộ chuỗi sinh ra trên cùng một tài liệu truy xuất.
- **RAG-Token:** Có thể sử dụng tài liệu truy xuất khác nhau cho từng token được sinh ra.

Kiến trúc hoạt động theo cơ chế: truy vấn người dùng được mã hóa thành vector, tìm kiếm MIPS (Maximum Inner Product Search) qua FAISS để lấy top-K đoạn văn, sau đó BART sinh câu trả lời từ cặp (truy vấn, đoạn văn được truy xuất).

#### Kết Quả

Mô hình RAG thiết lập kỷ lục mới (state-of-the-art) trên ba tác vụ trả lời câu hỏi miền mở, vượt qua cả mô hình T5-11B (tham số thuần túy) lẫn các kiến trúc retrieve-and-extract truyền thống. Đặc biệt, các câu trả lời do RAG sinh ra **cụ thể hơn, đa dạng hơn và chuẩn xác về mặt sự thật hơn** so với các mô hình seq2seq thuần tham số.

#### Ý nghĩa và Hạn chế

Bài báo [8] đặt nền móng lý thuyết cho toàn bộ lĩnh vực RAG. Tuy nhiên, công trình ban đầu này được tối ưu hóa chủ yếu cho dữ liệu văn bản phi cấu trúc và các tác vụ QA đơn giản, tạo ra khoảng trống nghiên cứu cho các ứng dụng doanh nghiệp phức tạp hơn được giải quyết bởi các bài báo [1], [2], [9], [12].

---

## 3. RAG cho Dữ liệu Doanh nghiệp và Dữ liệu Có Cấu trúc

### 3.1 RAG Nâng cao cho Dữ liệu Doanh nghiệp Có Cấu trúc [1]

**Paper:** C. Cheerla, "Advancing Retrieval-Augmented Generation for Structured Enterprise and Internal Data," *arXiv:2507.12425*, 2025.

#### Vấn đề và Động lực

Dữ liệu doanh nghiệp thực tế — bao gồm hồ sơ nhân sự, báo cáo có cấu trúc, tài liệu dạng bảng — có tính chất không đồng nhất và phức tạp. Các hệ thống RAG truyền thống gặp phải bốn vấn đề chính khi xử lý dữ liệu này: (1) biểu diễn ngữ cảnh bị phân mảnh do phân đoạn theo độ dài token cố định, (2) xử lý dữ liệu bảng không thỏa đáng khi làm phẳng thành văn bản tuyến tính, (3) độ đầy đủ truy xuất hạn chế khi chỉ dùng một phương pháp tìm kiếm duy nhất, và (4) ảo giác khi tài liệu truy xuất chứa thông tin không liên quan.

#### Đóng góp và Phương pháp

Cheerla [1] đề xuất một **khung RAG lai toàn diện** tích hợp nhiều kỹ thuật:

- **Phân đoạn ngữ nghĩa (Semantic Chunking):** Bảo toàn tính mạch lạc của văn bản thay vì cắt theo độ dài cố định.
- **Phân đoạn nhận biết bảng (Table-Aware Chunking):** Lập chỉ mục theo cấp độ hàng để bảo toàn mối quan hệ hàng-cột trong dữ liệu bảng.
- **Truy xuất lai (Hybrid Retrieval):** Kết hợp vector nhúng dày đặc (`all-mpnet-base-v2`) với BM25 để tận dụng ưu điểm của cả hai phương pháp.
- **Lọc nhận biết siêu dữ liệu (Metadata-Aware Filtering):** Sử dụng SpaCy NER để trích xuất thực thể có tên, tăng độ chính xác lọc.
- **Tái xếp hạng bằng Cross-Encoder:** Mô hình `ms-marco-MiniLM-L-12-v2` nâng cao độ liên quan ngữ cảnh.
- **Cơ chế Human-in-the-Loop:** Phản hồi của người dùng và bộ nhớ hội thoại giúp hệ thống thích ứng theo thời gian.
- **Lập chỉ mục lượng tử hóa (Quantized Indexing):** Tối ưu hóa hiệu quả tính toán.

#### Kết Quả

So với RAG cơ sở, khung RAG nâng cao đạt được:
- **Precision@5:** 90% so với 75% (+15%)
- **Recall@5:** 87% so với 74% (+13%)
- **MRR:** 0.85 so với 0.69 (+16%)
- **Faithfulness** (thang Likert 5): 4.6 so với 3.0
- **Completeness:** 4.2 so với 2.5
- **Relevance:** 4.5 so với 3.2

#### Ý nghĩa

Bài báo [1] cung cấp một kiến trúc hoàn chỉnh và đánh giá nghiêm ngặt cho RAG trong bối cảnh doanh nghiệp, đặc biệt giải quyết bài toán xử lý dữ liệu bảng — thách thức thiết yếu trong các hệ thống quản lý thực đơn, đơn hàng và dữ liệu nhà hàng.

---

### 3.2 Thách thức Kiến trúc khi LLM Agent Truy vấn Dữ liệu Có Cấu trúc [2]

**Paper:** S. N. Ahmed, "Beyond Document Retrieval: Architectural Challenges When LLM Agents Query Structured Enterprise Data," *arXiv:2608.19235*, 2026.

#### Vấn đề và Động lực

Phần lớn tài liệu nghiên cứu RAG giả định nguồn dữ liệu là tập hợp văn bản phi cấu trúc. Ahmed [2] chỉ ra rằng một lớp ngày càng tăng của các enterprise agent phải truy vấn **dữ liệu có cấu trúc** — cơ sở dữ liệu quan hệ, kho dữ liệu, analytics API — nơi câu trả lời là *kết quả tính toán* chứ không phải đoạn văn bản được truy xuất. Việc áp dụng trực tiếp kiến trúc document RAG lên dữ liệu có cấu trúc dẫn đến nhiều vấn đề kiến trúc cơ bản.

#### Đóng góp và Phương pháp

Bài báo xác định **7 chiều kiến trúc** phân biệt structured-data agent với document RAG:

1. **Ngữ nghĩa truy xuất (Retrieval Semantics):** Thay vì tìm đoạn văn tương đồng, agent phải tạo SQL/API call chính xác.
2. **Phân quyền/Ủy quyền (Authorization):** Kiểm soát truy cập nghiêm ngặt theo vai trò người dùng.
3. **Nhận diện ý định (Intent Recognition):** Xác định miền nghiệp vụ mục tiêu.
4. **Phân giải thực thể (Entity Resolution):** Ánh xạ tên thực thể thành mã định danh chuẩn.
5. **Đánh giá (Evaluation):** Độ chính xác truy vấn và trung thực lược đồ thay vì độ liên quan truy xuất.
6. **Các chế độ thất bại (Failure Modes):** Năm rủi ro đặc trưng gồm SQL injection, vi phạm phân quyền, lỗi phân giải thực thể, ảo giác lược đồ, và lỗi kiểu dữ liệu.
7. **Độ trễ (Latency):** Thực thi truy vấn cơ sở dữ liệu có độ trễ khác hẳn so với tìm kiếm vector.

Bài báo đề xuất **kiến trúc phân tầng (staged architecture)** với các giai đoạn tường minh: diễn giải câu hỏi, kiểm tra chính sách, gắn kết thực thể, lập kế hoạch lược đồ, xác thực khả năng trả lời, thực thi có quản trị, giải thích phản hồi, ghi nhật ký kiểm toán.

#### Kết Quả

Nghiên cứu tổng hợp có đối chứng chứng minh: kiến trúc phân tầng đề xuất **triệt tiêu hoàn toàn các vi phạm phân quyền** so với đường cơ sở dịch-và-thực-thi trực tiếp (direct translate-and-execute baseline) trong các điều kiện đối chứng.

#### Ý nghĩa

Bài báo [2] cung cấp nền tảng lý thuyết để thiết kế phần **truy vấn dữ liệu SQL** trong hệ thống SmartRestaurant, nơi agent cần truy vấn dữ liệu đặt bàn, menu, và lịch sử đơn hàng từ cơ sở dữ liệu quan hệ.

---

### 3.3 W-RAG: Truy xuất Nhận biết Nguồn cho Tạo Tài liệu Doanh nghiệp [9]

**Paper:** H. Dhulipala, R. Ombase, M. Wang, and T. N. Nguyen, "W-RAG: Source-Aware Retrieval for Enterprise Document Generation from Heterogeneous Knowledge Bases," *arXiv:2608.22081*, 2026.

#### Vấn đề và Động lực

Các hệ thống RAG hiện tại giả định rằng bằng chứng từ nhiều kho lưu trữ khác nhau có thể được xếp hạng toàn cục (global ranking) qua một hàm tương đồng duy nhất. Trong môi trường doanh nghiệp, các cơ sở tri thức không đồng nhất (chính sách, quy định pháp lý, tài liệu kỹ thuật, hướng dẫn phòng ban) có **vai trò hoàn toàn khác nhau** và cần được đại diện đồng thời trong tài liệu được tạo ra. Xếp hạng toàn cục tạo ra ngữ cảnh mất cân bằng, bị chi phối bởi một nhóm nguồn thông tin.

#### Đóng góp và Phương pháp

Nhóm tác giả tại UT Dallas, DMI và MIT đề xuất **W-RAG (Weighted RAG)**, hoạt động qua ba giai đoạn:

1. **Truy xuất định hướng bản thể học (Ontology-Guided Retrieval):** Mô hình hóa chủ đề có hướng dẫn bản thể học để xác định đoạn văn không chỉ tương đồng từ vựng mà còn phù hợp với yêu cầu chủ đề của tài liệu đích.
2. **Xếp hạng cục bộ (Local Ranking):** Xếp hạng bằng chứng bên trong từng cơ sở tri thức riêng biệt thay vì gộp chung.
3. **Gán trọng số cấp nguồn (Source-Level Weighting):** Điều tiết lượng ngữ cảnh từ mỗi cơ sở tri thức, đảm bảo đại diện đa nguồn cân bằng.

Bài báo còn giới thiệu một **bộ dữ liệu mới** cho tác vụ tạo tài liệu doanh nghiệp bao gồm: chính sách doanh nghiệp, tài liệu ra mắt sản phẩm, báo cáo thẩm định M&A, và đề xuất chương trình đào tạo — trải dài trên nhiều lĩnh vực công nghiệp (AI, Y tế, Khí hậu, Tài chính).

#### Kết Quả

Thực nghiệm cho thấy các quy trình RAG tiêu chuẩn hoạt động kém trên tác vụ tạo tài liệu doanh nghiệp mặc dù văn bản đầu ra trôi chảy, trong khi **W-RAG cải thiện đáng kể cả độ bao phủ yêu cầu tài liệu lẫn chất lượng tạo sinh**.

#### Ý nghĩa

Bài báo [9] giải quyết bài toán tích hợp tri thức từ nhiều nguồn — đặc biệt quan trọng khi hệ thống AI tư vấn cần tổng hợp thông tin từ menu, chính sách nhà hàng, phản hồi khách hàng và cơ sở dữ liệu đặt bàn.

---

### 3.4 DocuSearch: RAG Lai với Đồ thị Tri thức, RRF và Đánh giá Theo Đoạn [12]

**Paper:** H. Saragadam, S. Sharma, and M. Pujari, "Hybrid Retrieval-Augmented Generation with Knowledge Graph Expansion, RRF Fusion, and Per-Chunk Grounded Evaluation for Enterprise Document Search," *Vodafone Idea – SNOC*, 2025.

#### Vấn đề và Động lực

Trong môi trường vận hành mạng viễn thông, các kỹ sư phải tìm kiếm qua hàng trăm tài liệu kỹ thuật dưới áp lực thời gian. Phương pháp truy xuất vector đơn lẻ thường bỏ sót thông tin quan trọng vì: (1) tính không hoàn chỉnh của tín hiệu đơn, (2) phân mảnh ngữ cảnh giữa các đoạn không liền kề, và (3) ảo giác không được xác minh.

#### Đóng góp và Phương pháp

**DocuSearch** là hệ thống RAG đa tác tử lai kết hợp **ba nguồn tín hiệu** bổ trợ nhau:

- **Tìm kiếm ngữ nghĩa:** Vector store Qdrant với mô hình nhúng BGE-Large.
- **Tìm kiếm toàn văn BM25:** Chỉ mục SQLite FTS5.
- **Mở rộng Đồ thị Tri thức (KG Expansion):** Bảng cạnh có cấu trúc.

Ba danh sách xếp hạng được hợp nhất qua **Reciprocal Rank Fusion (RRF)** với trọng số có căn cứ thực nghiệm:

$$s_{RRF}(d) = \sum_{i \in \{v, b, kg\}} \frac{w_i}{k + r_i(d)}, \quad w_v=0.50,\; w_b=0.35,\; w_{kg}=0.15,\; k=60$$

Tiếp theo, bộ **cross-encoder** tái xếp hạng và thuật toán **MMR (Maximal Marginal Relevance)** với λ=0.65 chọn lọc để cân bằng liên quan và đa dạng. Đặc biệt, **vòng lặp đánh giá tác tử theo từng đoạn (Per-Chunk Agentic Evaluation Loop)** coi mỗi đoạn như một bài toán truy xuất thu nhỏ: LLM kiểm tra xem đoạn có cần thêm ngữ cảnh không, có đủ thông tin không, và câu trả lời có thực sự có căn cứ không.

#### Kết Quả

Trên ngữ liệu tài liệu viễn thông nội bộ:
- **Precision@10:** 0.69 (+15 điểm % so với RAG đơn thuần)
- **Recall@10:** 0.79 (+16 điểm %)
- **Grounding Rate:** 89.6% (+18.4 điểm %)

#### Ý nghĩa

DocuSearch [12] cung cấp một kiến trúc hoàn chỉnh sẵn sàng cho sản xuất, kết hợp RRF, KG, và vòng lặp kiểm tra căn cứ — mẫu thiết kế phù hợp cho việc tìm kiếm tài liệu nội bộ nhà hàng, SOP phục vụ và chính sách dịch vụ.

---

## 4. Kiến Trúc và Hành vi Agentic AI

### 4.1 Từ LLM đến World-Acting Systems: Tiến trình và Giới hạn [3]

**Paper:** L. Zhu and M. Cai, "From Language Models to World-Acting Systems: Progress and Limits of Agentic AI across Digital, Social, Virtual, and Physical Environments," *arXiv:2609.04894*, 2026.

#### Vấn đề và Động lực

Từ các mô hình ngôn ngữ trả lời đơn thuần, AI đã tiến hóa thành các hệ thống có thể gọi công cụ, thao tác giao diện, ủy nhiệm công việc, duy trì trạng thái và điều khiển robot. Tuy nhiên, Zhu & Cai [3] nhận thấy sự thiếu rõ ràng khái niệm khi "mang tính agent nhiều hơn" thường bị lẫn lộn giữa bốn sự thay đổi hoàn toàn khác nhau: mô hình cơ sở mạnh hơn, phần mềm harness phong phú hơn, vòng đời tác vụ dài hơn, và quyền truy cập môi trường có tác động lớn hơn.

#### Đóng góp và Phương pháp

Bài tổng quan phê phán này tổ chức các hệ thống agentic theo **ba chiều phân tích** độc lập:

1. **Thẩm quyền được ủy nhiệm (Delegated Authority):** Những thay đổi trạng thái nào hệ thống được phép kích hoạt và ủy quyền của ai là bắt buộc.
2. **Tính bền bỉ theo thời gian (Temporal Persistence):** Mục tiêu, bộ nhớ, thông tin chứng thực có tồn tại qua các bước thực thi hay không.
3. **Sự gắn kết môi trường (Environmental Coupling):** Mức độ trực tiếp mà hành động tác động lên các hệ thống số, ảo hay vật lý.

Bài báo còn duy trì phân biệt rõ ràng giữa **model** (năng lực suy luận), **harness** (phần mềm điều phối), và **môi trường** (nơi tiếp nhận hành động).

Các bằng chứng thực nghiệm quan trọng được trích dẫn: agent GPT-4 trong WebArena chỉ đạt 14.41% tỷ lệ hoàn thành (so với 78.24% của con người); OSWorld ghi nhận dưới 12.2% (so với 72.4% của con người). Điều này bác bỏ câu chuyện tiến bộ giản đơn về AI tự chủ.

#### Khái niệm Cốt lõi: Justified Delegation

Bài báo đề xuất nguyên lý **"ủy quyền hợp thức" (Justified Delegation)** — chỉ mở rộng phạm vi hành động khi bằng chứng thực nghiệm chứng minh được: nguồn gốc hành động, thẩm quyền có ranh giới, khả năng phát hiện lỗi, phục hồi an toàn, và sự kiểm soát được hiệu chuẩn của con người.

#### Ý nghĩa

Bài báo [3] cung cấp khuôn khổ đánh giá mức độ tự chủ phù hợp cho từng tác vụ — thiết yếu khi thiết kế hệ thống AI tư vấn nhà hàng cần quyết định mức độ tự chủ nào là an toàn trong việc đặt bàn, xử lý đơn hàng và tương tác với khách hàng.

---

### 4.2 Từ Prompt-Response đến Goal-Directed Systems: Tiến hóa Kiến trúc Agentic AI [5]

**Paper:** M. Alenezi, "From Prompt–Response to Goal-Directed Systems: The Evolution of Agentic AI Software Architecture," *arXiv:2602.10479*, 2026.

#### Vấn đề và Động lực

Những tích hợp ban đầu của AI tạo sinh vào phần mềm tuân theo mẫu hình *prompt-response* phi trạng thái, tỏ ra hiệu quả cho tạo nội dung và QA đơn giản nhưng cực kỳ giòn gãy đối với các khối lượng công việc vận hành — nơi tác vụ trải dài nhiều bước, giao diện công cụ thay đổi, và yêu cầu pháp lý cần dấu vết kiểm toán. Alenezi [5] lập luận rằng một sự tái cấu hình có tính hệ quả sâu sắc đang diễn ra.

#### Đóng góp và Phương pháp

Bài báo kết nối **lý thuyết agent thông minh nền tảng** (reactive, deliberative, BDI) với **các phương pháp đương đại lấy LLM làm trung tâm** và trình bày ba đóng góp chính:

1. **Kiến trúc tham chiếu cho LLM agent cấp sản xuất:** Phân tách rạch ròi giữa suy luận nhận thức (cognitive reasoning) và thực thi (execution) thông qua các giao diện công cụ định kiểu (typed tool interfaces).

2. **Bảng phân loại các cấu trúc liên kết đa tác tử (Multi-Agent Topologies):** Tập trung, phân tán, phân cấp — cùng với chế độ thất bại và phương pháp giảm thiểu tương ứng.

3. **Danh mục kiểm tra độ vững chắc doanh nghiệp (Enterprise Hardening Checklist):** Tích hợp quản trị (governance), khả năng quan sát (observability), và tính tái lặp (reproducibility).

Bài báo phân tích các nền tảng công nghiệp mới nổi: **Kore.ai, Salesforce Agentforce, TrueFoundry, ZenML, LangChain**, chỉ ra sự hội tụ hướng tới các vòng lặp agent chuẩn hóa, sổ đăng ký (registries), và cơ chế kiểm soát có thể kiểm toán.

Điểm nhấn kiến trúc quan trọng: **"tính tác tử là năng lực kiến trúc phần mềm, không phải ý chí nhân hình"** — nó phát sinh từ sự phân tách giữa nhận thức khỏi thực thi, quản lý trạng thái, và thực thi chính sách.

Kiến trúc tham chiếu định nghĩa LLM như **"nhân nhận thức" (cognitive kernel)** trong một kiến trúc điều khiển vòng lặp khép kín, tích hợp: bộ nhớ phân tầng (working/episodic/semantic), lập kế hoạch (planning), thực thi công cụ có định kiểu, và cổng quản trị (governance gateway).

#### Ý nghĩa

Bài báo [5] cung cấp thiết kế kiến trúc cụ thể cho các hệ thống agent cấp sản xuất — quan trọng để đảm bảo tính tin cậy, có thể kiểm toán và an toàn khi triển khai agent AI trong nhà hàng.

---

## 5. Công Nghệ Sử Dụng Công Cụ — Tool Use

### 5.1 ReAct: Hiệp Đồng Giữa Suy Luận và Hành Động [6]

**Paper:** S. Yao, J. Zhao, D. Yu, N. Du, I. Shafran, K. Narasimhan, and Y. Cao, "ReAct: Synergizing Reasoning and Acting in Language Models," in *Proc. ICLR 2023*, arXiv:2210.03629.

#### Vấn đề và Động lực

Khả năng suy luận (reasoning) và hành động (acting) của LLMs phần lớn vẫn được nghiên cứu như các chủ đề tách biệt: Chain-of-Thought (CoT) giúp suy luận nội tâm nhưng là hệ thống khép kín dễ bị ảo giác và lan truyền lỗi; trong khi các phương pháp Act-only tạo kế hoạch hành động nhưng thiếu khả năng suy luận trừu tượng. Yao et al. [6] đề xuất kết hợp cả hai trong một cơ chế thống nhất.

#### Đóng góp và Phương pháp

**ReAct (Reasoning + Acting)** mở rộng không gian hành động của tác tử thành:
$$\hat{\mathcal{A}} = \mathcal{A} \cup \mathcal{L}$$

trong đó $\mathcal{A}$ là không gian hành động vật lý và $\mathcal{L}$ là không gian ngôn ngữ (suy nghĩ nội tâm). Mô hình luân phiên sinh ra:
- **Thought** (suy nghĩ): phân rã bài toán, theo dõi tiến độ, điều chỉnh kế hoạch.
- **Action** (hành động): giao tiếp với môi trường bên ngoài (công cụ, API, cơ sở tri thức).
- **Observation** (quan sát): phản hồi từ môi trường được nạp lại vào ngữ cảnh.

Vòng lặp Thought→Action→Observation→Thought liên tục đến khi đạt câu trả lời.

#### Kết Quả

Trên **HotpotQA và FEVER** (suy luận thâm dụng tri thức): ReAct vượt các đường cơ sở CoT đơn thuần bằng cách tương tác với Wikipedia API, giảm mạnh ảo giác và lan truyền lỗi.

Trên **ALFWorld và WebShop** (ra quyết định tương tác): ReAct vượt các phương pháp học bắt chước (imitation learning) và học tăng cường (reinforcement learning) với:
- **ALFWorld:** tỷ lệ thành công tuyệt đối cao hơn **34%**
- **WebShop:** tỷ lệ thành công tuyệt đối cao hơn **10%**

chỉ với 1-2 ví dụ ngữ cảnh (in-context few-shot).

#### Ý nghĩa

ReAct [6] là nền tảng lý thuyết cho mọi hệ thống agent hiện đại. Vòng lặp Thought-Action-Observation được áp dụng trực tiếp trong thiết kế agent AI tư vấn SmartRestaurant khi xử lý các câu hỏi phức tạp đòi hỏi tra cứu menu, kiểm tra tình trạng đặt bàn, và tổng hợp thông tin từ nhiều nguồn.

---

### 5.2 Toolformer: Mô hình Ngôn ngữ Tự Dạy Cách Sử dụng Công cụ [7]

**Paper:** T. Schick, J. Dwivedi-Yu, R. Dessì, M. Lomeli, L. Zettlemoyer, N. Cancedda, R. Raileanu, and T. Scialom, "Toolformer: Language Models Can Teach Themselves to Use Tools," *arXiv:2302.04761*, Meta AI Research, 2023.

#### Vấn đề và Động lực

Dù LLMs có khả năng ấn tượng, chúng lại gặp khó khăn nghịch lý với các chức năng cơ bản: tính toán số học, tra cứu sự thật thời gian thực, nhận thức về thời gian. Schick et al. [7] đặt câu hỏi: liệu mô hình ngôn ngữ có thể **tự học** cách sử dụng các công cụ bên ngoài mà không cần gán nhãn thủ công?

#### Đóng góp và Phương pháp

**Toolformer** giới thiệu phương pháp **tự giám sát (self-supervised)** để huấn luyện mô hình sử dụng API:

**Quy trình 3 bước:**
1. **Tạo dữ liệu tự động:** Sử dụng khả năng few-shot của LLM để chèn ứng viên lời gọi API vào corpus văn bản hiện có.
2. **Lọc bằng hàm mất mát tự giám sát:** Giữ lại chỉ những lời gọi API thực sự giúp dự đoán token tiếp theo tốt hơn.
3. **Tinh chỉnh (Fine-tuning):** Huấn luyện mô hình trên corpus đã được chú thích API hữu ích.

Mô hình học tự quyết định: gọi API nào, khi nào gọi, tham số đối số nào, và cách kết hợp kết quả.

**Các công cụ tích hợp:** Máy tính số học (Calculator), hệ thống Q&A, công cụ tìm kiếm (Search Engine), dịch máy (Translation), lịch thời gian (Calendar).

#### Kết Quả

Toolformer dựa trên GPT-J 6.7B đạt hiệu năng zero-shot:
- Vượt qua các mô hình GPT-3 175B trên nhiều tác vụ số học và tra cứu thực tế.
- Không làm suy giảm năng lực mô hình hóa ngôn ngữ cốt lõi.
- Hiệu quả tính toán vượt trội so với mô hình lớn hơn nhiều lần.

#### Ý nghĩa

Toolformer [7] cung cấp nền tảng lý thuyết và phương pháp thực tiễn cho việc xây dựng các hệ thống agent có thể tự động gọi các dịch vụ bên ngoài — tiền đề cho thiết kế các công cụ tích hợp (tra cứu menu, kiểm tra giờ mở cửa, tính giá) trong SmartRestaurant.

---

## 6. Ứng Dụng Triển Khai Thực Tế

### 6.1 Hệ thống Hỗ trợ Khách hàng Agentic Tự Tiến hóa tại LinkedIn [4]

**Paper:** C. H. Wang, M. Tu, Q. Zhang, W. Wu, L. Zhou, M. Shen, and C. Wei, "Self-evolving Agentic Customer Support System at LinkedIn," *arXiv:2608.10224*, 2026.

#### Vấn đề và Động lực

Tại LinkedIn, dịch vụ hỗ trợ trải rộng trên nhiều bề mặt sản phẩm, nhiều mảng kinh doanh và hàng chục ngôn ngữ, trong khi hệ sinh thái liên tục biến đổi. Các tác tử hỗ trợ truyền thống — xây dựng trên câu nhắc thủ công, đường ống truy xuất cố định, QA định kỳ của con người — không thể mở rộng kịp với tốc độ thay đổi này. Vấn đề cốt lõi là thiếu vòng lặp phản hồi nguyên tắc để phát hiện sự thoái lui và tự thích ứng.

#### Đóng góp và Phương pháp

LinkedIn đề xuất kiến trúc **tự tiến hóa (self-evolving)** với ba tầng được đồng tiến hóa:

**Tầng 1 — Auto-Prompt Engine (Bộ máy câu nhắc tự động):**
Tối ưu hóa câu nhắc hệ thống thông qua **tìm kiếm tiến hóa (evolutionary search)**, xử lý prompt như tạo phẩm có quản lý phiên bản với kiểm thử hồi quy và triển khai theo giai đoạn.

**Tầng 2 — RAG như hành động tường minh:**
RAG được phơi bày như một *explicit action* thay vì bước tiền xử lý — agent tự quyết định khi nào cần truy xuất và cách tích hợp bằng chứng (nhất quán với ReAct [6]).

**Tầng 3 — Modular Evaluation Framework:**
Đánh giá đa tín hiệu phân rã chất lượng thành: grounding, intent alignment, multilingual fidelity, stylistic compliance — kết hợp rule-based diagnostics và LLM-as-a-judge.

Hai vòng lặp lồng nhau:
- **Vòng trong:** `agent ↔ RAG ↔ content lake`
- **Vòng ngoài:** `auto-prompt → agent → evaluator → auto-prompt`

#### Kết Quả

Trong A/B test ngẫu nhiên hóa theo người dùng, kéo dài hai tuần trên lưu lượng thực tế LinkedIn:
- **QA self-serve rate:** tăng **+9.0 điểm phần trăm**
- **Cancellation self-serve rate:** tăng **+4.8 điểm phần trăm**
- **Routing accuracy:** tăng **+30.6 điểm phần trăm**

#### Ý nghĩa

Bài báo [4] cung cấp bản thiết kế thực tiễn cho hệ thống hỗ trợ khách hàng có khả năng tự cải tiến — mô hình thiết kế phù hợp để xây dựng AI tư vấn nhà hàng có thể thích ứng với menu thay đổi, chính sách dịch vụ mới và phản hồi khách hàng liên tục.

---

### 6.2 Reflect-SQL: Khung Text-to-SQL Dựa trên Tự Suy ngẫm [11]

**Paper:** A. Jain and M. Shrivastava, "Reflect-SQL: A Self-Reflection Based Framework for Text-to-SQL," IIIT Hyderabad, 2024.

#### Vấn đề và Động lực

Việc ứng dụng Text-to-SQL trong thực tế bị cản trở bởi ba thách thức: (1) lược đồ cơ sở dữ liệu lớn và khó hiểu với tên cột viết tắt như `A2`, `dname`; (2) truy xuất không hiệu quả các bảng và cột liên quan do truy vấn người dùng mơ hồ; (3) SQL được sinh ra có lỗi cú pháp hoặc sai lệch logic.

#### Đóng góp và Phương pháp

**Reflect-SQL** giới thiệu khung làm việc **tự suy ngẫm nhiều giai đoạn (multi-stage self-reflection)**:

**Giai đoạn 1 — Xây dựng Cơ sở Tri thức (Knowledge Base):**
Tạo KB động từ lược đồ cơ sở dữ liệu, chứa mô tả bảng, siêu dữ liệu cột và mối quan hệ. KB liên tục được làm giàu từ các lần thực thi thành công.

**Giai đoạn 2 — Vòng lặp Truy xuất có Phản hồi (Feedback-Driven Retrieval):**
Truy xuất phân cấp từ KB (bảng → cột liên quan). LLM-as-a-judge chấm điểm ngữ cảnh truy xuất và định dạng lại truy vấn người dùng nếu chất lượng không đủ.

**Giai đoạn 3 — Vòng lặp Tổng hợp SQL Lặp lại (Iterative SQL Synthesis):**
Sinh SQL → kiểm tra cú pháp → chấm điểm ngữ nghĩa đa chiều → sửa lỗi → lặp lại.

**Giai đoạn 4 — Kiểm tra Suy diễn Logic (Entailment Check):**
Xác minh kết quả SQL có thực sự trả lời đúng ý định người dùng.

**Đặc điểm nổi bật:** Đánh giá SQL không cần mẫu đối chiếu (Reference-Free SQL Evaluation) — không cần nhãn gold-standard.

#### Kết Quả

Trên benchmark BIRD (phức tạp, gần thực tế doanh nghiệp):
- **Execution Accuracy: 65.3%** trên BIRD test set — đạt SOTA tại thời điểm công bố
- **72.03% Execution Accuracy** trên BIRD development set
- Cải thiện **+11.05%** so với các phương pháp đường cơ sở trực tiếp (single-pass)
- Vòng lặp phản hồi lặp lại giảm mạnh lỗi cú pháp và ngữ nghĩa SQL
- KB động (DKB) cải thiện chất lượng truy xuất theo thời gian qua việc làm giàu liên tục

#### Ý nghĩa

Reflect-SQL [11] cung cấp phương pháp chuyển câu hỏi ngôn ngữ tự nhiên thành SQL chính xác — thiết yếu cho agent SmartRestaurant khi cần truy vấn dữ liệu đặt bàn, tồn kho nguyên liệu, và lịch sử đơn hàng từ cơ sở dữ liệu.

---

## 7. Công Nghệ Xử Lý Ngôn Ngữ Nói

### 7.1 Phiên âm Giọng nói Dựa trên Whisper cho Hiểu biết Đa Văn hóa [10]

**Paper:** M. Picheny, "Whisper-Based Speech Transcription from Videos Across Multiple Languages for Cross-Cultural Understanding," NYU Courant Institute, 2024.

#### Vấn đề và Động lực

Trong một thế giới kết nối đa ngôn ngữ, việc phát triển các công cụ hỗ trợ hiểu biết đa văn hóa đòi hỏi xử lý lượng lớn dữ liệu âm thanh và video thực tế ("in-the-wild"). Picheny [10] nhận thấy rằng các bảng xếp hạng ASR thông thường (với WER dưới 10%) chỉ đo lường trên dữ liệu lời nói theo kịch bản, không phản ánh thực tế của lời nói tự nhiên đa ngôn ngữ từ YouTube và mạng xã hội.

#### Đóng góp và Phương pháp

Nghiên cứu đánh giá và cải thiện **Whisper** (OpenAI) và biến thể **WhisperX** (Oxford) trên **7 ngôn ngữ**: Tây Ban Nha, Nhật Bản, Hàn Quốc, Quan Thoại, Thổ Nhĩ Kỳ, Nga, Do Thái.

**Quy trình thu thập dữ liệu từ YouTube:**
- Lọc video có phụ đề thủ công và giấy phép Creative Commons.
- Xây dựng danh sách từ từ Wikimedia index.
- Trích xuất âm thanh và chuyển về 16kHz mono.
- Đánh giá Word Error Rate (WER) so sánh Whisper mặc định vs tinh chỉnh.

**WhisperX** được chọn vì: tích hợp speaker diarization (Pyannote), tăng tốc gấp 10 lần, API dễ sử dụng. Mô hình `large-v2` được sử dụng (ít bị ảo giác hơn `large-v3` với dữ liệu nhiễu).

#### Kết Quả

- **WER mặc định (out-of-the-box):** trung bình **30%** trên 7 ngôn ngữ
- **WER sau tinh chỉnh (fine-tuning):** giảm xuống còn **20%** — cải thiện 33%
- Dữ liệu tiếng nói và siêu dữ liệu được công bố mở cho cộng đồng nghiên cứu.

#### Ý nghĩa

Bài báo [10] cung cấp nền tảng kỹ thuật cho **tính năng đặt bàn bằng giọng nói** trong SmartRestaurant — chuyển đổi câu hỏi bằng giọng nói của khách hàng sang văn bản để xử lý tiếp bởi AI agent, đặc biệt quan trọng trong môi trường đa ngôn ngữ.

---

## 8. Phân Tích Tổng Hợp và Liên kết với KLTN

### 8.1 Bức Tranh Tổng Thể

Mười hai bài báo cùng xây dựng một kiến trúc lý thuyết và thực nghiệm cho hệ thống AI tư vấn thông minh theo các lớp:

```
┌────────────────────────────────────────────────────────────────┐
│              KIẾN TRÚC HỆ THỐNG AI TƯ VẤN                     │
├────────────────────────────────────────────────────────────────┤
│  GIAO TIẾP: Ngôn ngữ nói → văn bản [10]                       │
├────────────────────────────────────────────────────────────────┤
│  SUY LUẬN & HÀNH ĐỘNG: ReAct [6], Toolformer [7]              │
├────────────────────────────────────────────────────────────────┤
│  KIẾN TRÚC AGENT: Agentic AI [3][5], Self-Evolving [4]        │
├────────────────────────────────────────────────────────────────┤
│  TRUY XUẤT & TỔng HỢP:                                        │
│    - RAG nền tảng [8]                                          │
│    - RAG doanh nghiệp [1][9][12]                               │
│    - Dữ liệu có cấu trúc [2][11]                               │
└────────────────────────────────────────────────────────────────┘
```

### 8.2 Xu hướng Nghiên cứu Nổi bật

**Xu hướng 1: RAG từ văn bản đến dữ liệu có cấu trúc**
Từ RAG cơ bản [8] → RAG nâng cao cho doanh nghiệp [1] → Xử lý dữ liệu có cấu trúc [2] → Text-to-SQL tự suy ngẫm [11]: xu hướng rõ ràng là mở rộng RAG vượt ra ngoài văn bản phi cấu trúc để xử lý cơ sở dữ liệu quan hệ.

**Xu hướng 2: Từ RAG tĩnh đến Agentic RAG**
Từ RAG cổ điển [8] → Tự tiến hóa tại LinkedIn [4] → Đánh giá theo từng đoạn [12]: RAG ngày càng được tích hợp trong vòng lặp agent với khả năng tự kiểm tra và cải thiện.

**Xu hướng 3: Truy xuất đa tín hiệu**
Tất cả các bài báo RAG nâng cao ([1], [9], [12]) đều nhấn mạnh kết hợp nhiều tín hiệu truy xuất (dense + sparse + KG), phản ánh sự đồng thuận về giới hạn của một hàm tương đồng đơn lẻ.

**Xu hướng 4: Tự suy ngẫm và Kiểm tra chất lượng nội bộ**
LinkedIn [4], Reflect-SQL [11], và DocuSearch [12] đều tích hợp vòng lặp phản hồi và cơ chế tự kiểm tra — xu hướng hướng tới hệ thống agent tự cải thiện.

**Xu hướng 5: An toàn và Quản trị**
Cả [2], [3], và [5] đều nhấn mạnh tầm quan trọng của quản trị, phân quyền, và kiểm soát con người — phản ánh sự trưởng thành của lĩnh vực hướng tới ứng dụng doanh nghiệp thực tế.

### 8.3 Áp dụng vào SmartRestaurant AI Consultant

| Thành phần SmartRestaurant | Bài báo liên quan | Kỹ thuật áp dụng |
|:---|:---:|:---|
| Nhận diện giọng nói khách hàng | [10] | Whisper/WhisperX fine-tuning |
| Xử lý câu hỏi menu/chính sách | [8], [1] | Hybrid RAG + Semantic Chunking |
| Truy vấn CSDL đặt bàn | [2], [11] | Staged Agent + Reflect-SQL |
| Tổng hợp đa nguồn tri thức | [9], [12] | W-RAG + RRF Fusion + KG |
| Vòng lặp agent suy luận | [6] | ReAct Thought-Action-Observation |
| Gọi dịch vụ bên ngoài | [7] | Toolformer-style tool selection |
| Tự cải thiện theo phản hồi | [4] | Self-evolving + Auto-prompt |
| Kiến trúc tổng thể | [5] | Cognitive kernel + Typed interfaces |
| Đánh giá mức độ tự chủ | [3] | Justified Delegation framework |

---

## 9. Danh Mục Tài Liệu Tham Khảo (IEEE)

> **Chú thích trình bày:** Các trích dẫn trong tài liệu này tuân theo **Tiêu chuẩn IEEE** (IEEE Reference Format), trong đó số thứ tự trích dẫn đặt trong ngoặc vuông [n] theo thứ tự xuất hiện lần đầu trong văn bản. Tên tác giả viết tắt tên đệm và tên, theo sau là họ. Tên bài báo đặt trong ngoặc kép; tên tạp chí/hội nghị in nghiêng.

---

[1] C. Cheerla, "Advancing Retrieval-Augmented Generation for Structured Enterprise and Internal Data," *arXiv preprint arXiv:2507.12425*, Jul. 2025.

[2] S. N. Ahmed, "Beyond Document Retrieval: Architectural Challenges When LLM Agents Query Structured Enterprise Data," *arXiv preprint arXiv:2608.19235*, Aug. 2026.

[3] L. Zhu and M. Cai, "From Language Models to World-Acting Systems: Progress and Limits of Agentic AI across Digital, Social, Virtual, and Physical Environments," *arXiv preprint arXiv:2609.04894*, Sep. 2026.

[4] C. H. Wang, M. Tu, Q. Zhang, W. Wu, L. Zhou, M. Shen, and C. Wei, "Self-evolving Agentic Customer Support System at LinkedIn," *arXiv preprint arXiv:2608.10224*, Aug. 2026.

[5] M. Alenezi, "From Prompt–Response to Goal-Directed Systems: The Evolution of Agentic AI Software Architecture," *arXiv preprint arXiv:2602.10479*, Feb. 2026.

[6] S. Yao, J. Zhao, D. Yu, N. Du, I. Shafran, K. Narasimhan, and Y. Cao, "ReAct: Synergizing Reasoning and Acting in Language Models," in *Proc. 11th Int. Conf. Learning Representations (ICLR)*, Kigali, Rwanda, May 2023. [Online]. Available: https://react-lm.github.io/

[7] T. Schick, J. Dwivedi-Yu, R. Dessì, M. Lomeli, L. Zettlemoyer, N. Cancedda, R. Raileanu, and T. Scialom, "Toolformer: Language Models Can Teach Themselves to Use Tools," *arXiv preprint arXiv:2302.04761*, Feb. 2023.

[8] P. Lewis, E. Perez, A. Piktus, F. Petroni, V. Karpukhin, N. Goyal, H. Küttler, M. Lewis, W. Yih, T. Rocktäschel, S. Riedel, and D. Kiela, "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks," in *Advances in Neural Information Processing Systems (NeurIPS)*, vol. 33, pp. 9459–9474, 2020.

[9] H. Dhulipala, R. Ombase, M. Wang, and T. N. Nguyen, "W-RAG: Source-Aware Retrieval for Enterprise Document Generation from Heterogeneous Knowledge Bases," *arXiv preprint arXiv:2608.22081*, Aug. 2026.

[10] M. Picheny, "Whisper-Based Speech Transcription from Videos Across Multiple Languages for Cross-Cultural Understanding," NYU Courant Institute of Mathematical Sciences, New York University, New York, USA, 2024.

[11] A. Jain and M. Shrivastava, "Reflect-SQL: A Self-Reflection Based Framework for Text-to-SQL," International Institute of Information Technology Hyderabad (IIIT Hyderabad), India, 2024.

[12] H. Saragadam, S. Sharma, and M. Pujari, "Hybrid Retrieval-Augmented Generation with Knowledge Graph Expansion, RRF Fusion, and Per-Chunk Grounded Evaluation for Enterprise Document Search," Vodafone Idea – SNOC, 2025.

---

*Tài liệu này được soạn thảo phục vụ mục đích học thuật trong khuôn khổ Khoá luận Tốt nghiệp.*  
*Mọi trích dẫn tuân thủ nguyên tắc IEEE Citation Format.*
