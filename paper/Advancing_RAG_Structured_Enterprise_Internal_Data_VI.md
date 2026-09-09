# Phát triển Sinh Tăng cường Truy xuất cho Dữ liệu Doanh nghiệp và Dữ liệu Nội bộ có Cấu trúc
## (Advancing Retrieval-Augmented Generation for Structured Enterprise and Internal Data)

**Chandana Cheerla**  
*IIT Roorkee*  
`chandana_c@mfs.iitr.ac.in`  
*Ngày 17 tháng 7 năm 2025*  
*arXiv:2507.12425v1 [cs.CL] 16 Jul 2025*

---

### Tóm tắt (Abstract)

Các tổ chức ngày càng phụ thuộc vào dữ liệu doanh nghiệp độc quyền — bao gồm hồ sơ nhân sự (HR), báo cáo có cấu trúc, và các tài liệu dạng bảng — để phục vụ việc ra quyết định quan trọng. Mặc dù các Mô hình Ngôn ngữ Lớn (LLMs) thể hiện khả năng tạo sinh mạnh mẽ, chúng vẫn bị hạn chế bởi quá trình tiền huấn luyện tĩnh (*static pretraining*), cửa sổ ngữ cảnh hữu hạn (*limited context windows*), và các thách thức trong việc xử lý các định dạng dữ liệu không đồng nhất (*heterogeneous data formats*). Mặc dù các khung sườn Sinh Tăng cường Truy xuất (*Retrieval-Augmented Generation - RAG*) truyền thống giải quyết được một số ràng buộc này, chúng thường tỏ ra kém hiệu quả trong việc xử lý dữ liệu có cấu trúc (*structured*) và bán cấu trúc (*semi-structured*). 

Công trình này giới thiệu một khung sườn RAG nâng cao (*advanced RAG framework*) kết hợp các chiến lược truy xuất lai (*hybrid retrieval strategies*) tận dụng véc-tơ nhúng dày đặc (*dense embeddings* sử dụng `all-mpnet-base-v2`) và truy xuất từ khóa BM25, được tăng cường thông qua lọc nhận biết siêu dữ liệu (*metadata-aware filtering*) bằng nhận dạng thực thể có tên SpaCy NER và tái xếp hạng bằng mô hình mã hóa chéo (*cross-encoder reranking*) để cải thiện độ liên quan. Khung sườn sử dụng kỹ thuật phân đoạn ngữ nghĩa (*semantic chunking*) để bảo toàn tính mạch lạc của văn bản và giữ lại cấu trúc của dữ liệu bảng một cách tường minh, đảm bảo tính toàn vẹn của các mối quan hệ hàng - cột (*row-column relationships*). 

Các kỹ thuật lập chỉ mục lượng tử hóa (*quantized indexing*) được tích hợp để tối ưu hóa hiệu quả tính toán, trong khi cơ chế phản hồi có con người tham gia vào vòng lặp (*human-in-the-loop feedback*) và bộ nhớ hội thoại (*conversation memory*) giúp nâng cao khả năng thích ứng của hệ thống theo thời gian. Các đánh giá trên tập dữ liệu doanh nghiệp độc quyền chứng minh những cải tiến đáng kể so với các phương pháp RAG cơ sở, với mức tăng 15% trong Precision@5 (90% so với 75%), tăng 13% trong Recall@5 (87% so với 74%), và cải thiện 16% trong Mean Reciprocal Rank (0,85 so với 0,69). Các đánh giá định tính tiếp tục xác thực hiệu quả của khung sườn, cho thấy điểm số cao hơn về Tính trung thực (*Faithfulness*: 4,6 so với 3,0), Độ hoàn thiện (*Completeness*: 4,2 so với 2,5), và Độ liên quan (*Relevance*: 4,5 so với 3,2) trên thang đo Likert 5 điểm. Những phát hiện này khẳng định khả năng của khung sườn trong việc cung cấp các câu trả lời chính xác, toàn diện và phù hợp theo ngữ cảnh cho các tác vụ tri thức doanh nghiệp. Hướng nghiên cứu tương lai sẽ tập trung vào việc mở rộng khung sườn để hỗ trợ dữ liệu đa phương thức (*multimodal data*) và tích hợp các hệ thống truy xuất dựa trên tác tử (*agent-based retrieval systems*). Mã nguồn sẽ được phát hành dần tại kho lưu trữ GitHub.

**Từ khóa (Keywords):** Retrieval-Augmented Generation (RAG), Truy xuất dữ liệu có cấu trúc (*Structured Data Retrieval*), Truy xuất lai (*Hybrid Retrieval*), Xử lý dữ liệu bảng (*Tabular Data Processing*), Tái xếp hạng bằng Cross-Encoder (*Cross-Encoder Reranking*), Mở rộng tri thức doanh nghiệp (*Enterprise Knowledge Augmentation*), Lọc siêu dữ liệu (*Metadata Filtering*), Phân đoạn ngữ nghĩa (*Semantic Chunking*), Tái cấu trúc truy vấn (*Query Reformulation*), Truy xuất dẫn dắt bởi phản hồi (*Feedback-Driven Retrieval*).

---

## 1. Giới thiệu (Introduction)

Các Mô hình Ngôn ngữ Lớn (LLMs) như GPT-4 [11], PaLM [3], và LLaMA [18] đã nâng cao đáng kể các năng lực hiểu và sinh ngôn ngữ tự nhiên, vượt trội trong các tác vụ như trả lời câu hỏi (*question answering*), tóm tắt văn bản (*summarization*), và truy xuất tri thức (*knowledge retrieval*). Bất chấp những thành tựu này, LLMs vẫn bị hạn chế cố hữu bởi quá trình tiền huấn luyện tĩnh trên các kho ngữ liệu cố định và cửa sổ ngữ cảnh bị giới hạn [1, 13], điều này kìm hãm khả năng thích ứng của chúng đối với dữ liệu doanh nghiệp mang tính động hoặc độc quyền. Trong các lĩnh vực như quản trị doanh nghiệp, quản lý nhân sự, và tài chính, các thông tin trọng yếu thường được gói gọn trong các hồ sơ có cấu trúc, tài liệu chính sách, và các định dạng bảng biểu mà LLMs không thể tiếp nạp hoặc suy luận một cách tự nhiên sau khi đã triển khai.

Các khung sườn Sinh Tăng cường Truy xuất (*Retrieval-Augmented Generation - RAG*) đã xuất hiện để giải quyết khoảng trống này bằng cách tích hợp các cơ chế truy xuất với LLMs, cho phép các mô hình lấy tri thức bên ngoài tại thời điểm suy luận (*inference time*) [9, 7]. Mô hình mẫu này nâng cao độ liên quan và tính thực tế của câu trả lời bằng cách tiếp đất (*grounding*) quá trình tạo sinh vào dữ liệu cập nhật, đặc thù cho từng miền. Tuy nhiên, các phương pháp RAG thông thường hoặc cơ sở (*baseline RAG*), vốn được tối ưu hóa chủ yếu cho dữ liệu văn bản phi cấu trúc, phải đối mặt với những thách thức đáng chú ý khi áp dụng vào các tập dữ liệu doanh nghiệp bao gồm thông tin có cấu trúc, bán cấu trúc, và dạng bảng [5]. Các hạn chế chính bao gồm:

- **Biểu diễn ngữ cảnh bị phân mảnh (*Fragmented Contextual Representation*):** Các chiến lược phân đoạn cơ sở, thường sử dụng việc cắt chia theo độ dài token cố định (*fixed token-length splits*), thường làm gãy vụn các ngữ cảnh có ý nghĩa, đặc biệt là trong các tài liệu phức tạp như tài liệu chính sách hoặc sổ tay hướng dẫn [12].
- **Xử lý dữ liệu bảng không thỏa đáng (*Inadequate Handling of Tabular Data*):** Việc làm phẳng (*flattening*) các bảng thành các định dạng văn bản tuyến tính sẽ phá hủy các mối quan hệ hàng - cột nội tại cần thiết cho việc truy xuất dữ liệu chính xác bên trong các bảng [20].
- **Độ đầy đủ của truy xuất bị hạn chế (*Limited Retrieval Completeness*):** Việc chỉ dựa hoàn toàn vào các véc-tơ nhúng dày đặc (*dense embeddings*) thường bỏ sót các truy vấn dựa trên từ khóa chính xác hoặc các mã định danh cụ thể của doanh nghiệp (ví dụ: ID nhân viên, mã dự án), trong khi việc truy xuất thưa thớt (*sparse retrieval*) đơn thuần lại thiếu đi khả năng hiểu ngữ nghĩa [15].
- **Ảo giác và trôi dạt ngữ cảnh (*Hallucination and Contextual Drift*):** Các tài liệu được truy xuất có thể chứa thông tin không liên quan hoặc gây nhiễu, dẫn đến việc LLM sinh ra các câu trả lời không chính xác hoặc suy diễn phóng đại [16].
- **Thiếu tính thích ứng tương tác (*Lack of Interactive Adaptability*):** Các đường ống tĩnh không thể kết hợp phản hồi của người dùng để tinh chỉnh kết quả tìm kiếm cho các truy vấn mơ hồ hoặc nhiều lượt [19].

Để vượt qua những rào cản này, chúng tôi đề xuất một khung sườn RAG nâng cao được thiết kế riêng cho dữ liệu doanh nghiệp phức hợp. Khung sườn của chúng tôi tích hợp:
- **Phân đoạn nhận biết bảng (*table-aware chunking*)** để bảo tồn tính toàn vẹn của cấu trúc bảng;
- **Lọc nhận biết siêu dữ liệu (*metadata-aware filtering*)** sử dụng SpaCy [17] để trích xuất thực thể;
- **Chiến lược truy xuất lai (*hybrid retrieval strategy*)** kết hợp các véc-tơ nhúng dày đặc (mô hình `all-mpnet-base-v2`) với BM25;
- **Bộ tái xếp hạng mã hóa chéo (*Cross-Encoder reranker*)** (mô hình `ms-marco-MiniLM-L-12-v2`) để nâng cao độ liên quan ngữ cảnh;
- **Cơ chế phản hồi có con người can thiệp (*human-in-the-loop feedback mechanism*)** cùng bộ nhớ đệm hội thoại để cải tiến lặp.

### 1.1 Các đóng góp chính (Contributions)

1. **Khung sườn RAG lai toàn diện (*Comprehensive Hybrid RAG Framework*):** Chúng tôi thiết kế một kiến trúc tích hợp kết hợp giữa truy xuất dày đặc và thưa thớt, tái xếp hạng ngữ cảnh, và tinh chỉnh truy vấn dựa trên phản hồi, giải quyết các hạn chế của RAG truyền thống trên dữ liệu doanh nghiệp không đồng nhất.
2. **Kỹ thuật xử lý bảng cải tiến (*Advanced Table Processing*):** Chúng tôi đề xuất và đánh giá các chiến lược lập chỉ mục theo cấp độ hàng (*row-level indexing*) và phân đoạn nhận biết bảng, bảo toàn các mối quan hệ cấu trúc và cải thiện độ chính xác truy xuất trên dữ liệu dạng bảng.
3. **Đánh giá thực nghiệm nghiêm ngặt (*Rigorous Empirical Evaluation*):** Chúng tôi tiến hành các đánh giá định lượng và định tính mở rộng trên tập dữ liệu doanh nghiệp độc quyền, chứng minh những cải tiến vượt trội về độ chính xác, độ bao phủ, và tính hữu ích thực tiễn.

### 1.2 Kết quả (Results)

Cách tiếp cận của chúng tôi mang lại những cải tiến đáng kể so với các hệ thống RAG cơ sở:
- **Precision@5:** 90% so với 75%
- **Recall@5:** 87% so với 74%
- **Mean Reciprocal Rank (MRR):** 0,85 so với 0,69

Những kết quả này khẳng định độ vững chắc và khả năng ứng dụng của khung sườn trong bối cảnh doanh nghiệp thực tế, mang lại độ chính xác truy xuất vượt trội, câu trả lời toàn diện, và độ liên quan ngữ cảnh cao hơn.

Chúng tôi dự kiến mở rộng khung sườn này hướng tới **các hệ thống RAG mang tính tác tử (*agentic RAG systems* [4, 16])**, nơi các tác tử thông minh có thể tự chủ lựa chọn các chiến lược truy xuất, tự điều chỉnh tái cấu trúc truy vấn, và tích hợp các nguồn dữ liệu đa phương thức (*multimodal data sources*) — bao gồm hình ảnh, tài liệu quét, và âm thanh — từ đó mở rộng bức tranh tăng cường tri thức doanh nghiệp.

### 1.3 Cấu trúc Bài báo (Paper Organization)

Phần còn lại của bài báo được tổ chức như sau:
- **Mục 2:** Trình bày chi tiết các công trình liên quan.
- **Mục 3:** Giới thiệu phương pháp luận của khung sườn đề xuất.
- **Mục 4:** Thảo luận về các thực nghiệm và kết quả đạt được.
- **Mục 5:** Nêu bật các ưu điểm của khung sườn.
- **Mục 6:** Kết luận với các định hướng cho nghiên cứu trong tương lai, bao gồm các mở rộng tiềm năng hướng tới các hệ thống truy xuất dựa trên tác tử.

---

## 2. Các Công trình Liên quan (Related Work)

Sinh Tăng cường Truy xuất (*Retrieval-Augmented Generation - RAG*) đã nổi lên như một mô hình mẫu then chốt để thu hẹp khoảng cách giữa tri thức tham số tĩnh của LLMs và các nguồn dữ liệu bên ngoài mang tính động. Các công trình tiên phong như REALM (Guu et al. [5]) và RAG (Lewis et al. [9]) đã chứng minh tính hiệu quả của việc tăng cường các mô hình sinh bằng các bộ truy xuất dựa trên văn bản cho các tác vụ hỏi đáp miền mở (*open-domain QA*). Tuy nhiên, các khung sườn ban đầu này chủ yếu tập trung vào dữ liệu văn bản phi cấu trúc, khiến chúng kém hiệu quả hơn đối với các môi trường doanh nghiệp có nhiều dữ liệu bảng biểu và dữ liệu bán cấu trúc.

Gần đây hơn, các mô hình truy xuất dày đặc (*dense retrieval models*) như DPR (Dense Passage Retrieval [8]) và ColBERT (Khattab và Zaharia [22]) đã nâng cao độ chính xác truy xuất ngữ nghĩa bằng cách tận dụng các biểu diễn ngữ cảnh sâu. Đồng thời, các kỹ thuật tái xếp hạng (*reranking techniques*) sử dụng các mô hình mã hóa chéo (*cross-encoders* [10]) đã được áp dụng để tinh chỉnh các tài liệu ứng viên được truy xuất, cải thiện đáng kể độ liên quan ngữ cảnh. 

Mặc dù có những tiến bộ này, dữ liệu có cấu trúc và dạng bảng vẫn là một thách thức lớn đối với RAG truyền thống. Các mô hình như TAPAS (Herzig et al. [6]) và TURL (Table Understanding through Representation Learning [20]) được phát triển chuyên biệt cho việc hiểu bảng, nhưng chúng thường hoạt động như các hệ thống độc lập chứ không được tích hợp vào các đường ống RAG tổng quát. Các phương pháp tiếp cận tương tự như ReAct (Yao et al. [19]) và Reflexion (Shinn et al. [16]) đã khám phá các hành vi mang tính tác tử và các vòng lặp phản hồi lặp đi lặp lại để tinh chỉnh các kế hoạch truy xuất và tạo sinh, chỉ ra tiềm năng của các hệ thống thích ứng tương tác.

### 2.1 Ưu điểm của các Phương pháp Trước đây (Advantages of Prior Approaches)

- **Cân bằng Ngữ nghĩa và Từ vựng (*Semantic and Lexical Balance*):** Truy xuất lai kết hợp hiệu quả giữa độ sâu ngữ nghĩa và tính chính xác của từ khóa.
- **Cải thiện Độ liên quan (*Improved Relevance*):** Các cơ chế tái xếp hạng như *cross-encoders* nâng cao mức độ phù hợp ngữ cảnh của các kết quả được truy xuất.
- **Xử lý Dữ liệu có Cấu trúc (*Handling Structured Data*):** Các mô hình chuyên biệt như TAPAS [6] và TURL [20] giải quyết được các sắc thái của việc thấu hiểu dạng bảng.

### 2.2 Khoảng trống Nghiên cứu được Giải quyết (Gap Addressed by Our Work)

Mặc dù những tiến bộ này đã đặt một nền móng vững chắc, hiện vẫn còn thiếu các khung sườn thống nhất tích hợp liền mạch giữa: truy xuất lai, xử lý dữ liệu có cấu trúc, lọc siêu dữ liệu, tái xếp hạng, và tinh chỉnh tương tác được thiết kế riêng cho các môi trường doanh nghiệp. Công trình của chúng tôi giải quyết nhu cầu toàn diện này, mở rộng các năng lực RAG sang dữ liệu doanh nghiệp có cấu trúc, bán cấu trúc và phi cấu trúc, tạo tiền đề cho các hệ thống truy xuất đa phương thức và dẫn dắt bởi tác tử (*agent-driven retrieval systems*) trong tương lai.



## 3. Phương pháp luận (Methodology)

Khung sườn RAG nâng cao được đề xuất của chúng tôi được thiết kế để truy xuất và tạo sinh câu trả lời một cách hiệu quả từ dữ liệu doanh nghiệp không đồng nhất, bao gồm văn bản thuần túy, tài liệu có cấu trúc, và các bản ghi dạng bảng. Kiến trúc này giải quyết các hạn chế trong các đường ống RAG thông thường (*naive RAG*) thông qua sự kết hợp của: tiền xử lý tài liệu tối ưu, các chiến lược truy xuất lai (*hybrid retrieval*), các cơ chế xếp hạng nâng cao (*advanced ranking*), và tinh chỉnh dẫn dắt bởi phản hồi (*feedback-driven refinement*). Phần này trình bày chi tiết từng giai đoạn trong hệ thống của chúng tôi.

```
+---------------------------------------------------------------------------------------------------+
|               HÌNH 1: SƠ ĐỒ KIẾN TRÚC CỦA KHUNG SƯỜN RAG ĐỀ XUẤT (PROPOSED RAG FRAMEWORK)         |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  [QUY TRÌNH TIỀN XỬ LÝ VÀ LẬP CHỈ MỤC NGOẠI TUYẾN - OFFLINE INGESTION & INDEXING]                 |
|                                                                                                   |
|   ┌─────────────┐       ┌─────────────────┐       ┌──────────────┐       ┌─────────────────┐      |
|   │  Documents  │──────►│  Preprocessing  │──────►│ Chunked Data │──────►│ Embedding Model │      |
|   │ (User Data) │       │  and Chunking   │       │(Text & Table)│       │all-mpnet-base-v2│      |
|   └─────────────┘       └─────────────────┘       └──────────────┘       └────────┬────────┘      |
|                                                                                   │               |
|                                                                                   ▼               |
|                                                   ┌──────────────┐       ┌─────────────────┐      |
|                                                   │ Vector DB    │◄──────│   Embeddings    │      |
|                                                   │ (FAISS HNSW) │Index. │  (Dense Vector) │      |
|                                                   └──────┬───────┘       └─────────────────┘      |
|                                                          │                                        |
|  ════════════════════════════════════════════════════════╪══════════════════════════════════════  |
|                                                          │                                        |
|  [QUY TRÌNH TRUY VẤN VÀ TẠO SINH TRỰC TUYẾN - ONLINE QUERY & GENERATION FLOW]                     |
|                                                          │                                        |
|                     ┌─────────────────────────┐          │ Retrieval                              |
|                     │       User Query        │──────────┼──────────────┐                         |
|                     │  (Khởi đầu truy xuất)   │          │              │                         |
|                     └────────────┬────────────┘          ▼              ▼                         |
|                                  │               ┌──────────────┐┌──────────────┐                 |
|                                  │               │Dense Retriev.││BM25 Retriev. │                 |
|                                  │               │(FAISS HNSW)  ││ (Sparse)     │                 |
|                                  │               └──────┬───────┘└──────┬───────┘                 |
|                                  │                      │               │                         |
|                                  │                      └───────┬───────┘                         |
|                                  │                              ▼                                 |
|                                  │                   ┌──────────────────────┐                     |
|                                  │                   │   Hybrid Retrieval   │                     |
|                                  │                   │ (Score_comb: 0.6/0.4)│                     |
|                                  │                   └──────────┬───────────┘                     |
|                                  │                              │                                 |
|                                  │                              ▼                                 |
|                                  │                   ┌──────────────────────┐                     |
|                                  │                   │  Metadata Filtering  │                     |
|                                  │                   │     (SpaCy NER)      │                     |
|                                  │                   └──────────┬───────────┘                     |
|                                  │                              │                                 |
|                                  │                              ▼                                 |
|                                  │                   ┌──────────────────────┐                     |
|                                  │                   │ Contextual Reranking │                     |
|                                  │                   │   (Cross-Encoder)    │                     |
|                                  │                   └──────────┬───────────┘                     |
|                                  │                              │                                 |
|                                  ▼                              ▼                                 |
|                     ┌─────────────────────────┐        Top-k Ranked Chunks                        |
|   ┌────────────────►│ Query Refining & Expans.│─────────────────┘                                 |
|   │                 │ (LLaMA / Mistral Groq)  │                                                   |
|   │                 └────────────┬────────────┘                                                   |
|   │                              │                                                                |
|   │                              ▼                                                                |
|   │                 ┌─────────────────────────┐                                                   |
|   │                 │     LLM Generation      │                                                   |
|   │                 │ (Grounded Prompt Templ.)│                                                   |
|   │                 └────────────┬────────────┘                                                   |
|   │                              │                                                                |
|   │                              ▼                                                                |
|   │  Feedback Loop  ┌─────────────────────────┐                                                   |
|   └─────────────────┤  User Feedback (👍 / 👎) │──► [Kết thúc phiên / Lưu Memory]                  |
|     (Nếu tiêu cực)  └─────────────────────────┘                                                   |
|                                                                                                   |
+---------------------------------------------------------------------------------------------------+
```
*Hình 1: Sơ đồ kiến trúc của Khung sườn RAG đề xuất (Architecture Diagram of the Proposed RAG Framework).*

### 3.1 Tiền xử lý Tài liệu và Phân đoạn (Document Preprocessing and Chunking)

#### 3.1.1 Trích xuất Văn bản và Phân đoạn Ngữ nghĩa (Text Extraction and Semantic Chunking)
Tất cả các tài liệu văn bản, chủ yếu có nguồn gốc từ các chính sách nhân sự (HR) công khai (ví dụ: các bộ dữ liệu NASSCOM), được trích xuất bằng thư viện `pdfplumber`. Văn bản trích xuất được phân đoạn bằng bộ chia văn bản ký tự đệ quy (*Recursive Character Text Splitter*) với **kích thước đoạn (chunk size) là 2.000 ký tự** và **độ gối đầu (overlap) là 500 ký tự**, đảm bảo tính mạch lạc về mặt ngữ nghĩa trong khi vẫn tuân thủ các ràng buộc về số lượng token của các mô hình LLM.

#### 3.1.2 Trích xuất Bảng và Biểu diễn Dạng bảng (Table Extraction and Representation)
Để xử lý chính xác dữ liệu dạng bảng, chúng tôi sử dụng công cụ `Camelot` [2] cho việc phát hiện và trích xuất bảng. Các bảng được tuần tự hóa (*serialized*) sang định dạng JSON, lưu lại các siêu dữ liệu bao gồm:
- Tên tệp (*File Name*);
- Định danh hàng và cột (*Row and Column Identifiers*);
- Giá trị các ô (*Cell Values*);
- **Tách thành từng hàng riêng lẻ (*split into individual rows*)**, mỗi hàng được lập chỉ mục riêng biệt để tạo điều kiện thuận lợi cho việc truy xuất ở cấp độ hàng (*row-level retrieval*).

Khi Camelot không đủ khả năng xử lý (ví dụ: đối với các bảng có định dạng phức tạp), chúng tôi sử dụng cơ chế dự phòng quay về `pdfplumber` để trích xuất các cấu trúc giống bảng. Điều này đảm bảo quá trình trích xuất diễn ra vững chắc trên nhiều loại tài liệu đa dạng.

### 3.2 Làm giàu Siêu dữ liệu (Metadata Enrichment)

Chúng tôi áp dụng mô hình Nhận dạng Thực thể có Tên (*Named Entity Recognition - NER*) của `spaCy` [17] để chú thích cho từng đoạn văn bản các thực thể như địa điểm, ngày tháng, và tên tổ chức. Các siêu dữ liệu bổ sung như loại tài liệu, phòng ban, và mức độ bảo mật (*confidentiality level*) được mô phỏng cho quá trình thực nghiệm nhưng có thể được thay thế dễ dàng bằng siêu dữ liệu thực tế của doanh nghiệp.

### 3.3 Chiến lược Truy xuất Lai (Hybrid Retrieval Strategy)

Đường ống truy xuất của chúng tôi kết hợp giữa truy xuất dày đặc (*dense retrieval*), truy xuất thưa thớt (*sparse retrieval*), và tái xếp hạng (*reranking*), giúp nâng cao cả khả năng hiểu ngữ nghĩa lẫn độ chính xác của từ khóa.

#### 3.3.1 Truy xuất Dày đặc (Dense Retrieval)
Các đoạn văn bản được nhúng (*embedded*) bằng mô hình `all-mpnet-base-v2` [14], một mô hình nhúng câu tiên tiến (*state-of-the-art sentence embedding model*). Các véc-tơ nhúng này được lưu trữ trong một chỉ mục **FAISS HNSW** (với các siêu tham số $M=32$, $efConstruction=200$, $efSearch=50$), cho phép tìm kiếm láng giềng gần nhất xấp xỉ (*approximate nearest neighbor search*) một cách hiệu quả.

#### 3.3.2 Truy xuất Thưa thớt (Sparse Retrieval)
Chúng tôi sử dụng thuật toán **BM25** [15], một thuật toán truy xuất dựa trên từ khóa kinh điển, để bổ trợ cho việc truy xuất dày đặc, đặc biệt hữu ích cho các trường hợp khớp từ khóa chính xác (*exact term matching*).

#### 3.3.3 Dung hợp Truy xuất (Retrieval Fusion)
Điểm số truy xuất dày đặc và thưa thớt được kết hợp với nhau thông qua công thức tổng có trọng số:

$$\text{Score}_{\text{combined}} = 0.6 \times \text{Score}_{\text{dense}} + 0.4 \times \text{Score}_{\text{sparse}} \quad (1)$$

Trọng số này được xác định thông qua thực nghiệm nhằm cân bằng tối ưu giữa độ liên quan ngữ nghĩa (*semantic relevance*) và độ liên quan từ vựng (*lexical relevance*).

### 3.4 Tái xếp hạng Ngữ cảnh (Contextual Reranking)

Các đoạn văn bản ứng viên hàng đầu (*top candidate chunks*) được tái xếp hạng bằng một bộ tái xếp hạng mã hóa chéo (*Cross-Encoder reranker*) dựa trên mô hình `ms-marco-MiniLM-L-12-v2` [10]. Mô hình mã hóa chéo này đánh giá trực tiếp các cặp (truy vấn, đoạn văn bản) để gán lại điểm liên quan, đảm bảo rằng các tài liệu có mức độ liên kết ngữ cảnh chặt chẽ nhất sẽ được ưu tiên đưa lên đầu.

### 3.5 Công thức hóa và Tinh chỉnh Truy vấn (Query Formulation and Refinement)

Để tăng cường các câu truy vấn ban đầu của người dùng, chúng tôi tích hợp:
- **Viết lại Truy vấn (*Query Rewriting*):** Diễn đạt lại các truy vấn mơ hồ hoặc không đầy đủ bằng cách sử dụng các mô hình LLaMA hoặc Mistral trên nền tảng ChatGroq.
- **Mở rộng Truy vấn (*Query Expansion*):** Tạo ra các cách diễn đạt truy vấn thay thế để bao quát các khía cạnh rộng hơn của chủ đề.

Nếu người dùng đánh dấu một câu trả lời là không đạt yêu cầu (*unsatisfactory*), câu truy vấn sẽ tự động được mở rộng và thử lại, tận dụng LLM để dẫn dắt quá trình tái cấu trúc câu lệnh.

### 3.6 Tạo sinh Câu trả lời bằng LLMs (Answer Generation with LLMs)

Các đoạn văn bản cuối cùng sau khi tái xếp hạng sẽ được chuyển đến các mô hình LLM để tổng hợp câu trả lời. Chúng tôi sử dụng:
- **Các mô hình Mistral-7B và LLaMA** trên ChatGroq nhờ sự cân bằng xuất sắc giữa độ chính xác và tốc độ suy luận.
- **Một Mẫu Câu nhắc Tiếp đất (*Grounded Prompt Template*)** hướng dẫn mô hình:
  - Trả lời nghiêm ngặt chỉ dựa trên các nguồn tài liệu được truy xuất;
  - Sử dụng các gạch đầu dòng để đảm bảo tính rõ ràng;
  - Cung cấp trích dẫn nguồn tới các tài liệu gốc;
  - Đính kèm phần tóm tắt nếu câu trả lời dài quá ba câu.

### 3.7 Vòng lặp Phản hồi và Bộ nhớ Hội thoại (Feedback Loop and Conversational Memory)

Hệ thống sử dụng một `ConversationBufferMemory` lưu giữ tối đa **10 lượt tương tác gần nhất**, duy trì tính liên tục của phiên làm việc. Ngoài ra, phản hồi của người dùng (nút thích / không thích - *thumbs up/down*) được ghi nhật ký đầy đủ. Phản hồi tiêu cực sẽ tự động kích hoạt quá trình tái cấu trúc truy vấn và truy xuất lại, nâng cao khả năng thích ứng của hệ thống theo thời gian.

### 3.8 Tối ưu hóa Chỉ mục (Index Optimization)

Chúng tôi duy trì hai chỉ mục FAISS song song:
- **Chỉ mục Độ chính xác cao (*High-Precision Index*):** Sử dụng véc-tơ nhúng `all-mpnet-base-v2` [14] cho các truy vấn tổng quát đòi hỏi độ chính xác tối đa.
- **Chỉ mục Hạng nhẹ (*Lightweight Index*):** Sử dụng véc-tơ nhúng `paraphrase-MiniLM-L3-v2` cho các môi trường bị hạn chế về tài nguyên tính toán.

Hệ thống chỉ mục kép này mang lại sự đánh đổi linh hoạt giữa hiệu quả tính toán và độ chính xác truy xuất.

### 3.9 Tập dữ liệu Đánh giá và Thiết lập (Evaluation Dataset and Setup)

Các đánh giá của chúng tôi sử dụng một kho ngữ liệu chủ yếu gồm các chính sách nhân sự (HR) từ các nguồn công khai và các báo cáo doanh nghiệp. Tập dữ liệu chứa đựng sự pha trộn phong phú giữa văn bản thuần túy và các bảng biểu, mô phỏng chân thực sự đa dạng của dữ liệu doanh nghiệp trong thế giới thực.

### 3.10 Các Thước đo Đánh giá (Metrics)

Chúng tôi đánh giá hệ thống cả về mặt định lượng lẫn định tính:
- **Định lượng:** Precision@5, Recall@5, Mean Reciprocal Rank (MRR) — các thước đo truy xuất chuẩn mực.
- **Định tính:** Tính trung thực (*Faithfulness*), Độ hoàn thiện (*Completeness*), và Độ liên quan (*Relevance*) — được đánh giá trên thang đo Likert 5 điểm bởi các chuyên viên đánh giá là con người.



## 4. Thực nghiệm (Experiments)

### 4.1 Tập dữ liệu (Dataset)

Chúng tôi đánh giá khung sườn của mình trên một tập dữ liệu bao gồm các chính sách nhân sự (HR) có sẵn công khai (ví dụ: dữ liệu từ các công ty và tổ chức) và các báo cáo doanh nghiệp. Tập dữ liệu này đại diện cho một bộ sưu tập đa dạng gồm văn bản phi cấu trúc, dữ liệu có cấu trúc, và nội dung dạng bảng, mô phỏng chân thực các kho lưu trữ tri thức doanh nghiệp trong thế giới thực. Ngoài ra, các thực nghiệm bổ sung đã sử dụng các tập dữ liệu từ các kho lưu trữ công cộng như Data.gov.in (https://www.data.gov.in/), UCI Machine Learning Repository (https://archive.ics.uci.edu/ml/datasets/adult), và kho lưu trữ HR Analytics trên GitHub.

### 4.2 Quy trình Thực nghiệm (Experimental Procedure)

Chúng tôi áp dụng phương pháp thực nghiệm tăng tiến từng bước (*progressive experimental methodology*), bắt đầu với một hệ thống RAG cơ sở thông thường (*naive RAG baseline*) và tích hợp dần dần các kỹ thuật truy xuất và tạo sinh nâng cao. Cách tiếp cận theo từng bước này cho phép chúng tôi định lượng chính xác tác động đóng góp của từng cải tiến trong đường ống.

### 4.3 Đường cơ sở Naive RAG (Naive RAG Baseline)

Hệ thống cơ sở được cấu hình như sau:
- **Phân đoạn theo ký tự đệ quy (*Recursive Character-Level Chunking*):** Tài liệu được phân đoạn thành các đoạn có kích thước 500, 700, và 1.000 ký tự để cân bằng giữa việc bảo toàn ngữ cảnh và khả năng truy xuất. Kích thước đoạn xấp xỉ 700 ký tự mang lại hiệu năng tối ưu, mặc dù sự biến thiên giữa các kích thước là không quá lớn.
- **Chỉ truy xuất dày đặc (*Dense Retrieval Only*):** Các véc-tơ nhúng tài liệu được tạo ra bằng mô hình `all-mpnet-base-v2` [14], được lập chỉ mục thông qua FAISS cho truy xuất dày đặc.
- **Tạo sinh LLM trực tiếp (*Direct LLM Generation*):** Các đoạn văn bản được truy xuất được chuyển thẳng đến LLM mà không qua bất kỳ cơ chế tái xếp hạng hay lọc nào.
- **Dữ liệu bảng (*Tabular Data*):** Ban đầu, các bảng biểu được xử lý như văn bản thuần túy và được phân đoạn tương tự như văn bản phi cấu trúc, dẫn đến hiệu năng kém tối ưu, đặc biệt đối với các truy vấn nhắm vào từng hàng cụ thể.

### 4.4 Các Chiến lược Xử lý Bảng (Table Handling Strategies)

Nhận thấy sự bất cập trong việc xử lý dữ liệu dạng bảng, chúng tôi đã thử nghiệm một số chiến lược:
1. **Lưu trữ toàn bộ bảng dưới dạng các đoạn phân chia (*Storing Entire Tables as Chunks*):** Hiệu quả đối với các bảng nhỏ (dưới 10 hàng), nhưng không khả thi đối với các bảng lớn hơn do các ràng buộc về cửa sổ ngữ cảnh và độ chính xác kém trong các truy xuất nhắm vào từng hàng cụ thể.
2. **Azure Document Intelligence:** Được sử dụng để phân tích cú pháp các bảng thành các định dạng có cấu trúc được làm giàu bằng siêu dữ liệu chi tiết cho các hàng, cột, và tiêu đề.
3. **Tích hợp Camelot:** Sử dụng công cụ mã nguồn mở `Camelot` [2] để trích xuất các bảng sang định dạng JSON, bảo toàn các mối quan hệ cấu trúc.
4. **Lập chỉ mục cấp độ hàng (*Row-Level Indexing*):** Mỗi hàng của bảng được lập chỉ mục riêng biệt bên trong FAISS, cho phép truy xuất mịn (*fine-grained retrieval*) đối với các truy vấn đặc thù theo từng hàng.

### 4.5 Đường ống RAG Nâng cao Toàn diện (Full Advanced RAG Pipeline)

Sau khi tinh chỉnh các cơ chế xử lý bảng, chúng tôi triển khai đường ống RAG nâng cao hoàn chỉnh:
- **Truy xuất Lai (*Hybrid Retrieval*):** Kết hợp truy xuất dày đặc (`all-mpnet-base-v2` [14]) với truy xuất thưa thớt (BM25 [15]) bằng công thức dung hợp có trọng số: **0,6 (dày đặc)** và **0,4 (thưa thớt)**.
- **Phân đoạn Ngữ nghĩa và Nhận biết Bảng (*Semantic and Table-Aware Chunking*):** Các chiến lược phân đoạn nâng cao đảm bảo tính mạch lạc cho dữ liệu văn bản và tính toàn vẹn cấu trúc cho các bảng.
- **Tái xếp hạng bằng Cross-Encoder (*Cross-Encoder Reranking*):** Áp dụng mô hình `ms-marco-MiniLM-L-12-v2` [10] như một bộ tái xếp hạng mã hóa chéo để chấm điểm và sắp xếp lại top-$k$ đoạn văn bản được truy xuất.
- **Tinh chỉnh Truy vấn (*Query Refinement*):** Tích hợp tính năng tự động viết lại và mở rộng truy vấn sử dụng các mô hình LLaMA và Mistral trên ChatGroq, đặc biệt khi nhận phản hồi tiêu cực từ người dùng.
- **Vòng lặp Phản hồi (*Feedback Loop*):** Cơ chế có con người tham gia vào vòng lặp (*human-in-the-loop*), nơi phản hồi của người dùng kích hoạt quá trình tái cấu trúc câu lệnh và truy xuất lại.

### 4.6 Các Thước đo Đánh giá (Evaluation Metrics)

Chúng tôi đánh giá hệ thống bằng cả số liệu định lượng và định tính:
- **Precision@5:** Tỷ lệ tài liệu liên quan nằm trong top 5 kết quả được truy xuất, biểu thị tính hữu ích tức thì.
- **Recall@5:** Tỷ lệ tất cả các tài liệu liên quan được nắm bắt trong top 5 kết quả, phản ánh độ bao phủ.
- **Mean Reciprocal Rank (MRR):** Đo lường vị trí xếp hạng của tài liệu liên quan đầu tiên, giá trị càng cao cho thấy khả năng truy xuất nhanh chóng tài liệu phù hợp.

Ngoài ra, các đánh giá định tính được thực hiện bởi các chuyên viên đánh giá là con người, chấm điểm các câu trả lời dựa trên:
- **Tính trung thực (*Faithfulness*):** Mức độ mà câu trả lời được tạo ra phản ánh chính xác nội dung được truy xuất mà không có ảo giác.
- **Độ hoàn thiện (*Completeness*):** Mức độ mà câu trả lời giải quyết toàn diện câu truy vấn của người dùng.
- **Độ liên quan (*Relevance*):** Tính thích đáng và trúng đích của câu trả lời đối với truy vấn của người dùng.

Bên cạnh đó, chúng tôi cũng sử dụng các LLM như một bộ đánh giá bổ sung. Mỗi chỉ số định tính được đánh giá trên thang đo Likert 5 điểm.

---

### 4.7 Kết quả (Results)

```
+---------------------------------------------------------------------------------------------------+
|               HÌNH 2: SO SÁNH CÁC THƯỚC ĐO HIỆU NĂNG GIỮA CÁC PHƯƠNG PHÁP                        |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  Điểm số (%)                                                                                      |
|  100 ┌                                                                                            |
|   90 ┤                                                [90%]            [87%]                      |
|   80 ┤                            [75%]                            [74%]                 [85%]    |
|   70 ┤        [62%]                                                                               |
|   60 ┤                    [58%]                                                      [69%]        |
|   50 ┤                                                                           [60%]            |
|    0 └──────────┬───────────────────┬───────────────────┬───────────────────┬───────────────────  |
|             Precision@5          Recall@5                       MRR                               |
|                                                                                                   |
|  Thang điểm 5                                                                                     |
|    5 ┌                                [4.6]                            [4.2]             [4.5]    |
|    4 ┤                                                                                            |
|    3 ┤        [2.8]   [3.0]                       [2.3]   [2.5]             [2.9]   [3.2]         |
|    2 ┤                                                                                            |
|    0 └──────────┬───────────────────┬───────────────────┬───────────────────┬───────────────────  |
|             Faithfulness        Completeness                 Relevance                            |
|                                                                                                   |
|  Ký hiệu:  ░░ Direct LLM        ▒▒ Naive RAG        ██ Advanced RAG (Phương pháp đề xuất)         |
+---------------------------------------------------------------------------------------------------+
```
*Hình 2: So sánh trực quan các thước đo hiệu năng giữa Direct LLM, Naive RAG, và Advanced RAG.*

---

### Bảng 1: So sánh các Thước đo Hiệu năng giữa Naive RAG, Direct LLM, và Advanced RAG

| Thước đo (*Metric*) | LLM Trực tiếp (*Direct LLM*) | Naive RAG | **Advanced RAG (Đề xuất)** |
| :--- | :---: | :---: | :---: |
| **Precision@5** | 62% | 75% | **90%** |
| **Recall@5** | 58% | 74% | **87%** |
| **Mean Reciprocal Rank (MRR)** | 0,60 | 0,69 | **0,85** |
| **Tính trung thực (*Faithfulness*)** *(thang 5)* | 2,8 | 3,0 | **4,6** |
| **Độ hoàn thiện (*Completeness*)** *(thang 5)* | 2,3 | 2,5 | **4,2** |
| **Độ liên quan (*Relevance*)** *(thang 5)* | 2,9 | 3,2 | **4,5** |

---

### 4.8 Các Quan sát Cốt lõi (Key Observations)

- **Phân đoạn văn bản (*Chunking*):** Kích thước đoạn 700 ký tự mang lại sự đánh đổi cân bằng giữa việc bảo toàn ngữ cảnh và khả năng truy xuất, mặc dù tác động của kích thước đoạn không quá khác biệt khi vượt qua một số ngưỡng nhất định.
- **Xử lý bảng biểu (*Table Handling*):** Việc triển khai lập chỉ mục ở cấp độ hàng (*row-level indexing*) đã cải thiện đáng kể độ chính xác truy xuất cho các truy vấn dữ liệu bảng so với phương pháp phân đoạn thông thường.
- **Đóng góp của các thành phần (*Component Contributions*):** Mỗi cải tiến — truy xuất lai, tái xếp hạng bằng mã hóa chéo (*cross-encoder*), và tinh chỉnh truy vấn — đều mang lại những cải tiến tăng dần, tổng hòa lại tạo ra những bước tiến vượt bậc trên cả các chỉ số định lượng và định tính.

### 4.9 Tóm lược Đánh giá (Summary)

Các kết quả thực nghiệm của chúng tôi chứng minh rằng khung sườn RAG nâng cao được đề xuất vượt trội đáng kể so với cả Naive RAG lẫn phương pháp nhắc lệnh LLM trực tiếp (*direct LLM prompting*). Sự kết hợp giữa truy xuất lai, phân đoạn nhận biết cấu trúc và ngữ nghĩa, tái xếp hạng mã hóa chéo, cùng tinh chỉnh truy vấn động cho phép hệ thống xử lý hiệu quả dữ liệu doanh nghiệp không đồng nhất, bao gồm cả các định dạng bảng phức tạp. 

Sự cải thiện đồng nhất trên Precision@5, Recall@5, và MRR, song hành cùng điểm đánh giá cao hơn từ con người về tính trung thực, độ hoàn thiện, và độ liên quan, khẳng định độ vững chắc của đường ống đối với các tác vụ tăng cường tri thức doanh nghiệp trong thế giới thực. Những phát hiện này xác thực sự cần thiết của các chiến lược truy xuất được thiết kế riêng và cơ chế xử lý dữ liệu có cấu trúc bên trong các hệ thống RAG doanh nghiệp.

---

## 5. Các Ưu điểm của Khung sườn Đề xuất (Advantages of the Proposed Framework)

Khung sườn RAG nâng cao của chúng tôi đưa ra một số cải tiến quan trọng giúp nó đặc biệt phù hợp cho các tác vụ truy xuất và tạo sinh dữ liệu doanh nghiệp:
1. **Linh hoạt với đa dạng định dạng dữ liệu:** Khung sườn có khả năng làm việc hiệu quả với nhiều định dạng dữ liệu phổ biến trong doanh nghiệp, bao gồm văn bản phi cấu trúc, tài liệu có cấu trúc, và dữ liệu dạng bảng. Tính linh hoạt này giúp hệ thống trở nên thiết thực cho các kịch bản thực tế nơi thông tin bị phân tán trên nhiều định dạng khác nhau.
2. **Cân bằng ngữ nghĩa và từ khóa:** Cách tiếp cận truy xuất lai — kết hợp véc-tơ nhúng dày đặc với các phương pháp từ khóa thưa thớt — tạo ra sự cân bằng hoàn hảo giữa hiểu biết ngữ nghĩa sâu sắc và khớp từ khóa chính xác. Tầng tái xếp hạng bằng mô hình mã hóa chéo (*cross-encoder reranking*) tiếp tục tinh chỉnh kết quả, ưu tiên các nội dung có mức độ phù hợp ngữ cảnh cao nhất.
3. **Đột phá trong xử lý dữ liệu bảng:** Bằng cách triển khai phân đoạn nhận biết bảng và lập chỉ mục riêng cho từng hàng, hệ thống đạt được độ mịn (*granularity*) cho phép trả lời các truy vấn đặc thù theo hàng hiệu quả hơn nhiều so với việc phân đoạn văn bản tiêu chuẩn.
4. **Tối ưu hóa truy vấn động:** Hệ thống tích hợp khả năng viết lại và mở rộng truy vấn dựa trên LLM, cho phép tinh chỉnh các truy vấn mơ hồ hoặc không đầy đủ của người dùng, giúp quy trình truy xuất trở nên vững chắc hơn trước các dạng đầu vào đa dạng.
5. **Giảm thiểu ảo giác thông qua tiếp đất nghiêm ngặt:** Việc sử dụng mẫu câu nhắc tiếp đất (*grounded prompt template*) đảm bảo các câu trả lời của LLM luôn được neo chặt vào các bằng chứng được truy xuất, đính kèm trích dẫn nguồn và bản tóm tắt khi cần thiết, nâng cao độ tin cậy và triệt tiêu nguy cơ ảo giác.
6. **Khả năng mở rộng với chỉ mục kép (*Dual-Index*):** Hệ thống được thiết kế hướng tới khả năng mở rộng với hai chỉ mục song song — một chỉ mục độ chính xác cao cho các tác vụ đòi hỏi khắt khe, và một chỉ mục hạng nhẹ thay thế cho các môi trường bị hạn chế tài nguyên. Thiết kế dạng mô-đun cũng giúp khung sườn dễ dàng thích ứng với các lĩnh vực ngoài nhân sự (HR), chẳng hạn như y tế, pháp lý, và tài chính.

---

## 6. Các Hạn chế và Hướng Nghiên cứu Tương lai (Limitations and Future Work)

Mặc dù khung sườn mang lại nhiều ưu điểm, vẫn còn một số hạn chế mà chúng tôi hướng tới giải quyết trong các nghiên cứu tiếp theo:
- **Sự phụ thuộc vào lập chỉ mục tĩnh (*Static Indexing*):** Hiện tại, bất kỳ bản cập nhật nào đối với kho tài liệu đều đòi hỏi phải tái lập chỉ mục toàn bộ (*full reindexing*), điều này tốn thời gian và không thực tế trong các môi trường dữ liệu thay đổi thường xuyên. Cần có một cơ chế lập chỉ mục gia tăng, động (*incremental, dynamic indexing*) để hệ thống phản hồi tức thì với các bản cập nhật dữ liệu thời gian thực.
- **Xử lý các bảng có cấu trúc lồng nhau hoặc quá phức tạp (*Complex / Nested Tables*):** Mặc dù cách tiếp cận hiện tại hoạt động tốt trên các bảng đơn giản và có độ phức tạp trung bình, nó có thể gặp khó khăn trong việc bảo toàn mối quan hệ trong các bảng có cấu trúc sâu với tiêu đề phân cấp hoặc các ô bị hợp nhất (*merged cells*), đôi khi dẫn đến việc mất một phần ngữ cảnh trong quá trình truy xuất.
- **Phụ thuộc vào phản hồi tường minh của người dùng (*Explicit Feedback Dependence*):** Cơ chế phản hồi hiện phụ thuộc vào các hành động bấm nút thích hoặc không thích của người dùng. Trong thực tế, người dùng không phải lúc nào cũng cung cấp phản hồi, làm hạn chế khả năng tự học của hệ thống. Việc kết hợp các tín hiệu thụ động ngầm định (*passive/implicit signals*), chẳng hạn như cách người dùng tương tác với thông tin được truy xuất, có thể giúp hệ thống tự cải thiện mà không cần người dùng chấm điểm trực tiếp.
- **Quy trình tái cấu trúc truy vấn còn dựa trên kinh nghiệm (*Heuristic Query Reformulation*):** Việc mở rộng truy vấn hiện dựa trên phỏng đoán của LLM, đôi khi có thể hiểu sai ý định của người dùng hoặc mở rộng truy vấn quá rộng, dẫn đến kết quả kém tập trung hơn. Các phương pháp làm rõ tương tác hoặc nhận biết ý định sâu sắc hơn sẽ giải quyết được vấn đề này.
- **Thách thức tính toán khi mở rộng quy mô dung hợp (*Computational Scaling of Retrieval Fusion*):** Mặc dù chiến lược dung hợp truy xuất hiệu quả trên các tập dữ liệu kích thước vừa phải, việc mở rộng quy mô lên các kho ngữ liệu khổng lồ đặt ra những thách thức tính toán về độ trễ truy xuất và mức sử dụng bộ nhớ.

### 6.1 Hướng Nghiên cứu Tương lai (Future Work)

Nhìn về tương lai, chúng tôi dự định nâng cao khung sườn theo một số hướng:
1. **Lập chỉ mục động (*Dynamic Indexing*):** Triển khai khả năng cập nhật chỉ mục gia tăng khi có dữ liệu mới xuất hiện.
2. **Tích hợp các mô hình thấu hiểu bảng tiên tiến:** Áp dụng các mô hình chuyên biệt như TAPAS [6] hoặc TURL [20], vốn được huấn luyện đặc thù để bảo toàn cấu trúc quan hệ trong các bảng phức tạp.
3. **Khai thác phản hồi ngầm định (*Implicit Feedback*):** Tận dụng tỷ lệ nhấp chuột (*click-through rates*) và thời gian dừng trên tài liệu để dẫn hướng cải tiến hệ thống mà không cần người dùng đánh giá tường minh.
4. **Áp dụng các tác tử thông minh (Agent-based approaches):** Sử dụng các tác tử như **ReAct agents** [19] có khả năng suy luận về ý định truy vấn và điều chỉnh động các chiến lược truy xuất tại thời gian chạy.
5. **Mở rộng sang dữ liệu đa phương thức (*Multimodal Data*):** Hỗ trợ tài liệu quét, hình ảnh, và biểu đồ, mở rộng khả năng ứng dụng trên nhiều bối cảnh doanh nghiệp đa dạng.

---

## Tài liệu Tham khảo (References)

[1] R. Bommasani et al. On the opportunities and risks of foundation models. *arXiv preprint arXiv:2108.07258*, 2021.  
[2] Camelot Project. Camelot: PDF Table Extraction for Humans. 2018. https://camelot-py.readthedocs.io.  
[3] A. Chowdhery et al. PaLM: Scaling Language Modeling with Pathways. *arXiv preprint arXiv:2204.02311*, 2022.  
[4] Y. Gao et al. Precise Zero-Shot Dense Retrieval without Relevance Labels. *arXiv preprint arXiv:2212.10496*, 2022.  
[5] K. Guu et al. REALM: Retrieval-Augmented Language Model Pre-Training. *arXiv preprint arXiv:2002.08909*, 2020.  
[6] J. Herzig et al. TAPAS: Weakly Supervised Table Parsing via Pre-training. *arXiv preprint arXiv:2004.02349*, 2020.  
[7] G. Izacard and E. Grave. Leveraging Passage Retrieval with Generative Models for Open Domain Question Answering. *arXiv preprint arXiv:2007.01282*, 2020.  
[8] V. Karpukhin et al. Dense Passage Retrieval for Open-Domain Question Answering. *arXiv preprint arXiv:2004.04906*, 2020.  
[9] P. Lewis et al. Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. *arXiv preprint arXiv:2005.11401*, 2020.  
[10] R. Nogueira and K. Cho. Passage Reranking with BERT. *arXiv preprint arXiv:1901.04085*, 2019.  
[11] OpenAI. GPT-4 Technical Report. *arXiv preprint arXiv:2303.08774*, 2023.  
[12] J. Phang et al. Clustering and Chunking Strategies for Efficient Retrieval. *arXiv preprint arXiv:2104.07511*, 2021.  
[13] O. Press et al. Train Short, Test Long: Attention with Linear Biases. *arXiv preprint arXiv:2108.12409*, 2021.  
[14] N. Reimers and I. Gurevych. Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks. *arXiv preprint arXiv:1908.10084*, 2019.  
[15] S. Robertson and H. Zaragoza. The Probabilistic Relevance Framework: BM25 and Beyond. *Foundations and Trends in Information Retrieval*, 2009. https://www.nowpublishers.com/article/Details/INR-018.  
[16] N. Shinn et al. Reflexion: Language Agents with Verbal Reinforcement Learning. *arXiv preprint arXiv:2303.11366*, 2023.  
[17] spaCy Team. spaCy: Industrial-Strength Natural Language Processing. 2020. https://spacy.io.  
[18] H. Touvron et al. LLaMA: Open and Efficient Foundation Language Models. *arXiv preprint arXiv:2302.13971*, 2023.  
[19] S. Yao et al. ReAct: Synergizing Reasoning and Acting in Language Models. *arXiv preprint arXiv:2210.03629*, 2022.  
[20] R. Zhang et al. TURL: Table Understanding through Representation Learning. *arXiv preprint arXiv:2006.14806*, 2020.  
[21] G. Mialon et al. Augmented Language Models: A Survey. *arXiv preprint arXiv:2302.07842*, 2023.  
[22] O. Khattab and M. Zaharia. ColBERT: Efficient and Effective Passage Search via Contextualized Late Interaction over BERT. *arXiv preprint arXiv:2004.12832*, 2020.
