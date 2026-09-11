# Reflect-SQL: Khung làm việc dựa trên Tự suy ngẫm cho Text-to-SQL (Reflect-SQL: A Self-Reflection Based Framework for Text-to-SQL)

**Tác giả:** Anupreksha Jain$^{1[0009-0004-5609-2108]}$ và Manish Shrivastava$^{1[0000-0001-8705-6637]}$  
*Viện Công nghệ Thông tin Quốc tế Hyderabad, Ấn Độ (International Institute of Information Technology Hyderabad, India)*  
`anupreksha.j@research.iiit.ac.in`, `m.shrivastava@iiit.ac.in`

---

## Tóm tắt (Abstract)
Bình dân hóa quyền truy cập dữ liệu thông qua ngôn ngữ tự nhiên là một mục tiêu tối quan trọng đối với các doanh nghiệp hiện đại, nhưng việc ứng dụng Text-to-SQL trong thực tế đang bị cản trở nghiêm trọng bởi các vấn đề phức tạp trong thế giới thực: 
1. Lược đồ cơ sở dữ liệu (schema) lớn và khó hiểu (obscure),
2. Truy xuất không hiệu quả các bảng và cột liên quan do cấu trúc phức tạp của lược đồ và truy vấn mơ hồ của người dùng,
3. Sinh ra mã SQL bị lỗi cú pháp hoặc sai lệch logic do thiếu cơ chế xác thực và sửa lỗi mạnh mẽ.

Để giải quyết những thách thức mang tính hệ thống này, chúng tôi giới thiệu **Reflect-SQL**, một khung làm việc (framework) mới cho Text-to-SQL, dựa trên phương pháp tự suy ngẫm (self-reflection) nhiều giai đoạn để xây dựng sự hiểu biết về các lược đồ khó hiểu thông qua một cơ sở tri thức (Knowledge Base), thiết lập một quy trình truy xuất hiệu quả và một hệ thống sinh mã SQL chuẩn xác về cả mặt cú pháp lẫn ngữ nghĩa. 

Thay vì chỉ thực hiện một lượt duy nhất (single-pass attempt), hệ thống của chúng tôi sử dụng cơ chế chấm điểm dựa trên LLM-làm-giám-khảo (LLM-as-a-judge) bên trong các vòng lặp phản hồi (feedback loops) liên kết chặt chẽ với nhau để tinh chỉnh lặp lại kết quả ở từng giai đoạn:
- Vòng lặp truy xuất có phản hồi sẽ tinh chỉnh câu truy vấn ngôn ngữ tự nhiên của người dùng,
- Vòng lặp tổng hợp sẽ kiểm tra và sửa mã SQL,
- Cuối cùng, vòng lặp suy diễn logic (entailment loop) tối ưu hóa toàn bộ quy trình từ đầu đến cuối và liên tục làm giàu cơ sở tri thức.

Bằng cách tích hợp các lớp tự suy ngẫm này, Reflect-SQL đã thu hẹp khoảng cách quan trọng giữa ý định của người dùng và dữ liệu phức tạp. Trên tập dữ liệu benchmark đầy thách thức **BIRD**, khung làm việc của chúng tôi đạt độ chính xác thực thi (**execution accuracy**) là **72.03%**, vượt trội đáng kể so với các mô hình đường cơ sở (baselines) tiên tiến nhất hiện nay (SOTA), chứng minh một bước nhảy vọt về độ tin cậy cho các ứng dụng cấp doanh nghiệp.

**Từ khóa:** Text-to-SQL · Tự suy ngẫm (Self-reflection) · Tạo sinh tăng cường truy xuất (Retrieval-Augmented Generation) · Cơ sở tri thức (Knowledge Base) · Mô hình ngôn ngữ lớn (Large Language Models).

---

## 1 Giới thiệu (Introduction)

Việc triển khai thành công Text-to-SQL trong môi trường doanh nghiệp phụ thuộc vào việc vượt qua ba thách thức quan trọng:
1. **Lược đồ khó hiểu (Schema Obscurity):** Việc giải mã các cơ sở dữ liệu quy mô lớn có đặc điểm là tên cột khó hiểu, viết tắt (ví dụ: `'A2'`, `'dname'`) và các mối quan hệ không được ghi chép tài liệu rõ ràng.
2. **Truy xuất theo ngữ cảnh (Contextual Retrieval):** Việc trích xuất chính xác các thành phần lược đồ liên quan là rất khó, do các truy vấn mơ hồ của người dùng thường không ánh xạ rõ ràng vào các môi trường cơ sở dữ liệu có cấu trúc phức tạp.
3. **Tính toàn vẹn logic (Logical Integrity):** Cần vượt ra ngoài tính đúng đắn về cú pháp để đảm bảo độ chính xác về ngữ nghĩa, ngăn chặn việc sinh ra mã SQL có lỗi logic dẫn đến kết quả sai.

Chúng tôi giới thiệu **Reflect-SQL**, một khung làm việc giúp vượt qua những thách thức này thông qua quá trình tự suy ngẫm nhiều giai đoạn. Hệ thống sử dụng một Cơ sở tri thức (Knowledge Base) động để làm rõ các cấu trúc cơ sở dữ liệu khó hiểu, tạo điều kiện cho quy trình Truy xuất Dựa trên Phản hồi (Feedback-Driven Retrieval) tinh chỉnh các truy vấn mơ hồ của người dùng nhằm thu thập ngữ cảnh chính xác. Ngoài ra, một vòng lặp Tổng hợp SQL Lặp lại (Iterative SQL Synthesis loop) sẽ xác thực và sửa mã được sinh ra, sử dụng bước kiểm tra suy diễn logic (entailment check) cuối cùng để đảm bảo kết quả khớp chính xác với ý định ban đầu của người dùng.

Các thử nghiệm của chúng tôi đã xác thực phương pháp phản chiếu đa tầng này, cho thấy mức cải thiện độ chính xác đáng kể là **11.05%** trên các bộ benchmark phức tạp. Các đóng góp chính của công trình này gồm có:
1. **Một Khung làm việc Text-to-SQL hoàn chỉnh:** Một hệ thống toàn diện, từ đầu đến cuối (end-to-end) cho các tác vụ Text-to-SQL trong doanh nghiệp.
2. **Cơ sở tri thức động (Dynamic Knowledge Base):** Một cơ chế học tập giúp làm giàu khả năng hiểu lược đồ theo thời gian.
3. **Đánh giá SQL không cần mẫu đối chiếu (Reference-Free SQL Evaluation):** Một phương pháp luận mới để xác thực mã SQL mà không cần dựa vào các nhãn chuẩn vàng (gold-standard labels).
4. **Tinh chỉnh truy vấn dựa trên phản hồi (Feedback-Driven Query Refinement):** Một quy trình lặp giúp căn chỉnh các truy vấn mơ hồ của người dùng cho khớp với lược đồ cơ sở dữ liệu.

---

## 2 Các nghiên cứu liên quan (Related Work)

[1] đã giới thiệu khái niệm tự suy ngẫm (self-reflection) trong các mô hình ngôn ngữ nhằm cải thiện dần tính xác thực và tính nhất quán của các câu trả lời được sinh ra, chủ yếu áp dụng cho các tác vụ miền mở (open-domain). Trong phương pháp của họ, mô hình tự chấm điểm đầu ra của mình và tinh chỉnh lặp lại dựa trên các lỗi đã được xác định. Công trình của chúng tôi kế thừa và mở rộng mô hình này sang miền có cấu trúc của quá trình sinh Text-to-SQL — một tác vụ với các ràng buộc và tiêu chí đánh giá hoàn toàn khác biệt đối với việc Xây dựng Cơ sở Tri thức, Truy xuất Thông tin và Sinh mã SQL.

### 2.1 Xây dựng Cơ sở Tri thức (Knowledge Base Construction)
Các nghiên cứu gần đây đã chỉ ra rằng các cơ sở tri thức phong phú — được xây dựng bằng cách căn chỉnh siêu dữ liệu với các thuật ngữ kinh doanh [2], cải thiện mô tả cột [3], [4], [5], hoặc bổ sung tri thức miền [6] — giúp cải thiện đáng kể hiệu năng Text-to-SQL. Tuy nhiên, các phương pháp này chủ yếu coi cơ sở tri thức là một tài nguyên tĩnh chỉ được tạo ra một lần. Phương pháp của chúng tôi giới thiệu một vòng lặp tinh chỉnh lặp lại, trong đó cơ sở tri thức liên tục được làm giàu dựa trên các lần thực thi truy vấn thành công, cho phép thích ứng với các ứng dụng mập mờ trong thế giới thực.

### 2.2 Truy xuất Thông tin (Information Retrieval)
Kỹ thuật Tạo sinh Tăng cường Truy xuất (Retrieval-Augmented Generation - RAG) do [7] giới thiệu đã phát triển để bao gồm việc tinh chỉnh truy vấn lặp lại nhằm nâng cao chất lượng ngữ cảnh [8], [9], [10]. Chúng tôi áp dụng nguyên lý này vào miền cơ sở dữ liệu có cấu trúc bằng cách tạo ra một quy trình truy xuất phân cấp, nhận biết lược đồ. Khác với RAG tiêu chuẩn, khung làm việc của chúng tôi truy xuất thông tin lặp lại từ Cơ sở tri thức (bảng, bảng liên quan và các cột) và sử dụng điểm phản hồi cụ thể để định dạng lại truy vấn ngôn ngữ tự nhiên của người dùng nếu ngữ cảnh truy xuất không đủ hoặc không liên quan.

### 2.3 Text-to-SQL
Lĩnh vực Text-to-SQL đã tiến hóa từ các kiến trúc mã hóa-giải mã (encoder-decoder) ban đầu như Seq2SQL [11] và SQLNet [12] sang mô hình hiện nay được thống trị bởi các Mô hình Ngôn ngữ Lớn (LLM). Các phương pháp học theo ngữ cảnh (in-context learning) hiện đại như DIN-SQL [13] và SQLPrompt [14] đã cải thiện đáng kể hiệu năng nhờ tận dụng các ví dụ mẫu (few-shot exemplars) và chuỗi suy luận (chain-of-thought). Khung làm việc của chúng tôi không chỉ xây dựng trên các nền tảng này mà còn đưa vào các lớp tự sửa lỗi quan trọng:
- Thứ nhất, chúng tôi sử dụng vòng lặp tổng hợp SQL lặp lại, vượt qua kiểm tra cú pháp đơn thuần để sửa các lỗi logic dựa trên điểm ngữ nghĩa đa chiều.
- Thứ hai, như một lớp bảo vệ cuối cùng, chúng tôi thêm bước kiểm tra suy diễn logic (entailment check) để xác thực xem kết quả của câu truy vấn có thực sự trả lời đúng ý định của người dùng hay không.

---

## 3 Xây dựng và tinh chỉnh cơ sở tri thức (Knowledge Base Construction and Refinement)

Cơ sở tri thức (KB) đóng vai trò như một lớp trừu tượng ngữ nghĩa chứa các mô tả bảng, siêu dữ liệu cột và các mối quan hệ. Thành phần này rất quan trọng để xử lý các cơ sở dữ liệu quy mô doanh nghiệp, vốn thường vượt quá giới hạn ngữ cảnh (context window) của các LLM và chịu ảnh hưởng bởi các quy ước đặt tên khó hiểu. Bằng cách chuyển chi tiết lược đồ thành một KB có cấu trúc bên ngoài, chúng tôi khắc phục được giới hạn ngữ cảnh và hiểu biết lược đồ hạn chế, đảm bảo LLM chỉ truy cập các thông tin cụ thể cần thiết để thu hẹp khoảng cách giữa ý định của người dùng và cơ sở dữ liệu.

Kiến trúc tổng thể của khung làm việc được minh họa trong **Hình 1**.

```
+-------------------+      +------------------+      +---------------------+      +-------------+  Yes  +--------------------+
|  KB Construction  | ---> |  Retrieval Loop  | ---> | SQL Generation Loop | ---> |  Entailed?  | ----> |   KB Enrichment    |
| Generate table    |      | Retrieve relevant|      | Generate and refine |      +-------------+       | Improve KB with    |
| descriptions from |      | tables & columns |      | SQL Query           |             | No           | query & SQL        |
| table schema      |      +------------------+      +---------------------+             |              +--------------------+
+-------------------+               ^                           |                        |
                                    |___________________________|________________________|
```
*Hình 1: Kiến trúc mức cao của khung làm việc Reflect-SQL.*

### 3.1 Xây dựng (Construction)
Cơ sở tri thức đóng vai trò là xương sống ngữ nghĩa của khung làm việc chúng tôi. Đối với tập dữ liệu BIRD [15], chúng tôi xây dựng kho lưu trữ này bằng cách tổng hợp lược đồ cơ sở dữ liệu, các giá trị dữ liệu mẫu, cùng tập huấn luyện gồm các câu hỏi mẫu và bằng chứng bên ngoài (external evidence). Trong bối cảnh doanh nghiệp rộng hơn, quy trình này cũng tiếp nhận tri thức chuyên ngành từ tài liệu kinh doanh và từ điển thuật ngữ. 

Các đầu vào này được xử lý để tạo ra các mô tả toàn diện cho bảng, cột và các mối quan hệ (cấu trúc JSON chi tiết được cung cấp trong Phụ lục B). Để truy xuất hiệu quả, các thành phần này được mã hóa thành các biểu diễn vector dày đặc bằng mô hình nhúng câu (sentence embedding model) [16]. Cơ sở dữ liệu vector được cấu trúc theo dạng phân cấp: một tập hợp toàn cục (global collection) cho mô tả bảng và các tập hợp cục bộ (local collections) riêng biệt cho mô tả cột của từng bảng. Kiến trúc này hỗ trợ quy trình truy xuất hai bước: đầu tiên xác định các bảng liên quan, sau đó thu hẹp phạm vi vào các cột cụ thể.

### 3.2 Tinh chỉnh lặp (Iterative Refinement)
Trong bước hậu xử lý này, sau khi thực thi SQL thành công, nếu câu truy vấn vượt qua các bước xác thực cú pháp, ngữ nghĩa và điểm suy diễn logic giữa truy vấn và kết quả vượt qua ngưỡng $\theta_e$, cơ sở tri thức sẽ được tinh chỉnh. Việc cập nhật có điều kiện này rất quan trọng nhằm ngăn chặn sự lan truyền lỗi. Các câu truy vấn chất lượng thấp hoặc sai lệch ngữ cảnh có thể làm ô nhiễm cơ sở tri thức. Chỉ những truy vấn đã được xác thực chuẩn xác về cú pháp và ngữ nghĩa với kết quả đã kiểm chứng mới được đóng góp vào quá trình học của hệ thống.

Cơ chế cập nhật lặp này rất cần thiết trong môi trường thực tế, đặc biệt là các môi trường có tên cột mơ hồ hoặc không thể giải mã và lược đồ liên tục thay đổi. Ví dụ trong **Bảng 1** cho thấy mô tả các cột được tinh chỉnh như thế nào sau khi thực thi truy vấn thành công.

| Thành phần (Component) | Trước khi tinh chỉnh (Before Refinement) | Sau khi tinh chỉnh (After Refinement) |
| :--- | :--- | :--- |
| `loan.status` | Cột phân loại trạng thái khoản vay với các giá trị 'A', 'B', 'C', 'D'. *(Categorical column for loan status with values 'A', 'B', 'C', 'D'.)* | Trạng thái trả nợ: 'A' biểu thị đã hoàn thành hoặc đã thanh toán, 'B' biểu thị vỡ nợ... *(Loan repayment state: 'A' indicates finished or paid, 'B' indicates defaulted...)* |
| `trans.k_symbol` | Cột văn bản tên 'k_symbol' với các giá trị 'POJISTNE', 'SIPO'. *(Text column named 'k_symbol' with values 'POJISTNE', 'SIPO'.)* | Danh mục giao dịch: xác định loại thanh toán (ví dụ 'POJISTNE' tương ứng với Bảo hiểm)... *(Transaction Category: determines the payment type (e.g. 'POJISTNE' maps to Insurance)...)* |

*Bảng 1: Ví dụ về Tinh chỉnh Cơ sở Tri thức cho tập dữ liệu BIRD [15]*

---

## 4 Truy xuất RAG Lặp lại (Iterative RAG Retrieval)

Trong giai đoạn truy xuất ban đầu, chúng tôi sử dụng KB đã chọn lọc để xác định các bảng và cột liên quan cho truy vấn của người dùng, như chi tiết trong **Hình 2**.

```
                               +-----------------------------+
                               |        Retrieval Loop       |
+--------------------+         |  +-----------------------+  |
|   Knowledge Base   | ------->|  | Information Retrieval |  |
+--------------------+         |  | - Retrieve tables     |  |
                               |  | - Retrieve rel. tables|  |
+--------------------+         |  | - Retrieve columns    |  |
|     User Query     | ------->|  +-----------------------+  |
+--------------------+         |              |              |
                               |              v              |
                               |    [Scorer > threshold?]    |
                               |      /               \      |
                               |   (No)               (Yes)  |
                               |    /                   \    |
                               |   v                     v   |
                               | [LLM Prompt:          [Tới  |
                               |  Cải thiện query]   SQL Loop]
                               +-----------------------------+
```
*Hình 2: Vòng lặp truy xuất lặp lại (Iterative Retrieval Loop).*

### 4.1 Truy xuất bảng và cột (Quy trình truy xuất phân cấp)
Cho một truy vấn người dùng $Q$, chúng tôi nhúng (embed) truy vấn và sử dụng độ tương đồng cosine (công thức 1) để truy xuất top-$k$ bảng $\{T_1, \ldots, T_k\}$ từ cơ sở dữ liệu vector:

$$\text{score}(T_i, Q) = \cos(t_i, q) = \frac{t_i \cdot q}{\|t_i\| \|q\|} \quad (1)$$

Tập hợp này được mở rộng bằng cách bổ sung các bảng có quan hệ được định nghĩa trong KB, đảm bảo sẵn có các đường dẫn liên kết (join paths). Với mỗi bảng được chọn, một tìm kiếm dựa trên embedding tương tự sẽ truy xuất các cột liên quan nhất.

### 4.2 Chấm điểm mức độ liên quan và tính đầy đủ
Chúng tôi tính toán hai chỉ số để đánh giá chất lượng truy xuất: **Điểm liên quan (Relevance Score - $R$)** cho sự căn chỉnh ngữ nghĩa và **Điểm đầy đủ (Completeness Score - $C$)** để đảm bảo tất cả các thành phần lược đồ cần thiết đều hiện diện. Các điểm này được sinh ra bởi phương pháp mới dùng LLM-làm-giám-khảo (chi tiết prompt xem ở Phụ lục A). Điểm truy xuất cuối cùng ($Score_r$) được tính theo công thức 2:

$$Score_r = \alpha R + (1 - \alpha)C, \quad \text{trong đó } \alpha \in [0, 1] \quad (2)$$

### 4.3 Tinh chỉnh truy vấn (Query Refinement)
Nếu lược đồ được truy xuất bị coi là chưa đủ ($Score_r < \theta_r$), một vòng lặp tinh chỉnh lặp lại sẽ được kích hoạt. Ở mỗi vòng lặp:
1. LLM trước tiên định dạng lại câu truy vấn của người dùng thành phiên bản chi tiết hơn ($Q'$) nhằm cải thiện trọng tâm ngữ nghĩa.
2. Đồng thời, phạm vi truy xuất được mở rộng bằng cách tăng số lượng bảng và cột cần lấy trong lượt tiếp theo.

Quá trình tinh chỉnh tiêu điểm truy vấn kết hợp với mở rộng phạm vi tìm kiếm cho phép hệ thống nhanh chóng nhắm trúng tập hợp đầy đủ các thành phần lược đồ cần cho các truy vấn phức tạp. Vòng lặp kết thúc khi $Score_r \ge \theta_r$ hoặc khi đạt số lần lặp tối đa.

---

## 5 Sinh truy vấn SQL (SQL Query Generation)

Với tập hợp bảng, cột, mô tả và dữ liệu mẫu chất lượng cao đã truy xuất, chúng tôi sinh truy vấn SQL ứng viên bằng LLM, như minh họa trong **Hình 3**.

```
+------------------------------------------------------------------------+
|                          SQL Generation Loop                           |
|                                                                        |
| [Prompt với bảng, cột, quan hệ đã truy xuất] -> [LLM] -> [Mã SQL]      |
|                                                              |         |
|                                                              v         |
|                                                    [Đúng cú pháp?]     |
|                                                     /           \      |
|                                                  (No)          (Yes)   |
|                                                   /               \    |
|   [Prompt LLM sửa lỗi thực thi] <-----------------                 v   |
|                                                          [Điểm ngữ nghĩa|
|                                                           > threshold?] |
|                                                           /          \  |
|                                                        (No)         (Yes)
|                                                         /              \|
|   [Prompt LLM sinh lại dựa trên phản hồi] <-------------                v
|                                                                 [Kiểm tra
|                                                                 Suy diễn
|                                                                 (Entailment)]
+------------------------------------------------------------------------+
```
*Hình 3: Vòng lặp sinh mã SQL lặp lại (Iterative SQL Generation Loop).*

### 5.1 Vòng lặp xác thực và sửa lỗi cú pháp (Syntactic Validation and Correction Loop)
Mỗi câu truy vấn SQL được sinh ra ngay lập tức được kiểm tra cú pháp bằng database engine. Khi gặp lỗi cú pháp, vòng lặp sửa lỗi được kích hoạt: hệ thống đưa câu truy vấn ban đầu, thông báo lỗi thu được và ngữ cảnh lược đồ trở lại LLM kèm theo chỉ dẫn sửa lỗi. Vòng lặp này lặp lại cho đến khi sinh được truy vấn đúng cú pháp hoặc đạt giới hạn số lần lặp, giúp hệ thống chống chịu tốt trước các sai sót tạo sinh cơ bản.

### 5.2 Vòng lặp xác thực ngữ nghĩa (Semantic Validation Loop)
Truy vấn đúng cú pháp sẽ trải qua bước xác thực ngữ nghĩa theo bốn khía cạnh:
1. Tính nhất quán tên cột (Column name consistency - $C$),
2. Mức độ chi tiết và phép tổng hợp (Granularity and aggregation - $G$),
3. Tính nhất quán của phép nối và quan hệ (Join and relationship consistency - $J$),
4. Sự căn chỉnh logic truy vấn (Query logic alignment - $Q$).

Một LLM-làm-giám-khảo (prompt ở Phụ lục A) sẽ chấm điểm từng khía cạnh, và điểm ngữ nghĩa cuối cùng $S$ được tính là tổng trọng số các điểm như trong công thức 3:

$$S = w_c \cdot C + w_g \cdot G + w_j \cdot J + w_q \cdot Q \quad (3)$$

Trong đó $w_c, w_g, w_j, w_q$ là các trọng số được định nghĩa trước. Nếu $S < \theta_s$, truy vấn sẽ được gửi lại cho LLM cùng phản hồi chẩn đoán để sửa đổi lặp lại.

---

## 6 Suy diễn logic (Entailment)

Khi truy vấn vượt qua mọi khâu xác thực, nó được thực thi trên database engine để lấy kết quả. Trong giai đoạn kiểm chứng cuối cùng, chúng tôi kiểm tra xem tập kết quả $R$ có suy diễn logic (entail) câu truy vấn gốc $Q$ của người dùng hay không.

### 6.1 Chấm điểm suy diễn logic (Entailment Scoring)
Như thể hiện trong công thức 4, điểm suy diễn $E(Q, R)$ được tính bởi LLM-làm-giám-khảo (xem Phụ lục A), đánh giá cả **Tính nhất quán lược đồ ($E_{schema}$)** và **Tính nhất quán dữ liệu ($E_{data}$)**:

$$E(Q, R) = \beta \cdot E_{schema} + (1 - \beta) \cdot E_{data}, \quad \text{trong đó } \beta \in [0, 1] \quad (4)$$

### 6.2 Quyết định suy diễn logic (Entailment Decision)
Nếu $E(Q, R) \ge \theta_e$, kết quả sẽ được trả về cho người dùng, đồng thời KB được cập nhật với cặp truy vấn - kết quả thành công này. Nếu không, toàn bộ quy trình sẽ được kích hoạt lại kèm phản hồi về lý do thất bại (ví dụ: thiếu cột, bộ lọc không đúng). Vòng lặp cuối này đảm bảo đầu ra của hệ thống thực sự khớp với ý định của người dùng.

---

## 7 Giảm thiểu thiên kiến trong đánh giá dựa trên LLM (Mitigating Bias in LLM-based Evaluation)

Chúng tôi nhận thấy việc dùng LLM làm giám khảo có thể dẫn đến các thiên kiến tiềm ẩn [17]. Để giảm thiểu điều này, khung làm việc áp dụng chiến lược tạo prompt có cấu trúc và có ví dụ mẫu (few-shot prompting) cho tất cả các tác vụ chấm điểm. Như trong Phụ lục A, các prompt của chúng tôi cung cấp hướng dẫn chi tiết, tiêu chí chấm điểm (rubrics) và các ví dụ few-shot. Các ví dụ này neo giữ phán đoán của LLM vào các tiêu chuẩn cụ thể phù hợp với tác vụ, tăng độ tin cậy và khả năng tái lập của quá trình đánh giá, đồng thời giảm tác động của các thiên kiến vốn có của mô hình.

---

## 8 Tối ưu hóa tham số mô hình (Model Parameter Optimization)

Chúng tôi đã tiến hành tìm kiếm dạng lưới có hệ thống (grid search) để xác định các giá trị tối ưu cho tất cả các tham số: các ngưỡng $(\theta_r, \theta_s, \theta_e)$ và các trọng số $(\alpha, \beta, w_c, w_g, w_j, w_q)$. Mỗi tham số được thay đổi và tổ hợp mang lại độ chính xác cao nhất trên tập kiểm định (validation set) đã được chọn. Các giá trị tối ưu cuối cùng được trình bày trong **Bảng 2**.

| Tham số (Parameter) | Giá trị (Value) |
| :---: | :---: |
| $\theta_r$ | 4 |
| $\theta_s$ | 5 |
| $\theta_e$ | 3 |
| $\alpha$ | 0.6 |
| $\beta$ | 0.2 |
| $w_c$ | 0.1 |
| $w_g$ | 0.3 |
| $w_j$ | 0.4 |
| $w_q$ | 0.2 |

*Bảng 2: Các tham số được tối ưu hóa bằng phương pháp grid search.*

---

## 9 Đánh giá thực nghiệm (Evaluation)

### 9.1 Thiết lập thực nghiệm (Experimental Setup)
Chúng tôi đánh giá khung làm việc của mình trên benchmark **BIRD** [15]. Do việc tiếp cận các bộ dữ liệu doanh nghiệp lớn trong thế giới thực cho nghiên cứu học thuật thường bất khả thi vì tính chất bảo mật độc quyền, bộ benchmark BIRD đóng vai trò như một đại diện xuất sắc. Nó được thiết kế để kiểm thử các hệ thống Text-to-SQL trên nhiều cơ sở dữ liệu quan hệ đa dạng phản ánh đúng độ phức tạp trong thực tế, khiến nó trở thành môi trường kiểm thử phù hợp cho hệ thống của chúng tôi.

### 9.2 Kết quả (Results)
Chúng tôi đánh giá hệ thống bằng các mô hình qua API của Claude, OpenAI, DeepSeek, và các mô hình mã nguồn mở thuộc họ DeepSeek. **Bảng 3** trình bày độ chính xác thực thi trên tập dữ liệu BIRD. Trên tất cả các mô hình, việc kích hoạt khung làm việc tự suy ngẫm mang lại mức tăng độ chính xác đáng kể so với việc đánh giá không có khung suy ngẫm, với mức tăng tổng thể từ **6-8%**. Kết quả này khẳng định cơ chế suy luận và tinh chỉnh lặp lại đóng vai trò then chốt trong việc nâng cao hiệu năng.

| Mô hình (Model) | Đơn giản (Simple) | Trung bình (Moderate) | Thách thức (Challenging) | Tổng thể (Overall) |
| :--- | :---: | :---: | :---: | :---: |
| **Mô hình Claude** | | | | |
| Claude-sonnet-4.5 (có suy ngẫm - with reflection) | **88.97** | **50.65** | **32.41** | **72.03** |
| Claude-sonnet-4.5 (không suy ngẫm - w/o reflection) | 81.18 | 45.25 | 24.13 | 64.92 |
| **Mô hình API OpenAI** | | | | |
| o1-preview (có suy ngẫm - with reflection) | 75.89 | 48.49 | 18.62 | 62.19 |
| o1-preview (không suy ngẫm - w/o reflection) | 69.35 | 40.54 | 15.86 | 55.66 |
| **Mô hình API DeepSeek** | | | | |
| deepseek-reasoner (có suy ngẫm - with reflection) | 73.62 | 46.55 | 17.24 | 60.10 |
| deepseek-reasoner (không suy ngẫm - w/o reflection) | 62.90 | 40.54 | 12.41 | 51.88 |
| **Mô hình mã nguồn mở (Cài đặt cục bộ)** | | | | |
| DeepSeek-Coder-V2-Lite... (có suy ngẫm - with reflection) | 43.55 | 21.62 | 3.44 | 35.02 |
| DeepSeek-Coder-V2-Lite... (không suy ngẫm - w/o reflection) | 30.65 | 13.51 | 0.0 | 22.64 |

*Bảng 3: Độ chính xác (%) của các mô hình khác nhau trên tập dữ liệu BIRD. Các kết quả cao nhất trong từng danh mục được in đậm.*

### 9.3 Đánh giá của con người (Human Evaluation)
Để bổ trợ cho việc đánh giá tự động, chúng tôi thực hiện đánh giá định tính của con người nhằm phân tích tính đúng đắn và sự căn chỉnh ngữ nghĩa của các truy vấn được sinh ra, đặc biệt tập trung vào tác động của bước kiểm tra suy diễn logic (entailment check). Đánh giá này tập trung vào việc phát hiện các lỗi logic tinh vi mà kiểm tra cú pháp hoặc xác thực ngữ nghĩa cơ bản khó có thể bắt được. **Bảng 4** minh họa một ví dụ như vậy.

| Giai đoạn (Stage) | Phân tích / Đoạn mã SQL (Analysis / SQL Snippet) |
| :--- | :--- |
| **Truy vấn người dùng (User Query)** | Liệt kê ba mức tỷ lệ miễn phí hợp lệ thấp nhất cho học sinh tại các trường bổ túc. *(List the lowest three eligible free rates for students in continuation schools.)* |
| **SQL ban đầu (Initial SQL)** | `SELECT ... (f.Count / f.Enrollment) ... WHERE s.SOCType LIKE '%Continuation%'` |
| **Kết quả kiểm tra suy diễn logic (Entailment Check Result)** | **Điểm:** 2 / 5<br>**Lý do:** Kết quả trả về các giá trị `None` do lỗi chia cho 0 hoặc giá trị null. Cần lọc số lượng ghi danh dương (`Enrollment > 0`) và ép kiểu số thực (`CAST AS REAL`). |
| **SQL đã tinh chỉnh (Refined SQL)** | `SELECT ... (CAST(f.Count AS REAL) / f.Enrollment) ... WHERE f.Enrollment > 0 AND s.SOCType LIKE '%Continuation%'` |

*Bảng 4: Ví dụ về tinh chỉnh SQL nhờ phản hồi từ kiểm tra suy diễn logic.*

### 9.4 So sánh với các phương pháp tiên tiến nhất (Comparison with State-of-the-Art)
Chúng tôi so sánh khung làm việc của mình với các phương pháp SOTA hàng đầu trên tập phát triển (development set) của BIRD (**Bảng 5**). Reflect-SQL đạt độ chính xác thực thi đỉnh cao là **72.03%**, cải thiện đáng kể so với DIN-SQL [13] (50.72%), DAIL-SQL [19] (57.41%) và MAC-SQL [20] (59.59%). Hiệu năng này tương đương với kiến trúc CHASE-SQL [21] mới đề xuất gần đây, xác lập Reflect-SQL là giải pháp hàng đầu cho việc truy vấn cơ sở dữ liệu phức tạp.

| Phương pháp (Method) | Độ chính xác tổng thể (Overall Accuracy %) |
| :--- | :---: |
| BIRD paper [15] | 46.35 |
| DIN-SQL [13] | 50.72 |
| DAIL-SQL [19] | 57.41 |
| MAC-SQL [20] | 59.59 |
| CHASE-SQL + Claude 3.5 Sonnet [21] | 69.53 |
| CHASE-SQL + Gemini 1.5 Pro [21] | 73.01 |
| **Reflect-SQL + Claude 4.5 Sonnet (Của chúng tôi)** | **72.03** |

*Bảng 5: So sánh với các phương pháp SOTA trên tập dev BIRD (Độ chính xác thực thi %). Số liệu của các phương pháp khác được trích xuất từ các công bố tương ứng.*

---

## 10 Phân tích thành phần (Ablation Study)

Để hiểu rõ đóng góp của từng thành phần, chúng tôi tiến hành phân tích triệt tiêu (ablation study) sử dụng `deepseek-chat` làm mô hình nền tảng. Như trong **Bảng 6**, việc loại bỏ bất kỳ thành phần nào của khung làm việc Reflect-SQL đều làm suy giảm hiệu năng. Trong đó, vòng lặp tự suy ngẫm trong khâu sinh SQL đóng vai trò quan trọng nhất — việc loại bỏ nó khiến độ chính xác giảm mạnh nhất. Những phát hiện này khẳng định tính hiệu quả của phương pháp suy ngẫm nhiều giai đoạn.

| Biến thể (Variant) | Đơn giản (Simple) | Trung bình (Moderate) | Thách thức (Challenging) | Tổng thể (Overall) |
| :--- | :---: | :---: | :---: | :---: |
| **Mô hình đầy đủ (Full Model - Self-Reflect)** | **68.64** | **43.10** | **14.48** | **55.80** |
| Không có tự suy ngẫm trong sinh SQL (w/o Self-Reflection in SQL Gen) | 62.91 | 37.93 | 12.41 | 50.58 |
| Không có truy xuất lặp (w/o Iterative Retrieval) | 67.02 | 40.30 | 10.34 | 53.58 |
| Không có kiểm tra suy diễn logic (w/o Entailment Check) | 64.10 | 41.59 | 13.10 | 52.47 |

*Bảng 6: Kết quả phân tích thành phần cho thấy sự đóng góp của từng module.*

---

## 11 Kết luận và Hướng nghiên cứu tương lai (Conclusion and Future Work)

Trong công trình này, chúng tôi đã trình bày Reflect-SQL, một khung làm việc tự suy ngẫm tận dụng quá trình truy xuất, sinh mã và xác thực lặp lại để tạo ra các truy vấn SQL chính xác. Phương pháp của chúng tôi giải quyết các thách thức lớn trong môi trường lược đồ cơ sở dữ liệu lớn bằng cách tinh chỉnh truy vấn người dùng và đầu ra SQL trong một vòng lặp phản hồi khép kín. Bằng cách liên tục cập nhật cơ sở tri thức, hệ thống thích ứng theo thời gian, nâng cao hiệu năng cho các trường hợp sử dụng trong thực tế.

Trong tương lai, chúng tôi dự định:
1. Nghiên cứu các biểu diễn lược đồ dựa trên đồ thị (graph-based schema representations) để mô hình hóa tốt hơn các quan hệ phức tạp giữa các bảng và cải thiện hiệu quả truy xuất phân cấp.
2. Phát triển các phương pháp chấm điểm suy diễn logic nâng cao hơn, sử dụng các kỹ thuật như học tương phản (contrastive learning) để tăng cường khả năng phát hiện các sai lệch tinh vi giữa kết quả và ý định của người dùng.

---

## 12 Hạn chế (Limitations)

Hiệu quả của khung làm việc phụ thuộc vào chất lượng ban đầu của cơ sở tri thức và có thể đối mặt với thách thức về khả năng mở rộng (scalability) khi gặp các lược đồ cực lớn. Hơn nữa, các chỉ số đánh giá tự động cho tính đúng đắn về ngữ nghĩa và suy diễn logic, dù hiệu quả, vẫn là một lĩnh vực nghiên cứu đang tiếp tục phát triển.

---

## Phụ lục A: Ví dụ Prompt cho việc Chấm điểm bằng LLM-làm-giám-khảo (Example Prompts for LLM-as-a-judge Scoring)

### Prompt chấm điểm ngữ nghĩa (Prompt for Semantic Scoring)
```text
You are an expert SQL analyst. Score a generated SQL query on four dimensions of semantic correctness (1-10).
**User Query:** "{user_query}"
**Database Schema:** {schema_json}
**Generated SQL:** "{sql_query}"
**Instructions:**
1. **Column Name Consistency:** Are all columns valid?
2. **Granularity and Aggregation:** Are aggregations/filters correct?
3. **Join and Relationship Consistency:** Are joins logical?
4. **Query Logic Alignment:** Does the logic match the user's intent?
**Few-shot Examples:** [...]
**Current Task:**
Evaluate the provided query, schema, and SQL. Respond in JSON format: {...}
```

---

## Phụ lục B: Cấu trúc Cơ sở Tri thức (Knowledge Base Structure)

**Hình 4** minh họa định dạng JSON có cấu trúc của Cơ sở Tri thức được xây dựng. Biểu diễn này thu thập các mô tả ngữ nghĩa của bảng và cột được rút ra từ lược đồ thô và bằng chứng bổ trợ, đóng vai trò là nguồn để tạo ra các vector nhúng (embeddings).

```json
{
  "financial": {
    "account": {
      "table_description": "it stores information about bank accounts ...",
      "relationships": [
        {
          "column_name": "district_id",
          "related_table": "district",
          "related_column": "district_id"
        }
      ],
      "column_description": {
        "account_id": "Unique identifier for each bank account...",
        "district_id": "Identifier representing the district..."
      }
    }
  }
}
```
*Hình 4: Đặc tả JSON ví dụ của cơ sở tri thức.*

---

## Tài liệu tham khảo (References)

1. Ji, Z., et al.: Towards general-purpose in-context learning for knowledge extraction. arXiv preprint arXiv:2305.12253 (2023)
2. Lobo, E., et al.: Matching business glossaries to databases: A semantic and few-shot learning approach. In: Proceedings of the 2023 International Conference on Management of Data (2023)
3. Gao, Y., et al.: Automatic metadata generation for text-to-sql. To appear in: Proceedings of the VLDB Endowment (2025)
4. Qin, K., et al.: Relational schema-augmented text-to-sql generation. In: Proceedings of the ACM Web Conference (2024)
5. Wretblad, P., et al.: Synthetic data for text-to-sql: A simple and effective approach. In: Proceedings of the Conference on Empirical Methods in Natural Language Processing (2024)
6. Ma, Z., et al.: Enhancing text-to-sql with domain knowledge injection. In: Proceedings of the AAAI Conference on Artificial Intelligence (2024)
7. Lewis, P., et al.: Retrieval-augmented generation for knowledge-intensive nlp tasks. In: Advances in Neural Information Processing Systems (2020)
8. Asai, A., et al.: Self-rag: Learning to retrieve, generate, and critique through self-reflection. arXiv preprint arXiv:2310.11511 (2023)
9. Chan, H., et al.: Rq-rag: A retrieve-query-generate framework for in-context learning. arXiv preprint arXiv:2404.07598 (2024)
10. Zhou, Y., et al.: Openrag: An open-source retrieval-augmented generation framework. To appear in: Proceedings of the AAAI Conference on Artificial Intelligence (2025)
11. Zhong, V., Xiong, C., Socher, R.: Seq2sql: Generating structured queries from natural language using reinforcement learning. arXiv preprint arXiv:1709.00103 (2017)
12. Xu, X., Liu, C., Song, D.: Sqlnet: Generating structured queries from natural language without reinforcement learning. arXiv preprint arXiv:1711.04436 (2017)
13. Pourreza, M., Ghasemzadeh, H.: Din-sql: Decomposed in-context learning of text-to-sql with self-correction. In: Proceedings of the 61st Annual Meeting of the Association for Computational Linguistics (2023)
14. Sun, R., et al.: Sqlprompt: In-context learning for text-to-sql. In: Proceedings of the Conference on Empirical Methods in Natural Language Processing (2023)
15. Li, J., et al.: BIRD: A big bench for large-scale database grounded text-to-sql. In: Advances in Neural Information Processing Systems (2023)
16. Reimers, N., Gurevych, I.: Sentence-bert: Sentence embeddings using siamese bert-networks. In: Proceedings of the Conference on Empirical Methods in Natural Language Processing (2019)
17. Zheng, L., et al.: Judging llm-as-a-judge with mt-bench and chatbot arena. In: Advances in Neural Information Processing Systems (2023)
18. Guo, D., et al.: Deepseek coder: Let the code write itself. To appear in: Proceedings of the International Conference on Learning Representations (2025)
19. Gao, D., et al.: Text-to-SQL empowered by large language models: A benchmark evaluation. Proceedings of the VLDB Endowment 17(11) (2024)
20. Wang, B., et al.: MAC-SQL: A multi-agent collaborative framework for Text-to-SQL. In: Proceedings of the 2024 Joint International Conference on Computational Linguistics, Language Resources and Evaluation (LREC-COLING 2024) (2024)
21. Pourreza, M., et al.: CHASE-SQL: Multi-Path Reasoning and Preference Optimized Candidate Selection in Text-to-SQL. arXiv preprint arXiv:2410.01943 (2024)
