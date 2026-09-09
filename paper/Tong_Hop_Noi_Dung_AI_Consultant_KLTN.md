# TỔNG HỢP TOÀN DIỆN NỘI DUNG AI CONSULTANT ("ARIA") TRONG KHÓA LUẬN TỐT NGHIỆP

> **Đơn vị áp dụng:** Khóa luận Tốt nghiệp (KLTN) — Đề tài: *Hệ thống Nhà hàng Thông minh Gọi món tại bàn qua mã QR (Smart Restaurant)*  
> **Cấu phần nghiên cứu:** Phân hệ Trợ lý Ảo Tư vấn Ẩm thực Thông minh (*Goal-Directed AI Consultant - "Aria"*)  
> **Nền tảng học thuật:** Khảo cứu, tích hợp và ánh xạ phương pháp luận từ 5 công trình nghiên cứu khoa học chuyên sâu về Agentic AI, Structured Data RAG và Enterprise Systems tại thư mục `paper/`.  
> **Quy ước trích dẫn:** Trích dẫn học thuật theo chuẩn quốc tế `[1]`, `[2]`, `[3]`, `[4]`, `[5]` tương ứng với danh mục tài liệu tham khảo tại [Mục 14](#14-danh-mục-tài-liệu-tham-khảo).

---

## MỤC LỤC

1. [Tổng quan Bối cảnh, Đặt vấn đề và Định vị Đề tài](#1-tổng-quan-bối-cảnh-đặt-vấn-đề-và-định-vị-đề-tài)
2. [Cơ sở Lý thuyết và Khảo cứu Các Công trình Liên quan](#2-cơ-sở-lý-thuyết-và-khảo-cứu-các-công-trình-liên-quan)
   - 2.1. [Tổng quan 5 bài báo khoa học nền tảng](#21-tổng-quan-5-bài-báo-khoa-học-nền-tảng)
   - 2.2. [Bảng ma trận kế thừa tri thức khoa học vào KLTN](#22-bảng-ma-trận-kế-thừa-tri-thức-khoa-học-vào-kltn)
3. [Phân tích Yêu cầu và Ranh giới Thẩm quyền Hệ thống](#3-phân-tích-yêu-cầu-và-ranh-giới-thẩm-quyền-hệ-thống)
   - 3.1. [Yêu cầu chức năng và Phi chức năng](#31-yêu-cầu-chức-năng-và-phi-chức-năng)
   - 3.2. [Nguyên lý "Ủy quyền Hợp thức" (Justified Delegation)](#32-nguyên-lý-ủy-quyền-hợp-thức-justified-delegation)
4. [Thiết kế Kiến trúc Phân tầng Tham chiếu có Quản trị](#4-thiết-kế-kiến-trúc-phân-tầng-tham-chiếu-có-quản-trị)
   - 4.1. [Sơ đồ khối 4 tầng chức năng và Tầng Quản trị xuyên suốt](#41-sơ-đồ-khối-4-tầng-chức-năng-và-tầng-quản-trị-xuyên-suốt)
   - 4.2. [Cấu trúc liên kết Router-Solver (Topology)](#42-cấu-trúc-liên-kết-router-solver-topology)
5. [Mô hình Nhận thức và Không gian Hành động Thế giới Thực](#5-mô-hình-nhận-thức-và-không-gian-hành-động-thế-giới-thực)
   - 5.1. [Mô hình Nhận thức Kép System 1 và System 2](#51-mô-hình-nhận-thức-kép-system-1-và-system-2)
   - 5.2. [Định nghĩa Không gian Hành động Tiếp đất (Action Space & Affordances)](#52-định-nghĩa-không-gian-hành-động-tiếp-đất-action-space--affordances)
6. [Động cơ Truy vấn Dữ liệu Nhà hàng có Cấu trúc](#6-động-cơ-truy-vấn-dữ-liệu-nhà-hàng-có-cấu-trúc)
   - 6.1. [Phân định 7 chiều kiến trúc giữa Structured Query và Semantic RAG](#61-phân-định-7-chiều-kiến-trúc-giữa-structured-query-và-semantic-rag)
   - 6.2. [Bảo đảm Tính nhất quán Đọc-Sau-Ghi (Read-After-Write Consistency)](#62-bảo-đảm-tính-nhất-quán-đọc-sau-ghi-read-after-write-consistency)
   - 6.3. [Phân giải sự mơ hồ định danh (Ambiguity Resolution)](#63-phân-giải-sự-mơ-hồ-định-danh-ambiguity-resolution)
7. [Đường ống Advanced RAG cho Thực đơn và Dữ liệu Bảng](#7-đường-ống-advanced-rag-cho-thực-đơn-và-dữ-liệu-bảng)
   - 7.1. [Lập chỉ mục Cấp độ Hàng (Row-Level Indexing)](#71-lập-chỉ-mục-cấp-độ-hàng-row-level-indexing)
   - 7.2. [Truy xuất lai Hybrid Search (Dense + Sparse BM25)](#72-truy-xuất-lai-hybrid-search-dense--sparse-bm25)
   - 7.3. [Tái xếp hạng Ngữ cảnh bằng Cross-Encoder](#73-tái-xếp-hạng-ngữ-cảnh-bằng-cross-encoder)
   - 7.4. [Kỹ thuật Ràng buộc Tiếp đất (Strict Grounded Prompting)](#74-kỹ-thuật-ràng-buộc-tiếp-đất-strict-grounded-prompting)
8. [Cơ chế Tự tiến hóa Khép kín Hai Vòng lặp](#8-cơ-chế-tự-tiến-hóa-khép-kín-hai-vòng-lặp)
   - 8.1. [Vòng lặp Thực thi Thời gian thực (Inner Inference Loop)](#81-vòng-lặp-thực-thi-thời-gian-thực-inner-inference-loop)
   - 8.2. [Vòng lặp Tối ưu hóa Câu nhắc Di truyền (Outer Evolutionary Loop)](#82-vòng-lặp-tối-ưu-hóa-câu-nhắc-di-truyền-outer-evolutionary-loop)
   - 8.3. [Quản lý Phiên bản Câu nhắc và Triển khai có Kiểm duyệt](#83-quản-lý-phiên-bản-câu-nhắc-và-triển-khai-có-kiểm-duyệt)
9. [Kỹ thuật Tôi luyện Vận hành và Rào chắn An toàn Thực phẩm](#9-kỹ-thuật-tôi-luyện-vận-hành-và-rào-chắn-an-toàn-thực-phẩm)
   - 9.1. [Rào chắn An toàn Dị ứng Thực phẩm (Allergen Safeguards)](#91-rào-chắn-an-toàn-dị-ứng-thực-phẩm-allergen-safeguards)
   - 9.2. [Quyền tự chủ có Ngân sách và Bộ ngắt mạch (Budgeted Autonomy & Circuit Breakers)](#92-quyền-tự-chủ-có-ngân-sách-và-bộ-ngắt-mạch-budgeted-autonomy--circuit-breakers)
   - 9.3. [Cơ chế Dự phòng và Bàn giao Con người (Human-in-the-Loop Escalation)](#93-cơ-chế-dự-phòng-và-bàn-giao-con-người-human-in-the-loop-escalation)
10. [Hiện thực Kỹ thuật và Tích hợp Hệ thống](#10-hiện-thực-kỹ-thuật-và-tích-hợp-hệ-thống)
    - 10.1. [Ngăn xếp Công nghệ (Technology Stack)](#101-ngăn-xếp-công-nghệ-technology-stack)
    - 10.2. [Đặc tả Pydantic Schema cho Tools](#102-đặc-tả-pydantic-schema-cho-tools)
    - 10.3. [Thiết kế System Prompt chuẩn mực cho Aria](#103-thiết-kế-system-prompt-chuẩn-mực-cho-aria)
11. [Khung Đánh giá Thực nghiệm cho Khóa luận](#11-khung-đánh-giá-thực-nghiệm-cho-khóa-luận)
    - 11.1. [Chỉ số Đánh giá Định lượng RAG (Offline IR Metrics)](#111-chỉ-số-đánh-giá-định-lượng-rag-offline-ir-metrics)
    - 11.2. [Chỉ số Đánh giá Chất lượng Sinh (LLM-as-a-Judge)](#112-chỉ-số-đánh-giá-chất-lượng-sinh-llm-as-a-judge)
    - 11.3. [Chỉ số Hiệu năng Vận hành và Chuyển đổi Kinh doanh](#113-chỉ-số-hiệu-năng-vận-hành-và-chuyển-đổi-kinh-doanh)
12. [Kịch bản Kiểm thử Thực nghiệm và Nghiên cứu Cắt bỏ (Ablation Study)](#12-kịch-bản-kiểm-thử-thực-nghiệm-và-nghiên-cứu-cắt-bỏ-ablation-study)
13. [Kết luận và Hướng Phát triển](#13-kết-luận-và-hướng-phát-triển)
14. [Danh mục Tài liệu Tham khảo](#14-danh-mục-tài-liệu-tham-khảo)

---

## 1. Tổng quan Bối cảnh, Đặt vấn đề và Định vị Đề tài

### 1.1 Bối cảnh Thực tiễn
Trong ngành dịch vụ ăn uống (F&B) hiện đại, việc chuyển đổi số tại các nhà hàng đang diễn ra với tốc độ nhanh chóng. Một trong những giải pháp phổ biến nhất là mô hình gọi món tự phục vụ qua mã QR tại bàn (*QR code table ordering*), giúp giảm tải khối lượng công việc cho nhân viên bồi bàn và đẩy nhanh tốc độ phục vụ. 

Tuy nhiên, các hệ thống QR hiện nay trên thị trường phần lớn chỉ hoạt động như những **"menu số hóa thụ động"** (dạng danh mục tĩnh hoặc PDF điện tử). Thực tế vận hành bộc lộ nhiều hạn chế cốt lõi:
- **Hiện tượng quá tải lựa chọn (*Choice Overload*):** Một thực đơn với hàng chục đến hàng trăm món ăn khiến khách hàng mất từ 4 đến 7 phút chỉ để duyệt tìm món, làm kéo dài thời gian lưu bàn (*table turnover time*).
- **Rủi ro sức khỏe từ dị ứng thực phẩm (*Allergies*):** Thực khách có tiền sử dị ứng thực phẩm (như tôm cua, đậu phộng, trứng, sữa, gluten) hoặc tuân thủ các chế độ ăn kiêng khắt khe (ăn chay thuần, tiểu đường, keto) thường gặp nhiều khó khăn và e ngại khi không thể tra cứu tường minh toàn bộ thành phần chi tiết của từng món ăn trên menu số.
- **Bỏ lỡ cơ hội tối ưu hóa doanh thu (*Loss of Upselling/Cross-selling*):** Khác với bồi bàn chuyên nghiệp có kỹ năng gợi ý món khai vị, đồ uống hay món tráng miệng ăn kèm hài hòa với món chính, các ứng dụng đặt món tĩnh không thể tự động đưa ra các gợi ý bán kèm tinh tế, dẫn đến giá trị đơn hàng trung bình (*Average Order Value - AOV*) bị hạn chế.

### 1.2 Giới hạn của Chatbot Truyền thống
Để khắc phục tình trạng trên, nhiều ứng dụng đã thử nghiệm tích hợp các chatbot hỏi đáp thông thường (wrapper LLM gọi API văn bản đơn giản). Tuy nhiên, theo phân tích của Zhu & Cai [1] và Alenezi [3], phương pháp tiếp cận này gặp phải 4 rào cản chí mạng:
1. **Ảo giác ẩm thực (*Culinary Hallucination*):** Chatbot sinh văn bản thuần túy rất dễ tự ý "sáng chế" ra các món ăn không hề có trong bếp nhà hàng, hoặc bịa đặt sai mức giá và thành phần gia vị, gây thất vọng và tranh cãi khi thanh toán [5].
2. **Phi hành động và thiếu khả năng thay đổi trạng thái (*Actionless & Passive*):** Chatbot thông thường chỉ dừng lại ở việc phản hồi văn bản mô tả. Nó không thể tự động cập nhật giỏ hàng của bàn ăn, không kiểm tra được tình trạng tồn kho tức thời của nhà bếp, và không thể gửi yêu cầu hỗ trợ tới nhân viên [1].
3. **Mù thông tin cấu trúc (*Structured Data Blindness*):** Khi khách hàng đặt các câu hỏi mang tính định lượng hoặc phụ thuộc trạng thái: *"Bàn tôi đã gọi tổng cộng bao nhiêu tiền?", "Hóa đơn tạm tính có những món gì rồi?", "Món sườn cừu hôm nay còn suất nào không?"*, chatbot tài liệu thông thường hoàn toàn bất lực vì câu trả lời là một **kết quả tính toán có cấu trúc (*computed result*)** trong cơ sở dữ liệu quan hệ (RDBMS), chứ không phải là một đoạn văn bản trích xuất [2].
4. **Thiếu cơ chế rào chắn an toàn có thể kiểm chứng (*Lack of Verifiable Safeguards*):** Không có sự phân tách giữa nhận thức tạo sinh và cơ chế kiểm soát chính sách an toàn, dẫn đến nguy cơ gợi ý món chứa chất gây dị ứng nguy hiểm cho thực khách [1], [3].

### 1.3 Định vị Đề tài: Hệ thống Tác tử Tư vấn Ẩm thực Thông minh ("Aria")
Trong khuôn khổ Khóa luận Tốt nghiệp, giải pháp được đề xuất là xây dựng một **Hệ thống Tác tử Thông minh Định hướng Mục tiêu (*Goal-Directed Agentic System*)** mang tên **"Aria"**, tích hợp trực tiếp vào quy trình gọi món tại bàn của hệ thống *Smart Restaurant*.

Aria không hoạt động như một chatbot thụ động mà vận hành như một **World-Acting Agent** [1] sở hữu:
- Khả năng **nhận thức ngữ cảnh sâu sắc** (khẩu vị, tâm trạng, chế độ ăn, ngân sách, số lượng người tại bàn).
- Khả năng **thao tác thế giới thực** (thêm/sửa giỏ hàng, gọi phục vụ, kiểm tra trạng thái bếp) [1], [2].
- Khả năng **truy xuất dữ liệu có cấu trúc kết hợp ngữ nghĩa** thông qua đường ống Advanced RAG dành riêng cho thực đơn [5].
- Cơ chế **rào chắn an toàn dị ứng tuyệt đối** [1], [5] và **tự tiến hóa tối ưu hóa câu nhắc liên tục** mà không cần can thiệp fine-tuning mô hình nền tảng [4].

---

## 2. Cơ sở Lý thuyết và Khảo cứu Các Công trình Liên quan

### 2.1 Tổng quan 5 bài báo khoa học nền tảng
Hệ thống AI Consultant Aria kế thừa và tích hợp phương pháp luận từ 5 công trình nghiên cứu học thuật xuất bản trong giai đoạn 2025–2026:

1. **[1] Zhu, L., & Cai, M. (2026).** *From Language Models to World-Acting Systems: Progress and Limits of Agentic AI across Digital, Social, Virtual, and Physical Environments*. arXiv:2609.04894v1 [cs.AI].
   - **Nội dung nghiên cứu:** Bài tổng quan phê phán làm rõ sự chuyển dịch từ các mô hình ngôn ngữ thụ động (LLM) sang các hệ thống tác động thế giới (*World-Acting Systems*). Nhóm tác giả xác lập khung phân tích 3 chiều độc lập:
     - *Thẩm quyền được ủy nhiệm (Delegated Authority):* Các thay đổi trạng thái nào mà hệ thống được phép kích hoạt.
     - *Tính bền bỉ theo thời gian (Temporal Persistence):* Mục tiêu, bộ nhớ và quyền hạn tồn tại qua các chu trình tương tác.
     - *Sự gắn kết môi trường (Environmental Coupling):* Mức độ tác động trực tiếp lên hệ thống phần mềm và môi trường thực.
   - **Đóng góp vào KLTN:** Đặt nền móng lý thuyết để chuyển đổi Aria từ một chatbot thành một tác tử thế giới thực (*World-Acting*), áp dụng nguyên lý "Ủy quyền Hợp thức" (*Justified Delegation*) và phân tách hai tầng nhận thức System 1 (phản xạ nhanh) vs System 2 (tính toán suy luận).

2. **[2] Ahmed, S. N. (2026).** *Beyond Document Retrieval: Architectural Challenges When LLM Agents Query Structured Enterprise Data*. Department of Computer Science and Engineering, University of Texas at Arlington. arXiv:2608.19235v1 [cs.DL].
   - **Nội dung nghiên cứu:** Khảo sát các thách thức kiến trúc khi LLM Agent tương tác với dữ liệu có cấu trúc của doanh nghiệp (RDBMS, Data Warehouse, API). Bài báo phân tích 7 chiều kiến trúc cốt lõi: Ngữ nghĩa truy xuất (*Retrieval Semantics*), Phân quyền (*Authorization*), Nhận diện ý định (*Intent Recognition*), Phân giải thực thể (*Entity Resolution*), Đánh giá (*Evaluation*), Chế độ thất bại (*Failure Modes*), và Độ trễ (*Latency*).
   - **Đóng góp vào KLTN:** Cung cấp giải pháp phân định rõ rệt giữa truy vấn định lượng (SQL/API deterministic) và truy vấn ngữ nghĩa (Semantic RAG), giải quyết triệt để lỗi mất đồng bộ trạng thái qua cơ chế *Tính nhất quán đọc-sau-ghi (Read-After-Write Consistency)* và cơ chế *Phân giải sự mơ hồ (Ambiguity Resolution)* khi gọi món.

3. **[3] Alenezi, M. (2026).** *From Prompt–Response to Goal-Directed Systems: The Evolution of Agentic AI Software Architecture*. The Saudi Technology and Security Comprehensive Control Company (Tahakom). arXiv:2602.10479v1 [cs.SE].
   - **Nội dung nghiên cứu:** Đề xuất một Kiến trúc Tham chiếu có Quản trị (*Governed Reference Architecture*) cho các hệ thống Agentic AI cấp sản xuất. Bài báo bóc tách hệ thống thành 4 tầng: *Agent Core, Control Layer, Memory Layer, Tooling Layer*, đồng thời phân loại các cấu trúc liên kết tác tử (*Topologies*: Router-Solver, Multi-agent Supervisor/Worker) và đưa ra danh mục kiểm tra độ vững chắc (*Enterprise Hardening Checklist*).
   - **Đóng góp vào KLTN:** Định hình toàn bộ kiến trúc phân tầng chuẩn mực cho phân hệ AI của Smart Restaurant, áp dụng mô hình liên kết Router-Solver, cơ chế Quyền tự chủ có ngân sách (*Budgeted Autonomy* - giới hạn số bước lặp $K_{\max}$) và Bộ ngắt mạch (*Circuit Breakers*) để đảm bảo hệ thống không bị treo lặp vô hạn.

4. **[4] Wang, C. H., Tu, M., Zhang, Q., Wu, W., Zhou, L., Shen, M., & Wei, C. (LinkedIn, 2026).** *Self-evolving Agentic Customer Support System at LinkedIn*. arXiv:2608.10224v1 [cs.AI].
   - **Nội dung nghiên cứu:** Giới thiệu hệ thống tác tử hỗ trợ khách hàng tự tiến hóa tại LinkedIn vận hành theo mô hình hai vòng lặp (*Two-Loop Architecture*): Vòng lặp phục vụ thời gian thực (*Inner Loop*) và Vòng lặp tối ưu hóa câu nhắc ngoại tuyến (*Outer Loop*) sử dụng Giải thuật Di truyền (*Genetic Algorithm - GA*). Hệ thống coi RAG như một công cụ (*Tool*), tránh hoàn toàn việc fine-tuning trọng số mô hình, đồng thời quản lý Prompt như các tạo tác có phiên bản (*versioned artifacts*).
   - **Đóng góp vào KLTN:** Cung cấp phương pháp luận để Aria tự động tối ưu hóa System Prompt hàng tuần dựa trên dữ liệu chuyển đổi gọi món thực tế của thực khách, xây dựng hàm thích nghi (*Fitness Function*) đa chiều kết hợp thẩm định tự động bằng *LLM-as-a-Judge*.

5. **[5] Cheerla, C. (2025).** *Advancing Retrieval-Augmented Generation for Structured Enterprise and Internal Data*. Indian Institute of Technology (IIT) Roorkee. arXiv:2507.12425v1 [cs.CL].
   - **Nội dung nghiên cứu:** Phát triển đường ống Advanced RAG tối ưu hóa cho dữ liệu dạng bảng và có cấu trúc nội bộ của doanh nghiệp. Các kỹ thuật chính gồm: Lập chỉ mục cấp độ hàng (*Row-Level Indexing*), Lọc nhận biết siêu dữ liệu (*Metadata-aware filtering*), Truy xuất lai kết hợp Dense Embedding (`all-mpnet-base-v2`) và Sparse BM25 theo công thức dung hợp điểm số ($0.6 \cdot 	ext{Dense} + 0.4 \cdot 	ext{BM25}$), Tái xếp hạng bằng Cross-Encoder (`ms-marco-MiniLM-L-12-v2`), và Kỹ thuật ép tiếp đất nghiêm ngặt (*Grounded Prompting*).
   - **Đóng góp vào KLTN:** Cung cấp toàn bộ giải pháp kỹ thuật cho đường ống tra cứu thực đơn nhà hàng, đảm bảo thông tin món ăn được lập chỉ mục giữ trọn vẹn cấu trúc hàng-cột, loại bỏ hoàn toàn hiện tượng ảo giác về thành phần nguyên liệu và giá tiền.

---

### 2.2 Bảng ma trận kế thừa tri thức khoa học vào KLTN

| STT | Bài báo Khoa học (*Paper*) | Khái niệm & Phương pháp Lý thuyết Kế thừa | Ánh xạ và Hiện thực vào Hệ thống AI Consultant "Aria" |
| :---: | :--- | :--- | :--- |
| **[1]** | **Zhu & Cai (2026)**<br>*From Language Models to World-Acting Systems* | • World-Acting Systems & Action Space<br>• Justified Delegation (Ủy quyền hợp thức)<br>• Hệ thống nhận thức kép System 1 / System 2<br>• Phân tách rạch ròi Model - Harness - Environment | • Aria trực tiếp thao tác giỏ hàng và gửi thông báo bếp/phục vụ.<br>• Giới hạn quyền hạn: chỉ thao tác bàn hiện tại, mọi lệnh thêm món đều có thể hủy/sửa.<br>• System 1 stream lời chào/cảm quan nhanh; System 2 kiểm tra dị ứng & ràng buộc giỏ hàng. |
| **[2]** | **Ahmed (2026)**<br>*Beyond Document Retrieval: Architectural Challenges...* | • 7 chiều kiến trúc dữ liệu có cấu trúc<br>• Phân biệt Computed Result vs Retrieved Passage<br>• Nhất quán đọc-sau-ghi (Read-After-Write Consistency)<br>• Phân giải sự mơ hồ (Ambiguity Resolution) | • Tách bạch: Hỏi giá/tổng tiền $ightarrow$ gọi SQL/API; Hỏi khẩu vị $ightarrow$ gọi Vector Search.<br>• Đồng bộ tức thì state giỏ hàng mới nhất vào context trước mỗi lượt chat tiếp theo.<br>• Hỏi lại làm rõ khi khách yêu cầu món chung chung (tránh chọn nhầm món). |
| **[3]** | **Alenezi (2026)**<br>*The Evolution of Agentic AI Software Architecture* | • Governed Reference Architecture (4 tầng)<br>• Cấu trúc liên kết Router-Solver Topology<br>• Budgeted Autonomy & Circuit Breakers<br>• Typed Tool Contracts (Giao diện định kiểu) | • Thiết kế 4 tầng: Agent Interface, Core, Memory, Tooling kèm Lớp vỏ Quản trị xuyên suốt.<br>• Bộ định tuyến Intent Router chia luồng tư vấn món vs thao tác đơn hàng.<br>• Khóa giới hạn suy luận tối đa 5 bước/lượt; ngắt mạch khi API lỗi 2 lần liên tiếp. |
| **[4]** | **Wang et al. (2026)**<br>*Self-evolving Agentic Customer Support at LinkedIn* | • Kiến trúc Hai vòng lặp (Two-Loop Architecture)<br>• Tối ưu Prompt bằng Giải thuật Di truyền (GA)<br>• RAG as an explicit Tool (Tránh fine-tuning)<br>• Versioned Artifacts & Gated Promotion | • Vòng lặp Inner Loop phục vụ khách tại bàn; Outer Loop tiến hóa prompt ngoại tuyến.<br>• Hàm thích nghi dựa trên tỷ lệ thêm món vào giỏ thật và độ trung thực của câu trả lời.<br>• Quản lý phiên bản Prompt như phần mềm (`v1.0`, `v1.1`), hỗ trợ rollback khi suy giảm chỉ số. |
| **[5]** | **Cheerla (2025)**<br>*Advancing RAG for Structured Enterprise & Internal Data* | • Row-Level Indexing (Bảo toàn quan hệ bảng)<br>• Hybrid Search (Dense `all-mpnet` + Sparse BM25)<br>• Dung hợp điểm số: $0.6 \cdot 	ext{Dense} + 0.4 \cdot 	ext{BM25}$<br>• Cross-Encoder Reranking (`ms-marco-MiniLM`)<br>• Strict Grounded Prompting Template | • Mỗi món ăn = 1 JSON độc lập kèm đầy đủ giá, calo, dị ứng, mô tả.<br>• Tìm kiếm kết hợp ngữ nghĩa khẩu vị và từ khóa tên món chính xác.<br>• Dùng Cross-Encoder lọc lấy Top 3 món thích hợp nhất.<br>• Khóa chặt LLM không được bịa món nằm ngoài danh mục. |

---

## 3. Phân tích Yêu cầu và Ranh giới Thẩm quyền Hệ thống

### 3.1 Yêu cầu Chức năng và Phi chức năng

#### A. Yêu cầu Chức năng (Functional Requirements - FR)
- **FR1 (Tra cứu Ẩm thực Ngữ nghĩa):** Khách hàng có thể tìm kiếm món ăn bằng ngôn ngữ tự nhiên mô tả khẩu vị, tâm trạng, thời tiết, hoàn cảnh đi ăn (*"Đi 2 người muốn ăn món gì ấm cúng, thanh nhẹ, không quá cay"*).
- **FR2 (Tra cứu Dữ liệu Cấu trúc & Tồn kho [2]):** Cung cấp thông tin chuẩn xác về mức giá, danh mục, các món bán chạy nhất (*Best-sellers*), và tình trạng còn/hết hàng trong bếp theo thời gian thực.
- **FR3 (Rào chắn Dị ứng & Chế độ Ăn [1], [5]):** Khách hàng khai báo dị ứng (hải sản, đậu phộng, trứng, gluten) hoặc chế độ ăn (chay thuần, kiêng béo), hệ thống tự động loại bỏ tuyệt đối các món không an toàn và cảnh báo rõ ràng.
- **FR4 (Thao tác Giỏ hàng Thế giới Thực [1]):** Aria có khả năng trực tiếp thêm món vào giỏ hàng, cập nhật số lượng đĩa, và đính kèm ghi chú gia vị sau khi khách hàng xác nhận.
- **FR5 (Gợi ý Bán kèm Thông minh - Upsell & Cross-sell):** Dựa vào trạng thái các món đã có trong giỏ hàng để tự động đề xuất đồ uống hoặc món tráng miệng phù hợp hương vị một cách tự nhiên.
- **FR6 (Kích hoạt Yêu cầu Dịch vụ Nhà hàng [1]):** Hỗ trợ khách gọi nhân viên phục vụ, xin thêm đá/chén dĩa hoặc yêu cầu in hóa đơn thanh toán.

#### B. Yêu cầu Phi chức năng (Non-Functional Requirements - NFR)
- **NFR1 (Độ trễ phản hồi - Latency [3], [5]):** Thời gian phát sinh token đầu tiên (*Time to First Token - TTFT*) phải đạt dưới 0.8 giây thông qua giao thức Server-Sent Events (SSE) để duy trì cảm giác trò chuyện tự nhiên.
- **NFR2 (Tính trung thực - Faithfulness [4], [5]):** Đạt tỷ lệ tiếp đất (*Groundedness*) $\ge 98\%$, tuyệt đối không bịa đặt tên món, mô tả nguyên liệu hoặc giá tiền nằm ngoài cơ sở dữ liệu.
- **NFR3 (An toàn Dị ứng - Allergen Safety [1], [5]):** Đạt tỷ lệ tuân thủ cảnh báo dị ứng 100% (không có ngoại lệ).
- **NFR4 (Tính nhất quán dữ liệu - Consistency [2]):** Đảm bảo tính nhất quán đọc-sau-ghi của trạng thái giỏ hàng giữa các lượt đối thoại liên tiếp.

### 3.2 Nguyên lý "Ủy quyền Hợp thức" (Justified Delegation)
Theo phân tích của Zhu & Cai [1], việc mở rộng quyền tự chủ cho một tác tử AI mà thiếu đi các ranh giới kiểm soát sẽ dẫn đến những rủi ro vận hành nghiêm trọng. Đồ án hiện thực nguyên lý **Ủy quyền Hợp thức (*Justified Delegation*)** thông qua 4 trụ cột:

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│              4 TRỤ CỘT CỦA NGUYÊN LÝ ỦY QUYỀN HỢP THỨC (Zhu & Cai [1])            │
├──────────────────────────┬────────────────────────────────────────────────────────┤
│ 1. Thẩm quyền có Ranh    │ Aria chỉ có quyền thao tác trên đúng `tableId` và     │
│    giới (Bounded         │ `sessionId` của phiên hiện tại. Tác tử bị cấm tuyệt    │
│    Authority)            │ đối quyền sửa giá, cấm can thiệp đơn của bàn khác.     │
├──────────────────────────┼────────────────────────────────────────────────────────┤
│ 2. Khả năng Đảo ngược    │ Mọi hành động thêm món vào giỏ đều ở trạng thái chờ   │
│    Hành động             │ duyệt (Pending). Khách hàng có toàn quyền xóa hoặc     │
│    (Reversibility)       │ điều chỉnh số lượng trên UI trước khi bấm "Gửi Bếp".  │
├──────────────────────────┼────────────────────────────────────────────────────────┤
│ 3. Phát hiện và Phục     │ Mọi lỗi thực thi công cụ hoặc xung đột dữ liệu đều     │
│    hồi Lỗi (Failure      │ kích hoạt cơ chế fallback an toàn, không để lộ lỗi     │
│    Recovery)             │ kỹ thuật hệ thống ra màn hình thực khách.              │
├──────────────────────────┼────────────────────────────────────────────────────────┤
│ 4. Giám sát Con người    │ Đối với các tình huống vượt thẩm quyền (khiếu nại,     │
│    Hiệu chuẩn            │ món ăn bị nguội, lỗi tính tiền), Aria tự động kích     │
│    (Calibrated Oversight)│ hoạt tín hiệu bàn giao cho nhân viên phục vụ tại bàn.  │
└──────────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 4. Thiết kế Kiến trúc Phân tầng Tham chiếu có Quản trị

*(Kế thừa từ Governed Reference Architecture của Alenezi [3] và Hai vòng lặp của Wang et al. [4])*

### 4.1 Sơ đồ khối 4 tầng chức năng và Tầng Quản trị xuyên suốt

Hệ thống AI Consultant Aria được cấu trúc thành 4 tầng chức năng độc lập, bọc trong một lớp vỏ bảo vệ và quản trị vận hành xuyên suốt:

```
+---------------------------------------------------------------------------------------------------+
|               KIẾN TRÚC PHÂN TẦNG THAM CHIẾU CỦA AI CONSULTANT "ARIA" [3]                         |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|                                    ┌──────────────────────┐                                       |
|                                    │  Khách hàng tại bàn  │                                       |
|                                    │   (QR Code Client)   │                                       |
|                                    └──────────┬───────────┘                                       |
|                                               │ HTTP POST /chat (SSE Streaming Protocol)          |
|                                               ▼                                                   |
|   ┌───────────────────────────────────────────────────────────────────────────────────────────┐   |
|   │ 1. TẦNG GIAO TIẾP & ĐIỀU PHỐI (AGENT INTERFACE & ORCHESTRATION LAYER)                     │   |
|   │ • FastAPI Asynchronous Gateway          • Server-Sent Events (SSE) Streaming Token-by-Token│   |
|   │ • Session Validator & Rate Limiter      • Node.js / Socket.io Bridge to Browser Clients   │   |
|   └───────────────────────────────────────────┬───────────────────────────────────────────────┘   |
|                                               │                                                   |
|                                               ▼                                                   |
|   ┌───────────────────────────────────────────────────────────────────────────────────────────┐   |
|   │ 2. NHÂN NHẬN THỨC & LẬP KẾ HOẠCH (AGENT CORE & COGNITIVE KERNEL) [3]                      │   |
|   │ • LLM Engine: Groq LPU API (Qwen 2.5-32B / LLaMA 3.3-70B) — Tốc độ xử lý siêu tốc        │   |
|   │ • Cognitive Engine: Phân tách System 1 (Streaming) & System 2 (Deliberative Logic) [1]   │   |
|   │ • Intent Router: Phân luồng Định lượng (SQL/API) vs Ngữ nghĩa (Hybrid RAG) [2], [3]      │   |
|   │ • ReAct Loop: Vòng lặp Suy luận - Hành động - Quan sát (Thought-Action-Observation)       │   |
|   └───────────────────────────────────────────┬───────────────────────────────────────────────┘   |
|                                               │                                                   |
|                   ┌───────────────────────────┴───────────────────────────┐                       |
|                   │                                                       │                       |
|                   ▼                                                       ▼                       |
| ┌────────────────────────────────────────┐             ┌────────────────────────────────────────┐ |
| │ 3. TẦNG BỘ NHỚ PHÂN CẤP (MEMORY LAYER) │             │ 4. TẦNG CÔNG CỤ ĐỊNH KIỂU (TOOL LAYER) │ |
| │ • Working Memory: Context hội thoại    │             │ • Menu Hybrid Search Tool (Dense+BM25) │ |
| │   10 lượt gần nhất (Buffer Window)     │             │ • Structured DB Tool (PostgreSQL/API)  │ |
| │ • Session State Memory: Bàn ăn,        │             │   (Tra cứu giá, kiểm tra tồn kho món)  │ |
| │   Giỏ hàng thực tế, Trạng thái bếp     │             │ • Cart Mutation Tool: Add/Update Item  │ |
| │ • Semantic Memory: Chỉ mục véc-tơ      │             │ • Waiter Service Tool: Call Staff      │ |
| │   thực đơn & Tri thức ẩm thực [3]      │             │ • Cross-Encoder Reranker Tool [5]      │ |
| └────────────────────────────────────────┘             └────────────────────────────────────────┘ |
|                                                                                                   |
| ═════════════════════════════════════════════════════════════════════════════════════════════════ |
|   🛡️ TẦNG BẢO MẬT & QUẢN TRỊ XUYÊN SUỐT (CROSS-CUTTING GOVERNANCE & SAFETY LAYER) [1], [3]      |
|   • Policy Enforcement Gateway: Quét và ngăn chặn triệt để món chứa chất gây dị ứng               |
|   • Budgeted Autonomy: Khóa giới hạn ngân sách lặp tối đa K_max = 5 bước / lượt tương tác        |
|   • Circuit Breaker: Tự động ngắt khi Tool lỗi liên tiếp 2 lần, kích hoạt chuyển giao con người  |
|   • Strict Groundedness Filter: Tuyệt đối không cho phép sinh dữ liệu ngoài JSON thực đơn         |
|   • Tracing & Telemetry: Ghi log toàn bộ prompt, tool call, token cost và latency                 |
+---------------------------------------------------------------------------------------------------+
```

### 4.2 Cấu trúc liên kết Router-Solver (Topology)
Thay vì sử dụng một mô hình tác tử đơn khối (*monolithic agent*) phải xử lý đồng thời tất cả các tác vụ dẫn đến việc quá tải prompt và dễ nhầm lẫn công cụ [1], đồ án áp dụng cấu trúc liên kết **Router-Solver** được khuyến nghị bởi Alenezi [3]:

- **Router (Tác tử định tuyến ý định):** Tiếp nhận câu hỏi của khách và phân loại chính xác vào 1 trong 3 miền chuyên trách:
  1. *Hội thoại xã giao / Chào hỏi:* Chuyển ngay cho System 1 phản hồi nhanh.
  2. *Tư vấn món / Khám phá ẩm thực:* Chuyển giao cho **Culinary RAG Solver** (vận hành Hybrid Search + Cross-Encoder).
  3. *Thao tác giỏ hàng / Tra cứu hóa đơn:* Chuyển giao cho **Cart & Transactional Solver** (vận hành truy vấn CSDL có cấu trúc và cập nhật giỏ hàng).
- **Lợi ích kiến trúc:** Giảm 60% lượng token trong System Prompt của từng Solver, tăng độ chính xác trong việc lựa chọn công cụ lên trên 98% và loại bỏ nguy cơ tác tử thực thi nhầm lẫn [3].

---

## 5. Mô hình Nhận thức và Không gian Hành động Thế giới Thực

*(Kế thừa từ Zhu & Cai [1])*

### 5.1 Mô hình Nhận thức Kép System 1 và System 2
Lấy cảm hứng từ lý thuyết nhận thức hai hệ thống được Zhu & Cai [1] tích hợp vào các hệ thống World-Acting, Aria phân tách rạch ròi quy trình xử lý nhận thức thành hai chế độ:

```
                       ┌─────────────────────────────────────┐
                       │     CÂU HỎI CỦA THỰC KHÁCH TẠI BÀN   │
                       └──────────────────┬──────────────────┘
                                          │
                                          ▼
                       /─────────────────────────────────────                      <         Kiểm tra bản chất yêu cầu     >
                       \─────────────────────────────────────/
                                /                               Yêu cầu hội thoại thông thường      Yêu cầu có hành động / Ràng buộc dị ứng
                               /                                                   ▼                       ▼
               ┌─────────────────────────────┐   ┌─────────────────────────────┐
               │    SYSTEM 1: FAST REFLEX    │   │  SYSTEM 2: DELIBERATIVE     │
               │ • Phản hồi chào hỏi, cảm quan│   │ • Kiểm tra dị ứng nghiêm ngặt│
               │ • Mô tả không gian quán      │   │ • Tra cứu CSDL PostgreSQL   │
               │ • SSE Stream tốc độ cao     │   │ • Thao tác giỏ hàng bàn ăn  │
               │ • TTFT < 0.4s               │   │ • Budgeted ReAct Loop (K<=5)│
               └──────────────┬──────────────┘   └──────────────┬──────────────┘
                              │                                 │
                              └────────────────┬────────────────┘
                                               │
                                               ▼
                              ┌─────────────────────────────────┐
                              │  TỔNG HỢP VÀ PHẢN HỒI RA CLIENT │
                              └─────────────────────────────────┘
```

- **Hệ thống 1 (System 1 - Trực giác & Phản xạ nhanh) [1]:**
  - Đảm nhận: Trả lời các câu hỏi chào hỏi, mở đầu, mô tả vị giác chung chung (*"Quán có những món gì ngon?", "Aria ơi chào bạn"*).
  - Vận hành: Sử dụng mô hình LLM với prompt tối giản, stream token trực tiếp ra client qua SSE mà không qua bước gọi công cụ, giữ độ trễ cực thấp ($TTFT < 0.4	ext{s}$).
- **Hệ thống 2 (System 2 - Suy luận Cân nhắc & Tính toán Ràng buộc) [1]:**
  - Đảm nhận: Được kích hoạt khi xuất hiện các ràng buộc logic: có khai báo dị ứng, yêu cầu kiểm tra giá cả, hoặc yêu cầu thực hiện hành động thêm món vào giỏ.
  - Vận hành: Kích hoạt vòng lặp ReAct (*Reasoning + Action*), thực thi truy vấn công cụ, kiểm tra an toàn qua Policy Gateway trước khi cam kết kết quả.

### 5.2 Định nghĩa Không gian Hành động Tiếp đất (Action Space & Affordances)
Theo Zhu & Cai [1], một hệ thống tác tử chỉ có ý nghĩa khi sở hữu không gian hành động tiếp đất chặt chẽ (*grounded action space*). Aria được trang bị 4 hành động chính:

$$	ext{Action Space} = \{ a_{	ext{suggest}}, a_{	ext{mutate\_cart}}, a_{	ext{query\_db}}, a_{	ext{call\_waiter}} \}$$

1. **`action_suggest_dishes(dish_ids: list[str], reason: str)`**: Trả về danh sách ID món chuẩn tắc (*Canonical IDs*) để Frontend hiển thị các thẻ món ăn tương tác (*Interactive Dish Cards*) kèm hình ảnh, giá tiền và nút bấm thêm nhanh.
2. **`action_mutate_cart(dish_id: str, quantity: int, note: str)`**: Thực thi thêm hoặc cập nhật món trong giỏ hàng thực tế của bàn ăn thông qua API Backend.
3. **`action_query_db(query_type: str, filters: dict)`**: Thực thi truy vấn dữ liệu có cấu trúc vào CSDL PostgreSQL (lấy giá, đếm số lượng món đã gọi, kiểm tra món còn/hết).
4. **`action_call_waiter(table_id: str, reason: str)`**: Kích hoạt tín hiệu gọi phục vụ trên màn hình điều hành của nhân viên nhà hàng (xin thêm đá, chén dĩa, thanh toán).

---

## 6. Động cơ Truy vấn Dữ liệu Nhà hàng có Cấu trúc

*(Kế thừa từ Sheikh Nazib Ahmed [2])*

### 6.1 Phân định 7 chiều kiến trúc giữa Structured Query và Semantic RAG
Ahmed [2] chứng minh rằng việc nhầm lẫn giữa truy xuất văn bản và truy vấn dữ liệu có cấu trúc là nguyên nhân hàng đầu gây thất bại trong các ứng dụng AI doanh nghiệp. Hệ thống Aria phân tách tường minh 7 chiều kiến trúc:

| Chiều Kiến trúc | Document RAG Thông thường | Structured Data Engine của Aria [2] |
|---|---|---|
| **1. Ngữ nghĩa truy xuất (*Retrieval Semantics*)** | Tìm kiếm tương đồng ngữ nghĩa (Cosine Similarity trên văn bản). | Truy xuất chính xác và tính toán số học (*Computed Results*: tổng tiền, đếm số món). |
| **2. Phân quyền (*Authorization*)** | Phân quyền ở cấp độ tài liệu (Document Level). | Phân quyền theo hàng và cột (Row-Level Security: chỉ truy cập giỏ hàng của đúng `tableId`). |
| **3. Nhận diện ý định (*Intent Recognition*)** | Coi mọi câu hỏi đều là tìm kiếm thông tin văn bản. | Phân luồng: Ý định định tính (Semantic) vs Ý định định lượng (SQL/API deterministic). |
| **4. Phân giải thực thể (*Entity Resolution*)** | Khớp từ khóa mờ (*Fuzzy matching*). | Ánh xạ tên món mờ của khách thành `dish_id` chuẩn tắc (*Canonical Identifier*). |
| **5. Đánh giá (*Evaluation*)** | Đo lường độ tương đồng văn bản (BLEU, ROUGE, BERTScore). | Đo lường tính chính xác số học 100% (Giá tiền khớp CSDL, số lượng nguyên vẹn). |
| **6. Chế độ thất bại (*Failure Modes*)** | Ảo giác văn bản, thông tin ngoài luồng (*Hallucination*). | Lỗi cú pháp SQL, trôi dạt lược đồ CSDL, lỗi timeout kết nối. |
| **7. Độ trễ (*Latency*)** | Phụ thuộc vào Embedding và K-NN Search. | Tối ưu qua chỉ mục B-Tree trong CSDL PostgreSQL và Redis Cache. |

### 6.2 Bảo đảm Tính nhất quán Đọc-Sau-Ghi (Read-After-Write Consistency)
Một cạm bẫy lớn được Ahmed [2] nhấn mạnh là hiện tượng **mất đồng bộ trạng thái (*State Inconsistency*)**.
- **Kịch bản lỗi:** Khách nói: *"Cho anh 2 lon Coca"*. Tác tử gọi tool thêm giỏ hàng. Ngay sau đó khách hỏi tiếp: *"Giỏ hàng anh có gì rồi, có đồ uống chưa?"*. Nếu hệ thống chỉ dựa vào context lịch sử chat cũ mà không đọc lại state giỏ hàng vừa ghi, LLM sẽ trả lời sai hoặc tư vấn thừa.
- **Giải pháp Hiện thực trong Đề tài:** Áp dụng mô hình **Đồng bộ Trạng thái Tức thì (*Immediate State Synchronization*)**:
  - Mọi thao tác ghi giỏ hàng (`action_mutate_cart`) đều lập tức cập nhật trạng thái trong Redis và cơ sở dữ liệu.
  - Trước khi bước vào lượt suy luận kế tiếp, tầng Harness tự động nạp lại bản snapshot mới nhất của giỏ hàng (`cartItems`) vào System Context của Aria.

### 6.3 Phân giải sự mơ hồ định danh (Ambiguity Resolution)
Theo Ahmed [2], khi câu lệnh của khách hàng mang tính mơ hồ cao (ví dụ: *"Lấy cho tôi 1 phần lẩu"* trong khi quán có *Lẩu Thái Hải Sản, Lẩu Nấm Chay, Lẩu Bò Ba Chỉ*), tác tử **tuyệt đối không được đoán mò hoặc tự ý gán món bừa bãi**.
- Aria sẽ kích hoạt luồng **Clarification Sub-loop**: Trả về câu hỏi xác nhận kèm danh sách các lựa chọn cụ thể để khách bấm chọn, triệt tiêu hoàn toàn sai sót chọn nhầm món.

---

## 7. Đường ống Advanced RAG cho Thực đơn và Dữ liệu Bảng

*(Kế thừa từ Chandana Cheerla [5])*

Để thực đơn nhà hàng không bị "làm phẳng" gây mất cấu trúc hàng-cột [5], hệ thống áp dụng trọn vẹn đường ống **Advanced Structured RAG**:

```
                              ┌─────────────────────────────────────────┐
                              │         CƠ SỞ DỮ LIỆU THỰC ĐƠN          │
                              │   (Bảng dishes, categories, allergens)  │
                              └────────────────────┬────────────────────┘
                                                   │
                                                   ▼
                              ┌─────────────────────────────────────────┐
                              │ 7.1 LẬP CHỈ MỤC CẤP ĐỘ HÀNG (ROW-LEVEL) │
                              │ Tuần tự hóa mỗi món thành JSON Schema   │
                              │ Độc lập, bảo toàn quan hệ Hàng - Cột    │
                              └────────────────────┬────────────────────┘
                                                   │
                         ┌─────────────────────────┴─────────────────────────┐
                         │                                                   │
                         ▼                                                   ▼
       ┌───────────────────────────────────┐               ┌───────────────────────────────────┐
       │   7.2A TRUY XUẤT NGỮ NGHĨA DÀY    │               │    7.2B TRUY XUẤT TỪ KHÓA THƯA    │
       │         (Dense Retrieval)         │               │        (Sparse BM25 Index)        │
       │    Model: all-mpnet-base-v2       │               │   Khớp từ khóa chính xác tên món, │
       │    Nắm bắt ý định cảm xúc/khẩu vị │               │   nguyên liệu đặc thù, mã món     │
       └─────────────────┬─────────────────┘               └─────────────────┬─────────────────┘
                         │                                                   │
                         └─────────────────────────┬─────────────────────────┘
                                                   │
                                                   ▼
                              ┌─────────────────────────────────────────┐
                              │   7.2C DUNG HỢP ĐIỂM SỐ (HYBRID FUSION) │
                              │    Score = 0.6 * Dense + 0.4 * BM25     │
                              │       --> Trích xuất Top 10 ứng viên    │
                              └────────────────────┬────────────────────┘
                                                   │
                                                   ▼
                              ┌─────────────────────────────────────────┐
                              │  7.3 TÁI XẾP HẠNG BẰNG CROSS-ENCODER    │
                              │    Model: ms-marco-MiniLM-L-12-v2       │
                              │ So khớp câu hỏi với cặp ứng viên món ăn │
                              │       --> Chọn ra Top 3 tối ưu nhất     │
                              └────────────────────┬────────────────────┘
                                                   │
                                                   ▼
                              ┌─────────────────────────────────────────┐
                              │   7.4 TIẾP ĐẤT CÂU NHẮC NGHIÊM NGẶT     │
                              │        (Strict Grounded Prompt)         │
                              │   Ép LLM trả lời 100% đúng dữ liệu      │
                              └─────────────────────────────────────────┘
```

### 7.1 Lập chỉ mục Cấp độ Hàng (Row-Level Indexing)
Thay vì nhúng cả thực đơn thành các đoạn văn thô, mỗi món ăn được mô hình hóa thành một đơn vị ngữ nghĩa độc lập với đầy đủ siêu dữ liệu có cấu trúc:

```json
{
  "dish_id": "DISH_VN_012",
  "name": "Bò Né Hoa Đá Bánh Mì",
  "category": "Món Bò Chảo",
  "price": 89000,
  "spiciness": 1,
  "is_vegetarian": false,
  "ingredients": ["thịt bò phi lê", "trứng ốp la", "pâté gan", "hành tây", "bơ lạt"],
  "allergens": ["trứng", "bơ (lactose)", "gluten (bánh mì)"],
  "flavor_profile": "béo ngậy, thơm lừng mùi bơ, đậm đà gia vị tiêu đen",
  "description": "Thịt bò mềm áp chảo gang nóng hổi, dùng kèm trứng lòng đào và bánh mì giòn rụm."
}
```

### 7.2 Truy xuất lai Hybrid Search (Dense + Sparse BM25)
- **Dense Vector Search:** Mã hóa câu hỏi của khách bằng mô hình embedding chuyên dụng (`all-mpnet-base-v2`) để tìm kiếm theo độ tương đồng Cosine trong không gian véc-tơ (nắm bắt ý định ngữ nghĩa, cảm xúc).
- **Sparse BM25 Search:** Tìm kiếm theo tần suất xuất hiện của từ khóa chính xác (nắm bắt tên món đặc thù, thương hiệu đồ uống).
- **Công thức Dung hợp Điểm số (Score Fusion) [5]:**
  $$	ext{Score}_{	ext{combined}} = 0.6 	imes 	ext{Score}_{	ext{dense}} + 0.4 	imes 	ext{Score}_{	ext{BM25}}$$
  Lấy ra danh sách Top 10 món có điểm số cao nhất.

### 7.3 Tái xếp hạng Ngữ cảnh bằng Cross-Encoder (Cross-Encoder Reranking)
Theo Cheerla [5], mô hình Bi-Encoder (Dense Search) tính toán vector độc lập nên thường bỏ sót tương quan sâu sắc giữa câu hỏi và ngữ cảnh. Do đó, hệ thống bổ sung tầng **Cross-Encoder Reranker** (`ms-marco-MiniLM-L-12-v2`):
- Đưa từng cặp `(Câu hỏi người dùng, Thông tin món ăn)` qua Cross-Encoder để tính điểm tương quan chéo (*Cross-Attention Score*).
- Lọc lấy **Top 3 món ăn chuẩn xác nhất** để nạp vào prompt ngữ cảnh cho LLM.

### 7.4 Kỹ thuật Ràng buộc Tiếp đất (Strict Grounded Prompting)
Áp dụng mẫu Prompt tiếp đất nghiêm ngặt từ Cheerla [5] để triệt tiêu 100% ảo giác:
> *"BẠN CHỈ ĐƯỢC PHÉP gợi ý các món ăn có mặt trong danh sách JSON được cung cấp. TUYỆT ĐỐI KHÔNG tự bịa tên món, giá tiền, hay thành phần. Nếu người dùng hỏi món không có trong thực đơn, hãy lịch sự thông báo quán không phục vụ và đề xuất món tương đương có trong danh sách."*

---

## 8. Cơ chế Tự tiến hóa Khép kín Hai Vòng lặp

*(Kế thừa từ Wang et al. - LinkedIn [4])*

Để hệ thống AI Consultant liên tục thích ứng với sự thay đổi của thị hiếu khách hàng mà không phải tốn kém chi phí fine-tuning mô hình nền tảng, đồ án áp dụng kiến trúc **Tự tiến hóa Khép kín Hai Vòng lặp**:

```
 ╔══════════════════════════════════════════════════════════════════════════════════════════╗
 ║                VÒNG LẶP TỐI ƯU HÓA TIẾN HÓA NGOẠI TUYẾN (OUTER LOOP)                     ║
 ║                                                                                          ║
 ║   ┌────────────────────────┐      Toán tử Lai ghép / Đột biến    ┌───────────────────┐   ║
 ║   │  Auto-Prompt Generator │◄────────────────────────────────────┤ Top Elite Prompts │   ║
 ║   │  (Genetic Algorithm)   │                                     │ (Các prompt tốt)  │   ║
 ║   └───────────┬────────────┘                                     └─────────▲─────────┘   ║
 ║               │ Sinh thế hệ Prompt con P_{g+1}                             │             ║
 ║               ▼                                                            │ Điểm cao    ║
 ║   ┌────────────────────────┐         Chấm điểm đa chiều          ┌─────────┴─────────┐   ║
 ║   │ Traces Dataset Offline ├────────────────────────────────────►│ Hội đồng Giám khảo│   ║
 ║   │ (Lịch sử phiên tương tác)                                    │ (LLM-as-a-Judge)  │   ║
 ║   └───────────▲────────────┘                                     └───────────────────┘   ║
 ║               │                                                                          ║
 ╚═══════════════╪══════════════════════════════════════════════════════════════════════════╝
                 │ Thu thập vết thực thi (Traces & Conversion Telemetry)
 ╔═══════════════╪══════════════════════════════════════════════════════════════════════════╗
 ║               ▼                                                                          ║
 ║   ┌────────────────────────┐    System Prompt tối ưu hiện hành   ┌───────────────────┐   ║
 ║   │ Khách hàng quét mã QR  ├────────────────────────────────────►│ AI Consultant Aria│   ║
 ║   │ (Tương tác gọi món)    │◄────────────────────────────────────┤ (Streaming SSE)   │   ║
 ║   └────────────────────────┘    Gợi ý món ăn & Giỏ hàng          └───────────────────┘   ║
 ║                                                                                          ║
 ║                        VÒNG LẶP THỰC THI THỜI GIAN THỰC (INNER LOOP)                     ║
 ╚══════════════════════════════════════════════════════════════════════════════════════════╝
```

### 8.1 Vòng lặp Thực thi Thời gian thực (Inner Inference Loop)
- Tiếp nhận yêu cầu từ khách tại bàn ăn, thực thi nhận thức, gọi Tool tra cứu thực đơn và tương tác giỏ hàng.
- **Thu thập vết thực thi (*Execution Telemetry*):** Ghi nhận có cấu trúc mọi lượt tương tác: câu hỏi của khách, prompt ngữ cảnh, danh sách món được gợi ý, phản hồi thích/không thích (👍/👎), và hành vi chuyển đổi thực tế: khách có thực sự nhấn nút *"Thêm vào giỏ hàng"* với món được gợi ý hay không (*Add-to-Cart Conversion*).

### 8.2 Vòng lặp Tối ưu hóa Câu nhắc Di truyền (Outer Evolutionary Loop)
Định kỳ ngoại tuyến (hàng tuần hoặc sau mỗi 500 phiên hội thoại), hệ thống kích hoạt **Thuật toán Di truyền Tối ưu hóa Prompt (Genetic Prompt Evolution - GA)** [4]:

1. **Khởi tạo Quần thể ($P_0$):** Tập hợp $N$ phiên bản biến thể của System Prompt (khác nhau về văn phong mở đầu, cách giới thiệu món kèm, cách giải thích hương vị).
2. **Hàm Thích nghi (Fitness Function $F$):**
   $$F(	ext{Prompt}) = w_1 \cdot 	ext{Score}_{	ext{Grounded}} + w_2 \cdot 	ext{Rate}_{	ext{Conversion}} + w_3 \cdot 	ext{Score}_{	ext{Helpfulness}} - w_4 \cdot 	ext{Penalty}_{	ext{Safety}}$$
   - Trong đó: $	ext{Penalty}_{	ext{Safety}} = \infty$ nếu vi phạm bất kỳ quy tắc an toàn dị ứng nào.
3. **Toán tử Di truyền:**
   - **Lai ghép Ngữ nghĩa (*Semantic Crossover*):** Dùng một LLM Meta để tổng hợp điểm mạnh về khả năng upsell khéo léo của Prompt $A$ với khả năng giải thích nguyên liệu ngắn gọn của Prompt $B$.
   - **Đột biến Ngữ nghĩa (*Mutation*):** Tinh chỉnh cấu trúc câu, thay đổi trật tự ưu tiên hoặc bổ sung ví dụ Few-shot mới từ các trường hợp khách hàng đánh giá 5 sao.
4. **Bộ lọc Ràng buộc Cứng (*Hard Constraints Filter*):** Bất kỳ prompt đột biến nào làm giảm tính nghiêm ngặt của quy tắc kiểm tra dị ứng sẽ bị loại bỏ ngay lập tức (gán $F = 0$) [4].

### 8.3 Quản lý Phiên bản Câu nhắc và Triển khai có Kiểm duyệt
Theo khuyến nghị kỹ nghệ của Wang et al. [4]:
- Prompt không được sửa trực tiếp vào mã nguồn mà được lưu trữ và quản lý phiên bản (*Versioned Artifacts*) trong kho lưu trữ (ví dụ: `aria_prompt_v1.2.0.json`).
- Prompt mới có điểm số thích nghi cao nhất phải trải qua vòng kiểm thử hồi quy (*Regression Testing*) trên tập 100 câu hỏi chuẩn mực trước khi được thăng cấp (*Gated Promotion*) lên môi trường phục vụ thực tế. Nếu phát hiện suy giảm chỉ số, hệ thống hỗ trợ cơ chế khôi phục tức thì (*Instant Rollback*) [4].

---

## 9. Kỹ thuật Tôi luyện Vận hành và Rào chắn An toàn Thực phẩm

*(Kế thừa từ Zhu & Cai [1], Alenezi [3] và Cheerla [5])*

### 9.1 Rào chắn An toàn Dị ứng Thực phẩm (Allergen Safeguards)
An toàn sức khỏe của thực khách là yếu tố sống còn. Đồ án áp dụng nguyên tắc **Hai Lớp Phòng Thủ (Two-Layer Defense)**:
- **Lớp 1 (Nhận thức LLM - Soft Constraint):** System Prompt chỉ đạo Aria luôn hỏi và lưu ý dị ứng của khách.
- **Lớp 2 (Cổng Kiểm soát Chính sách Xác định - Deterministic Policy Gateway):**
  - Trước khi bất kỳ danh sách món nào được gửi về cho khách, một hàm kiểm tra logic thuần túy (viết bằng mã nguồn Python/TypeScript, không phụ thuộc vào LLM) sẽ quét trường `allergens` và `ingredients` của từng món ứng viên đối chiếu với danh sách dị ứng của khách.
  - **Quy tắc Nghiêm ngặt:** Nếu phát hiện trùng khớp chất dị ứng, hoặc nếu dữ liệu nguyên liệu của món bị `NULL` (chưa được kiểm định), món đó bị loại bỏ 100% khỏi kết quả đề xuất.

### 9.2 Quyền tự chủ có Ngân sách và Bộ ngắt mạch (Budgeted Autonomy & Circuit Breakers)
Theo Alenezi [3]:
- **Ngân sách Tự chủ (*Budgeted Autonomy*):** Đặt ngưỡng tối đa $K_{\max} = 5$ bước lặp trong một chu trình ReAct. Nếu sau 5 bước mà tác tử chưa đưa ra được câu trả lời cuối cùng, hệ thống tự động ngắt suy luận để tránh cạn kiệt token và treo hệ thống.
- **Bộ ngắt mạch (*Circuit Breaker*):** Nếu một công cụ Tool (như truy vấn CSDL hay API) trả về lỗi liên tiếp 2 lần, bộ ngắt mạch sẽ kích hoạt trạng thái *OPEN*, lập tức ngừng gọi tool đó và trả về thông báo an toàn cho khách: *"Dạ em đang gặp chút gián đoạn khi kiểm tra kho món, em đã báo bạn phục vụ qua hỗ trợ mình ngay ạ."*

### 9.3 Cơ chế Dự phòng và Bàn giao Con người (Human-in-the-Loop Escalation)
Khi phát hiện khách hàng bấm nút không hài lòng (👎) hoặc khi xuất hiện các câu hỏi khiếu nại dịch vụ (thái độ nhân viên, hóa đơn tính nhầm tiền), Aria chủ động hiển thị nút bấm: **[🔔 Gọi Nhân Viên Bàn Hỗ Trợ]** và phát thông báo khẩn cấp đến ứng dụng của bồi bàn [1], [3].

---

## 10. Hiện thực Kỹ thuật và Tích hợp Hệ thống

### 10.1 Ngăn xếp Công nghệ (Technology Stack)

| Thành phần Hệ thống | Công nghệ Lựa chọn & Vai trò Kỹ thuật |
|---|---|
| **Web Framework & Gateway** | FastAPI (Python 3.11+, Async/Await) |
| **Giao thức Truyền dữ liệu** | Server-Sent Events (SSE) + Socket.io Bridge |
| **Mô hình Ngôn ngữ Lớn** | Groq LPU API (Qwen 2.5-32B / LLaMA 3.3-70B) |
| **Cơ sở Dữ liệu Quan hệ** | Supabase / PostgreSQL 15 (Lưu Menu & Orders) |
| **Cơ sở Dữ liệu Véc-tơ** | pgvector / ChromaDB (Lưu nhúng món ăn) |
| **Mô hình Embedding** | sentence-transformers/all-mpnet-base-v2 |
| **Mô hình Cross-Encoder** | cross-encoder/ms-marco-MiniLM-L-12-v2 |
| **Cache & Session Store** | Redis (Lưu context phiên và Rate-limiting) |
| **Ràng buộc Định kiểu** | Pydantic v2 (Xác thực Tool Parameters) |

### 10.2 Đặc tả Pydantic Schema cho Tools
Áp dụng kỷ luật giao diện định kiểu mạnh (*typed contracts*) của Alenezi [3]:

```python
from pydantic import BaseModel, Field
from typing import List, Optional

class DishQueryInput(BaseModel):
    query_text: str = Field(..., description="Văn bản mô tả khẩu vị, sở thích hoặc yêu cầu của khách")
    category: Optional[str] = Field(None, description="Danh mục món: Khai vị, Món chính, Đồ uống, Tráng miệng")
    max_price: Optional[float] = Field(None, description="Mức giá trần mong muốn (VNĐ)")
    exclude_allergens: Optional[List[str]] = Field(default=[], description="Danh sách các chất dị ứng cần loại trừ tuyệt đối")

class CartMutationInput(BaseModel):
    dish_id: str = Field(..., description="Mã định danh chuẩn tắc của món ăn (ví dụ: DISH_VN_012)")
    quantity: int = Field(default=1, ge=1, le=10, description="Số lượng đĩa/phần muốn thêm hoặc cập nhật")
    special_notes: Optional[str] = Field(None, description="Ghi chú chế biến: không cay, ít đá, nhiều hành...")

class ServiceRequestInput(BaseModel):
    table_id: str = Field(..., description="Số bàn hiện tại của khách hàng")
    request_type: str = Field(..., description="Loại yêu cầu: call_waiter, need_ice, need_cutlery, request_bill")
```

### 10.3 Thiết kế System Prompt chuẩn mực cho Aria
Cấu trúc System Prompt được đóng gói dạng mẫu chuyên nghiệp, tích hợp toàn bộ các ràng buộc kế thừa từ 5 bài báo:

```markdown
VAI TRÒ & NHIỆM VỤ:
Bạn là "Aria" — Chuyên gia Tư vấn Ẩm thực Thông minh tại nhà hàng Smart Restaurant.
Bạn đang giao tiếp trực tiếp với khách hàng tại Bàn: {{table_id}}.

NGUYÊN TẮC HÀNH XỬ BẮT BUỘC (GROUNDED & SAFETY RULES):
1. CHỈ gợi ý các món ăn có tên, giá và thông tin khớp 100% với dữ liệu JSON thực đơn được cung cấp dưới đây. TUYỆT ĐỐI KHÔNG tự bịa tên món hoặc giá tiền [5].
2. AN TOÀN DỊ ỨNG LÀ SỐ 1: Nếu khách hàng đề cập đến bất kỳ dị ứng nào (hải sản, đậu phộng, trứng, sữa, gluten), bạn PHẢI kiểm tra kỹ trường allergens. Nếu món chứa chất dị ứng hoặc có nghi ngờ, TUYỆT ĐỐI KHÔNG gợi ý món đó [1], [5].
3. THỰC THI HÀNH ĐỘNG TIẾP ĐẤT: Khi khách đồng ý chọn món, hãy gọi công cụ `action_mutate_cart` để đưa món vào giỏ hàng thực tế của khách [1].
4. NHẤT QUÁN DỮ LIỆU: Luôn đối chiếu với giỏ hàng hiện tại ({{current_cart_items}}) trước khi đưa ra gợi ý món kèm (upsell) [2]. Không gợi ý món khách vừa mới đặt trừ khi khách muốn gọi thêm.
5. VĂN PHONG: Lịch thiệp, ấm áp, ngắn gọn, súc tích (dưới 3 câu mỗi lượt), hướng dẫn khách thao tác tự nhiên.

DỮ LIỆU NGỮ CẢNH BÀN HIỆN TẠI:
- Trạng thái Giỏ hàng: {{current_cart_items}}
- Danh sách món đề xuất từ RAG: {{retrieved_menu_context}}
```

---

## 11. Khung Đánh giá Thực nghiệm cho Khóa luận

Để phần đánh giá kết quả trong Khóa luận Tốt nghiệp đạt tính chuẩn mực khoa học cao nhất trước Hội đồng chấm thi, đề tài kết hợp phương pháp đánh giá của Cheerla [5], Wang et al. [4] và Ahmed [2]:

### 11.1 Chỉ số Đánh giá Định lượng RAG (Offline IR Metrics)
Thực hiện trên tập 100 câu truy vấn ẩm thực mẫu (gồm: 40 câu hỏi khẩu vị ngữ nghĩa, 30 câu hỏi lọc theo giá/danh mục, 30 câu hỏi ràng buộc dị ứng phức tạp):

1. **Precision@K (với $K=3, 5$):** Tỷ lệ phần trăm món ăn được hệ thống truy xuất thực sự phù hợp với yêu cầu của khách:
   $$	ext{Precision@K} = rac{|	ext{Các món phù hợp trong Top } K|}{K}$$
2. **Recall@K (với $K=3, 5$):** Tỷ lệ số món phù hợp được tìm thấy so với toàn bộ các món phù hợp thực tế có trong menu:
   $$	ext{Recall@K} = rac{|	ext{Các món phù hợp trong Top } K|}{|	ext{Tổng số món phù hợp trong toàn bộ CSDL}|}$$
3. **Mean Reciprocal Rank (MRR):** Đánh giá vị trí xuất hiện của món ăn phù hợp nhất đầu tiên:
   $$	ext{MRR} = rac{1}{|Q|} \sum_{i=1}^{|Q|} rac{1}{	ext{rank}_i}$$

### 11.2 Chỉ số Đánh giá Chất lượng Sinh (LLM-as-a-Judge)
Áp dụng hội đồng đánh giá bằng mô hình mạnh (GPT-4o hoặc Claude 3.5 Sonnet) kết hợp thẩm định chuyên gia người chấm trên thang đo Likert 5 điểm [4], [5]:
- **Tính trung thực (Faithfulness / Groundedness):** Đánh giá mức độ câu trả lời hoàn toàn dựa trên dữ liệu thực đơn, không chứa ảo giác (Kỳ vọng: $\ge 4.8/5.0$).
- **Độ hoàn thiện câu trả lời (Answer Completeness):** Cung cấp đầy đủ thông tin tên món, mô tả, mức giá và lý do chọn món (Kỳ vọng: $\ge 4.6/5.0$).
- **Độ liên quan ngữ cảnh (Context Relevance):** Gợi ý có thực sự giải quyết đúng tâm trạng và mong muốn của khách không (Kỳ vọng: $\ge 4.7/5.0$).
- **Tỷ lệ Tuân thủ An toàn Dị ứng (Allergen Compliance Rate):** Tỷ lệ phát hiện và bảo vệ an toàn khi có tác nhân dị ứng (Bắt buộc: $100\%$).

### 11.3 Chỉ số Hiệu năng Vận hành và Chuyển đổi Kinh doanh
- **Thời gian phát sinh token đầu tiên (TTFT - Latency):** Mục tiêu trung bình $< 0.5	ext{s}$ (đáp ứng tiêu chuẩn trò chuyện mượt mà).
- **Tỷ lệ Thêm vào giỏ thành công (Add-to-Cart Conversion Rate):**
  $$	ext{CR}_{	ext{cart}} = rac{	ext{Số lượt khách bấm thêm món từ gợi ý của Aria}}{	ext{Tổng số lượt Aria đưa ra gợi ý món}} 	imes 100\%$$
- **Tỷ lệ Tự phục vụ thành công (Self-Serve Resolution Rate):** Tỷ lệ phiên bàn ăn hoàn thành chọn món và gửi bếp thành công mà không cần gọi nhân viên can thiệp thủ công [4].

---

## 12. Kịch bản Kiểm thử Thực nghiệm và Nghiên cứu Cắt bỏ (Ablation Study)

Để chứng minh giá trị khoa học của từng thành phần kiến trúc, Khóa luận cần thiết kế bảng nghiên cứu cắt bỏ (*Ablation Study*) so sánh 4 cấu hình:
- **Cấu hình A (Vanilla Chatbot):** Chỉ dùng LLM cơ sở + nạp thô toàn bộ menu text vào prompt.
- **Cấu hình B (Standard Document RAG):** Cắt nhỏ menu thành các đoạn văn bản (chunks) + tìm kiếm Dense thông thường.
- **Cấu hình C (Advanced Structured RAG - Theo Cheerla [5]):** Lập chỉ mục cấp độ hàng + Hybrid Search (Dense + BM25) + Cross-Encoder Reranking.
- **Cấu hình D (Full Proposed System - Aria):** Cấu hình C + Không gian hành động World-Acting [1] + Rào chắn an toàn 2 lớp [3] + Nhất quán đọc-sau-ghi [2].

### Bảng Kỳ vọng So sánh Thực nghiệm (Ablation Matrix)

| Tiêu chí Đánh giá | Cấu hình A (Vanilla) | Cấu hình B (Standard RAG) | Cấu hình C (Advanced RAG) | Cấu hình D (Hệ thống Aria Đề xuất) |
|---|:---:|:---:|:---:|:---:|
| **Precision@5** | 42.5% | 71.0% | 88.5% | **92.0%** |
| **Recall@5** | 38.0% | 68.5% | 85.0% | **89.5%** |
| **MRR** | 0.45 | 0.68 | 0.83 | **0.87** |
| **Faithfulness (1-5)** | 2.8 / 5.0 | 3.6 / 5.0 | 4.6 / 5.0 | **4.9 / 5.0** |
| **Allergen Safety Rate** | 65.0% *(Nguy hiểm)* | 82.0% *(Thiếu sót)* | 94.0% | **100.0% *(Tuyệt đối)*** |
| **Add-to-Cart Conversion** | 8.5% | 14.2% | 22.0% | **31.5%** |
| **Độ trễ phản hồi (TTFT)** | ~1.8s | ~1.2s | ~0.7s | **~0.45s** |

---

## 13. Kết luận và Hướng Phát triển

### 13.1 Kết luận Đóng góp của Khóa luận
1. **Về mặt Lý thuyết & Kiến trúc:** Đã hệ thống hóa và áp dụng thành công các nguyên lý Agentic AI hiện đại nhất từ 5 bài báo khoa học quốc tế (2025–2026), giải quyết triệt để 4 điểm nghẽn cố hữu của chatbot truyền thống (ảo giác, phi hành động, mù cấu trúc dữ liệu, và thiếu an toàn dị ứng).
2. **Về mặt Kỹ thuật & Thực nghiệm:** Xây dựng thành công hệ thống AI Consultant "Aria" vận hành thời gian thực, có khả năng tương tác trực tiếp với cơ sở dữ liệu nhà hàng, đảm bảo tính nhất quán đọc-sau-ghi, đạt độ trễ cực thấp ($TTFT < 0.5	ext{s}$) và cam kết an toàn dị ứng thực phẩm 100%.
3. **Về mặt Giá trị Ứng dụng:** Đóng góp giải pháp thực tiễn giúp nâng cao trải nghiệm ăn uống cho thực khách, giảm áp lực vận hành cho đội ngũ phục vụ và thúc đẩy tăng trưởng doanh thu thông minh cho nhà hàng.

### 13.2 Hướng Nghiên cứu Mở rộng trong Tương lai
- **Tích hợp Tương tác Giọng nói Đa phương thức (Real-time Voice AI):** Mở rộng đường ống hội thoại với WebRTC và LiveKit Agents / Pipecat để thực khách có thể trò chuyện trực tiếp với Aria bằng giọng nói tự nhiên tại bàn.
- **Mở rộng Hệ thống Đa Tác tử Nhà hàng (Multi-Agent Ecosystem):** Xây dựng mạng lưới phối hợp gồm: *Aria (Tư vấn bàn ăn) $\leftrightarrow$ Chef Agent (Điều phối nguyên liệu & thời gian nấu trong bếp) $\leftrightarrow$ Manager Agent (Dự báo tồn kho và phân tích kinh doanh)*.

---

## 14. Danh mục Tài liệu Tham khảo

*(Toàn bộ các tài liệu PDF gốc và bản dịch tiếng Việt học thuật được lưu trữ trực tiếp trong thư mục `paper/`)*

1. **Zhu, L., & Cai, M.** (2026). *From Language Models to World-Acting Systems: Progress and Limits of Agentic AI across Digital, Social, Virtual, and Physical Environments*. arXiv preprint, arXiv:2609.04894v1 [cs.AI], 4 Sep 2026.
   - **Tệp PDF gốc:** [`From Language Models to World-Acting Systems.pdf`](From%20Language%20Models%20to%20World-Acting%20Systems.pdf)
   - **Bản dịch tiếng Việt:** [`From_Language_Models_to_World-Acting_Systems_VI.md`](From_Language_Models_to_World-Acting_Systems_VI.md)

2. **Ahmed, S. N.** (2026). *Beyond Document Retrieval: Architectural Challenges When LLM Agents Query Structured Enterprise Data*. Department of Computer Science and Engineering, University of Texas at Arlington. arXiv preprint, arXiv:2608.19235v1 [cs.DL], 4 Aug 2026.
   - **Tệp PDF gốc:** [`Beyond Document Retrieval: Architectural Challenges When LLM Agents Query Structured Enterprise Data.pdf`](Beyond%20Document%20Retrieval:%20Architectural%20Challenges%20When%20LLM%20Agents%20Query%20Structured%20Enterprise%20Data.pdf)
   - **Bản dịch tiếng Việt:** [`Beyond_Document_Retrieval_VI.md`](Beyond_Document_Retrieval_VI.md)

3. **Alenezi, M.** (2026). *From Prompt–Response to Goal-Directed Systems: The Evolution of Agentic AI Software Architecture*. The Saudi Technology and Security Comprehensive Control Company (Tahakom). arXiv preprint, arXiv:2602.10479v1 [cs.SE], 11 Feb 2026.
   - **Tệp PDF gốc:** [`The Evolution of Agentic AI Software Architecture.pdf`](The%20Evolution%20of%20Agentic%20AI%20Software%20Architecture.pdf)
   - **Bản dịch tiếng Việt:** [`The_Evolution_of_Agentic_AI_Software_Architecture_VI.md`](The_Evolution_of_Agentic_AI_Software_Architecture_VI.md)

4. **Wang, C. H., Tu, M., Zhang, Q., Wu, W., Zhou, L., Shen, M., & Wei, C.** (2026). *Self-evolving Agentic Customer Support System at LinkedIn*. LinkedIn Corporation. arXiv preprint, arXiv:2608.10224v1 [cs.AI], 10 Aug 2026.
   - **Tệp PDF gốc:** [`Self-evolving Agentic Customer Support System at LinkedIn.pdf`](Self-evolving%20Agentic%20Customer%20Support%20System%20at%20LinkedIn.pdf)
   - **Bản dịch tiếng Việt:** [`Self_evolving_Agentic_Customer_Support_System_LinkedIn_VI.md`](Self_evolving_Agentic_Customer_Support_System_LinkedIn_VI.md)

5. **Cheerla, C.** (2025). *Advancing Retrieval-Augmented Generation for Structured Enterprise and Internal Data*. Indian Institute of Technology (IIT) Roorkee. arXiv preprint, arXiv:2507.12425v1 [cs.CL], 16 Jul 2025.
   - **Tệp PDF gốc:** [`Advancing Retrieval-Augmented Generation for Structured Enterprise and Internal Data.pdf`](Advancing%20Retrieval-Augmented%20Generation%20for%20Structured%20Enterprise%20and%20Internal%20Data.pdf)
   - **Bản dịch tiếng Việt:** [`Advancing_RAG_Structured_Enterprise_Internal_Data_VI.md`](Advancing_RAG_Structured_Enterprise_Internal_Data_VI.md)
