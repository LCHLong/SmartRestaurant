# ReAct: Hiệp Đồng Giữa Suy Luận và Hành Động trong các Mô Hình Ngôn Ngữ
## (ReAct: Synergizing Reasoning and Acting in Language Models)

**Tác giả:** Shunyu Yao*¹ , Jeffrey Zhao² , Dian Yu² , Nan Du² , Izhak Shafran² , Karthik Narasimhan¹ , Yuan Cao²  
¹ *Department of Computer Science, Princeton University*  
² *Google Research, Brain team*  
`{shunyuy, karthikn}@princeton.edu`, `{jeffreyzhao, dianyu, dunan, izhak, yuancao}@google.com`  
*Xuất bản tại Hội nghị Quốc tế về Biểu diễn Học tập (ICLR 2023)*  
*arXiv:2210.03629v3 [cs.CL] 10 Mar 2023*  
(* Nghiên cứu thực hiện trong thời gian thực tập tại Google. Trang dự án & mã nguồn: https://react-lm.github.io/)

---

### Tóm tắt (Abstract)

Mặc dù các mô hình ngôn ngữ lớn (*Large Language Models - LLMs*) đã thể hiện hiệu năng ấn tượng trên nhiều tác vụ hiểu ngôn ngữ và ra quyết định tương tác, khả năng **suy luận (*reasoning*)** (ví dụ: kích hoạt chuỗi suy nghĩ - *chain-of-thought prompting*) và **hành động (*acting*)** (ví dụ: tạo kế hoạch hành động - *action plan generation*) của chúng phần lớn vẫn được nghiên cứu như các chủ đề tách biệt. 

Trong bài báo này, chúng tôi khám phá việc sử dụng LLMs để tạo ra đồng thời cả **vết suy luận (*reasoning traces*)** và **các hành động đặc thù cho tác vụ (*task-specific actions*)** theo cơ chế xen kẽ (*interleaved manner*), mang lại sự hiệp đồng (*synergy*) lớn hơn giữa cả hai:
- Các vết suy luận giúp mô hình cảm ứng, theo dõi và cập nhật các kế hoạch hành động, đồng thời xử lý các trường hợp ngoại lệ (*exceptions*);
- Các hành động cho phép mô hình giao tiếp với các nguồn tài nguyên bên ngoài (như cơ sở tri thức hoặc môi trường) để thu thập thêm thông tin bổ trợ.

Chúng tôi áp dụng phương pháp tiếp cận này, đặt tên là **ReAct**, vào một tập hợp đa dạng các tác vụ ngôn ngữ và ra quyết định, chứng minh tính hiệu quả vượt trội của nó so với các đường cơ sở tiên tiến nhất (*state-of-the-art baselines*), bên cạnh việc nâng cao khả năng diễn giải (*interpretability*) và độ tin cậy (*trustworthiness*) đối với con người. 

Cụ thể:
- Trên các tác vụ trả lời câu hỏi nhiều bước (**HotpotQA**) và xác minh sự thật (**FEVER**), ReAct khắc phục các vấn đề phổ biến về **ảo giác (*hallucination*)** và **sự lan truyền lỗi (*error propagation*)** trong suy luận *chain-of-thought* thông qua việc tương tác với một Wikipedia API đơn giản, tạo ra các quỹ đạo giải quyết tác vụ giống con người và dễ diễn giải hơn so với các đường cơ sở không có vết suy luận.
- Trên hai bộ chuẩn ra quyết định tương tác (**ALFWorld** và **WebShop**), ReAct vượt trội hơn các phương pháp học bắt chước (*imitation learning*) và học tăng cường (*reinforcement learning*) với tỷ lệ thành công tuyệt đối cao hơn lần lượt là **34%** và **10%**, trong khi chỉ cần được nhắc (*prompted*) bằng một hoặc hai ví dụ ngữ cảnh (*in-context examples*).

**Từ khóa (Keywords):** Large Language Models (LLMs), Reasoning and Acting, Chain-of-Thought (CoT), Interactive Decision Making, ReAct, Tool Use, Question Answering, Embodied AI, Web Navigation.

---

## 1. Giới thiệu (Introduction)

Một đặc điểm độc đáo của trí tuệ con người là khả năng kết hợp liền mạch các hành động định hướng mục tiêu (*task-oriented actions*) với suy luận bằng lời nói (*verbal reasoning* hoặc lời nói nội tâm - *inner speech* [Alderson-Day & Fernyhough, 2015]). Cơ chế này từ lâu đã được lý thuyết hóa là đóng vai trò then chốt trong nhận thức của con người nhằm kích hoạt khả năng tự điều chỉnh hoặc lập chiến lược [Vygotsky, 1987; Luria, 1965; Fernyhough, 2010] và duy trì bộ nhớ làm việc (*working memory*) [Baddeley, 1992].

Hãy xem xét ví dụ về việc nấu một món ăn trong bếp. Giữa hai hành động cụ thể bất kỳ, chúng ta thường suy luận bằng ngôn ngữ nhằm:
1. Theo dõi tiến độ (*"Bây giờ mọi thứ đã được cắt xong, mình nên đun nóng nồi nước"*);
2. Xử lý ngoại lệ hoặc điều chỉnh kế hoạch theo tình huống (*"Mình hết muối rồi, vậy hãy dùng nước tương và tiêu để thay thế"*);
3. Nhận biết khi nào cần thông tin bên ngoài (*"Làm thế nào để nhào bột bánh? Hãy để mình tìm kiếm trên Internet"*).

Chúng ta cũng có thể thực hiện hành động (mở sách dạy nấu ăn để đọc công thức, mở tủ lạnh, kiểm tra nguyên liệu) để hỗ trợ quá trình suy luận và trả lời câu hỏi (*"Bây giờ mình có thể nấu món gì?"*). Sự hiệp đồng chặt chẽ giữa "hành động" (*acting*) và "suy luận" (*reasoning*) cho phép con người học các tác vụ mới nhanh chóng và thực hiện việc ra quyết định hoặc suy luận vững chắc, ngay cả trong những hoàn cảnh chưa từng thấy trước đây hoặc khi đối mặt với sự không chắc chắn của thông tin.

Các kết quả nghiên cứu gần đây đã gợi mở khả năng kết hợp suy luận ngôn ngữ với việc ra quyết định tương tác trong các hệ thống tự hành. Một mặt, khi được thiết kế câu nhắc (*prompted*) phù hợp, các mô hình ngôn ngữ lớn (LLMs) đã thể hiện năng lực mới nổi (*emergent capabilities*) trong việc thực hiện nhiều bước của các vết suy luận để tìm ra câu trả lời từ các câu hỏi trong các tác vụ toán số học, suy luận thường thức (*commonsense reasoning*) và suy luận ký hiệu [Wei et al., 2022b; Wang et al., 2022a]. Kỹ thuật này, được gọi là **Chain-of-Thought (CoT)**, cho thấy tiềm năng của LLMs trong việc tự sinh ra "suy nghĩ nội tâm" để giải quyết các vấn đề tĩnh. Tuy nhiên, CoT là một hệ thống khép kín: mô hình không thể tương tác với thế giới bên ngoài để cập nhật tri thức hoặc kiểm chứng suy luận, dẫn đến hiện tượng **ảo giác (*hallucination*)**, bịa đặt thông tin và lan truyền lỗi qua từng bước suy luận.

Mặt khác, các nghiên cứu gần đây đã khám phá việc sử dụng LLMs để lập kế hoạch và ra quyết định hành động tương tác trong môi trường số hoặc môi trường vật lý [Yao et al., 2022a; Huang et al., 2022a; Ahn et al., 2022]. Trong các thiết lập này, LLMs chuyển đổi mục tiêu ngôn ngữ thành một chuỗi các hành động thực thi (ví dụ: gọi API, điều hướng web, điều khiển robot). Tuy nhiên, các phương pháp chỉ tập trung vào hành động (*Act-only*) thiếu đi khả năng suy luận trừu tượng: chúng không thể duy trì bộ nhớ làm việc linh hoạt, khó lập kế hoạch đa bước ở mức cao, và dễ bị lạc lối trong các không gian hành động phức tạp khi gặp phải phản hồi không mong muốn từ môi trường.

```
+--------------------------------------------------------------------------------------------------+
|                            SO SÁNH 4 MẪU HÌNH PROMPTING TRONG LLM                                |
+--------------------------------------------------------------------------------------------------+
| (a) Standard Prompting:                                                                          |
|     Input -> LLM -> Output (Direct Answer)                                                       |
|                                                                                                  |
| (b) Chain-of-Thought (CoT) Prompting (Reason Only):                                              |
|     Input -> Thought 1 -> Thought 2 -> ... -> Output (No environment interaction)               |
|                                                                                                  |
| (c) Act-Only Prompting (Action Only):                                                            |
|     Input -> Act 1 -> Obs 1 -> Act 2 -> Obs 2 -> ... -> Output (No explicit verbal reasoning)   |
|                                                                                                  |
| (d) ReAct Prompting (Reason + Act Interleaved) [Ours]:                                           |
|     Input -> Thought 1 -> Act 1 -> Obs 1 -> Thought 2 -> Act 2 -> Obs 2 -> ... -> Output        |
+--------------------------------------------------------------------------------------------------+
```

Để khắc phục những hạn chế nói trên, chúng tôi đề xuất **ReAct** (*Reasoning + Acting*) — một mô hình mẫu mới tích hợp việc suy luận và hành động trong các mô hình ngôn ngữ lớn. Trong ReAct:
- Mô hình luân phiên sinh ra các **suy nghĩ ngôn ngữ (*thoughts*)** và các **hành động (*actions*)**.
- Các **suy nghĩ** đóng vai trò điều hướng nhận thức: phân rã bài toán, theo dõi tiến độ, trích xuất thông tin trọng tâm từ các quan sát, điều chỉnh kế hoạch khi gặp lỗi.
- Các **hành động** tác động vào môi trường bên ngoài (ví dụ: công cụ tìm kiếm, cơ sở tri thức Wikipedia, môi trường giả lập), và môi trường trả về các **quan sát (*observations*)**.
- Các quan sát này ngay lập tức được nạp lại vào ngữ cảnh, cung cấp dữ liệu thực tế tiếp đất (*grounded facts*) để dẫn dắt các suy nghĩ tiếp theo.

Chúng tôi tiến hành thực nghiệm rộng rãi trên cả hai lớp tác vụ:
1. **Các tác vụ suy luận thâm dụng tri thức (*Knowledge-intensive reasoning*):** Trả lời câu hỏi đa bước (HotpotQA) và kiểm chứng sự thật (FEVER);
2. **Các tác vụ ra quyết định tương tác (*Interactive decision making*):** Môi trường điều hướng văn bản gia đình (ALFWorld) và môi trường mua sắm trực tuyến thực tế (WebShop).

Kết quả thực nghiệm chứng minh rằng ReAct vượt trội rõ rệt so với các đường cơ sở chỉ suy luận hoặc chỉ hành động, giảm thiểu mạnh mẽ hiện tượng ảo giác, cải thiện khả năng diễn giải cho con người, và mở ra hướng đi đầy hứa hẹn cho các hệ thống tác tử thông minh tự hành.

---

## 2. ReAct: Hiệp Đồng Giữa Suy Luận và Hành Động

### 2.1 Thiết lập và Định dạng Không gian Hành động Mở rộng

Xét một tác tử tương tác với môi trường để giải quyết một tác vụ. Tại mỗi bước thời gian $t$, tác tử tiếp nhận một quan sát $o_t \in \mathcal{O}$ từ môi trường và chọn một hành động $a_t \in \mathcal{A}$ tuân theo chính sách $\pi(a_t | c_t)$, trong đó:
$$c_t = (o_1, a_1, o_2, a_2, \dots, o_{t-1}, a_{t-1}, o_t)$$
là ngữ cảnh lịch sử tương tác.

Trong các bài toán ra quyết định truyền thống, không gian hành động $\mathcal{A}$ là một tập hợp hữu hạn hoặc liên tục của các hành động vật lý/giao diện (ví dụ: di chuyển, bấm nút, gõ lệnh). Ngược lại, trong các tác vụ suy luận thuần túy (như CoT), mô hình chỉ sinh ra các bước suy luận nội tâm $a_t \in \mathcal{L}$ (trong đó $\mathcal{L}$ là không gian ngôn ngữ tự do) mà không hề có sự tương tác với môi trường bên ngoài ($o_t = \emptyset$).

**Đóng góp cốt lõi của ReAct** là mở rộng không gian hành động của tác tử thành:
$$\hat{\mathcal{A}} = \mathcal{A} \cup \mathcal{L}$$

Trong đó:
- Một hành động $a_t \in \mathcal{A}$ được gửi tới môi trường bên ngoài để thực thi, và môi trường trả về một quan sát mới $o_t$;
- Một hành động $\hat{a}_t \in \mathcal{L}$ được gọi là một **suy nghĩ (*thought*)** hay một **vết suy luận (*reasoning trace*)**. Một suy nghĩ không làm thay đổi trạng thái bên ngoài của môi trường ($o_t = \emptyset$), mà thay vào đó nhằm mục đích tái cấu trúc ngữ cảnh hiện tại, hỗ trợ lập luận nội tâm và định hướng cho các hành động tiếp theo.

Chính sách của tác tử ReAct được mô hình hóa trực tiếp thông qua một mô hình ngôn ngữ lớn được nhắc (*prompted*) bằng các ví dụ ngữ cảnh (*in-context few-shot learning*):
$$\hat{a}_t \sim \pi_{	ext{LLM}}(\cdot | x, \hat{a}_1, o_1, \dots, \hat{a}_{t-1}, o_{t-1})$$
trong đó $x$ là chỉ dẫn nhiệm vụ hoặc câu hỏi đầu vào.

```
                              QUY TRÌNH VÒNG LẶP REACT
                              
      ┌────────────────────────────────────────────────────────────────────────┐
      │ Ngữ cảnh: Câu hỏi đầu vào x + Lịch sử (Thought, Action, Observation)   │
      └───────────────────────────────────┬────────────────────────────────────┘
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │    LLM GENERATION (Suy luận nội tâm)   │
                      │ Thought t: "Cần tìm kiếm thực thể A   │
                      │            để xác định thông tin B"   │
                      └───────────────────┬───────────────────┘
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │     LLM ACTION (Hành động tiếp đất)   │
                      │ Act t: search[Thực thể A]             │
                      └───────────────────┬───────────────────┘
                                          │ Gửi tới Môi trường / Tool / API
                                          ▼
                      ┌───────────────────────────────────────┐
                      │       MÔI TRƯỜNG / CÔNG CỤ NGOÀI      │
                      │ Trả về kết quả thực thi:               │
                      │ Obs t: "Thực thể A được thành lập     │
                      │         vào năm 1995 tại California"  │
                      └───────────────────┬───────────────────┘
                                          │ Cập nhật vào Ngữ cảnh Context
                                          ▼
      ┌────────────────────────────────────────────────────────────────────────┐
      │ Tiếp tục chu trình: Thought t+1 -> Act t+1 -> Obs t+1 -> ... -> Finish │
      └────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Các Đặc Tính Nổi Bật của ReAct

1. **Trực quan và Dễ thiết kế (*Intuitive & Easy to Design*):**  
   Việc thiết kế prompt cho ReAct vô cùng tự nhiên. Người gán nhãn chỉ cần viết ra dòng suy nghĩ bằng ngôn ngữ thông thường đi kèm các hành động mà họ thực hiện để giải quyết bài toán. Không cần các định dạng đặc tả phức tạp hay thuật toán sinh mẫu cầu kỳ.
2. **Tổng quát và Linh hoạt (*General & Flexible*):**  
   Nhờ không gian suy nghĩ tự do $\mathcal{L}$ và cơ chế luân phiên không đồng bộ giữa suy nghĩ và hành động, ReAct áp dụng hiệu quả cho nhiều lớp bài toán khác nhau: từ tra cứu thông tin, hỏi đáp phức tạp, kiểm chứng sự thật, cho đến điều hướng trang web hay điều khiển tác tử trong môi trường ảo.
3. **Hiệu năng Cao và Vững chắc (*Performant & Robust*):**  
   Bằng cách tiếp đất (*grounding*) quá trình suy luận vào các quan sát thực tế từ môi trường bên ngoài, ReAct hạn chế tối đa việc mô hình tự bịa đặt dữ kiện, đồng thời cho phép tác tử tự phục hồi khi gặp lỗi (ví dụ: tìm kiếm thất bại thì đổi từ khóa khác).
4. **Căn chỉnh với Con người và Có thể Kiểm soát (*Human Aligned & Controllable*):**  
   Vì toàn bộ quá trình ra quyết định được minh bạch hóa dưới dạng chuỗi văn bản (Thought, Action, Observation), con người có thể dễ dàng kiểm tra tính đúng đắn của logic suy luận. Hơn thế nữa, con người có thể can thiệp vào vòng lặp (*Human-in-the-loop*) bằng cách chỉnh sửa trực tiếp các suy nghĩ (*Thought Editing*) để uốn nắn hành vi của tác tử trong thời gian thực.

---

## 3. Các Tác Vụ Suy Luận Thâm Dụng Tri Thức (Knowledge-Intensive Reasoning Tasks)

Chúng tôi bắt đầu thử nghiệm ReAct trên hai bộ chuẩn suy luận thâm dụng tri thức hàng đầu: trả lời câu hỏi nhiều bước (**HotpotQA**) và xác thực sự thật (**FEVER**).

### 3.1 Thiết lập Thực nghiệm

- **HotpotQA [Yang et al., 2018]:** Tác vụ hỏi đáp đòi hỏi suy luận qua nhiều văn bản Wikipedia khác nhau (*multi-hop question answering*).
- **FEVER [Thorne et al., 2018]:** Tác vụ xác minh tính đúng đắn của một nhận định (*claim verification*), phân loại thành `SUPPORTS` (Ủng hộ), `REFUTES` (Bác bỏ), hoặc `NOT ENOUGH INFO` (Không đủ thông tin).

Trong bài báo này, chúng tôi vận hành ở thiết lập **chỉ có câu hỏi (*question-only setup*)**: mô hình chỉ nhận được câu hỏi hoặc nhận định mà không được cung cấp sẵn các đoạn văn bản vàng (*gold paragraphs*). Mô hình bắt buộc phải dựa vào tri thức nội tại hoặc tự tương tác với môi trường bên ngoài để tìm kiếm bằng chứng.

#### Không gian Hành động Wikipedia API:
Chúng tôi thiết kế một giao diện tương tác Wikipedia đơn giản gồm 3 loại hành động:
1. `search[entity]`: Trả về 5 câu đầu tiên từ trang Wikipedia tương ứng với thực thể nếu tồn tại; nếu không, trả về danh sách 5 thực thể tương tự nhất từ công cụ tìm kiếm Wikipedia.
2. `lookup[string]`: Trả về câu tiếp theo trong trang có chứa chuỗi `string`, mô phỏng chức năng phím tắt `Ctrl + F` trên trình duyệt web.
3. `finish[answer]`: Kết thúc tác vụ hiện tại và trả về câu trả lời `answer`.

Không gian hành động này cố ý được thiết kế đơn giản, mô phỏng hành vi tra cứu thủ công của con người và buộc mô hình phải dựa vào suy luận tường minh bằng ngôn ngữ để định hướng việc tìm kiếm.

### 3.2 Các Phương Pháp So Sánh và Đường Cơ Sở

Chúng tôi xây dựng 6 ví dụ mẫu (*in-context few-shot examples*) cho HotpotQA và 3 ví dụ cho FEVER. Các đường cơ sở so sánh gồm:
1. **Standard Prompting:** Loại bỏ toàn bộ các suy nghĩ, hành động và quan sát; mô hình trực tiếp sinh ra câu trả lời từ câu hỏi.
2. **Chain-of-Thought (CoT) [Wei et al., 2022b]:** Loại bỏ các hành động và quan sát; mô hình sinh chuỗi suy luận nội tâm thuần túy rồi đưa ra câu trả lời.
3. **CoT with Self-Consistency (CoT-SC) [Wang et al., 2022a]:** Lấy mẫu 21 quỹ đạo CoT với nhiệt độ giải mã $T = 0.7$, sau đó chọn câu trả lời theo cơ chế biểu quyết đa số (*majority voting*).
4. **Act-Only:** Loại bỏ các bước suy nghĩ (*thoughts*), mô hình chỉ sinh ra chuỗi các hành động `search` và `lookup`, tương tự phong cách của WebGPT [Nakano et al., 2021].
5. **ReAct:** Phương pháp đề xuất kết hợp xen kẽ suy nghĩ và hành động.
6. **Phương pháp Kết hợp ReAct và CoT-SC:**
   - **ReAct $ightarrow$ CoT-SC:** Khi ReAct không trả về kết quả trong số bước quy định (7 bước cho HotpotQA, 5 bước cho FEVER), hệ thống tự động lùi về sử dụng CoT-SC.
   - **CoT-SC $ightarrow$ ReAct:** Khi câu trả lời đa số trong $n$ mẫu CoT-SC chiếm tỷ lệ dưới $n/2$ (thể hiện mô hình thiếu tự tin về tri thức nội tại), hệ thống chuyển sang gọi ReAct để tra cứu bên ngoài.

#### Tinh chỉnh Mô hình Nhỏ (*Finetuning*):
Để đánh giá khả năng nhân rộng quy mô, chúng tôi lấy 3.000 quỹ đạo ReAct thành công do PaLM-540B sinh ra để tinh chỉnh các mô hình nhỏ hơn gồm **PaLM-8B** và **PaLM-62B**.

---

### 3.3 Kết quả Thực nghiệm và Phân Tích Quan Sát

#### Bảng 1: Kết quả Prompting của PaLM-540B trên HotpotQA và FEVER

| Phương pháp (*Prompt Method*) | HotpotQA (Exact Match - EM %) | FEVER (Accuracy - Acc %) |
|---|:---:|:---:|
| **Standard** | 28.7 | 57.1 |
| **CoT** *(Wei et al., 2022b)* | 29.4 | 56.3 |
| **CoT-SC** *(Wang et al., 2022a)* | 33.4 | 60.4 |
| **Act-only** | 25.7 | 58.9 |
| **ReAct (Đề xuất)** | **27.4** | **60.9** |
| **CoT-SC $ightarrow$ ReAct** | **34.2** | **64.6** |
| **ReAct $ightarrow$ CoT-SC** | **35.1** | **62.0** |
| *Supervised State-of-the-Art (Tham khảo)* | *67.5* | *89.5* |

#### Bảng 2: Phân tích Chế độ Thành công và Thất bại giữa ReAct và CoT trên HotpotQA
*(Khảo sát chi tiết trên 200 mẫu ngẫu nhiên được con người thẩm định)*

| Loại (*Type*) | Chế độ (*Mode*) | Định nghĩa (*Definition*) | ReAct | CoT |
|---|---|---|:---:|:---:|
| **Thành công (*Success*)** | **True Positive** | Vết suy luận và các sự kiện đều đúng đắn | **94%** | 86% |
| | **False Positive** | Đoán đúng nhãn nhưng suy luận bị ảo giác/sai lệch | **6%** | **14%** |
| **Thất bại (*Failure*)** | **Lỗi suy luận (*Reasoning error*)** | Logic sai hoặc rơi vào vòng lặp lặp lại | 47% | 16% |
| | **Lỗi tìm kiếm (*Search error*)** | Tìm kiếm rỗng hoặc không chứa thông tin hữu ích | 23% | — |
| | **Ảo giác (*Hallucination*)** | Bịa đặt thông tin không có thật trong suy luận | **0%** | **56%** |
| | **Mơ hồ nhãn (*Label ambiguity*)** | Dự đoán đúng thực tế nhưng không khớp nhãn cứng | 29% | 28% |

```
                       PHÂN TÍCH SO SÁNH NGUYÊN NHÂN LỖI
                       
         ReAct: Lỗi chủ yếu do Tìm kiếm & Logic        CoT: Lỗi chủ yếu do Ảo giác
         
         ┌────────────────────────────────┐            ┌────────────────────────────────┐
         │ Lỗi suy luận / Lặp lại: 47%    │            │ ẢO GIÁC (HALLUCINATION): 56%   │
         │ Mơ hồ nhãn dữ liệu: 29%        │            │ Mơ hồ nhãn dữ liệu: 28%        │
         │ Tìm kiếm không ra: 23%         │            │ Lỗi suy luận logic: 16%        │
         │ ẢO GIÁC: 0%                    │            │                                │
         └────────────────────────────────┘            └────────────────────────────────┘
```

#### Những Quan Sát Đột Phá:
1. **Triệt tiêu Ảo giác:** Ảo giác là nguyên nhân thất bại số 1 của CoT (chiếm 56% tổng số ca lỗi). Ngược lại, đối với ReAct, nhờ việc tiếp đất vào Wikipedia thông qua hành động thực tế, tỷ lệ ảo giác giảm xuống **0%**.
2. **Sự Hiệp đồng Tối ưu giữa ReAct và CoT-SC:** Bằng cách kết hợp linh hoạt tri thức tham số nội tại (CoT-SC) và tri thức truy xuất ngoại tại (ReAct), các phương pháp kết hợp đạt hiệu năng cao nhất (**35.1% EM** trên HotpotQA và **64.6% Acc** trên FEVER), vượt xa việc chỉ dùng đơn lẻ từng phương pháp.
3. **Hiệu ứng Nhân rộng Quy mô khi Fine-tuning:** Khi tinh chỉnh mô hình PaLM-8B bằng 3.000 mẫu quỹ đạo ReAct, mô hình 8B này đạt hiệu năng vượt trội hơn toàn bộ các phương pháp prompting trên PaLM-62B; và PaLM-62B tinh chỉnh ReAct thậm chí vượt trội hơn cả PaLM-540B prompting! Điều này chứng minh rằng việc dạy mô hình cách suy luận và hành động tương tác mang lại khả năng tổng quát hóa cao hơn nhiều so với việc bắt mô hình ghi nhớ sự kiện tĩnh.

---

## 4. Các Tác Vụ Ra Quyết Định Tương Tác (Decision Making Tasks)

Chúng tôi kiểm thử ReAct trên hai môi trường ra quyết định tương tác dựa trên ngôn ngữ phức tạp: **ALFWorld** và **WebShop**. Cả hai môi trường đều đặc trưng bởi chuỗi hành động dài (*long-horizon*) và phần thưởng thưa thớt (*sparse rewards*).

### 4.1 Thiết lập Môi trường

#### 1. ALFWorld [Shridhar et al., 2020b]:
Môi trường trò chơi văn bản tương tác mô phỏng ngôi nhà thực tế (dựa trên chuẩn ALFRED). Tác tử cần hoàn thành 6 loại nhiệm vụ phức tạp (ví dụ: *"tìm một quả táo, rửa sạch tại bồn rửa, hâm nóng bằng lò vi sóng rồi đặt lên bàn ăn"*). Một nhiệm vụ có thể trải dài qua hơn 50 bước hành động. Chúng tôi đánh giá trên 134 màn chơi chưa từng gặp (*unseen evaluation games*).

#### 2. WebShop [Yao et al., 2022a]:
Trang web thương mại điện tử mô phỏng quy mô lớn chứa **1.18 triệu sản phẩm thực tế** được cào từ Amazon và 12.000 chỉ dẫn mua hàng của con người. Tác tử phải thực hiện các hành động gõ từ khóa tìm kiếm, duyệt danh sách sản phẩm, chọn các tùy chọn (màu sắc, kích thước, số lượng) và nhấn nút mua hàng (*Buy Now*) thỏa mãn các ràng buộc trong chỉ dẫn của người dùng (ví dụ: *"Tìm bàn đầu giường có ngăn kéo, lớp hoàn thiện niken, giá dưới 140$"*).

### 4.2 Kết quả Thực nghiệm

#### Bảng 3: Tỷ lệ Thành công trên Từng Loại Nhiệm vụ của ALFWorld (%)

| Phương pháp (*Method*) | Nhặt (*Pick*) | Rửa (*Clean*) | Hâm nóng (*Heat*) | Làm mát (*Cool*) | Quan sát (*Look*) | Nhặt 2 vật (*Pick 2*) | Trung bình Tất cả (*All*) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **BUTLERg (Best of 8)** *(Imitation Learning)* | 33 | 26 | 70 | 76 | 17 | 12 | 22 |
| **BUTLER (Best of 8)** *(Imitation Learning)* | 46 | 39 | 74 | 100 | 22 | 24 | 37 |
| **Act-only (Best of 6)** | 88 | 42 | 74 | 67 | 72 | 41 | 45 |
| **ReAct (Trung bình 6 lần)** | 65 | 39 | 83 | 76 | 55 | 24 | **57** |
| **ReAct (Best of 6)** | **92** | **58** | **96** | **86** | **78** | **41** | **71** |

*(Ghi chú: BUTLER được huấn luyện trên 105 quỹ đạo chuyên gia cho mỗi loại tác vụ; trong khi ReAct chỉ sử dụng đúng 2 ví dụ ngữ cảnh in-context!)*

#### Bảng 4: Điểm số và Tỷ lệ Thành công trên WebShop

| Phương pháp (*Method*) | Điểm Trung Bình (*Score %*) | Tỷ Lệ Thành Công Tuyệt Đối (*Success Rate - SR %*) |
|---|:---:|:---:|
| **Imitation Learning (IL)** *(1.012 quỹ đạo người gán nhãn)* | 59.9 | 29.1 |
| **IL + Reinforcement Learning (IL+RL)** *(10.587 chỉ dẫn huấn luyện)* | 62.4 | 28.7 |
| **Act-only Prompting (1-shot)** | 62.3 | 30.1 |
| **ReAct Prompting (1-shot) [Đề xuất]** | **66.6** | **40.0** |

#### Đánh giá Định tính và Tương tác Người trong Vòng lặp (*Human-in-the-loop*):
- **Phân tích so sánh hành vi:** Trong môi trường WebShop, tác tử Act-only thường xuyên bị mất tập trung: sau khi tìm kiếm, nó bấm bừa vào các sản phẩm không khớp yêu cầu về giá hoặc chất liệu. Ngược lại, ReAct sử dụng các bước suy nghĩ: *"Người dùng cần hoàn thiện bằng niken và giá dưới 140$. Sản phẩm này giá 155$ -> bỏ qua, quay lại tìm kiếm"*. Nhờ đó, ReAct đạt tỷ lệ mua sắm chuẩn xác vượt trội (**40.0% so với 30.1%**).
- **Can thiệp Thời gian Thực (*Thought Editing*):** Trong ALFWorld, khi tác tử ReAct gặp bế tắc hoặc lặp lại hành động, người dùng có thể can thiệp bằng cách sửa trực tiếp dòng suy nghĩ (ví dụ: đổi `Thought: Không thấy tiêu ở tủ 1` thành `Thought: Tiêu có thể ở mặt bàn bếp, hãy qua bàn bếp tìm`). Tác tử ngay lập tức thay đổi hành vi và hoàn thành nhiệm vụ, chứng minh tính minh bạch và khả năng kiểm soát cao của ReAct.

---

## 5. Các Công Trình Liên Quan (Related Work)

### 5.1 Suy luận trong Mô hình Ngôn ngữ (Reasoning in Language Models)
Các công trình như Chain-of-Thought (CoT) [Wei et al., 2022b], Scratchpads [Nye et al., 2021], và STaR [Zelikman et al., 2022] đã chứng minh rằng việc cho phép mô hình sinh ra các bước tính toán trung gian giúp cải thiện đáng kể khả năng giải quyết các bài toán số học, logic và ký hiệu. Tuy nhiên, các kỹ thuật này chỉ giới hạn trong nhận thức nội tại tĩnh, không có khả năng truy xuất hay cập nhật trạng thái thế giới bên ngoài. ReAct kết nối chuỗi suy nghĩ này với các hành động tương tác ngoại tại.

### 5.2 Hành động trong Môi trường Tương tác (Acting in Interactive Environments)
Nhiều nghiên cứu đã ứng dụng LLM vào việc điều khiển tác tử: WebGPT [Nakano et al., 2021] dùng duyệt web trả lời câu hỏi; SayCan [Ahn et al., 2022] và Inner Monologue [Huang et al., 2022b] dùng mô hình ngôn ngữ lập kế hoạch cho robot. Tuy nhiên, các hệ thống này phần lớn tách rời việc suy luận khỏi luồng hành động hoặc chỉ dùng phản hồi môi trường thụ động. ReAct thiết lập một khuôn khổ tổng quát, thống nhất nơi suy luận và hành động bổ trợ tương hỗ cho nhau qua từng bước thời gian.

---

## 6. Kết Luận (Conclusion)

Bài báo giới thiệu **ReAct**, một phương pháp tiếp cận đơn giản nhưng mang tính nền tảng để kết hợp nhịp nhàng giữa **suy luận (*reasoning*)** và **hành động (*acting*)** trong các mô hình ngôn ngữ lớn. 

Thông qua các thực nghiệm trên cả tác vụ trả lời câu hỏi thâm dụng tri thức và ra quyết định tương tác, ReAct chứng minh:
1. Giảm thiểu triệt để ảo giác thông qua truy xuất tiếp đất;
2. Tăng cường khả năng giải quyết các bài toán tương tác phức tạp vượt xa học tăng cường và học bắt chước;
3. Tạo ra các quỹ đạo hành động minh bạch, dễ kiểm tra, và hỗ trợ con người can thiệp điều khiển linh hoạt.

ReAct đánh dấu một bước chuyển dịch then chốt: biến các mô hình ngôn ngữ từ những "bộ sinh văn bản thụ động" thành các **tác tử tự hành có khả năng tương tác và hành động trong thế giới thực**.

---

## 7. Tài Liệu Tham Khảo (References - Trích dẫn Chọn lọc)

1. **Ahn, M., Brohan, A., Brown, N., et al.** (2022). *Do as I can, not as I say: Grounding language in robotic affordances*. arXiv:2204.01691.
2. **Huang, W., Abbeel, P., Pathak, D., & Mordatch, I.** (2022a). *Language models as zero-shot planners: Extracting actionable knowledge for embodied agents*. In ICML.
3. **Huang, W., Fei-Fei, L., & Guibas, L.** (2022b). *Inner monologue: Embodied reasoning through planning with language models*. arXiv:2207.05608.
4. **Nakano, R., Hilton, J., Balaji, S., et al.** (2021). *WebGPT: Browser-assisted question-answering with human feedback*. arXiv:2112.09332.
5. **Shridhar, M., Yuan, X., Côté, M. A., Bisk, Y., Trischler, A., & Hausknecht, M.** (2020b). *ALFWorld: Aligning text and embodied environments for interactive learning*. In ICLR.
6. **Thorne, J., Vlachos, A., Christodoulopoulos, C., & Mittal, A.** (2018). *FEVER: a large-scale dataset for fact extraction and VERification*. In NAACL.
7. **Wang, X., Wei, J., Schuurmans, D., et al.** (2022a). *Self-consistency improves chain of thought reasoning in language models*. In ICLR.
8. **Wei, J., Wang, X., Schuurmans, D., et al.** (2022b). *Chain of thought prompting elicits reasoning in large language models*. In NeurIPS.
9. **Yang, Z., Qi, P., Zhang, S., Bengio, Y., Cohen, W., Salakhutdinov, R., & Manning, C. D.** (2018). *HotpotQA: A dataset for diverse, explainable multi-hop question answering*. In EMNLP.
10. **Yao, S., Chen, H., Yang, J., & Narasimhan, K.** (2022a). *WebShop: Towards scalable real-world web interaction with grounded language agents*. In NeurIPS.
