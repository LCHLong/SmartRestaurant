# W-RAG: Truy xuất Nhận biết Nguồn cho Quá trình Tạo Tài liệu Doanh nghiệp từ các Cơ sở Tri thức Không đồng nhất
*(W-RAG: Source-Aware Retrieval for Enterprise Document Generation from Heterogeneous Knowledge Bases)*

**Hridya Dhulipala**¹ **Rajesh Ombase**² **Michael Wang**³ **Tien N. Nguyen**¹  
¹ *The University of Texas at Dallas (Đại học Texas tại Dallas)*  
² *DIGITAL MANAGEMENT, LLC (DMI)*  
³ *Massachusetts Institute of Technology (Viện Công nghệ Massachusetts - MIT)*  
`{hridya.dhulipala, tien.n.nyugen}@utdallas.edu`, `rombase@dmigs.com`, `wangrzm@mit.edu`

*arXiv:2608.22081v1 [cs.SE] 22 Aug 2026*

---

## Tóm tắt (Abstract)

Tạo sinh Tăng cường Truy xuất (Retrieval-Augmented Generation - RAG) cho phép các mô hình ngôn ngữ lớn (LLM) tích hợp tri thức bên ngoài trong quá trình tạo văn bản, từ đó cải thiện tính chuẩn xác về mặt sự kiện (factual grounding) và khả năng thích ứng với từng miền nghiệp vụ. Tuy nhiên, các kiến trúc RAG hiện hữu đều giả định rằng các bằng chứng được truy xuất từ nhiều kho lưu trữ khác nhau có thể được xếp hạng toàn cục (globally ranked) thông qua một hàm tính tương đồng duy nhất. 

Mặc dù giả định này phù hợp với bài toán truy xuất trên miền mở (open-domain retrieval), nhưng nó lại bộc lộ hạn chế nghiêm trọng trong tác vụ tạo tài liệu doanh nghiệp. Trong môi trường doanh nghiệp, các cơ sở tri thức không đồng nhất (chẳng hạn như chính sách, quy định pháp lý, tài liệu kỹ thuật và hướng dẫn của các phòng ban) đóng các vai trò hoàn toàn khác nhau và bắt buộc phải được đại diện đồng thời trong tài liệu được tạo ra. Kết quả là, việc xếp hạng toàn cục thường tạo ra một ngữ cảnh mất cân bằng, bị chi phối bởi một nhóm nguồn thông tin chiếm ưu thế, dẫn đến các bản thảo tài liệu doanh nghiệp bị thiếu sót và không đầy đủ.

Để giải quyết hạn chế này, chúng tôi đề xuất **W-RAG**, một khung truy xuất nhận biết nguồn (source-aware retrieval framework). W-RAG thực hiện truy xuất theo định hướng bản thể học (ontology-guided retrieval), xếp hạng cục bộ (local ranking) bên trong từng cơ sở tri thức, và áp dụng cơ chế gán trọng số cấp nguồn (source-level weighting) để điều tiết cơ cấu thành phần của bằng chứng. Hơn nữa, chúng tôi giới thiệu một bộ dữ liệu mới phục vụ cho tác vụ tạo tài liệu doanh nghiệp dựa trên truy xuất, bao quát nhiều loại tài liệu và lĩnh vực công nghiệp khác nhau. Các kết quả thực nghiệm chứng minh rằng các quy trình RAG tiêu chuẩn gặp rất nhiều khó khăn trong tác vụ này, trong khi W-RAG giúp cải thiện đáng kể cả độ bao phủ yêu cầu của tài liệu lẫn chất lượng tạo sinh.

---

## 1 Giới thiệu (Introduction)

Tạo sinh Tăng cường Truy xuất (Retrieval-Augmented Generation - RAG) đã nổi lên như một mô hình chuẩn mạnh mẽ nhằm neo giữ các mô hình ngôn ngữ lớn trong tri thức thực tế, nâng cao rõ rệt tính xác thực, độ minh bạch và khả năng tương thích theo từng lĩnh vực (Lewis và cộng sự, 2021; Gao và cộng sự, 2024; Guu và cộng sự, 2020). Bằng cách kết hợp giữa năng lực tạo văn bản của mạng nơ-ron với việc truy xuất có định hướng từ các kho lưu trữ, các hệ thống RAG giúp tổ chức tổng hợp các chính sách, hợp đồng, tài liệu kỹ thuật và tài liệu giao tiếp với khách hàng với độ tin cậy vượt trội so với các mô hình chỉ dựa thuần túy vào tham số nội tại (Jadad-Garcia và Jadad, 2024).

Mặc dù đạt được những bước tiến đó, các hệ thống RAG doanh nghiệp hiện nay vẫn mang những hạn chế mang tính cấu trúc cố hữu. Các nghiên cứu và báo cáo kinh nghiệm gần đây chỉ ra rằng các quy trình RAG ngây thơ chỉ dựa trên độ tương đồng đơn thuần thường hoạt động kém hiệu quả đối với các tác vụ tạo văn bản phức tạp như xây dựng chính sách, đề xuất dự án, tài liệu Yêu cầu Cung cấp Thông tin (Request for Information - RFI), và các báo cáo tuân thủ trong môi trường doanh nghiệp không đồng nhất (Bruckhaus, 2024; Hadfield và Clark, 2026; Richards, 2025; Jayarama Nettar, 2024; Brynjolfsson và cộng sự, 2024; Jadad-Garcia và Jadad, 2024). Nguyên nhân là do các hệ thống RAG hiện tại truy xuất các ứng viên từ nhiều cơ sở tri thức không đồng nhất, sau đó gom chung lại để xếp hạng toàn cục trước khi chọn ra ngữ cảnh top-$k$ cho khâu tạo sinh. Mặc dù thiết kế này rất tự nhiên trong truy xuất miền mở, nhưng lại có vấn đề lớn đối với tác vụ tạo tài liệu doanh nghiệp vì nó ngầm giả định rằng bằng chứng từ các kho lưu trữ không đồng nhất có thể được so sánh công bằng bằng một hàm xếp hạng đơn lẻ.

Trên thực tế, các cơ sở tri thức doanh nghiệp khác biệt nhau rất lớn về:
- **Phạm vi (Scope)**,
- **Thẩm quyền (Authority)**,
- **Mật độ thông tin (Density)**,
- **Vai trò chức năng (Role)**.

Các chính sách tiền lệ, quy định pháp lý, tri thức khoa học, sổ tay hướng dẫn vận hành (playbooks), ghi chú phòng ban và thông số kỹ thuật cần phải được xem xét một cách khác nhau về mức độ ảnh hưởng của chúng trong quá trình soạn thảo. Việc xếp hạng toàn cục thường có xu hướng thiên vị các cơ sở tri thức có quy mô lớn hơn, mật độ từ khóa dày đặc hơn hoặc có sự tương đồng từ vựng cao hơn với câu truy vấn, đồng thời đè nén các kho lưu trữ nhỏ hơn nhưng lại mang tính thiết yếu. Kết quả cuối cùng thường là một cửa sổ ngữ cảnh bị thống trị bởi duy nhất một nhóm nguồn thông tin, trong khi những bằng chứng trọng yếu từ các phòng ban hay lĩnh vực khác lại bị bỏ sót hoàn toàn. Đối với bài toán tạo tài liệu doanh nghiệp, vấn đề do đó không chỉ nằm ở chất lượng xếp hạng ở cấp độ từng đoạn văn bản (chunk level), mà cốt lõi là sự cấu thành và phân bổ bằng chứng ở cấp độ toàn bộ tài liệu (evidence composition at the document level).

Trong bài báo này, chúng tôi đề xuất **W-RAG**, một khung truy xuất phục vụ tạo tài liệu doanh nghiệp giúp cải thiện cả việc lựa chọn bằng chứng lẫn cơ cấu phân bổ nguồn trên nhiều cơ sở tri thức. W-RAG hoạt động qua ba giai đoạn:
1. Sử dụng mô hình hóa chủ đề có định hướng bản thể học (ontology-guided topic modeling) để xác định các đoạn văn bản không chỉ tương đồng về mặt từ vựng với truy vấn mà còn phù hợp với các yêu cầu mang tính chủ đề của tài liệu mục tiêu.
2. Xếp hạng bằng chứng cục bộ bên trong từng cơ sở tri thức riêng biệt, thay vì gộp chung tất cả các ứng viên vào một bảng xếp hạng toàn cục duy nhất.
3. Sử dụng trọng số ở cấp độ nguồn (hoặc do người dùng định nghĩa) để điều tiết lượng ngữ cảnh được chọn từ mỗi cơ sở tri thức, sao cho tập hợp bằng chứng cuối cùng phản ánh đúng nhu cầu toàn diện của tài liệu thay vì bị chi phối bởi bất kỳ kho lưu trữ đơn lẻ nào.

Bên cạnh đó, một rào cản lớn trong việc nghiên cứu vấn đề này là sự thiếu vắng các bộ dữ liệu dành riêng cho tác vụ tạo tài liệu doanh nghiệp dựa trên truy xuất. Các bộ dữ liệu RAG hiện có chủ yếu đánh giá bài toán trả lời câu hỏi (QA) (Yang và cộng sự, 2018; Chen và cộng sự, 2024; Karpukhin và cộng sự, 2020; Kwiatkowski và cộng sự, 2019; Joshi và cộng sự, 2017; Rajpurkar và cộng sự, 2016; Bajaj và cộng sự, 2018; Trischler và cộng sự, 2017), tóm tắt văn bản, hoặc tạo văn bản đòi hỏi tri thức tổng quát (Berant và cộng sự, 2013), và không hề phản ánh được cơ cấu bằng chứng đa nguồn cần có trong hoạt động soạn thảo văn bản doanh nghiệp.

Để thu hẹp khoảng cách này, chúng tôi giới thiệu một **bộ dữ liệu mới** bao quát nhiều loại tài liệu doanh nghiệp, bao gồm:
- Chính sách doanh nghiệp (Policies),
- Tài liệu ra mắt sản phẩm (Product launch documents),
- Báo cáo thẩm định mua bán & sáp nhập (M&A due diligence reports),
- Đề xuất chương trình đào tạo học thuật (Academic program proposals).

Bộ chuẩn đối sánh này trải dài trên nhiều lĩnh vực công nghiệp: *Công nghệ AI & Truyền thông số (AI Technology & Digital Media)*, *Chăm sóc sức khỏe & Y tế từ xa (Healthcare & Telehealth)*, *Khí hậu & Tính bền vững (Climate & Sustainability)*, và *Tài chính (Finance)*. Bộ dữ liệu được thiết kế sao cho quá trình tạo sinh chỉ thành công khi hệ thống truy xuất và kết hợp được bằng chứng từ các cơ sở tri thức không đồng nhất, thay vì chỉ dựa vào một nguồn đơn lẻ có độ tương đồng ngữ nghĩa cao.

Sử dụng bộ dữ liệu này, chúng tôi đánh giá nhiều hệ thống dựa trên LLM nguồn mở và thương mại dưới cấu hình RAG tiêu chuẩn, và phát hiện ra rằng chúng thể hiện rất kém trong việc tạo tài liệu doanh nghiệp mặc dù văn bản đầu ra đọc rất trôi chảy. Phân tích của chúng tôi chỉ ra rằng tài liệu doanh nghiệp được tạo ra cực kỳ nhạy cảm với các cơ sở tri thức xuất hiện trong ngữ cảnh được truy xuất. Khi truy xuất chỉ được thực hiện thông qua xếp hạng toàn cục, nó thường dẫn đến các bản thảo không thể bao quát đầy đủ bộ yêu cầu được nêu ra bởi tài liệu doanh nghiệp cần soạn thảo.

### Các đóng góp chính của bài báo:
1. **Định hình bài toán (Problem formulation):** Chúng tôi xác định bài toán tạo tài liệu doanh nghiệp là một môi trường truy xuất mà ở đó các giả định RAG chuẩn không còn phù hợp với yêu cầu tác vụ, đồng thời chỉ rõ lỗi sai mang tính hệ thống của các kiến trúc hiện có: việc xếp hạng toàn cục trên các cơ sở tri thức không đồng nhất làm mất đi cơ cấu phân bổ nguồn cần thiết cho một tài liệu hoàn chỉnh.
2. **Phương pháp (Method):** Chúng tôi đề xuất khung truy xuất nhận biết nguồn W-RAG dành cho tác vụ tạo tài liệu doanh nghiệp, dựa trên kỹ thuật truy xuất cục bộ có gán trọng số kết hợp với sự định hướng từ bản thể học do chuyên gia xây dựng, nhằm nâng cao chất lượng chọn lọc bằng chứng liên miền và cấu trúc ngữ cảnh.
3. **Bộ dữ liệu và các phát hiện thực nghiệm (Dataset and findings):** Chúng tôi giới thiệu một bộ dữ liệu chuẩn mới cho tác vụ tạo tài liệu doanh nghiệp dựa trên truy xuất qua nhiều loại tài liệu và lĩnh vực, chứng minh rằng các thuật toán RAG truyền thống hoạt động dưới mức kỳ vọng trên bộ dữ liệu này, trong khi phương pháp truy xuất nhận biết nguồn của chúng tôi mang lại những cải tiến vượt bậc.

---

## 2 Các nghiên cứu liên quan (Related Works)

### Tạo sinh Tăng cường Truy xuất (Retrieval-Augmented Generation)
RAG đã trở thành nền tảng của mô hình ngôn ngữ dựa trên tri thức thông qua việc tích hợp truy xuất từ bên ngoài vào quá trình suy luận tạo sinh. Khung nghiên cứu RAG nguyên bản của Lewis và cộng sự (2021) cùng các mô hình kế tiếp như REALM (Guu và cộng sự, 2020; Izacard và Grave, 2021) và RETRO (Borgeaud và cộng sự, 2022) đã chứng minh rằng việc truy xuất bằng chứng văn bản trước khi tạo sinh giúp tăng độ chuẩn xác về dữ kiện và giảm thiểu hiện tượng ảo giác (hallucination). Các nghiên cứu gần đây hơn (Gao và cộng sự, 2024) tiếp tục mở rộng mô hình này bằng cách tối ưu hóa sự tương tác giữa bộ truy xuất và bộ tạo sinh thông qua cơ chế điều hướng bằng chứng thích ứng (adaptive evidence routing) (Zheng và cộng sự, 2024; Li và cộng sự, 2026a), và học tăng cường từ phản hồi của con người (RLHF) (Zhang và cộng sự, 2025; Li và cộng sự, 2025). Mặc dù đạt nhiều tiến bộ, phần lớn các quy trình RAG vẫn giả định kho ngữ liệu là đồng nhất và thuộc miền mở, dựa vào kỹ thuật truy xuất tương đồng dày đặc (dense) hoặc lai (hybrid) để chọn tài liệu hỗ trợ. Giả định này trở nên bất cập trong môi trường doanh nghiệp hoặc đa nguồn, nơi các kho tài liệu có sự khác biệt sâu sắc về thẩm quyền, cấu trúc và ngôn ngữ chuyên ngành (Bruckhaus, 2024; Arrieta và cộng sự, 2019).

### Truy xuất Đa nguồn và Có cấu trúc (Multi-Source and Structured Retrieval)
Một số lượng lớn các công trình đã nghiên cứu mở rộng truy xuất ra ngoài phạm vi nguồn đơn. Các phương pháp truy xuất đa bước (multi-hop) và đa mức độ phân giải (multi-granularity) (Yang và cộng sự, 2018; Tang và Yang, 2024; Lin và cộng sự, 2025) nhằm mục đích kết hợp bằng chứng từ nhiều tài liệu, tuy nhiên chúng thường lập chỉ mục trên các bộ dữ liệu đồng nhất, phục vụ tác vụ đơn lẻ như Wikipedia hoặc kho lưu trữ tin tức. Một số nghiên cứu về hệ thống RAG chuyên sâu theo chiều dọc hoặc đặc thù miền đã nỗ lực giải quyết tính không đồng nhất này, chẳng hạn trong các lĩnh vực:
- Pháp lý (Kabir và cộng sự, 2025; Reuter và cộng sự, 2025; Butler và Butler, 2026),
- Y sinh (Du và cộng sự, 2024; Ögdü và cộng sự, 2025; Matsumoto và cộng sự, 2024),
- Tài chính (George và cộng sự, 2025; Wang và cộng sự, 2025a,b).

Các công trình này giới thiệu quy trình truy xuất phân cấp hoặc dựa trên bản thể học để phản ánh tốt hơn ngữ nghĩa của miền. Dẫu vậy, các cách tiếp cận trên vẫn chỉ tập trung vào độ chính xác bên trong một ngữ liệu duy nhất có phạm vi chặt chẽ. Trong khi đó, các ứng dụng doanh nghiệp lại đòi hỏi phải tổng hợp thông tin phân tán trên nhiều cơ sở tri thức có vai trò bổ trợ lẫn nhau. Các đánh giá thực nghiệm từ các đợt triển khai công nghiệp thực tế (Bruckhaus, 2024; Jayarama Nettar, 2024) xác nhận rằng việc truy xuất top-$k$ toàn cục dẫn đến sự thiên lệch trong lựa chọn bằng chứng, khi các nguồn có dung lượng lớn hoặc chiếm ưu thế từ vựng sẽ lấn át các nguồn nhỏ hơn nhưng tối quan trọng.

### Bộ dữ liệu cho Quá trình Tạo sinh dựa trên Tri thức (Datasets for Knowledge-Grounded Generation)
Các bộ dữ liệu chuẩn đối sánh cho RAG thường nhắm tới bài toán trả lời câu hỏi (Karpukhin và cộng sự, 2020; Kwiatkowski và cộng sự, 2019; Joshi và cộng sự, 2017; Rajpurkar và cộng sự, 2016; Bajaj và cộng sự, 2018), xác minh sự kiện (Sorodoc và cộng sự, 2025), hoặc tóm tắt ngắn (Berant và cộng sự, 2013). Các bộ dữ liệu suy luận đa tài liệu như HotpotQA (Yang và cộng sự, 2018) khuyến khích việc liên kết chuỗi bằng chứng nhưng vẫn chỉ khai thác từ các miền tri thức đơn lẻ. Những bộ dữ liệu gần đây dành cho việc tạo văn bản thực tế dạng dài (Zhao và cộng sự, 2024), soạn thảo chính sách an toàn (Hadfield và Clark, 2026), và tuân thủ tổ chức (Jadad-Garcia và Jadad, 2024) cho thấy mối quan tâm mới mẻ nhưng vẫn thiếu sự bao phủ các nguồn tri thức không đồng nhất. Bộ dữ liệu mà chúng tôi giới thiệu mở rộng theo hướng này bằng cách chú trọng vào sự cấu thành bằng chứng liên miền, đóng vai trò là chuẩn đo lường để đánh giá các phương pháp RAG có gán trọng số truy xuất trong bối cảnh doanh nghiệp.

---

## 3 Phương pháp (Method)

### 3.1 Tổng quan (Overview)

W-RAG là một khung truy xuất nhận biết nguồn dành cho tác vụ tạo tài liệu doanh nghiệp dựa trên các cơ sở tri thức (Knowledge Bases - KBs) không đồng nhất. Chúng tôi sử dụng thuật ngữ **phân bổ ngữ cảnh (context allocation)** để chỉ sự phân phối ở cấp độ token của ngữ cảnh prompt cuối cùng giữa các cơ sở tri thức. Cho một truy vấn đầu vào hoặc tài liệu hạt giống $q$, tổng ngân sách token truy xuất $T_{total}$, và $M$ cơ sở tri thức, mục tiêu là xây dựng một cửa sổ ngữ cảnh bằng cách chọn các đoạn văn bản (chunks) từ mỗi cơ sở tri thức sao cho tổng số token được truy xuất không vượt quá $T_{total}$ trong khi các bằng chứng thu về vẫn duy trì tính phù hợp với nhiệm vụ soạn thảo mục tiêu.

Ở mức tổng quát, W-RAG thực hiện qua ba bước:
1. Trích xuất các chủ đề dựa trên bản thể học từ đầu vào và truy xuất các đoạn ứng viên từ từng cơ sở tri thức.
2. Ước lượng và đề xuất tỷ lệ ngữ cảnh cuối cùng nên được lấy từ mỗi cơ sở tri thức.
3. Chuyển đổi các ưu tiên nguồn này thành ngân sách token và xây dựng một cửa sổ ngữ cảnh đơn lẻ có sự cân bằng về nguồn để chuyển vào khâu tạo sinh.

```
                          ┌─────────────────────────────┐
                          │   Requirement Document (q)  │
                          └──────────────┬──────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
      [Ontology-Guided Extraction]                 [Semantic Embeddings]
                 │                                               │
                 ├───────────────────────────────────────────────┤
                 ▼                                               ▼
         Input Topics T={(ti, gi)}                  Dense Query Vector φ(q)
                 │                                               │
                 ├───────────────────────┬───────────────────────┤
                 │                       │                       │
                 ▼                       ▼                       ▼
           [KB1: Corporate]        [KB2: Scientific]       [KB3: Regulatory] ...
           Local Hybrid Score: R(c_jk) = f_sim(q, c_jk) + λ * f_ont(T, c_jk)
                 │                       │                       │
                 ▼                       ▼                       ▼
            Top-m Chunks C1         Top-m Chunks C2         Top-m Chunks C3
                 │                       │                       │
                 └───────────────────────┼───────────────────────┘
                                         │
                                         ▼
                      [Stage 2: Source Weight Estimation]
                      S^j_final = 0.7 S_topic + 0.1 S_doc + 0.2 S_cat
                      => Weights w_j (%) & Budgets T_j (tokens)
                                         │
                                         ▼
                   [Stage 3: Weighted Context Construction]
                      Select top chunks per KB up to T_j
                      Merge into Single Context Window (SCW)
                                         │
                                         ▼
                         Prompt P = {I_sys, q, SCW}
                                         │
                                         ▼
                          [Generator LLM (GPT-4.1)]
                                         │
                                         ▼
                           Generated Enterprise Document
```

### 3.2 Giai đoạn 1: Truy xuất Ứng viên Có hướng dẫn từ Bản thể học (Ontology-Guided Candidate Retrieval)

Trước hết, W-RAG trích xuất một biểu diễn chủ đề có cấu trúc từ đầu vào thông qua một LLM được định hướng bởi bản thể học của miền. Bản thể học (ontology) là một biểu diễn hình thức của các khái niệm cốt lõi trong một miền và các mối quan hệ giữa chúng. Khác với sơ đồ phân loại (taxonomy), bản thể học cho phép mô tả các mối quan hệ phi phân cấp, phong phú hơn giữa các thực thể, khái niệm và phân loại. Trong hệ thống của chúng tôi, bản thể học vừa được sử dụng để tổ chức các khái niệm chuyên ngành, vừa để ánh xạ văn bản tự do đầu vào thành một tập hợp chủ đề có cấu trúc nhằm dẫn dắt quá trình truy xuất. 

Ví dụ, trong tác vụ soạn thảo văn bản chính sách, các chủ đề được trích xuất như *bảo mật dữ liệu (data privacy)*, *kiểm soát truy cập (access control)*, và *báo cáo tuân thủ (compliance reporting)* có thể được ánh xạ vào các danh mục bản thể học như *an ninh (security)* và *quản trị (governance)*. Chi tiết về việc xây dựng bản thể học và các prompt trích xuất chủ đề được trình bày trong Phụ lục A.2.

Với đầu vào $q$, bộ trích xuất chủ đề tạo ra tập:
$$T = \{(t_i, g_i)\}_{i=1}^N$$
trong đó $t_i$ là cụm từ chủ đề được trích xuất và $g_i$ là danh mục bản thể học tương ứng của nó.

Mỗi cơ sở tri thức KB $j$ được lập chỉ mục như một tập hợp các đoạn văn bản (ví dụ: các phân đoạn ở cấp đoạn văn). Chúng tôi ký hiệu đoạn văn bản thứ $k$ từ KB $j$ là $c_{jk}$. Tại thời điểm lập chỉ mục, mỗi đoạn cũng được gắn với một tập hợp các chủ đề bản thể học đã trích xuất, ký hiệu là $M(c_{jk})$. W-RAG truy xuất các đoạn ứng viên từ mỗi KB và chấm điểm chúng bằng một hàm liên quan lai (hybrid relevance function):

$$R(c_{jk}) = f_{sim}(q, c_{jk}) + \lambda f_{ont}(T, c_{jk}) \tag{1}$$

trong đó:
- $f_{sim}$ đo độ tương đồng ngữ nghĩa giữa đầu vào và đoạn văn bản,
- $f_{ont}$ đo độ căn chỉnh chủ đề dựa trên bản thể học,
- $\lambda \ge 0$ kiểm soát mức độ ảnh hưởng tương đối của sự định hướng bản thể học.

Độ tương đồng ngữ nghĩa được tính bằng độ tương đồng cosine giữa các vector nhúng dày đặc (dense embeddings):

$$f_{sim}(q, c_{jk}) = \cos(\phi(q), \phi(c_{jk})) \tag{2}$$

với $\phi(\cdot)$ là hàm nhúng được sử dụng bởi bộ truy xuất.

Để tính độ căn chỉnh bản thể học, chúng tôi so sánh từng chủ đề đầu vào với các chủ đề bản thể học gắn với đoạn văn bản. Với một chủ đề đầu vào $t_i$ và một chủ đề đoạn văn bản đã lập chỉ mục $m \in M(c_{jk})$, chúng tôi sử dụng hàm điểm so khớp dựa trên luật:

$$s(t_i, m) = \begin{cases} 
1.0 & \text{nếu } t_i \text{ khớp chính xác với } m, \\ 
0.7 & \text{nếu một chuỗi chứa chuỗi còn lại (khớp một phần)}, \\ 
0.3 & \text{nếu chỉ khớp danh mục bản thể học}, \\ 
0 & \text{trường hợp còn lại.} 
\end{cases}$$

Các giá trị này được lựa chọn để thiết lập một thứ tự rõ ràng về mức độ khớp (chính xác > một phần > danh mục > không khớp), đồng thời giữ cho cơ chế chấm điểm đơn giản và dễ giải thích.

Do đó, điểm số bản thể học ở cấp đoạn văn bản là:

$$f_{ont}(T, c_{jk}) = \frac{1}{N} \sum_{i=1}^N \max_{m \in M(c_{jk})} s(t_i, m) \tag{3}$$

Như vậy, $f_{ont}$ là điểm so khớp tốt nhất trung bình giữa các chủ đề đầu vào và các chủ đề bản thể học được lập chỉ mục của đoạn văn bản. Trên thực tế, các đoạn văn bản đề cập đến nhiều chủ đề đầu vào hơn — hoặc đề cập đến chúng một cách cụ thể hơn — sẽ nhận được điểm bản thể học cao hơn.

Trong tất cả các thử nghiệm, chúng tôi đặt $\lambda = 0.5$. Giá trị này được lựa chọn trên tập phát triển độc lập (held-out development set) bằng cách quét $\lambda \in [0, 1]$ và chọn giá trị giúp cải thiện mức độ thỏa mãn yêu cầu trung bình mà không làm suy giảm độ liên quan của ngữ cảnh. Giá trị này được giữ cố định trên toàn bộ các lĩnh vực và loại tài liệu.

Với mỗi KB $j$, chúng tôi sắp xếp các đoạn văn bản theo $R(c_{jk})$ và giữ lại top-$m$ ứng viên hàng đầu:

$$C_j = \{c_{j1}, c_{j2}, \dots, c_{jm}\} \tag{4}$$

trong đó $C_j$ biểu thị tập hợp $m$ đoạn văn bản ứng viên hàng đầu được truy xuất từ KB $j$ theo điểm số lai ở Công thức 1. Các tập ứng viên cục bộ theo từng KB này sau đó được sử dụng cho bước gán trọng số nguồn và xây dựng ngữ cảnh cuối cùng.

---

### 3.3 Giai đoạn 2: Ước lượng Trọng số Nguồn (Stage 2: Source Weight Estimation)

Giai đoạn 1 đã xác định các ứng viên có liên quan về mặt chủ đề, nhưng chưa xác định mỗi KB nên đóng góp bao nhiêu vào prompt cuối cùng. Chiến lược top-$k$ toàn cục thông thường sẽ chỉ đơn giản gộp tất cả các ứng viên vào một bảng xếp hạng chung duy nhất, điều này có thể làm cho ngữ cảnh cuối cùng bị tập trung quá mức vào một nguồn duy nhất. Ngược lại, W-RAG ước lượng một trọng số nguồn cho từng KB trước khi xây dựng ngữ cảnh cuối cùng.

Đối với mỗi KB $j$, chúng tôi duy trì một chỉ mục chủ đề cấp KB ký hiệu là $M_j$, có được bằng cách tổng hợp các chủ đề bản thể học gắn liền với các tài liệu trong KB đó. Trọng số nguồn được tính toán theo thời gian thực bằng cách so sánh tập chủ đề đầu vào $T$ với các chỉ mục chủ đề của KB.

Tín hiệu nguồn chính là **mức độ trùng lặp chủ đề (topical overlap)**:

$$S^j_{topic} = \frac{1}{N} \sum_{i=1}^N \max_{m \in M_j} s(t_i, m) \tag{5}$$

trong đó hàm so khớp chính xác / một phần / chỉ danh mục $s(\cdot, \cdot)$ được tái sử dụng như ở Giai đoạn 1. Như vậy, $S^j_{topic} \in [0, 1]$ đo lường mức độ KB $j$ khớp với các chủ đề đầu vào về tổng thể.

Chúng tôi kết hợp $S^j_{topic}$ với hai số hạng phụ trợ. Thứ nhất là **tiền nghiệm yếu về mức độ sẵn có của tài liệu (weak document-availability prior)**:

$$S^j_{doc} = \min\left(1, \frac{N^j_{doc}}{100} \times 0.5\right)$$

trong đó $N^j_{doc}$ là số lượng tài liệu đã được lập chỉ mục trong KB $j$. Số hạng này mang lại một mức tăng điểm nhỏ cho các KB có độ bao phủ hỗ trợ rộng hơn, đồng thời ngăn không cho quy mô tài liệu thuần túy thống trị điểm số. 

Thứ hai là **điểm thưởng danh mục (category bonus)**:

$$S^j_{cat} = \begin{cases} 
0.2 & \text{nếu KB } j \text{ khớp với ít nhất 1 chủ đề đầu vào}, \\ 
0 & \text{trường hợp còn lại.} 
\end{cases}$$

Số hạng này tưởng thưởng cho sự tương thích thô về mặt lĩnh vực ngay cả khi sự trùng lặp chủ đề chính xác bị hạn chế.

Điểm số nguồn cuối cùng cho KB $j$ là:

$$S^j_{final} = 0.7 S^j_{topic} + 0.1 S^j_{doc} + 0.2 S^j_{cat} \tag{6}$$

Các hệ số phản ánh mức độ ưu tiên dự kiến của ba tín hiệu: sự trùng lặp chủ đề là động lực chính, sự tương thích danh mục cung cấp hỗ trợ cấp miền, và mức độ sẵn có của tài liệu chỉ đóng vai trò là một tiền nghiệm yếu. Chúng tôi cố định các hệ số này sau khi tinh chỉnh sơ bộ ở giai đoạn phát triển và giữ nguyên chúng trong tất cả các thực nghiệm.

Các điểm số thu được được chuẩn hóa thành tỷ lệ phần trăm đóng góp của KB (được gọi là các **trọng số**):

$$w_j = \frac{S^j_{final}}{\sum_{k=1}^M S^k_{final}} \times 100, \quad \sum_{j=1}^M w_j = 100 \tag{7}$$

Quy trình này được tính toán hoàn toàn theo thời gian thực: bộ đề xuất không dựa vào các cấu hình ưu tiên KB tĩnh được tính toán từ trước, mà so sánh trực tiếp các chủ đề của đầu vào hiện tại với các chỉ mục chủ đề hiện hành của các KB. Khi các tài liệu mới được bổ sung vào một KB, chúng chỉ ảnh hưởng đến các đề xuất tương lai sau khi quá trình tái lập chỉ mục cập nhật chỉ mục chủ đề và số lượng tài liệu tương ứng.

---

### 3.4 Giai đoạn 3: Xây dựng Ngữ cảnh có Trọng số (Stage 3: Weighted Context Construction)

Do mô hình tạo sinh có một cửa sổ ngữ cảnh cố định, các trọng số KB trong Công thức 7 cần được chuyển đổi thành ngân sách token. Đối với mỗi KB $j$, chúng tôi định nghĩa:

$$T_j = \frac{w_j}{100} T_{total}, \quad \sum_{j=1}^M T_j = T_{total} \tag{8}$$

Trọng số được định nghĩa là tỷ lệ phân bổ các token ngữ cảnh giữa các cơ sở tri thức dựa trên độ liên quan ước tính của chúng đối với câu truy vấn. Các ngân sách này quy định chính xác mỗi KB được phép đóng góp tối đa bao nhiêu token vào ngữ cảnh prompt cuối cùng.

Sau đó, W-RAG chọn các đoạn văn bản có thứ hạng cao nhất từ từng tập ứng viên được xếp hạng cục bộ $C_j$ cho đến khi ngân sách tương ứng $T_j$ cạn kiệt. Các đoạn được chọn được hợp nhất thành một **Cửa sổ Ngữ cảnh Đơn lẻ (Single Context Window - SCW)**, và mỗi đoạn được gắn chú thích rõ cơ sở tri thức nguồn của nó để duy trì xuất xứ (provenance). 

Bước này chính là cơ chế thực thi các ràng buộc ở cấp độ nguồn lên cửa sổ ngữ cảnh cuối cùng — điều mà các quy trình RAG tiêu chuẩn hoàn toàn không kiểm soát được. Bằng cách này, W-RAG chuyển đổi các ước tính liên quan về nguồn thành một ngữ cảnh tạo sinh có thành phần phản ánh nhu cầu thông tin thực sự của tài liệu mục tiêu, thay vì bị chi phối bởi một nguồn thông tin đơn lẻ.

Prompt cuối cùng được định dạng như sau:

$$P = \{I_{sys}, q, SCW\}$$

trong đó $I_{sys}$ biểu thị các chỉ dẫn hệ thống (system instructions). Prompt này sau đó được truyền tới LLM để thực hiện tạo tài liệu doanh nghiệp.

---

## 4 Bộ dữ liệu (Dataset)

Việc đánh giá RAG cho tác vụ tạo tài liệu cấp doanh nghiệp đặt ra một thách thức đặc biệt, bởi hiện chưa có bộ dữ liệu chuẩn hóa nào tồn tại cho việc tổng hợp văn bản dạng dài, có tính chất dẫn dắt bởi yêu cầu (requirement-driven). Để lấp đầy khoảng trống này, chúng tôi giới thiệu một bộ dữ liệu mới được thiết kế để đánh giá các kỹ thuật RAG tạo tài liệu doanh nghiệp dưới điều kiện các cơ sở tri thức không đồng nhất.

Mỗi mẫu dữ liệu bao gồm một **tài liệu yêu cầu đầu vào (input requirement document)** quy định chi tiết các ràng buộc và mục tiêu để tạo ra tài liệu đích. Một ví dụ mẫu về tài liệu yêu cầu đầu vào được thể hiện trong Phụ lục A.1.

Bộ dữ liệu bao gồm **100 tài liệu yêu cầu đầu vào**. Mỗi tài liệu yêu cầu được xây dựng thủ công và thuộc về một trong bốn loại tài liệu doanh nghiệp:
1. **Chính sách (Policies)**,
2. **Tài liệu ra mắt sản phẩm (Product launch documents)**,
3. **Báo cáo thẩm định mua bán & sáp nhập (Merger and acquisitions due diligence documents)**,
4. **Đề xuất chương trình học thuật (Academic program documents)**.

Các loại tài liệu này được lựa chọn vì chúng đại diện cho các yêu cầu doanh nghiệp rõ rệt với nhu cầu bằng chứng, cấu trúc hùng biện (rhetorical structures) và mục đích ra quyết định rất khác nhau. Chi tiết về cách tạo lập và biên soạn các tài liệu đầu vào có thể xem trong Phụ lục A.1.

Xuyên suốt các loại tài liệu này, bộ dữ liệu bao quát bốn chủ đề nghiệp vụ cấp cao:
- **Công nghệ AI & Truyền thông số (AI Technology & Digital Media)**,
- **Chăm sóc sức khỏe & Y tế từ xa (Healthcare & Telehealth)**,
- **Khí hậu & Tính bền vững (Climate & Sustainability)**,
- **Tài chính (Finance)**.

Các chủ đề này được lựa chọn nhằm đảm bảo rằng chuẩn đối sánh phản ánh chân thực các tình huống doanh nghiệp trong thực tế, nơi việc tạo tài liệu phải tích hợp đồng thời thông tin kinh doanh, kỹ thuật, pháp lý và thị trường.

Để phục vụ truy xuất, chúng tôi xây dựng **bốn cơ sở tri thức (KB) không đồng nhất**, mỗi KB chứa xấp xỉ 500 tài liệu được thu thập công khai từ các tài nguyên web mở:
1. **KB1 (Doanh nghiệp - Corporate):** Các hồ sơ pháp lý công ty (SEC filings), báo cáo công ty, tài liệu vận hành và tài liệu quản trị (U.S. Securities and Exchange Commission, 2026a; Alpha Vantage, 2026).
2. **KB2 (Khoa học - Scientific):** Các bài báo tạp chí có bình duyệt, sách trắng kỹ thuật và tóm tắt nghiên cứu (arXiv, 2026; National Center for Biotechnology Information, 2026).
3. **KB3 (Pháp lý/Quy chuẩn - Regulatory):** Văn bản luật, hướng dẫn tuân thủ và khung quy định pháp lý (U.S. Food and Drug Administration, 2026; U.S. Securities and Exchange Commission, 2026b).
4. **KB4 (Thị trường & Tin tức - Market & News):** Khảo sát thị trường, báo cáo ngành và bài báo tin tức (Forbes Media LLC, 2026).

Mục tiêu của việc sử dụng các cơ sở tri thức này là kiểm tra năng lực của các hệ thống RAG trong việc tập hợp một ngữ cảnh phản ánh đầy đủ các vai trò chức năng khác nhau của bằng chứng doanh nghiệp. Chẳng hạn, một tài liệu ra mắt sản phẩm AI trong ngành y tế có thể đòi hỏi đồng thời tiền lệ doanh nghiệp, kiểm chứng khoa học, yêu cầu pháp lý quản lý và định vị thị trường.

---

## 5 Thực nghiệm (Experiments)

### 5.1 Các đường cơ sở & Thước đo đánh giá (Baselines & Metrics)

#### Các đường cơ sở (Baselines)
Chúng tôi so sánh W-RAG với các quy trình RAG đại diện sau:
1. **Vanilla RAG:** Quy trình RAG tiêu chuẩn (Lewis và cộng sự, 2021) thực hiện truy xuất ngữ nghĩa dày đặc trên tất cả các cơ sở tri thức hiện có, sau đó xếp hạng toàn cục các tài liệu được truy xuất giữa các KB. Các đoạn văn bản xếp hạng cao nhất sau đó được cung cấp cho bộ tạo sinh mà không có bất kỳ mô hình hóa rõ ràng nào về cấu trúc miền hoặc ưu tiên cấp nguồn.
2. **OG-RAG:** Đường cơ sở thứ hai tăng cường truy xuất bằng mô hình hóa chủ đề có định hướng bản thể học (Sharma và cộng sự, 2025). Đối với mỗi miền trong bốn miền, một bản thể học được tuyển chọn thủ công để bao hàm các khái niệm, thực thể và quan hệ chủ đề chính liên quan đến việc soạn thảo tài liệu trong miền đó. Các tài liệu truy xuất trước tiên được lọc và tổ chức bằng biểu diễn chủ đề định hướng bản thể học này, sau đó các đoạn văn bản được xếp hạng toàn cục trên tất cả các KB rồi chuyển tới bộ tạo sinh. OG-RAG đã được chứng minh là đạt độ bao phủ sự kiện chính xác và độ đúng đắn của phản hồi cao hơn so với các phương pháp RAG dựa trên ma trận (như RAPTOR (Sarthi và cộng sự, 2024)) và dựa trên đồ thị (như GraphRAG (Edge và cộng sự, 2025)), tạo thành một đường cơ sở rất mạnh.

#### Bản thể học (Ontologies)
Chúng tôi xây dựng một bản thể học cho mỗi cặp **miền – loại tài liệu**, tạo ra tổng cộng **16 bản thể học**. Mỗi bản thể học được xây dựng qua quy trình bán tự động: phiên bản ban đầu được sinh tự động rồi được tinh chỉnh thủ công và kiểm chứng bởi các chuyên gia trong ngành. Các bản thể học này hỗ trợ trích xuất chủ đề và truy xuất theo định hướng bản thể học trong cả OG-RAG và W-RAG.

#### Thước đo đánh giá (Evaluation Metrics)
Do bản chất đa chiều của việc tạo tài liệu doanh nghiệp, chúng tôi áp dụng các thước đo đánh giá bổ trợ sau:

**(1) Mức độ Thỏa mãn Yêu cầu (Requirement Satisfaction):**  
Được định nghĩa là mức độ mà tài liệu được tạo ra thỏa mãn các yêu cầu thiết yếu tối thiểu được nêu trong tài liệu đầu vào. Không giống như các chuẩn QA (nơi độ đúng đắn có thể được đối chiếu với một câu trả lời tham chiếu duy nhất), tài liệu doanh nghiệp được đánh giá tốt nhất dựa trên một danh mục kiểm tra yêu cầu (requirement checklist) chỉ định các yếu tố bắt buộc phải xuất hiện trong một bản thảo hợp lệ.

Đối với từng loại tài liệu (chính sách, thông tin ra mắt sản phẩm, tóm tắt thẩm định M&A...), chúng tôi xây dựng một danh sách kiểm tra các yêu cầu thiết yếu với sự tham vấn từ các chuyên gia trong ngành thường xuyên soạn thảo các tài liệu này; mỗi danh sách chứa khoảng **12 yêu cầu cốt lõi**. Mỗi yêu cầu được chấm theo thang thứ bậc 2 điểm:
- `0`: Không thỏa mãn (Not satisfied),
- `1`: Thỏa mãn một phần / nêu chưa đầy đủ chi tiết (Partially satisfied / insufficiently specified),
- `2`: Hoàn toàn thỏa mãn (Fully satisfied).

Thang điểm này dẫn đến điểm tối đa là 24 điểm cho mỗi tài liệu, sau đó được chuẩn hóa về thang phần trăm. Chúng tôi bán tự động hóa quá trình chấm điểm bằng cách sử dụng **LLM đóng vai trò giám khảo (LLM-as-a-judge)** được cung cấp:
1. Tài liệu yêu cầu đầu vào hoặc câu lệnh soạn thảo,
2. Văn bản đầu ra được tạo ra,
3. Danh mục kiểm tra yêu cầu cho loại tài liệu tương ứng.

Giám khảo được hướng dẫn gán điểm cho từng mục trong danh sách kiểm tra. Để nâng cao độ tin cậy, các điểm số này sau đó được các chuyên gia thẩm định thủ công trước khi đưa vào phân tích. Hướng dẫn chuẩn dành cho chuyên gia để kiểm chứng việc chấm điểm được trình bày trong Phụ lục A.7.

**(2) Độ phù hợp Ngữ cảnh (Context Relevancy):**  
Đo lường tỷ lệ các đoạn văn bản được truy xuất thực sự có liên quan đến nhiệm vụ soạn thảo đầu vào. Cho một tập hợp $N$ đoạn văn bản được truy xuất $\{p_i\}_{i=1}^N$, một LLM giám khảo sẽ dán nhãn từng đoạn là có liên quan ($z_i = 1$) hoặc không liên quan ($z_i = 0$) đối với tài liệu đầu vào và mục tiêu soạn thảo:

$$CTS = \frac{1}{N} \sum_{i=1}^N z_i$$

Tương tự như tính phù hợp của câu trả lời, các đánh giá bằng LLM đều được xác thực thủ công để đảm bảo tính nhất quán của điểm số. Việc sử dụng độ phù hợp ngữ cảnh như một thước đo giúp tách biệt chất lượng truy xuất khỏi chất lượng tạo sinh: một hệ thống có thể tạo ra văn bản trôi chảy, nhưng truy xuất kém sẽ giới hạn độ chính xác về sự kiện và việc neo giữ nguồn.

**(3) Độ trung thực Cơ sở Tri thức Thực nhận (Realized Knowledge Base Fidelity):**  
Mục tiêu của thước đo này là ước tính cơ sở tri thức nào có nhiều khả năng nhất hỗ trợ các phần khác nhau của tài liệu được tạo ra, thay vì chỉ phát hiện việc sao chép nguyên văn các đoạn được truy xuất. Vì các LLM hiện đại thường tổng hợp và diễn đạt lại (paraphrase) bằng chứng được truy xuất, việc quy gán (attribution) được thực hiện bằng cách đo độ tương đồng ngữ nghĩa trong không gian vector nhúng thay vì so khớp từ vựng. Do đó, thước đo phản ánh mức độ neo giữ phân phối trong nguồn tri thức:

Giả sử tài liệu được tạo ra được phân đoạn thành các đơn vị cấp câu:
$$S = \{s_1, s_2, \dots, s_T\}$$

Với mỗi đoạn $s_t$, chúng tôi tính vector nhúng của nó và so sánh với vector nhúng của toàn bộ các đoạn tài liệu được truy xuất. Đoạn có độ tương đồng cosine cao nhất được chọn:

$$c^*(s_t) = \arg\max_{c \in C} \cos(\phi(s_t), \phi(c))$$

trong đó $\phi(\cdot)$ là hàm nhúng và $C$ là tập hợp các đoạn được truy xuất.

Nếu độ tương đồng cao nhất rơi xuống dưới ngưỡng $\tau = 0.6$ (Es và cộng sự, 2024), câu đó được dán nhãn là **tổng hợp (`synthesized`)**, cho thấy nó không thể được neo giữ một cách tin cậy vào bất kỳ nguồn nào được truy xuất. Điều này cho phép thước đo tính toán tường minh nội dung được tạo ra từ khả năng tự suy diễn của mô hình thay vì từ sự hỗ trợ trực tiếp của nguồn. Mỗi phân đoạn hợp lệ sau đó được gán cho KB của đoạn văn bản khớp với nó.

Gọi $w_i$ là tổng số từ trong các câu được quy gán cho KB $i$, và $w_{synth}$ là tổng số từ được dán nhãn là tổng hợp. Phân phối thực nhận đối với mức độ sử dụng KB là:

$$Q_i = \frac{w_i}{\sum_{j=1}^K w_j + w_{synth}} \quad \text{với } i = 1, \dots, K$$
$$Q_{synth} = \frac{w_{synth}}{\sum_{j=1}^K w_j + w_{synth}}$$

Điều này mang lại một ước tính chi tiết về việc tài liệu được tạo ra thực sự được hỗ trợ bao nhiêu bởi từng KB.

**(4) Độ phân kỳ Jensen–Shannon (Jensen–Shannon Divergence - JSD):**  
Để định lượng mức độ trùng khớp giữa việc sử dụng KB thực nhận với các trọng số được quy định ban đầu, chúng tôi tính Độ phân kỳ JS (JSD) (Li và cộng sự, 2026b) giữa hai phân phối $P'$ và $Q'$:

$$P' = [P_1, \dots, P_K, 0]$$
$$Q' = [Q_1, \dots, Q_K, Q_{synth}]$$

trong đó chiều bổ sung đại diện cho nội dung tự tổng hợp ($P_K = 0$). JSD được định nghĩa là:

$$JSD(P' \parallel Q') = \frac{1}{2} KL(P' \parallel M) + \frac{1}{2} KL(Q' \parallel M), \quad \text{với } M = \frac{1}{2}(P' + Q')$$

với $KL$ là độ phân kỳ Kullback–Leibler. Bị chặn trong khoảng $[0, \ln 2]$, ta có điểm số độ trung thực (Fidelity) trong $[0, 1]$:

$$\text{Fidelity} = 1 - \frac{JSD(P' \parallel Q')}{\ln 2}$$

trong đó giá trị 1 biểu thị độ trung thực nguồn hoàn hảo và 0 biểu thị sự phân kỳ tối đa.

#### Mô hình Ngôn ngữ Lớn (Large Language Models)
Để đảm bảo rằng các khác biệt quan sát được là do cơ chế truy xuất chứ không phải do khâu tạo sinh, tất cả các quy trình truy xuất - tạo sinh đều được chạy bằng cùng một mô hình nền tảng: **GPT-4.1** (OpenAI, 2025), truy cập qua Azure AI Search (Microsoft Corporation, 2026).

Đối với việc đánh giá tự động Mức độ Thỏa mãn Yêu cầu và Độ phù hợp Ngữ cảnh, chúng tôi sử dụng **Claude Sonnet 4.6** (Anthropic, 2026) làm LLM giám khảo; các đánh giá này đều được chuyên gia thẩm định thủ công trước khi phân tích. Toàn bộ các câu lệnh (prompts) cho LLM được cung cấp trong Phụ lục A.3.

---

### 5.2 Kết quả (Results)

#### Chất lượng Tài liệu Tạo sinh và Hiệu quả Truy xuất
Trước khi phân tích hiệu năng, chúng tôi lưu ý rằng LLM giám khảo dùng để chấm điểm đã được xác thực thủ công và cho thấy sự đồng thuận cao với kiểm chứng của con người, với độ chính xác **91%** đối với Mức độ Thỏa mãn Yêu cầu và **86%** đối với Độ phù hợp Ngữ cảnh. Điều này khẳng định việc chấm điểm tự động đủ độ tin cậy cho đánh giá so sánh.

Bảng 1 báo cáo hai thước đo bổ trợ: Mức độ Thỏa mãn Yêu cầu (Requirement Satisfaction - đo lường tỷ lệ nội dung yêu cầu được bao phủ trong tài liệu) và Độ phù hợp Ngữ cảnh (Context Relevancy - đo lường tỷ lệ bằng chứng truy xuất thực sự liên quan đến tác vụ).

#### Bảng 1: So sánh các thuật toán RAG giữa các lĩnh vực theo Mức độ Thỏa mãn Yêu cầu và Độ phù hợp Ngữ cảnh

| Loại Tài liệu | Thuật toán RAG | Công nghệ AI & Truyền thông số<br>Thỏa mãn YC (%) \| Ngữ cảnh (%) | Khí hậu & Tính bền vững<br>Thỏa mãn YC (%) \| Ngữ cảnh (%) | Chăm sóc sức khỏe & Y tế từ xa<br>Thỏa mãn YC (%) \| Ngữ cảnh (%) | Tài chính<br>Thỏa mãn YC (%) \| Ngữ cảnh (%) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Chính sách (Policies)** | Vanilla RAG | 25 \| 57 | 38 \| 32 | 25 \| 30 | 34 \| 41 |
| | OG-RAG | 34 \| 73 | 68 \| 72 | 35 \| 40 | 51 \| 48 |
| | **W-RAG** | **78 \| 76** | **76 \| 70** | **55 \| 70** | **60 \| 79** |
| **Ra mắt Sản phẩm (Product Launch)** | Vanilla RAG | 34 \| 45 | 35 \| 40 | 22 \| 28 | 37 \| 40 |
| | OG-RAG | 38 \| 74 | 56 \| 50 | 33 \| 45 | 5 \| 52 |
| | **W-RAG** | **58 \| 78** | **74 \| 68** | **63 \| 71** | **61 \| 79** |
| **Mua bán & Sáp nhập (M&A)** | Vanilla RAG | 38 \| 52 | 42 \| 38 | 20 \| 32 | 41 \| 45 |
| | OG-RAG | 39 \| 70 | 54 \| 49 | 32 \| 41 | 5 \| 56 |
| | **W-RAG** | **65 \| 78** | **83 \| 87** | **62 \| 68** | **73 \| 82** |
| **Chương trình Học thuật (Academic Programs)** | Vanilla RAG | 28 \| 31 | 40 \| 45 | 27 \| 22 | 34 \| 40 |
| | OG-RAG | 34 \| 64 | 40 \| 44 | 29 \| 42 | 45 \| 52 |
| | **W-RAG** | **72 \| 81** | **78 \| 82** | **67 \| 74** | **63 \| 79** |

*Ghi chú: Trong bản in gốc ở ô Finance - Academic Programs của W-RAG hiển thị 63 và 7 (lỗi in ấn cho 79, như được làm rõ trong nội dung thảo luận văn bản).*

Trên tất cả 16 trường hợp thử nghiệm, W-RAG mang lại những bước tiến vượt trội:
- So với OG-RAG, W-RAG giúp tăng Mức độ Thỏa mãn Yêu cầu thêm **58.1%** và Độ phù hợp Ngữ cảnh thêm **39.1%**.
- So với Vanilla RAG, mức tăng trưởng tương ứng là **109.2%** và **96.4%**.

Về mặt ý nghĩa thực tiễn, điều này có nghĩa là W-RAG không chỉ truy xuất được bằng chứng hỗ trợ tốt hơn, mà còn chuyển hóa những bằng chứng đó thành các bản thảo đáp ứng được nhiều hơn đáng kể các yếu tố bắt buộc được nêu ra trong tài liệu yêu cầu.

Một quy luật trọng yếu được phát hiện là: **chất lượng truy xuất đơn thuần không đảm bảo chất lượng tài liệu tốt hơn**. Ví dụ, trong tài liệu ra mắt sản phẩm thuộc miền Công nghệ AI & Truyền thông số, OG-RAG cải thiện Độ phù hợp Ngữ cảnh lên tới 64.4% so với Vanilla RAG, nhưng Mức độ Thỏa mãn Yêu cầu chỉ tăng vỏn vẹn 11.8%. W-RAG đã thu hẹp hoàn toàn khoảng cách này, chứng minh rằng việc tạo tài liệu doanh nghiệp không chỉ phụ thuộc vào việc lấy về các đoạn văn bản có liên quan, mà còn đòi hỏi phải cấu thành bằng chứng từ nhiều KB theo một phương thức nhận biết nguồn. Phụ lục A.5 trình bày phân tích chi tiết hơn về các kết quả này.

#### Ảnh hưởng của Cơ sở Tri thức & Độ trung thực Nguồn (Knowledge Base Influence & Source Fidelity)
Hình 1 thể hiện sự so sánh theo từng lĩnh vực giữa phân phối nguồn được quy định tại thời điểm truy xuất và mức độ quy gán KB thực nhận trong tài liệu được tạo sinh. Mức độ mà phân phối KB thực nhận bám sát phân phối KB đầu vào đóng vai trò là một chỉ báo trực quan trực tiếp về độ trung thực nguồn: khi trọng số của một KB được chỉ định cao hơn trước khi truy xuất (tức là nhiều thông tin được lấy từ KB đó hơn các nguồn khác), tài liệu được tạo ra sẽ phản ánh chính xác cấu trúc nguồn dự định này. Sự ăn khớp chặt chẽ giữa phân phối đầu vào và thực nhận trên tất cả các miền cho thấy hệ thống duy trì được mối liên kết mạnh mẽ giữa việc gán trọng số nguồn lúc truy xuất và nội dung tài liệu kết quả.

Phù hợp với xu hướng trực quan, điểm số phân kỳ JS trung bình trên các miền dao động từ **0.60 đến 0.74**, cho thấy sự đồng thuận từ trung bình đến rất mạnh giữa việc sử dụng KB trên lý thuyết và trên thực tế. Điều này khẳng định rằng quy trình tạo sinh duy trì đúng tỷ lệ kết hợp mong muốn giữa tri thức doanh nghiệp, khoa học, pháp lý và thị trường khi xây dựng tài liệu. Để vượt ra ngoài các bằng chứng trực quan, Mục A.5.1 trình bày một nghiên cứu có kiểm soát về việc ghi đè trọng số, trong đó cơ cấu phối hợp KB được can thiệp thủ công.

#### Tình huống Ứng dụng Thực tế: Soạn thảo Hồ sơ Đề xuất Doanh nghiệp (Corporate Proposal Drafting)
Một trường hợp ứng dụng doanh nghiệp thúc đẩy nghiên cứu của chúng tôi là việc soạn thảo hồ sơ đề xuất (corporate proposal drafting), nơi các giám đốc đề xuất, kiến trúc sư giải pháp và nhóm phát triển kinh doanh chuẩn bị phản hồi cho các yêu cầu chào thầu (RFP) phức tạp từ các cơ quan dân sự và Bộ Quốc phòng Hoa Kỳ (DoD). Các tài liệu này có cấu trúc rất chặt chẽ và phụ thuộc nặng nề vào việc truy xuất bằng chứng từ các cơ sở tri thức nội bộ không đồng nhất, bao gồm các đề xuất trong quá khứ, hợp đồng cũ, hồ sơ năng lực, tài liệu tuân thủ, bảng giá và tài liệu riêng của từng cơ quan.

Trong một quy trình làm việc soạn thảo có hỗ trợ truy xuất nội bộ được áp dụng từ năm 2025–2026, các nhóm đã báo cáo những lợi ích năng suất to lớn, cho thấy việc soạn thảo đề xuất là một môi trường thử nghiệm thực tế quan trọng cho bài toán tạo tài liệu đa cơ sở tri thức. Chúng tôi cung cấp mô tả nghiên cứu điển hình chi tiết trong Phụ lục A.6.

---

## 6 Kết luận (Conclusion)

Công trình này giới thiệu W-RAG, một khung truy xuất được thiết kế riêng cho các tác vụ tạo tài liệu doanh nghiệp đòi hỏi bằng chứng từ nhiều cơ sở tri thức không đồng nhất. Các thực nghiệm của chúng tôi chứng minh rằng việc xếp hạng tương đồng toàn cục có thể dẫn đến việc cấu thành ngữ cảnh mất cân bằng, trong đó các nguồn vượt trội về kích thước hoặc từ vựng sẽ làm lu mờ các nguồn khác vốn rất cần thiết để thỏa mãn các yêu cầu phức tạp.

Bằng cách kết hợp trích xuất chủ đề định hướng bản thể học với phân bổ ngữ cảnh nhận biết nguồn, W-RAG cải thiện vượt bậc cả mức độ thỏa mãn yêu cầu lẫn tính liên quan của ngữ cảnh trên bộ dữ liệu thử nghiệm. Những kết quả này cho thấy rằng, trong môi trường doanh nghiệp đa nguồn, việc quản lý một cách tường minh cách thức ngữ cảnh truy xuất được phân phối giữa các cơ sở tri thức có thể dẫn đến việc tạo ra các tài liệu chuẩn xác, đầy đủ và trung thực hơn.

---

## 7 Hạn chế và Mối đe dọa đối với tính hợp lệ (Limitations and Threats to Validity)

- **Phạm vi Bộ dữ liệu và Tác vụ (Dataset and Task Scope):** Đánh giá của chúng tôi được thực hiện trên một bộ dữ liệu kiểu doanh nghiệp tương đối nhỏ và mang tính tổng hợp mô phỏng. Mặc dù được thiết kế để phản ánh các tình huống tạo tài liệu đa nguồn thực tế, bộ dữ liệu có thể chưa nắm bắt trọn vẹn sự đa dạng, quy mô khổng lồ và độ nhiễu trong môi trường doanh nghiệp thực tế.
- **Thước đo Đánh giá (Evaluation Metrics):** Chúng tôi đánh giá kết quả đầu ra bằng các thước đo đặc thù tác vụ như mức độ thỏa mãn yêu cầu và độ phù hợp ngữ cảnh, vốn chứa đựng một phần tính chủ quan trong định nghĩa và đo lường. Các thước đo này có thể chưa bao hàm hết mọi khía cạnh của chất lượng tài liệu, chẳng hạn như độ đúng đắn tuyệt đối về sự kiện, tính mạch lạc văn phong, hay khả năng ứng dụng thực tế trong các luồng công việc hạ nguồn.
- **So sánh với Đường cơ sở (Baseline Comparisons):** Các so sánh của chúng tôi bị giới hạn ở các đường cơ sở RAG tiêu chuẩn. Chúng tôi chưa đưa vào các chiến lược truy xuất được tinh chỉnh chuyên sâu, vốn có thể làm giảm bớt khoảng cách hiệu năng quan sát được.
- **Tính Tổng quát của Cách tiếp cận (Generality of the Approach):** W-RAG được đánh giá chủ yếu trong bối cảnh tạo tài liệu doanh nghiệp với các nguồn tri thức có cấu trúc. Hiệu quả của nó trong các miền khác — chẳng hạn như trả lời câu hỏi miền mở hoặc các môi trường truy xuất ít cấu trúc hơn — vẫn cần được kiểm chứng thêm trong tương lai.

---

## Tài liệu tham khảo (References)

- Alpha Vantage. 2026. Alpha Vantage. `https://www.alphavantage.co/`.
- Anthropic. 2026. Claude Sonnet 4.6 Model Overview. `https://www.anthropic.com/claude/sonnet`.
- Alejandro Barredo Arrieta, Natalia Díaz-Rodríguez, Javier Del Ser, Adrien Bennetot, Siham Tabik, Alberto Barbado, Salvador García, Sergio Gil-López, Daniel Molina, Richard Benjamins, Raja Chatila, and Francisco Herrera. 2019. Explainable artificial intelligence (xai): Concepts, taxonomies, opportunities and challenges toward responsible ai. *Preprint, arXiv:1910.10045*.
- arXiv. 2026. arXiv.org e-Print Archive. `https://arxiv.org/`.
- Payal Bajaj, Daniel Campos, Nick Craswell, Li Deng, Jianfeng Gao, Xiaodong Liu, Rangan Majumder, Andrew McNamara, Bhaskar Mitra, Tri Nguyen, Mir Rosenberg, Xia Song, Alina Stoica, Saurabh Tiwary, and Tong Wang. 2018. Ms marco: A human generated machine reading comprehension dataset. *Preprint, arXiv:1611.09268*.
- Jonathan Berant, Andrew Chou, Roy Frostig, and Percy Liang. 2013. Semantic parsing on Freebase from question-answer pairs. In *Proceedings of the 2013 Conference on Empirical Methods in Natural Language Processing*, pages 1533–1544, Seattle, Washington, USA. Association for Computational Linguistics.
- Sebastian Borgeaud, Arthur Mensch, Jordan Hoffmann, Trevor Cai, Eliza Rutherford, Katie Millican, George van den Driessche, Jean-Baptiste Lespiau, Bogdan Damoc, Aidan Clark, Diego de Las Casas, Aurelia Guy, Jacob Menick, Roman Ring, Tom Hennigan, Saffron Huang, Loren Maggiore, Chris Jones, Albin Cassirer, and 9 others. 2022. Improving language models by retrieving from trillions of tokens. *Preprint, arXiv:2112.04426*.
- Tilmann Bruckhaus. 2024. Rag does not work for enterprises. *Preprint, arXiv:2406.04369*.
- Erik Brynjolfsson, Danielle Li, and Lindsey Raymond. 2024. Generative ai at work. *Preprint, arXiv:2304.11771*.
- Abdur-Rahman Butler and Umar Butler. 2026. Legal rag bench: an end-to-end benchmark for legal rag. *Preprint, arXiv:2603.01710*.
- Jiawei Chen, Hongyu Lin, Xianpei Han, and Le Sun. 2024. Benchmarking large language models in retrieval-augmented generation. *Proceedings of the AAAI Conference on Artificial Intelligence*, 38(16):17754–17762.
- Yongping Du, Zikai Wang, Binrui Wang, Xingnan Jin, and Yu Pei. 2024. A novel rag framework with knowledge-enhancement for biomedical question answering. In *2024 IEEE International Conference on Bioinformatics and Biomedicine (BIBM)*, pages 3188–3191.
- Darren Edge, Ha Trinh, Newman Cheng, Joshua Bradley, Alex Chao, Apurva Mody, Steven Truitt, Dasha Metropolitansky, Robert Osazuwa Ness, and Jonathan Larson. 2025. From local to global: A graph rag approach to query-focused summarization. *Preprint, arXiv:2404.16130*.
- Shahul Es, Jithin James, Luis Espinosa Anke, and Steven Schockaert. 2024. RAGAs: Automated evaluation of retrieval augmented generation. In *Proceedings of the 18th Conference of the European Chapter of the Association for Computational Linguistics: System Demonstrations*, pages 150–158, St. Julians, Malta. Association for Computational Linguistics.
- Forbes Media LLC. 2026. Forbes: Business, Technology, and Finance News. `https://www.forbes.com/`.
- Yunfan Gao, Yun Xiong, Xinyu Gao, Kangxiang Jia, Jinliu Pan, Yuxi Bi, Yi Dai, Jiawei Sun, Meng Wang, and Haofen Wang. 2024. Retrieval-augmented generation for large language models: A survey. *Preprint, arXiv:2312.10997*.
- Ryan George, Akshay Govind Srinivasan, Jayden Koshy Joe, Harshith M R, Vijayavallabh J, Hrushikesh Kant, Rahul Vimalkanth, Sachin S, and Sudharshan Suresh. 2025. Enhancing financial RAG with agentic AI and multi-HyDE: A novel approach to knowledge retrieval and hallucination reduction. In *Proceedings of The 10th Workshop on Financial Technology and Natural Language Processing*, pages 19–32, Suzhou, China. Association for Computational Linguistics.
- Kelvin Guu, Kenton Lee, Zora Tung, Panupong Pasupat, and Ming-Wei Chang. 2020. Realm: Retrieval-augmented language model pre-training. *Preprint, arXiv:2002.08909*.
- Gillian K. Hadfield and Jack Clark. 2026. Regulatory markets: The future of ai governance. *Preprint, arXiv:2304.04914*.
- Gautier Izacard and Edouard Grave. 2021. Leveraging passage retrieval with generative models for open domain question answering. In *Proceedings of the 16th Conference of the European Chapter of the Association for Computational Linguistics: Main Volume*, pages 874–880, Online. Association for Computational Linguistics.
- Tamen Jadad-Garcia and Alejandro R. Jadad. 2024. The foundations of computational management: A systematic approach to task automation for the integration of artificial intelligence into existing workflows. *Preprint, arXiv:2402.05142*.
- Infosys Jayarama Nettar, Harry Keir Hughes. 2024. *The challenge of information retrieval in enterprise ai*.
- Mandar Joshi, Eunsol Choi, Daniel S. Weld, and Luke Zettlemoyer. 2017. Triviaqa: A large scale distantly supervised challenge dataset for reading comprehension. *Preprint, arXiv:1705.03551*.
- Muhammad Rafsan Kabir, Rafeed Mohammad Sultan, Fuad Rahman, Mohammad Ruhul Amin, Sifat Momen, Nabeel Mohammed, and Shafin Rahman. 2025. Legalrag: A hybrid rag system for multilingual legal information retrieval. *Preprint, arXiv:2504.16121*.
- Vladimir Karpukhin, Barlas Oguz, Sewon Min, Patrick Lewis, Ledell Wu, Sergey Edunov, Danqi Chen, and Wen-tau Yih. 2020. Dense passage retrieval for open-domain question answering. In *Proceedings of the 2020 Conference on Empirical Methods in Natural Language Processing (EMNLP)*, pages 6769–6781, Online. Association for Computational Linguistics.
- Tom Kwiatkowski, Jennimaria Palomaki, Olivia Redfield, Michael Collins, Ankur Parikh, Chris Alberti, Danielle Epstein, Illia Polosukhin, Jacob Devlin, Kenton Lee, Kristina Toutanova, Llion Jones, Matthew Kelcey, Ming-Wei Chang, Andrew M. Dai, Jakob Uszkoreit, Quoc Le, and Slav Petrov. 2019. Natural questions: A benchmark for question answering research. *Transactions of the Association for Computational Linguistics*, 7:452–466.
- Patrick Lewis, Ethan Perez, Aleksandra Piktus, Fabio Petroni, Vladimir Karpukhin, Naman Goyal, Heinrich Küttler, Mike Lewis, Wen tau Yih, Tim Rocktäschel, Sebastian Riedel, and Douwe Kiela. 2021. Retrieval-augmented generation for knowledge-intensive nlp tasks. *Preprint, arXiv:2005.11401*.
- Minghan Li, Eric Gaussier, Juntao Li, and Guodong Zhou. 2026a. Evirerank: Adaptive evidence construction for long-document llm reranking. *Preprint, arXiv:2411.06254*.
- Ruizhe Li, Chen Chen, Yuchen Hu, Yanjun Gao, Xi Wang, and Emine Yilmaz. 2026b. Attributing response to context: A jensen-shannon divergence driven mechanistic study of context attribution in retrieval-augmented generation. *Preprint, arXiv:2505.16415*.
- Yuan Li, Qi Luo, Xiaonan Li, Bufan Li, Qinyuan Cheng, Bo Wang, Yining Zheng, Yuxin Wang, Zhangyue Yin, and Xipeng Qiu. 2025. R3-rag: Learning step-by-step reasoning and retrieval for llms via reinforcement learning. *Preprint, arXiv:2505.23794*.
- Jiaen Lin, Jingyu Liu, and Yingbo Liu. 2025. Optimizing multi-hop document retrieval through intermediate representations. In *Findings of the Association for Computational Linguistics: ACL 2025*, pages 15798–15809, Vienna, Austria. Association for Computational Linguistics.
- Nicholas Matsumoto, Jay Moran, Hyunjun Choi, Miguel E. Hernandez, Mythreye Venkatesan, Zhiping Paul Wang, and Jason H. Moore. 2024. Kragen: a knowledge graph-enhanced rag framework for biomedical problem solving using large language models. *Bioinformatics*, 40.
- Microsoft Corporation. 2026. Azure AI Search Documentation. `https://docs.azure.cn/en-us/search/`.
- National Center for Biotechnology Information. 2026. NCBI: National Library of Medicine Databases. `https://www.ncbi.nlm.nih.gov/`.
- OpenAI. 2025. GPT-4.1: OpenAI Model Overview. `https://openai.com/index/gpt-4-1/`.
- Pranav Rajpurkar, Jian Zhang, Konstantin Lopyrev, and Percy Liang. 2016. SQuAD: 100,000+ questions for machine comprehension of text. In *Proceedings of the 2016 Conference on Empirical Methods in Natural Language Processing*, pages 2383–2392, Austin, Texas. Association for Computational Linguistics.
- Markus Reuter, Tobias Lingenberg, Rūta Liepiņa, Francesca Lagioia, Marco Lippi, Giovanni Sartor, Andrea Passerini, and Burcu Sayin. 2025. Towards reliable retrieval in rag systems for large legal datasets. *Preprint, arXiv:2510.06999*.
- David Richards. 2025. *The engineering gap: why 73% of enterprise rag systems fail where they matter most*.
- Parth Sarthi, Salman Abdullah, Aditi Tuli, Shubh Khanna, Anna Goldie, and Christopher D. Manning. 2024. Raptor: Recursive abstractive processing for tree-organized retrieval. *Preprint, arXiv:2401.18059*.
- Kartik Sharma, Peeyush Kumar, and Yunqing Li. 2025. OG-RAG: Ontology-grounded retrieval-augmented generation for large language models. In *Proceedings of the 2025 Conference on Empirical Methods in Natural Language Processing*, pages 32962–32981, Suzhou, China. Association for Computational Linguistics.
- Ionut-Teodor Sorodoc, Leonardo F. R. Ribeiro, Rexhina Blloshmi, Christopher Davis, and Adrià de Gispert. 2025. Garage: A benchmark with grounding annotations for rag evaluation. *Preprint, arXiv:2506.07671*.
- Yixuan Tang and Yi Yang. 2024. Multihop-rag: Benchmarking retrieval-augmented generation for multi-hop queries. *Preprint, arXiv:2401.15391*.
- Adam Trischler, Tong Wang, Xingdi Yuan, Justin Harris, Alessandro Sordoni, Philip Bachman, and Kaheer Suleman. 2017. NewsQA: A machine comprehension dataset. In *Proceedings of the 2nd Workshop on Representation Learning for NLP*, pages 191–200, Vancouver, Canada. Association for Computational Linguistics.
- U.S. Food and Drug Administration. 2026. FDA.gov: Official U.S. Food and Drug Administration Website.
- U.S. Securities and Exchange Commission. 2026a. EDGAR: SEC Search Filings Database. `https://www.sec.gov/search-filings`.
- U.S. Securities and Exchange Commission. 2026b. SEC.gov | Home. `https://www.sec.gov/`.
- Feng Wang, Yiding Sun, Jiaxin Mao, Xue Wei, and Danqing Xu. 2025a. Fins-pilot: A benchmark for online financial rag system. In *Proceedings of the 34th ACM International Conference on Information and Knowledge Management, CIKM ’25*, page 6544–6548, New York, NY, USA. Association for Computing Machinery.
- Jingru Wang, Wen Ding, and Xiaotong Zhu. 2025b. Financial analysis: Intelligent financial data analysis system based on llm-rag. *Preprint, arXiv:2504.06279*.
- Zhilin Yang, Peng Qi, Saizheng Zhang, Yoshua Bengio, William W. Cohen, Ruslan Salakhutdinov, and Christopher D. Manning. 2018. Hotpotqa: A dataset for diverse, explainable multi-hop question answering. *Preprint, arXiv:1809.09600*.
- Hanning Zhang, Juntong Song, Juno Zhu, Yuanhao Wu, Tong Zhang, and Cheng Niu. 2025. Opengenalign: A preference dataset and benchmark for trustworthy reward modeling in open-ended, long-context generation. *Preprint, arXiv:2501.13264*.
- Qingfei Zhao, Ruobing Wang, Yukuo Cen, Daren Zha, Shicheng Tan, Yuxiao Dong, and Jie Tang. 2024. Longrag: A dual-perspective retrieval-augmented generation paradigm for long-context question answering. *Preprint, arXiv:2410.18050*.
- Yuanhang Zheng, Peng Li, Wei Liu, Yang Liu, Jian Luan, and Bin Wang. 2024. Toolrerank: Adaptive and hierarchy-aware reranking for tool retrieval. In *Proceedings of the 2024 Joint International Conference on Computational Linguistics, Language Resources and Evaluation, LREC/COLING 2024*, pages 16263–16273. ELRA and ICCL.
- Çağatay Umut Ögdü, Kübra Arslanoğlu, and Mehmet Karaköse. 2025. An adaptive multi-agent llm-based clinical decision support system integrating biomedical rag and web intelligence. *IEEE Access*, 13:167390–167404.

---

## Phụ lục (Appendix)

### A.1 Chi tiết về Bộ Dữ liệu (Dataset Details)

#### A.1.1 Tài liệu Yêu cầu Đầu vào (Input Requirement Documents)
Mỗi mẫu trong bộ dữ liệu của chúng tôi bắt đầu bằng một **tài liệu yêu cầu đầu vào**, đóng vai trò là đặc tả soạn thảo cho tài liệu doanh nghiệp mục tiêu. Không giống như các câu lệnh ngắn hay các cặp câu hỏi - câu trả lời, các đầu vào này là các cấu phần yêu cầu có cấu trúc mô tả:
- Bối cảnh tổ chức,
- Ngữ cảnh kinh doanh,
- Các ràng buộc,
- Đối tượng độc giả mục tiêu,
- Các phần bắt buộc phải xuất hiện trong văn bản đầu ra cuối cùng.

Trong thực tế, chúng được thiết kế để tương đồng với các tài liệu yêu cầu được sử dụng trong các quy trình soạn thảo doanh nghiệp thực tế, nơi một người viết hoặc chủ sở hữu chính sách thường bắt đầu từ một bản tóm tắt chính thức (formal brief), tài liệu phạm vi (scope document), ghi chú quản trị (governance note) hoặc một yêu cầu nội bộ, thay vì từ một truy vấn ngôn ngữ tự nhiên đơn lẻ.

Đối với từng loại trong số bốn loại tài liệu — *Chính sách (Policies)*, *Tài liệu Ra mắt Sản phẩm (Product Launch documents)*, *Báo cáo Thẩm định Mua bán & Sáp nhập (M&A due diligence reports)*, và *Đề xuất Chương trình Học thuật (Academic Program proposals)* — chúng tôi tạo ra các tài liệu yêu cầu quy định cả bối cảnh tình huống lẫn các thành phần cấu trúc dự kiến của bản thảo cuối cùng. Thiết kế tài liệu được định hình dựa trên các khuôn mẫu soạn thảo văn bản doanh nghiệp phổ biến, tài liệu thể chế công khai, và các quy ước chuyên môn gắn liền với từng loại tài liệu. Mục tiêu là tạo ra các đặc tả yêu cầu mang tính đại diện, nắm bắt được các loại ràng buộc, nhu cầu bằng chứng liên chức năng và các kỳ vọng ở cấp từng phần vốn nảy sinh trong các nhiệm vụ soạn thảo doanh nghiệp thực tế.

Hình 2 minh họa một tài liệu yêu cầu đầu vào mẫu cho một chính sách doanh nghiệp trong Miền Công nghệ AI.

---

### A.2 Xây dựng Bản thể học, Trích xuất Chủ đề và Kỹ thuật Đặt Câu lệnh (Ontology Construction, Topic Extraction, and Prompting)

Đối với các phương pháp nhận biết bản thể học, chúng tôi xây dựng một bản thể học cho mỗi cặp miền – loại tài liệu, tạo ra tổng cộng **16 bản thể học**. Mỗi bản thể học được xây dựng bằng quy trình bán tự động: một bản dự thảo sơ khởi được tạo tự động từ tài liệu đại diện của miền và các tài liệu yêu cầu mẫu, sau đó được xem xét thủ công, tinh chỉnh và kiểm chứng bởi các chuyên gia trong miền. Quy trình này đảm bảo rằng bản thể học cuối cùng nắm bắt được các khái niệm, danh mục và mối quan hệ ngữ nghĩa phù hợp nhất với loại tài liệu doanh nghiệp tương ứng.

Một bản thể học trong bối cảnh của chúng tôi là một biểu diễn hình thức của các khái niệm trong miền và mối quan hệ giữa chúng. Không giống như sơ đồ phân loại hình cây (taxonomy) hay phân loại phẳng (flat classification), nó cho phép tổ chức ngữ nghĩa phong phú hơn bằng cách gom nhóm các khái niệm liên quan dưới các danh mục chức năng rộng hơn. Ví dụ, trong bản thể học soạn thảo chính sách, các khái niệm như *bảo mật dữ liệu*, *kiểm soát truy cập* và *ghi nhật ký kiểm toán* có thể được nhóm lại dưới các danh mục như *an ninh*, *quản trị* và *tuân thủ*.

Bản thể học được sử dụng tại hai vị trí:
1. Nó định hướng việc trích xuất chủ đề từ tài liệu đầu vào, tạo ra một biểu diễn chủ đề có cấu trúc của yêu cầu soạn thảo.
2. Nó hỗ trợ truy xuất nhận biết bản thể học bằng cách cho phép so sánh giữa các chủ đề đầu vào và các chủ đề được lập chỉ mục từ các tài liệu trong cơ sở tri thức. Để hỗ trợ điều này, mỗi tài liệu được thêm vào một KB đều được xử lý qua cùng một quy trình trích xuất chủ đề, và các chủ đề kết quả được lưu trữ dưới dạng siêu dữ liệu (metadata) của tài liệu.

Quá trình trích xuất chủ đề được thực hiện qua hai giai đoạn:
- **Giai đoạn 1:** Mô hình ngôn ngữ lớn xác định các cụm từ chủ đề nổi bật từ văn bản tài liệu.
- **Giai đoạn 2:** Nội dung bản thể học được cung cấp như ngữ cảnh bổ sung, nhờ đó các chủ đề được trích xuất sẽ căn chỉnh nhất quán hơn với từ vựng và danh mục của bản thể học.

Đầu ra cuối cùng được ánh xạ vào biểu diễn có cấu trúc:
$$T = \{(t_i, g_i)\}_{i=1}^N$$
trong đó $t_i$ là cụm từ chủ đề được trích xuất và $g_i$ là danh mục bản thể học của nó.

Khi các tài liệu mới được bổ sung vào một KB, chúng không tác động đến việc truy xuất ngay lập tức. Trước hết chúng phải được tái lập chỉ mục: các chủ đề được trích xuất từ tài liệu mới, chỉ mục chủ đề của KB được cập nhật, số lượng tài liệu và siêu dữ liệu được làm mới. Chỉ sau quy trình này, các tài liệu mới thêm vào mới ảnh hưởng đến việc truy xuất và ước lượng trọng số nguồn.

---

### A.3 LLM Đóng vai trò Giám khảo (LLM-as-a-Judge)

#### A.3.1 Chấm điểm Mức độ Thỏa mãn Yêu cầu (Requirements Satisfaction Scoring)
Đối với thước đo Mức độ Thỏa mãn Yêu cầu, mô hình giám khảo được cung cấp ba đầu vào:
1. Tài liệu yêu cầu ban đầu,
2. Tài liệu doanh nghiệp được tạo ra,
3. Danh mục kiểm tra yêu cầu đặc thù cho loại tài liệu do chuyên gia chuẩn bị.

Giám khảo được yêu cầu đánh giá tài liệu được tạo ra theo từng mục trong danh sách kiểm tra và gán một trong ba nhãn cho mỗi yêu cầu:
- **Thỏa mãn hoàn toàn (Full):** Yêu cầu được giải quyết rõ ràng và đầy đủ.
- **Thỏa mãn một phần (Partial):** Yêu cầu được đề cập đến nhưng chưa đầy đủ hoặc thiếu chi tiết.
- **Không thỏa mãn (None):** Yêu cầu hoàn toàn vắng mặt hoặc không được giải quyết một cách có ý nghĩa.

Các nhãn này sau đó được chuyển đổi thành điểm số định lượng theo biểu điểm:
- `Full` = trọn điểm (full points)
- `Partial` = nửa số điểm (half points)
- `None` = 0 điểm (zero points)

Danh mục kiểm tra được thiết kế để nắm bắt các yếu tố thiết yếu tối thiểu mà mọi tài liệu hợp lệ thuộc loại đó phải chứa đựng, không phụ thuộc vào phong cách hay cách dùng từ ngữ cụ thể của từng miền. Trong bối cảnh tài liệu chính sách, các mục kiểm tra mẫu bao gồm: bản thảo có xác định rõ phạm vi hay không, có nêu cấu trúc quản trị không, có phân công vai trò và trách nhiệm không, có nêu các biện pháp kiểm soát rủi ro và lộ trình báo cáo chuyển cấp không, có xác định cơ chế giám sát và tuân thủ không, và có quy định chu kỳ rà soát chính sách không. Một danh mục kiểm tra mẫu được đưa vào Bảng 2 và Hình 2, ví dụ về prompt được minh họa trong Hình 3.

#### A.3.2 Chấm điểm Độ phù hợp Ngữ cảnh (Context Relevancy Scoring)
Đối với Độ phù hợp Ngữ cảnh, mô hình giám khảo được cung cấp:
1. Tài liệu yêu cầu đầu vào,
2. Các đoạn văn bản được truy xuất dùng làm ngữ cảnh tạo sinh,
3. Hướng dẫn dán nhãn từng đoạn văn bản là có liên quan hay không liên quan đến tác vụ soạn thảo.

Mục đích của câu lệnh này (thể hiện trong Hình 4) là tách bạch chất lượng truy xuất khỏi chất lượng tạo sinh cuối cùng. Một đoạn văn bản được xem là có liên quan nếu nó cung cấp bằng chứng hữu ích hướng tới việc thỏa mãn một hoặc nhiều yêu cầu của tài liệu doanh nghiệp mục tiêu, ngay cả khi nó không được sao chép trực tiếp vào văn bản đầu ra. Điều này đặc biệt quan trọng trong môi trường của chúng tôi, nơi các bằng chứng được truy xuất có thể hỗ trợ quản trị, tuân thủ, biện pháp an toàn kỹ thuật hoặc quy trình tổ chức theo những cách thức bổ trợ lẫn nhau.

---

### Bảng 2: Danh mục kiểm tra yêu cầu mẫu dùng để chấm điểm chất lượng tạo tài liệu chính sách

*Mỗi mục được chấm là Full (Đầy đủ), Partial (Một phần), hoặc None (Không có), sau đó được chuyển đổi thành điểm Mức độ Thỏa mãn Yêu cầu đã chuẩn hóa.*

| Mục Thiết yếu (Essential Item) | Điểm Tối đa (Max Points) |
| :--- | :---: |
| Phạm vi được xác định rõ ràng (*Scope clearly defined*) | 3 |
| Cấu trúc quản trị được xác định (*Governance structure identified*) | 3 |
| Vai trò & trách nhiệm được phân công (*Roles & responsibilities assigned*) | 3 |
| Tiêu chuẩn lâm sàng / pháp lý được chỉ định (*Clinical/legal standards specified*) | 3 |
| Kiểm soát rủi ro / lộ trình chuyển cấp (*Risk controls / escalation paths*) | 2 |
| Các chỉ số chất lượng được xác định (*Quality metrics defined*) | 2 |
| Quy trình làm việc & quy tắc lập hồ sơ (*Workflows & documentation rules*) | 2 |
| Công nghệ được phê duyệt được chỉ định (*Approved technology specified*) | 2 |
| Yêu cầu đào tạo (*Training requirements*) | 2 |
| Kế hoạch giám sát & tuân thủ (*Monitoring & compliance plan*) | 2 |
| Chu kỳ rà soát chính sách (*Policy review cadence*) | 1 |
| **Tổng cộng (Total)** | **25** |

---

### A.4 Phân tích Kết quả Đánh giá Thực nghiệm (Empirical Evaluation Results Analysis)

#### A.4.1 Phân tích Chi tiết về Chất lượng Tài liệu Tạo sinh và Hiệu quả Truy xuất
Bảng 1 tiết lộ hai quy luật vững chắc:
1. W-RAG liên tục vượt trội hơn cả hai đường cơ sở về chất lượng tài liệu, chỉ ra rằng việc truy xuất tốt hơn đơn thuần là chưa đủ trừ khi bằng chứng thu về cũng được cấu thành một cách phù hợp giữa các cơ sở tri thức.
2. Mức độ cải thiện không đồng đều: các loại tài liệu đòi hỏi sự tổng hợp sâu rộng hơn trên các nguồn không đồng nhất sẽ hưởng lợi nhiều nhất từ cơ chế truy xuất nhận biết nguồn.

- **Chính sách (Policies):** Đối với loại tài liệu Chính sách, so với OG-RAG, W-RAG mang lại mức cải thiện tương đối **43.1%** về chất lượng tài liệu và **26.6%** về chất lượng truy xuất. Mức tăng mạnh nhất ở cấp độ miền xuất hiện trong *Công nghệ AI & Truyền thông số*, nơi Mức độ Thỏa mãn Yêu cầu tăng hơn gấp đôi so với OG-RAG (từ 34% lên 78%). Điều này cho thấy việc soạn thảo chính sách trong các lĩnh vực có sự biến đổi nhanh về mặt kỹ thuật phụ thuộc rất lớn vào việc thu hồi đúng tỷ lệ kết hợp giữa bằng chứng quy định, bằng chứng tổ chức và bằng chứng vận hành. Ngược lại, miền *Khí hậu & Tính bền vững* mang lại một phản ví dụ thú vị: OG-RAG hơi nhỉnh hơn W-RAG về Độ phù hợp Ngữ cảnh (72% so với 70%), nhưng W-RAG vẫn đạt được Mức độ Thỏa mãn Yêu cầu cao hơn (76% so với 68%). Khoảng cách này chỉ ra rằng, đối với việc soạn thảo chính sách, những cải thiện biên ở cấp độ liên quan của đoạn văn bản không nhất thiết mang lại tài liệu tốt hơn trừ khi bằng chứng được cấu thành theo cách thức bao trùm cấu trúc chính sách bắt buộc.

- **Ra mắt Sản phẩm (Product Launch):** Đối với các tài liệu Ra mắt Sản phẩm, so với OG-RAG, W-RAG đạt mức cải thiện **44.6%** về chất lượng tài liệu và **33.9%** về chất lượng truy xuất. Miền *Chăm sóc sức khỏe & Y tế từ xa* đặc biệt rõ rệt: Mức độ Thỏa mãn Yêu cầu tăng từ 33% lên 63% và Độ phù hợp Ngữ cảnh từ 45% lên 71% khi chuyển từ OG-RAG sang W-RAG. Việc soạn thảo tài liệu ra mắt sản phẩm dường như đặc biệt phụ thuộc vào việc kết hợp các loại bằng chứng bổ trợ — năng lực kỹ thuật, định vị thị trường, cân nhắc pháp lý và các ràng buộc tổ chức — thay vì chỉ đơn thuần truy xuất các đoạn văn có sự tương đồng về chủ đề. Sự cải thiện tương đối khiêm tốn của OG-RAG so với Vanilla RAG về Mức độ Thỏa mãn Yêu cầu cho thấy việc chỉ xác định nhiều đoạn văn bản liên quan hơn là không đủ nếu hệ thống không truy xuất chúng theo một cơ cấu phù hợp với doanh nghiệp.

- **Mua bán & Sáp nhập (Merger & Acquisitions - M&A):** M&A là loại tài liệu có hiệu năng cao nhất dưới cơ chế W-RAG và thể hiện những khoảng cách vượt trội lớn nhất so với cả hai đường cơ sở. Tính trung bình trên các miền:
  - Vanilla RAG đạt 35.3% Thỏa mãn Yêu cầu và 41.8% Độ phù hợp Ngữ cảnh;
  - OG-RAG tăng lên 43.8% và 54.0%;
  - W-RAG tăng vọt lên **70.8%** và **78.8%**.
  
  Điều này chuyển thành mức tăng tương đối **61.7%** về Mức độ Thỏa mãn Yêu cầu và **45.8%** về Độ phù hợp Ngữ cảnh so với OG-RAG. Mức cải thiện đơn lẻ lớn nhất diễn ra trong miền *Khí hậu & Tính bền vững*, nơi W-RAG đạt **83%** Thỏa mãn Yêu cầu và **87%** Phù hợp Ngữ cảnh, so với chỉ 54% và 49% dưới OG-RAG.

- **Chương trình Học thuật (Academic Programs):** Đề xuất chương trình học thuật cung cấp bằng chứng có lẽ là rõ ràng nhất cho thấy chất lượng truy xuất và chất lượng tài liệu cần phải được phân tích tách biệt. Tính trung bình trên các miền:
  - Vanilla RAG đạt 32.3% Thỏa mãn Yêu cầu và 34.5% Phù hợp Ngữ cảnh;
  - OG-RAG cải thiện lên 37.0% và 50.5%;
  - W-RAG đạt mức vượt trội **70.0%** và **76.8%**.
  
  So với OG-RAG, W-RAG cải thiện Mức độ Thỏa mãn Yêu cầu tới **89.2%** và Độ phù hợp Ngữ cảnh thêm **52.0%**. Ví dụ ấn tượng nhất là miền *Khí hậu & Tính bền vững*, nơi OG-RAG không thể hiện bất kỳ sự cải thiện nào so với Vanilla RAG về Thỏa mãn Yêu cầu (40% so với 40%), nhưng W-RAG nâng điểm số này lên **78%**. Xu hướng này khẳng định việc soạn thảo chương trình học thuật phụ thuộc rất cao vào việc lắp ráp bằng chứng thành một cấu trúc mạch lạc, thỏa mãn yêu cầu, và truy xuất cân bằng nguồn là tối quan trọng khi tài liệu đích bao trùm cả chính sách, chương trình giảng dạy, tính tuân thủ và luận cứ hướng tới thị trường.

- **Xu hướng theo Miền (Domain-level trends):** Phân tích trên tất cả các loại tài liệu làm lộ rõ các cấu trúc đặc thù theo miền:
  - *Chăm sóc sức khỏe & Y tế từ xa* là miền thách thức nhất: Vanilla RAG chỉ đạt trung bình 23.5% Thỏa mãn Yêu cầu và 28.0% Phù hợp Ngữ cảnh, trong khi OG-RAG chỉ cải thiện khiêm tốn lên 32.3% và 42.0%. W-RAG thu hẹp đáng kể khoảng cách này, nâng mức trung bình của miền lên **61.8%** và **70.8%**. So với OG-RAG, đây là mức tăng **91.5%** về chất lượng tài liệu và **68.5%** về chất lượng truy xuất — mức tăng tương đối lớn nhất trong cả bốn miền. Điều này ngụ ý rằng việc soạn thảo trong lĩnh vực y tế đòi hỏi phải tập hợp bằng chứng chuyên biệt và bị phân mảnh từ nhiều KB, do đó cực kỳ nhạy cảm với cơ cấu phân bổ nguồn.
  - Ngược lại, *Khí hậu & Tính bền vững* đạt Mức độ Thỏa mãn Yêu cầu trung bình cao nhất dưới W-RAG với **77.8%**, tiếp theo là *Công nghệ AI & Truyền thông số* với **68.3%** và *Tài chính* với **64.3%**.
  - Đáng chú ý, miền *Công nghệ AI & Truyền thông số* vốn đã đạt điểm truy xuất cao nhất ngay dưới OG-RAG (trung bình 70.3% Phù hợp Ngữ cảnh), nhưng chất lượng tài liệu vẫn ở mức rất thấp cho đến khi cơ chế gán trọng số được đưa vào (36.3% dưới OG-RAG so với **68.3%** dưới W-RAG).

- **Chất lượng Truy xuất so với Chất lượng Tài liệu (Retrieval quality versus document quality):** Quan sát kết luận là Độ phù hợp Ngữ cảnh và Mức độ Thỏa mãn Yêu cầu có tương quan với nhau nhưng không thể hoán đổi cho nhau. OG-RAG thường xuyên cải thiện Độ phù hợp Ngữ cảnh với biên độ lớn so với Vanilla RAG, nhưng chất lượng tài liệu thường chỉ tăng nhẹ. Ví dụ, trong tài liệu Ra mắt Sản phẩm thuộc miền Công nghệ AI & Truyền thông số, Độ phù hợp Ngữ cảnh tăng 29% (từ 45% lên 74%) khi chuyển từ Vanilla RAG sang OG-RAG, trong khi Thỏa mãn Yêu cầu chỉ tăng 4% (từ 34% lên 38%). Các khuôn mẫu tương tự cũng xuất hiện trong Chính sách và Chương trình Học thuật. Sự phân kỳ này củng cố luận điểm chính của bài báo: trong tác vụ soạn thảo doanh nghiệp đa cơ sở tri thức, việc truy xuất các đoạn văn bản có liên quan là điều kiện cần nhưng chưa đủ. Các hệ thống còn phải điều tiết lượng bằng chứng từ các nguồn không đồng nhất được truy xuất và sử dụng trong quá trình tạo sinh. W-RAG đạt hiệu quả chính xác là nhờ nó giải quyết đồng thời cả hai giai đoạn này.

---

### A.5 Phân tích Chi tiết về Ảnh hưởng của Cơ sở Tri thức (Fine-grained Analysis of Knowledge Base Influence)

- **Công nghệ AI & Truyền thông số (AI Technology & Digital Media):** Miền này thể hiện sự lệch pha lớn nhất giữa việc sử dụng KB theo quy định và thực nhận, khiến nó trở thành môi trường thách thức nhất cho việc kiểm soát nguồn. Cụ thể, mức độ quy gán thực nhận trong các cấu hình truy xuất - tạo sinh yếu hơn dường như sử dụng dưới mức đối với KB3 (Pháp lý) và KB4 (Thị trường) so với đóng góp quy định của chúng, trong khi lại vượt mức hoặc hụt mức đối với KB1 (Doanh nghiệp) và KB2 (Khoa học) tùy thuộc vào loại tài liệu. Điều này cho thấy trong miền này, bằng chứng liên quan phân bố không đồng đều giữa các KB, khiến quá trình tạo sinh dễ bị suy sụp nguồn (source collapse).
- **Khí hậu & Tính bền vững (Climate & Sustainability):** Khí hậu & Tính bền vững cho thấy sự ăn khớp mạnh nhất giữa phân phối quy định và thực nhận. Xuyên suốt các loại tài liệu, các đường đứt nét bám sát hình dạng của các đường liền nét, đặc biệt là đối với KB3 (Pháp lý) và KB4 (Thị trường) — cả hai đều là những nguồn đóng góp nổi bật trong miền này.
- **Chăm sóc sức khỏe & Y tế từ xa (Healthcare & Telehealth):** Trong miền Chăm sóc sức khỏe & Y tế từ xa, các phân phối thực nhận nắm bắt được hình dạng bao quát của cơ cấu nguồn quy định, nhưng có thể nhận thấy một sự suy giảm nhất định, đặc biệt đối với KB3 (Pháp lý) và KB4 (Thị trường), nơi mức độ quy gán thực nhận thấp hơn dự kiến đối với một số loại tài liệu. Dù vậy, so với các đường cơ sở yếu hơn, mức độ sử dụng nguồn thực nhận vẫn duy trì sự căn chỉnh tốt hơn đáng kể với cơ cấu quy định.
- **Tài chính (Finance):** Lĩnh vực Tài chính thể hiện một khuôn mẫu hỗn hợp nhưng vẫn rất giàu thông tin. Các phân phối thực nhận nhìn chung khôi phục lại các đỉnh chính trong trọng số nguồn quy định, đặc biệt là đối với KB1 (Doanh nghiệp) và KB3 (Pháp lý), nhưng thể hiện sự sai lệch lớn hơn đối với KB2 (Khoa học) và KB4 (Thị trường) trong một số loại tài liệu. Điều này cho thấy việc tạo văn bản liên quan đến tài chính chịu ảnh hưởng mạnh mẽ bởi bằng chứng doanh nghiệp và pháp lý, trong khi thông tin hướng tới thị trường có phần khó duy trì hơn theo đúng tỷ lệ mong muốn. Tuy nhiên, các đường cong thực nhận vẫn tuân theo cấu trúc tổng thể của các phân phối quy định, cho thấy ảnh hưởng nguồn có ý nghĩa chứ không phải là sự tạo sinh tự do thuần túy.

#### A.5.1 Nghiên cứu Tình huống: Ảnh hưởng của KB (KB Influence - Case Study)
Để kiểm tra sâu hơn xem liệu việc tạo nội dung có thực sự nhạy cảm với tỷ lệ nội dung được truy xuất từ các KB hay không, chúng tôi thực hiện một nghiên cứu kiểm soát ghi đè trọng số (controlled weight-override study) trên loại tài liệu Chính sách (Policies) trên cả bốn miền. Thay vì dựa vào các trọng số nguồn được đề xuất tự động, chúng tôi chỉ định thủ công bốn phân phối KB đầu vào thay thế cho mỗi ví dụ.

Cụ thể, mỗi tài liệu được chạy bốn lần, sử dụng bốn hoán vị của cùng một tập trọng số: `(40, 35, 20, 5)`. Trong mỗi lần chạy, một KB khác nhau được gán trọng số thấp nhất là `5%`, trong khi ba KB còn lại nhận các mức phân bổ cao hơn là `40%`, `35%`, và `20%`. Thiết kế này cho phép chúng tôi kiểm tra xem liệu việc thay đổi có hệ thống cơ cấu nguồn quy định tại thời điểm truy xuất có dẫn đến những thay đổi tương ứng trong mức độ sử dụng KB thực nhận của tài liệu được tạo ra hay không.

Với mỗi tài liệu được tạo ra, chúng tôi tính toán phân phối KB thực nhận bằng quy trình quy gán cấp câu được mô tả trong Mục 5, sau đó tính trung bình các phân phối thực nhận trên tất cả các ví dụ chính sách. Hình 5 thể hiện kết quả. Trong mỗi biểu đồ, các dấu chấm biểu thị tỷ lệ quy định và thực nhận thực tế cho mỗi KB, trong khi các đường nối chỉ được thêm vào để giúp xu hướng phân phối dễ so sánh hơn.

**Kết quả cốt lõi:** Việc thay đổi cơ cấu KB quy định dẫn đến những thay đổi tương ứng trực tiếp trong mức độ quy gán nguồn thực nhận của tài liệu được tạo ra. Nói cách khác, khi ngữ cảnh truy xuất được tái cân bằng trọng số để nhấn mạnh hoặc giảm bớt một cơ sở tri thức cụ thể, nội dung của tài liệu doanh nghiệp cuối cùng sẽ biến đổi tương ứng. Điều này chứng minh rằng việc tạo tài liệu doanh nghiệp cực kỳ nhạy cảm với loại thông tin được trích xuất từ các KB không đồng nhất: các nguồn doanh nghiệp, khoa học, pháp lý và thị trường không đóng góp theo cách có thể thay thế lẫn nhau, và việc dịch chuyển sự hiện diện tương đối của chúng trong khâu truy xuất sẽ làm thay đổi căn bản cấu trúc thông tin của văn bản đầu ra.

---

### A.6 Soạn thảo Hồ sơ Đề xuất Doanh nghiệp như một Ứng dụng Mục tiêu (Corporate Proposal Drafting as a Target Application)

Chúng tôi nhấn mạnh việc soạn thảo đề xuất doanh nghiệp (corporate proposal drafting) như một ứng dụng thực tế đầy tiềm năng cho việc tăng cường truy xuất đa cơ sở tri thức có trọng số. Trong nhiều tổ chức, các nhóm đề xuất phải chuẩn bị các phản hồi chi tiết cho các Yêu cầu Chào thầu (Request for Proposals - RFP) do chính phủ hoặc khách hàng thương mại ban hành. Các bản đề xuất này là những tài liệu có giá trị rất cao: chúng phải có tính thuyết phục, được neo giữ trên các sự kiện chuẩn xác, tuân thủ nghiêm ngặt các yêu cầu của hồ sơ mời thầu, và được điều chỉnh riêng theo từng khách hàng, đồng thời phải phản ánh năng lực công ty, thành tích trong quá khứ, các ràng buộc về giá cả và phong cách tổ chức. Kết quả là, việc soạn thảo đề xuất vừa tiêu tốn lượng tài liệu khổng lồ vừa phụ thuộc rất lớn vào truy xuất.

- **Tại sao việc soạn thảo đề xuất lại đầy thách thức:** Soạn thảo một bản đề xuất có tính cạnh tranh rất tốn thời gian vì thông tin liên quan nằm phân tán trên nhiều nguồn nội bộ không đồng nhất. Người viết phải xác định nội dung có thể tái sử dụng từ:
  - Các phản hồi đề xuất trước đây,
  - Hợp đồng cũ,
  - Tài liệu tuân thủ,
  - Sách trắng kỹ thuật,
  - Tài liệu định giá,
  - Hồ sơ năng lực công ty,
  - Các tài liệu đặc thù của từng cơ quan khách hàng.
  
  Sau đó, họ phải chuyển hóa những bằng chứng đó thành một câu trả lời mạch lạc. Trong thực tế, chất lượng không chỉ phụ thuộc vào việc tìm ra các đoạn văn bản có liên quan, mà còn ở việc cân bằng bằng chứng từ nhiều nguồn, duy trì tính nhất quán về sự kiện, thỏa mãn các ràng buộc tuân thủ và tùy biến bản thảo theo đúng hồ sơ mời thầu. Những đặc tính này biến việc soạn thảo đề xuất trở thành một ví dụ thực tế điển hình cho bài toán tổng quát được nghiên cứu trong bài báo này.

- **Bối cảnh Triển khai:** Quy trình làm việc thực tế được quan sát tại các nhóm chuyên trách đấu thầu và đề xuất nội bộ chịu trách nhiệm phản hồi các hồ sơ mời thầu của các cơ quan dân sự và Bộ Quốc phòng Hoa Kỳ (DoD). Người dùng bao gồm khoảng **15 nhân sự nội bộ** thuộc ba nhóm chức năng:
  1. Giám đốc đề xuất (Proposal managers),
  2. Kiến trúc sư giải pháp / kỹ thuật (Technical or solution architects),
  3. Chuyên viên phát triển kinh doanh (Business development professionals).
  
  Các nhóm làm việc trên các đề xuất bao trùm: phát triển và hiện đại hóa ứng dụng, dịch vụ hỗ trợ CNTT và bàn trợ giúp (service desk), cũng như chuyển đổi và hiện đại hóa đám mây. Các nguồn tri thức nội bộ được sử dụng bao gồm các đề xuất cũ, hợp đồng đã ký, hồ sơ năng lực, sách trắng và tài liệu định hướng tư tưởng, tài liệu định giá, tài liệu tuân thủ và quy định của công ty, tài liệu chuyên biệt của cơ quan khách hàng và các ấn phẩm đồ họa.

- **Quy trình Làm việc (Workflow):** Quy trình soạn thảo từ đầu đến cuối là một hệ thống có sự tham gia của con người trong vòng lặp (human-in-the-loop). Người dùng bắt đầu bằng cách nhập một bản tóm tắt RFP hoặc yêu cầu đề xuất. Hệ thống truy xuất sau đó xác định các tài liệu nội bộ có liên quan từ các cơ sở tri thức hiện có và soạn thảo một hoặc nhiều phần của bản đề xuất. Bản thảo kết quả được xem xét và chỉnh sửa bởi nhóm đề xuất — những người sẽ tinh chỉnh ngôn từ, thêm các định vị riêng của tổ chức, điều chỉnh cấu trúc khi cần thiết và hoàn thiện gói hồ sơ nộp thầu. Do đó, hệ thống vận hành như một **trợ lý soạn thảo** thay vì một cỗ máy tạo đề xuất hoàn toàn tự động.

- **Lợi ích Vận hành Quan sát được:** Trong giai đoạn 2025–2026, quy trình soạn thảo đề xuất có hỗ trợ truy xuất mở rộng đã được sử dụng trong một môi trường nội bộ liên tục. Người dùng ghi nhận những lợi ích hiệu quả đáng kể:
  - Tiết kiệm khoảng **12–18 giờ** làm việc cho mỗi nhóm mỗi tuần, một số báo cáo chỉ ra mức tiết kiệm lên tới **20–25 giờ** trong giai đoạn thử nghiệm beta.
  - Tốc độ hoàn thành đề xuất nhanh hơn tới **3 lần** ($3\times$ faster).
  - Thời gian chuẩn bị bản thảo đầu tiên giảm tới **80%** trong một số trường hợp.
  - Tỷ lệ chấp nhận bản thảo rất cao đối với các bản thảo sớm ("pink drafts"), với việc người dùng cho biết **90–100%** nội dung bản thảo thường được chấp nhận làm điểm khởi đầu tốt cho các khâu tinh chỉnh tiếp theo.
  - Gánh nặng chỉnh sửa tương đối thấp đối với các phần mà hệ thống có thể dựa nhiều vào tri thức nội bộ đã được kiểm duyệt và cấu trúc tài liệu định hướng tuân thủ.

- **Các Phần Nội dung Tạo sinh Hữu ích nhất:** Người dùng nhận thấy hệ thống đặc biệt hữu ích cho các phần phụ thuộc nhiều vào tri thức tổ chức có thể tái sử dụng, bao gồm:
  - Năng lực thực hiện trong quá khứ (past performance),
  - Các tập tài liệu kỹ thuật (technical volumes),
  - Các tập tài liệu quản trị (management volumes),
  - Nội dung các vùng nhiệm vụ cụ thể (task-area content).
  
  Họ cũng cho biết việc tạo ra một tệp tài liệu Word hoàn chỉnh mang lại giá trị vận hành rất lớn vì nó cắt giảm công sức thiết lập thủ công các mẫu biểu và cấu trúc. Cấu trúc tài liệu thường đạt độ tuân thủ rất cao với các yêu cầu của hồ sơ mời thầu, giúp giảm thiểu chi phí định dạng và rà soát tuân thủ trong giai đoạn soạn thảo ban đầu.

- **Nơi Con người Vẫn Bắt buộc Phải Can thiệp:** Bất chấp những lợi ích to lớn trên, sự xem xét của chuyên gia vẫn là thiết yếu. Người dùng đồng thuận cao rằng các phần sau đòi hỏi sự tham gia đáng kể của con người:
  - Tóm tắt dành cho lãnh đạo điều hành (executive summaries),
  - Các điểm khác biệt cốt lõi của công ty (company differentiators),
  - Chủ đề chiến thắng (win themes),
  - Kế hoạch bố trí nhân sự (staffing plans).
  
  Các thành phần này phụ thuộc vào chiến lược cạnh tranh, tri thức ngầm của tổ chức (tacit organizational knowledge), kế hoạch nhân sự động và các dạng thông tin thường ít khi được biểu diễn rõ ràng trong các kho tài liệu có thể truy xuất. Cụ thể, các bản tóm tắt điều hành xuất sắc và các tuyên bố khác biệt đòi hỏi nghệ thuật định vị mang tính thuyết phục cao được may đo riêng cho từng gói thầu, trong khi kế hoạch nhân sự lại quá biến động để có thể giao phó hoàn toàn cho hệ thống tự động.

- **Mối liên hệ với W-RAG:** Cần phân biệt rõ quy trình vận hành nêu trên với phương pháp cụ thể được đề xuất trong bài báo này. Hệ thống phục vụ sản xuất được mô tả ở đây là một quy trình soạn thảo có hỗ trợ truy xuất, nhưng bản thân W-RAG vẫn chưa được triển khai hoàn toàn trên môi trường vận hành thực tế. Do đó, các số liệu hiệu quả vận hành ở trên nên được hiểu là minh chứng cho thấy việc soạn thảo đề xuất doanh nghiệp là một tình huống ứng dụng có giá trị cao và liên quan mật thiết về mặt thực tiễn cho RAG, chứ không phải là đánh giá nhân quả trực tiếp của W-RAG. Trong bài báo này, chúng tôi đánh giá W-RAG ngoại tuyến (offline) trên một bộ dữ liệu soạn thảo đề xuất và chứng minh rằng việc truy xuất đa KB có gán trọng số giúp cải thiện chất lượng tài liệu và mức độ sử dụng bằng chứng so với các đường cơ sở tiêu chuẩn. Chúng tôi xem quy trình thực tế này là bối cảnh triển khai truyền cảm hứng và các kết quả ngoại tuyến là bằng chứng cho thấy W-RAG là bước nâng cấp đầy hứa hẹn cho các môi trường như vậy.

- **Bài học Rút ra (Takeaway):** Nhìn chung, quy trình soạn thảo đề xuất doanh nghiệp minh họa lý do tại sao việc truy xuất đa KB có gán trọng số lại đóng vai trò sống còn trong việc tạo tài liệu doanh nghiệp. Soạn thảo đề xuất không đơn thuần là một bài toán tìm kiếm và cũng không chỉ là bài toán tạo văn bản: nó đòi hỏi việc tích hợp các bằng chứng nội bộ không đồng nhất vào một bản thảo có tính tuân thủ, có thể tùy biến và mang đặc trưng riêng của tổ chức, đồng thời vẫn bảo toàn quyền kiểm soát của con người đối với nội dung cuối cùng. Điều này biến nó trở thành một ứng dụng mục tiêu tự nhiên cho W-RAG.

---

### A.7 Hướng dẫn Xác thực Thủ công (Manual Validation Instructions)

Để đảm bảo độ tin cậy của đánh giá, tất cả các điểm số Mức độ Thỏa mãn Yêu cầu và Độ phù hợp Ngữ cảnh do LLM chấm đều được xác thực thủ công bởi **2 người thẩm định**. Các chuyên gia thẩm định được hướng dẫn rà soát tài liệu được tạo ra đối chiếu với danh sách kiểm tra yêu cầu theo từng mục một, một cách độc lập, dựa trên biểu điểm sau:
1. **Có (Yes):** Yêu cầu được giải quyết một cách rõ ràng và thỏa đáng trong tài liệu được tạo ra.
2. **Không (No):** Yêu cầu vắng mặt hoặc được đề cập không đầy đủ.

Các chuyên gia được yêu cầu tập trung vào **độ bao phủ nội dung**, không đánh giá phong cách hành văn. Họ cũng được chỉ dẫn đánh giá độc lập từng mục trong danh sách kiểm tra và không cho điểm đối với những từ ngữ rộng nhưng mơ hồ, trừ khi yêu cầu đó thực sự được giải quyết một cách cụ thể.

---

## Chi tiết các Hình ảnh và Tài liệu Minh họa trong Bài báo

### Hình 1: Ảnh hưởng của Cơ sở Tri thức giữa các Miền (Knowledge-base influence across domains)
*(Knowledge-base influence across domains. Solid lines denote prescribed KB weights at retrieval time, and dotted lines denote realized KB attribution in the generated output. Colors correspond to document types: Blue: Policies, Orange: Product Launch, Green: M&A, Yellow: Academic Programs. Weights (Y-axis) range 0 to 50%.)*

**Mô tả:** Đồ thị thể hiện mức độ ảnh hưởng của các cơ sở tri thức trên 4 miền (AI Technology & Digital Media, Climate & Sustainability, Healthcare & Telehealth, Finance). Trục hoành biểu thị 4 cơ sở tri thức:
- KB1 (Corporate - Doanh nghiệp)
- KB2 (Scientific - Khoa học)
- KB3 (Regulatory - Pháp lý)
- KB4 (Market - Thị trường)

Trục tung biểu thị tỷ lệ phần trăm phân bổ trọng số (0% đến 50%). Đường nét liền biểu diễn trọng số KB được chỉ định tại thời điểm truy xuất, và đường nét đứt biểu diễn mức độ quy gán KB thực nhận trong văn bản sinh ra. Màu sắc đại diện cho các loại tài liệu:
- Xanh dương: Chính sách (Policies)
- Cam: Ra mắt sản phẩm (Product Launch)
- Xanh lá: Mua bán & sáp nhập (M&A)
- Vàng: Chương trình học thuật (Academic Programs)

Kết quả cho thấy đường nét đứt bám rất sát đường nét liền, chứng minh năng lực kiểm soát thành phần nguồn tri thức của W-RAG.

---

### Hình 2: Tài liệu Yêu cầu Quản trị AI Tạo sinh Doanh nghiệp Mẫu (Sample Enterprise Generative AI Governance Policy Requirement Documentation)

*Tài liệu yêu cầu đầu vào mẫu từ tập con Chính sách (Policies) của bộ chuẩn đối sánh. Tài liệu chỉ định cấu trúc bắt buộc và các yếu tố nội dung cốt lõi mà chính sách doanh nghiệp được tạo ra phải bao quát.*

Báo cáo phải là một tài liệu có cấu trúc bao gồm bốn phần bắt buộc sau:

#### 1. Phạm vi, Mục tiêu & Quản trị (Scope, Objectives & Governance)
- **Phạm vi chính sách:** các hệ thống thuộc phạm vi điều chỉnh (trợ lý dựa trên LLM, giao diện prompt, tầng điều phối - orchestration layer), các đơn vị kinh doanh và phạm vi địa lý.
- **Mục tiêu:** nâng cao năng suất, giảm thiểu rủi ro so với việc sử dụng không kiểm soát, căn chỉnh phù hợp với khẩu vị rủi ro của tổ chức.
- **Cấu trúc quản trị:** Ủy ban Rủi ro AI (AI Risk Committee), vai trò của Ban Quản trị Rủi ro Tập đoàn (Group Risk), CNTT (IT), Dữ liệu (Data), Pháp lý/Tuân thủ (Legal/Compliance) và các Chủ sở hữu Nghiệp vụ (Business Owners).
- **Quyền sở hữu chính sách, chu kỳ rà soát:** (ví dụ: hàng năm hoặc khi có những thay đổi lớn về công nghệ/quy định pháp lý), và quy trình báo cáo chuyển cấp (escalation paths).
- **Mối quan hệ với các chính sách hiện hành:** An toàn Thông tin (Information Security), Rủi ro Mô hình (Model Risk), Thuê ngoài/Bên thứ ba (Outsourcing/Third Parties), Bảo vệ Dữ liệu (Data Protection), Quy tắc Ứng xử & Đạo đức nghề nghiệp (Conduct & Ethics).

#### 2. Các Biện pháp Kiểm soát Dữ liệu, Quyền riêng tư & Bảo mật (Data, Privacy & Security Controls)
- **Quy tắc phân loại dữ liệu cho prompt và kết quả đầu ra:** (ví dụ: nghiêm cấm đưa bí mật kinh doanh, dữ liệu định danh cá nhân - PII, chiến lược giao dịch, mã định danh khách hàng vào các LLM bên ngoài).
- **Các loại dữ liệu được phép so với không được phép theo hình thức triển khai:** (tại chỗ - on-premise so với đám mây công cộng - public cloud, đơn người thuê - single-tenant so với chia sẻ - shared).
- **Tiêu chuẩn giảm thiểu dữ liệu và vệ sinh prompt (prompt hygiene):** kỹ thuật làm mờ (redaction), che mặt nạ dữ liệu (masking), và sử dụng dữ liệu tổng hợp (synthetic data) khi khả thi.
- **Các biện pháp kiểm soát an ninh:** mã hóa, phân đoạn mạng, kiểm soát truy cập, ghi nhật ký (logging) và giám sát.
- **Kiểm soát truyền dữ liệu xuyên biên giới:** bao gồm các yêu cầu về hàng rào địa lý (geofencing) và lưu trữ dữ liệu tại máy chủ khu vực (regional hosting).
- **Yêu cầu về quyền riêng tư và tính bảo mật theo từng khu vực tài phán:** (GDPR, UK GDPR, GLBA, các đạo luật bí mật ngân hàng địa phương).

#### 3. Vòng đời Mô hình, Chất lượng & An toàn (Model Lifecycle, Quality & Safety)
- **Tìm kiếm nguồn cung và phê duyệt mô hình:** tiêu chí lựa chọn nhà cung cấp LLM; thẩm định chu đáo (due diligence) về dữ liệu huấn luyện, bảo mật và độ tin cậy.
- **Căn chỉnh với Khung Quản trị Rủi ro Mô hình (Model Risk Management):** phân loại các công cụ AI tạo sinh dưới dạng mô hình (models) so với công cụ hỗ trợ (tools); kỳ vọng kiểm định đối với các tình huống sử dụng có rủi ro cao.
- **Các danh mục sử dụng được phép so với bị nghiêm cấm:** (ví dụ: không sử dụng cho các quyết định tín dụng tự động không có giám sát, tư vấn pháp lý, khuyến nghị đầu tư hoặc báo cáo theo quy định bắt buộc).
- **Yêu cầu về con người can thiệp trực tiếp (Human-in-the-loop) và con người giám sát vòng lặp (human-on-the-loop):** áp dụng bắt buộc cho các tình huống kinh doanh trọng yếu.
- **Kiểm soát ảo giác / độ tin cậy của đầu ra:** bắt buộc trích dẫn nguồn cho các tác vụ khai thác tri thức nội bộ, hiển thị tuyên bố miễn trừ trách nhiệm (disclaimers) cho các kết quả đầu ra.
- **Kiểm thử, giám sát và đánh giá hiệu năng:** kiểm thử trước khi triển khai, giám sát liên tục, phát hiện hiện tượng trôi dạt (drift)/các dạng lỗi, và thiết lập ngưỡng cảnh báo sự cố.

#### 4. Triển khai, Giám sát & Tuân thủ (Implementation, Monitoring & Compliance)
- **Quy trình tiếp nhận (onboarding) cho các trường hợp sử dụng AI tạo sinh mới:** các biểu mẫu đánh giá rủi ro, phê duyệt và lập hồ sơ chứng từ.
- **Quản lý truy cập người dùng:** điều kiện đủ, yêu cầu đào tạo bắt buộc, cơ chế thu hồi quyền truy cập.
- **Đào tạo & nâng cao nhận thức:** các mô-đun học trực tuyến bắt buộc, hướng dẫn sử dụng được chấp nhận, đào tạo chuyên sâu theo từng vai trò.
- **Giám sát & báo cáo:** ghi nhật ký tập trung, trang tổng quan theo dõi mức độ sử dụng theo đơn vị kinh doanh/khu vực/trường hợp sử dụng, kích hoạt cảnh báo vi phạm chính sách.
- **Quản lý sự cố:** định nghĩa và xử lý các sự cố liên quan đến AI (rò rỉ dữ liệu, đầu ra gây hại, vi phạm tuân thủ).
- **Đảm bảo & kiểm toán:** phạm vi kiểm toán nội bộ, mức độ sẵn sàng cho các đợt kiểm tra của cơ quan quản lý, lưu giữ bằng chứng, xác định các chỉ số KPI/KRI.

---

### Hình 3: Mẫu Câu lệnh LLM-as-a-Judge cho Mức độ Thỏa mãn Yêu cầu (Sample LLM-as-a-Judge Prompt for Requirement Satisfaction)

```text
Sample LLM-as-a-Judge Prompt for Requirement Satisfaction
You are evaluating whether a generated enterprise document satisfies the essential requirements of the requested document type.
You are given:
(1) The input requirement document
(2) The generated enterprise document
(3) A checklist of essential requirements
For each checklist item, assign one of the following labels:
(1) Full: the requirement is clearly and adequately satisfied
(2) Partial: the requirement is mentioned but incomplete or underspecified
(3) None: the requirement is absent or not meaningfully addressed
Convert these labels into scores:
(1) Full = full points
(2) Partial = half points
(3) None = zero points
Judge each checklist item independently. Focus on whether the required content is present, not on writing style or fluency.
Return the item-level scores and the total score.
```

**Bản dịch tiếng Việt của câu lệnh:**
> **Câu lệnh Mẫu LLM Đóng vai trò Giám khảo để Đánh giá Mức độ Thỏa mãn Yêu cầu**  
> Bạn đang đánh giá xem một tài liệu doanh nghiệp được tạo ra có thỏa mãn các yêu cầu thiết yếu của loại tài liệu được yêu cầu hay không.  
> Bạn được cung cấp:  
> (1) Tài liệu yêu cầu đầu vào  
> (2) Tài liệu doanh nghiệp được tạo ra  
> (3) Danh mục kiểm tra các yêu cầu thiết yếu  
> Đối với mỗi mục trong danh mục kiểm tra, hãy gán một trong các nhãn sau:  
> (1) **Full (Đầy đủ):** yêu cầu được giải quyết rõ ràng và thỏa đáng  
> (2) **Partial (Một phần):** yêu cầu được đề cập đến nhưng chưa đầy đủ hoặc thiếu chi tiết  
> (3) **None (Không có):** yêu cầu hoàn toàn vắng mặt hoặc không được giải quyết một cách có ý nghĩa  
> Chuyển đổi các nhãn này thành điểm số:  
> (1) Full = trọn điểm  
> (2) Partial = nửa điểm  
> (3) None = 0 điểm  
> Hãy đánh giá độc lập từng mục trong danh sách kiểm tra. Tập trung vào việc nội dung yêu cầu có hiện diện hay không, không đánh giá văn phong hay độ trôi chảy.  
> Trả về điểm số chi tiết cho từng mục và tổng điểm cuối cùng.

---

### Hình 4: Mẫu Câu lệnh LLM-as-a-Judge cho Độ phù hợp Ngữ cảnh (Sample LLM-as-a-Judge Prompt for Context Relevancy)

```text
Sample LLM-as-a-Judge Prompt for Context Relevancy
You are evaluating whether retrieved passages are relevant to an enterprise document drafting task.
You are given: (1) The input requirement document (2) A retrieved passage
Determine whether the passage is relevant to drafting the requested document.
Label the passage as:
(1) Relevant: the passage provides useful evidence for satisfying one or more required parts of the target document.
(2) Not Relevant: the passage is only loosely related, redundant, or does not materially help with the drafting task
Focus on task usefulness rather than general topical similarity. A passage may be relevant even if it supports only one section of the document.
```

**Bản dịch tiếng Việt của câu lệnh:**
> **Câu lệnh Mẫu LLM Đóng vai trò Giám khảo để Đánh giá Độ phù hợp Ngữ cảnh**  
> Bạn đang đánh giá xem các đoạn văn bản được truy xuất có liên quan đến một nhiệm vụ soạn thảo tài liệu doanh nghiệp hay không.  
> Bạn được cung cấp: (1) Tài liệu yêu cầu đầu vào (2) Một đoạn văn bản được truy xuất  
> Hãy xác định xem đoạn văn bản đó có liên quan đến việc soạn thảo tài liệu được yêu cầu hay không.  
> Dán nhãn đoạn văn bản là:  
> (1) **Relevant (Có liên quan):** đoạn văn bản cung cấp bằng chứng hữu ích để thỏa mãn một hoặc nhiều phần bắt buộc của tài liệu mục tiêu.  
> (2) **Not Relevant (Không liên quan):** đoạn văn bản chỉ có liên hệ lỏng lẻo, dư thừa hoặc không giúp ích đáng kể cho nhiệm vụ soạn thảo.  
> Tập trung vào mức độ hữu ích đối với tác vụ hơn là sự tương đồng chung về mặt chủ đề. Một đoạn văn bản vẫn có thể được xem là có liên quan ngay cả khi nó chỉ hỗ trợ cho duy nhất một phần của tài liệu.

---

### Hình 5: Nghiên cứu Kiểm soát Ghi đè Trọng số KB đối với Tài liệu Chính sách (Controlled KB weight-override study on Policies across all domains)
*(Figure 5: Controlled KB weight-override study on Policies across all domains. Solid denotes one prescribed input KB distribution, constructed as a permutation of (40, 35, 20, 5), and the corresponding dotted curve denotes the realized KB attribution in the generated output.)*

**Mô tả:** Nghiên cứu thực nghiệm có kiểm soát ghi đè trọng số trên loại tài liệu Chính sách xuyên suốt cả bốn lĩnh vực. Các đường nét liền biểu thị phân phối KB đầu vào quy định, được xây dựng dưới dạng một hoán vị của tập hợp trọng số `(40, 35, 20, 5)`. Đường cong nét đứt tương ứng biểu thị mức độ quy gán KB thực nhận trong văn bản đầu ra được tạo ra. Sự biến thiên song hành của đường nét đứt theo đường nét liền chứng minh một cách thuyết phục rằng mô hình tạo sinh chịu sự chi phối mạnh mẽ và có thể điều hướng được thông qua tỷ lệ phân bổ ngữ cảnh đầu vào giữa các cơ sở tri thức khác nhau.
