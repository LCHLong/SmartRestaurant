# Toolformer: Các Mô Hình Ngôn Ngữ Có Thể Tự Dạy Mình Cách Sử Dụng Công Cụ
## (Toolformer: Language Models Can Teach Themselves to Use Tools)

**Tác giả:** Timo Schick, Jane Dwivedi-Yu, Roberto Dessì†, Maria Lomeli, Luke Zettlemoyer, Nicola Cancedda, Roberta Raileanu, Thomas Scialom  
*Meta AI Research; † Universitat Pompeu Fabra*  
*arXiv:2302.04761v1 [cs.CL] 9 Feb 2023*  

---

### Tóm tắt (Abstract)

Các mô hình ngôn ngữ (*Language Models - LMs*) thể hiện khả năng đáng kinh ngạc trong việc giải quyết các tác vụ mới chỉ từ một vài ví dụ (*few-shot*) hoặc chỉ dẫn bằng văn bản, đặc biệt là khi tăng quy mô tham số. Tuy nhiên, một cách nghịch lý, chúng lại gặp khó khăn nghiêm trọng với các chức năng cơ bản như tính toán số học (*arithmetic*) hoặc tra cứu sự thật (*factual lookup*) — những tác vụ mà các mô hình chuyên biệt nhỏ hơn và đơn giản hơn rất nhiều lại vượt trội hoàn toàn.

Trong bài báo này, chúng tôi chỉ ra rằng các mô hình ngôn ngữ có thể **tự dạy mình cách sử dụng các công cụ bên ngoài** thông qua các giao diện lập trình ứng dụng đơn giản (*APIs*) và đạt được những gì tốt nhất của cả hai thế giới. Chúng tôi giới thiệu **Toolformer**, một mô hình được huấn luyện để tự quyết định:
1. **Gọi API nào (*which APIs to call*)**;
2. **Khi nào nên gọi (*when to call them*)**;
3. **Truyền vào những tham số đối số nào (*what arguments to pass*)**; và
4. **Cách kết hợp kết quả trả về tốt nhất vào việc dự đoán các token tiếp theo (*future token prediction*)**.

Toàn bộ quy trình này được thực hiện theo phương thức **tự giám sát (*self-supervised*)**, không đòi hỏi gì hơn ngoài một vài ví dụ minh họa ban đầu cho mỗi API. Chúng tôi tích hợp một loạt các công cụ gồm: **máy tính số học (*calculator*)**, **hệ thống hỏi đáp (*Q&A system*)**, **công cụ tìm kiếm (*search engine*)**, **hệ thống dịch máy (*translation system*)**, và **lịch thời gian (*calendar*)**. 

Toolformer đạt được hiệu năng **không cần ví dụ mẫu (*zero-shot*)** vượt trội trên nhiều tác vụ xuôi dòng (*downstream tasks*), thường xuyên cạnh tranh sòng phẳng với các mô hình lớn hơn nhiều lần (như GPT-3 175B), trong khi không hề làm suy giảm năng lực mô hình hóa ngôn ngữ cốt lõi của chính nó.

**Từ khóa (Keywords):** Language Models, Toolformer, Tool Use, API Calls, Self-Supervised Learning, Zero-Shot Learning, Arithmetic Reasoning, Information Retrieval, Augmented Language Models.

---

## 1. Giới thiệu (Introduction)

Các mô hình ngôn ngữ lớn (LLMs) hiện nay đã đạt được những bước tiến vượt bậc trong quá trình xử lý ngôn ngữ tự nhiên [Brown et al., 2020; Chowdhery et al., 2022]. Tuy nhiên, các mô hình ngôn ngữ thuần túy dựa trên tham số nội tại vẫn tồn tại nhiều hạn chế cố hữu không thể khắc phục chỉ bằng cách mở rộng quy mô dữ liệu tiền huấn luyện:
1. **Không có khả năng truy cập thông tin cập nhật thời gian thực:** Tri thức của mô hình bị đóng băng tại thời điểm hoàn tất tiền huấn luyện.
2. **Xu hướng ảo giác và bịa đặt sự thật (*Hallucination*):** Khi đối mặt với các thực thể hiếm hoặc tri thức chuyên sâu, mô hình thường sinh ra các khẳng định sai lệch nhưng đầy tự tin.
3. **Kém cỏi trong tính toán số học chính xác:** Ngay cả các mô hình hàng trăm tỷ tham số vẫn thường xuyên tính sai các phép nhân, chia hoặc cộng trừ số có nhiều chữ số.
4. **Thiếu nhận thức về thời gian (*Lack of Temporal Awareness*):** Mô hình không biết ngày giờ hiện tại, gây khó khăn khi trả lời các câu hỏi phụ thuộc mốc thời gian (*"Hôm nay là thứ mấy?", "Nhiệm kỳ tổng thống hiện tại bắt đầu khi nào?"*).

```
VÍ DỤ VỀ CÁCH TOOLFORMER TỰ ĐỘNG CHÈN LỜI GỌI API VÀO VĂN BẢN:

1. Tra cứu sự thật:
   "The New England Journal of Medicine is a registered trademark of 
    [QA("Who is the publisher of The New England Journal of Medicine?") -> Massachusetts Medical Society] 
    the MMS."

2. Tính toán số học:
   "Out of 1400 participants, 400 (or [Calculator(400 / 1400) -> 0.29] 29%) passed the test."

3. Dịch thuật đa ngữ:
   "The name derives from 'la tortuga', the Spanish word for [MT("tortuga") -> turtle] turtle."

4. Tìm kiếm tri thức Wikipedia:
   "The Brown Act is California's law [WikiSearch("Brown Act") -> The Ralph M. Brown Act is an act of 
    the California State Legislature that guarantees the public's right to attend meetings...] 
    that requires legislative bodies to hold their meetings open to the public."
```

Các giải pháp truyền thống giải quyết vấn đề này thường dựa vào:
- **Dữ liệu do con người gán nhãn thủ công (*Human Annotations*):** Yêu cầu chi phí rất cao và không thể mở rộng quy mô sang nhiều công cụ khác nhau;
- **Các phương pháp nhắc lệnh phức tạp (*Prompting-only*):** Đòi hỏi mô hình cực lớn (như GPT-3 175B hay PaLM 540B) và nhạy cảm cao với cách định dạng câu lệnh;
- **Học tăng cường dựa trên phản hồi của con người (*RLHF*):** Tốn kém tài nguyên và dễ dẫn đến tình trạng mô hình phụ thuộc vào thiên lệch của người chấm.

Để vượt qua các rào cản này, chúng tôi đề xuất **Toolformer**. Ý tưởng trọng tâm là: **tận dụng chính khả năng tạo sinh vài ví dụ (*in-context few-shot learning*) của LLM để tự động tạo ra một tập dữ liệu gán nhãn lời gọi API khổng lồ từ kho văn bản phi cấu trúc, sau đó dùng một hàm mất mát tự giám sát (*self-supervised loss*) để lọc ra những lời gọi API thực sự hữu ích, và cuối cùng tinh chỉnh (*fine-tune*) chính mô hình đó**.

Phương pháp này mang lại 3 ưu thế vượt trội:
- **Tự động hóa hoàn toàn (*Fully Self-Supervised*):** Chỉ cần viết một vài ví dụ mẫu mô tả cú pháp API, không cần con người can thiệp dán nhãn dữ liệu huấn luyện.
- **Bảo toàn năng lực tổng quát:** Huấn luyện trên cùng một kho ngữ liệu văn bản gốc, đảm bảo mô hình không bị "quên" khả năng xử lý ngôn ngữ tự nhiên.
- **Hiệu quả tính toán vượt trội:** Cho phép một mô hình kích thước trung bình (**GPT-J 6.7B**) đạt hiệu năng vượt xa các mô hình khổng lồ lớn hơn nó gấp hàng chục lần.

---

## 2. Phương Pháp Tiếp Cận (Approach)

Mục tiêu của chúng tôi là cho phép một mô hình ngôn ngữ $M$ có khả năng sử dụng các công cụ khác nhau thông qua các lệnh gọi API. Chúng tôi yêu cầu đầu vào và đầu ra của mỗi API đều có thể biểu diễn dưới dạng các chuỗi văn bản (*text sequences*). Điều này cho phép chèn liền mạch các lệnh gọi API vào bất kỳ văn bản nào bằng cách sử dụng các token đặc biệt đánh dấu điểm bắt đầu và kết thúc của mỗi lệnh gọi.

Chúng tôi biểu diễn mỗi lệnh gọi API dưới dạng một bộ đôi:
$$c = (a_c, i_c)$$
trong đó $a_c$ là tên của API và $i_c$ là đối số đầu vào tương ứng.

Cho một lệnh gọi API $c$ với kết quả trả về tương ứng là $r$, chúng tôi ký hiệu chuỗi tuyến tính hóa của lệnh gọi API khi chưa có và đã có kết quả lần lượt là:
$$e(c) = 	ext{<API>} \, a_c(i_c) \, 	ext{</API>}$$
$$e(c, r) = 	ext{<API>} \, a_c(i_c) ightarrow r \, 	ext{</API>}$$
trong đó `<API>`, `</API>` và $ightarrow$ là các token đặc biệt (trong thực nghiệm, chúng tôi dùng các chuỗi token sẵn có `[`, `]` và `->` để không phải sửa đổi từ vựng của mô hình).

```
                            QUY TRÌNH 4 BƯỚC CỦA TOOLFORMER
                            
 1. KHỞI TẠO VÀ LẤY MẪU (SAMPLING)
    Văn bản thô x -> Ghép Prompt P(x) -> LLM sinh các ứng viên gọi API: c_i = [API(input)]
                     
                                     │
                                     ▼
 2. THỰC THI API (EXECUTION)
    Thực thi API thực tế -> Nhận kết quả r_i -> Ghép thành [API(input) -> r_i]
                     
                                     │
                                     ▼
 3. LỌC TỰ GIÁM SÁT (SELF-SUPERVISED FILTERING)
    Đo lường hàm mất mát Loss:
    L+ = Mất mát khi CÓ API và CÓ kết quả
    L- = Mất mát khi KHÔNG CÓ API hoặc KHÔNG CÓ kết quả
    Điều kiện lọc: Giữ lại nếu (L- - L+) >= tau_f (API giúp giảm lỗi dự đoán)
                     
                                     │
                                     ▼
 4. TINH CHỈNH MÔ HÌNH (FINETUNING)
    Chèn các lệnh gọi API vượt qua bộ lọc vào văn bản gốc C -> Tạo tập dữ liệu C*
    Fine-tune mô hình M trên C* theo hàm mất mát mô hình hóa ngôn ngữ chuẩn.
```

### Bước 1: Lấy mẫu các Lời gọi API (Sampling API Calls)
Cho một văn bản đầu vào $x = x_1, x_2, \dots, x_n$. Với mỗi API, chúng tôi viết một câu nhắc $P(x)$ cung cấp định nghĩa ngắn gọn và một vài ví dụ minh họa cách gọi API.
- Đầu tiên, chúng tôi tính xác suất mô hình $M$ muốn bắt đầu một lệnh gọi API tại mỗi vị trí $i$:
  $$p_i = p_M(	ext{<API>} | P(x), x_{1:i-1})$$
  Chúng tôi chọn ra các vị trí $i$ có $p_i > 	au_s$ (ngưỡng khởi tạo) và chỉ giữ lại tối đa $k$ vị trí có xác suất cao nhất.
- Tại mỗi vị trí được chọn $i$, chúng tôi lấy mẫu tối đa $m$ lệnh gọi API ứng viên $c_i^1, \dots, c_i^m$ bằng cách giải mã từ $M$ với tiền tố $[P(x), x_{1:i-1}, 	ext{<API>}]$ cho đến khi gặp token `</API>`.

### Bước 2: Thực thi Lời gọi API (Executing API Calls)
Chúng tôi thực thi toàn bộ các lệnh gọi API hợp lệ được sinh ra từ Bước 1 bằng cách gửi truy vấn tới các dịch vụ tương ứng (máy tính, cơ sở dữ liệu, công cụ tìm kiếm) để nhận về chuỗi kết quả $r_i$.

### Bước 3: Lọc Lời gọi API Tự Giám sát (Filtering API Calls)
Một lệnh gọi API chỉ thực sự có giá trị nếu kết quả của nó giúp mô hình **dễ dàng dự đoán các token tiếp theo hơn**.
Để lượng hóa điều này, chúng tôi định nghĩa hàm mất mát dự đoán token có trọng số tại vị trí $i$:
$$L_i(z) = -\sum_{j=i}^n w_{j-i} \cdot \log p_M(x_j | z, x_{1:j-1})$$
trong đó $w_t$ là hàm trọng số suy giảm theo khoảng cách:
$$w_t = rac{	ilde{w}_t}{\sum_{s \in \mathbb{N}} 	ilde{w}_s} \quad 	ext{với} \quad 	ilde{w}_t = \max(0, 1 - 0.2 \cdot t)$$
Trọng số này đảm bảo rằng thông tin từ API chủ yếu hỗ trợ dự đoán các token nằm ngay sau vị trí gọi công cụ.

Chúng tôi so sánh hai giá trị mất mát:
- $L_i^+ = L_i(e(c_i, r_i))$: Mất mát khi mô hình được cung cấp lệnh gọi API cùng với kết quả trả về $r_i$.
- $L_i^- = \min \Big( L_i(\epsilon), \, L_i(e(c_i, \epsilon)) \Big)$: Mất mát nhỏ nhất giữa việc (i) hoàn toàn không gọi API nào ($\epsilon$) và (ii) có gọi API nhưng không nhận được kết quả ($r = \epsilon$).

**Quy tắc lọc (*Filtering Criterion*):** Chúng tôi chỉ giữ lại lệnh gọi API $c_i$ nếu nó thỏa mãn:
$$L_i^- - L_i^+ \ge 	au_f$$
Nghĩa là việc chèn công cụ và kết quả giúp làm giảm hàm mất mát ít nhất một đại lượng $	au_f$.

### Bước 4: Tinh chỉnh Mô hình (Finetuning)
Sau khi lọc, chúng tôi chèn các lệnh gọi API được giữ lại vào tập dữ liệu gốc để tạo thành tập dữ liệu mới $C^*$. Điều quan trọng là: **chúng tôi chỉ chèn $e(c_i) = 	ext{<API>} a_c(i_c) 	ext{</API>}$ (chưa chứa kết quả $r_i$)** vào luồng văn bản huấn luyện. Nhờ vậy, khi fine-tune trên $C^*$, mô hình học được chính xác **vị trí nào và tham số nào cần gọi công cụ** dựa trên ngữ cảnh đi trước.

### Cơ chế Suy luận Thời gian Thực (Inference)
Khi tạo văn bản trong thời gian thực, mô hình sinh token bình thường. Ngay khi mô hình sinh ra token `->`, quá trình sinh văn bản được tạm ngắt:
1. Hệ thống bóc tách tên API và tham số đầu vào vừa được sinh ra;
2. Gọi công cụ bên ngoài để lấy kết quả $r$;
3. Chèn kết quả $r$ cùng token đóng `]` vào ngữ cảnh;
4. Tiếp tục quá trình sinh văn bản bình thường.

---

## 3. Các Công Cụ Được Tích Hợp (Tools)

Chúng tôi tích hợp 5 công cụ đại diện cho các nhu cầu tri thức phổ biến nhất:

| Tên Công Cụ (*Tool*) | Nguồn Hiện Thực (*Underlying Engine*) | Ví Dụ Đầu Vào (*Input*) | Ví Dụ Đầu Ra (*Output*) |
|---|---|---|---|
| **Hỏi đáp (*Question Answering*)** | Mô hình Atlas [Izacard et al., 2022] fine-tune trên Natural Questions | `QA("Thủ đô của Úc là gì?")` | `Canberra` |
| **Máy tính (*Calculator*)** | Bộ tính toán số học Python (hỗ trợ $+$, $-$, $	imes$, $/$, làm tròn 2 chữ số) | `Calculator(27 + 4 * 2)` | `35` |
| **Tìm kiếm (*Wikipedia Search*)** | Công cụ tìm kiếm BM25 trên bản dump Wikipedia tiếng Anh | `WikiSearch("Định luật Ohm")` | `Định luật Ohm phát biểu rằng cường độ dòng điện...` |
| **Dịch máy (*Translation*)** | Mô hình NLLB-200 (600M) [Team et al., 2022] + bộ phân loại ngôn ngữ fastText | `MT("merci beaucoup")` | `thank you very much` |
| **Lịch (*Calendar*)** | API đồng hồ hệ thống (trả về ngày tháng hiện tại, không nhận tham số) | `Calendar()` | `Today is Friday, September 11, 2026` |

---

## 4. Thực Nghiệm và Đánh Giá (Experiments)

### 4.1 Thiết lập Thực nghiệm
- **Mô hình nền tảng:** GPT-J (6.7 tỷ tham số) [Wang & Komatsuzaki, 2021].
- **Tập dữ liệu huấn luyện:** Một tập con của CCNet [Wenzek et al., 2020].
- **Các đường cơ sở đối chứng:**
  - **GPT-J:** Mô hình gốc 6.7B không fine-tune.
  - **GPT-J + CC:** GPT-J được fine-tune trên tập dữ liệu CCNet không có lời gọi API.
  - **Toolformer (disabled):** Mô hình Toolformer nhưng bị khóa chức năng gọi API lúc kiểm tra.
  - **Toolformer:** Mô hình Toolformer kích hoạt đầy đủ API.
  - **OPT (66B)** [Zhang et al., 2022] và **GPT-3 Text-Davinci-003 (175B)** [Brown et al., 2020].

---

### 4.2 Kết quả Thực nghiệm

#### Bảng 3: Kết quả trên các tập con của Bộ chuẩn LAMA (Độ chính xác %)

| Mô hình (*Model*) | Quy mô (*Params*) | SQuAD | Google-RE | T-REx | Trung bình (*Avg*) |
|---|:---:|:---:|:---:|:---:|:---:|
| **GPT-J** | 6.7B | 19.3 | 4.9 | 31.4 | 18.5 |
| **GPT-J + CC** | 6.7B | 20.1 | 5.6 | 32.7 | 19.5 |
| **Toolformer (disabled)** | 6.7B | 21.2 | 6.3 | 34.1 | 20.5 |
| **Toolformer (Đề xuất)** | **6.7B** | **33.8** | **11.2** | **53.5** | **32.8** |
| *OPT* | *66B* | *23.4* | *7.0* | *37.8* | *22.7* |
| *GPT-3* | *175B* | *37.5* | *11.8* | *53.2* | *34.2* |

*(Nhận xét: Toolformer 6.7B sử dụng công cụ QA đạt 32.8%, vượt xa OPT 66B và tiệm cận mô hình GPT-3 175B lớn hơn nó gấp 26 lần!)*

---

#### Bảng 4: Kết quả trên các Bài toán Suy luận Toán học (Độ chính xác %)

| Mô hình (*Model*) | Quy mô (*Params*) | ASDiv | SVAMP | MAWPS | Trung bình (*Avg*) |
|---|:---:|:---:|:---:|:---:|:---:|
| **GPT-J** | 6.7B | 7.5 | 5.2 | 9.9 | 7.5 |
| **GPT-J + CC** | 6.7B | 8.2 | 5.0 | 9.3 | 7.5 |
| **Toolformer (disabled)** | 6.7B | 14.7 | 8.1 | 18.4 | 13.7 |
| **Toolformer (Đề xuất)** | **6.7B** | **40.4** | **29.4** | **44.0** | **37.9** |
| *OPT* | *66B* | *6.0* | *4.9* | *7.9* | *6.3* |
| *GPT-3* | *175B* | *16.8* | *10.6* | *15.0* | *14.1* |

```
                SO SÁNH ĐỘ CHÍNH XÁC SUY LUẬN TOÁN HỌC (%)
                
  45% ┌─────────────────────────────────────────────────────────────┐
      │                                                     [44.0%] │
  40% │                       [40.4%]                               │
      │                                                             │
  30% │                                       [29.4%]               │
      │                                                             │
  20% │                                                             │
      │       [16.8%]                         [15.0%]               │
  10% │                       [10.6%]                               │
      │ [7.5%]        [5.2%]          [9.9%]                        │
   0% └─────────────────────────────────────────────────────────────┘
        ASDiv (GPT-J)   ASDiv (Toolformer)  MAWPS (GPT-3)  MAWPS (Toolformer)
```

*(Nhận xét: Khi được trang bị máy tính Calculator, Toolformer đạt 37.9% trung bình, hủy diệt hoàn toàn GPT-3 175B vốn chỉ đạt 14.1%! Trong 97.9% trường hợp, mô hình tự chủ quyết định kích hoạt máy tính).*

---

#### Bảng 5: Kết quả trên các Tác vụ Trả lời Câu hỏi Tri thức (Độ chính xác %)

| Mô hình (*Model*) | WebQuestions | Natural Questions | TriviaQA |
|---|:---:|:---:|:---:|
| **GPT-J** | 9.6 | 13.0 | 25.1 |
| **GPT-J + CC** | 9.4 | 13.2 | 25.5 |
| **Toolformer (disabled)** | 9.8 | 13.5 | 26.0 |
| **Toolformer (Đề xuất)** | **18.7** | **21.5** | **39.8** |
| *GPT-3 (175B)* | *22.4* | *29.9* | *53.7* |

*(Nhận xét: Với Wikipedia Search API, Toolformer tăng vọt hiệu năng so với các mô hình cùng quy mô, dù vẫn còn khoảng cách với GPT-3 do công cụ tìm kiếm BM25 đơn giản chưa hỗ trợ duyệt nhiều lượt).*

---

#### Bảng 6: Kết quả trên Bộ chuẩn Đa ngữ MLQA (F1 Score %)

| Mô hình (*Model*) | Tiếng Tây Ban Nha (Es) | Tiếng Đức (De) | Tiếng Việt (Vi) | Tiếng Trung (Zh) | Tiếng Ả Rập (Ar) |
|---|:---:|:---:|:---:|:---:|:---:|
| **GPT-J** | 21.5 | 20.8 | 18.2 | 19.4 | 14.5 |
| **Toolformer (Đề xuất)** | **31.4** | **30.2** | **26.8** | **28.7** | **22.1** |
| *GPT-3 (175B)* | *23.1* | *22.5* | *20.1* | *21.4* | *16.8* |

*(Nhận xét: Nhờ công cụ Dịch máy tự động dịch câu hỏi sang tiếng Anh trước khi tìm đáp án, Toolformer cải thiện vượt bậc trên tất cả các ngôn ngữ, bao gồm cả tiếng Việt).*

---

## 5. Khảo Sát Năng Lực Mô Hình Hóa Ngôn Ngữ Cốt Lõi

Một câu hỏi quan trọng: **Liệu việc học gọi API có làm suy giảm năng lực ngôn ngữ tự nhiên của mô hình hay không?**
Chúng tôi đo lường độ hỗn loạn (*Perplexity - PPL*, giá trị càng thấp càng tốt) trên hai tập dữ liệu kiểm thử: **WikiText** và **CCNet**.

| Mô hình (*Model*) | PPL trên WikiText | PPL trên CCNet |
|---|:---:|:---:|
| **GPT-J (Gốc)** | 12.45 | 10.82 |
| **GPT-J + CC** | 12.38 | 10.45 |
| **Toolformer** | **12.35** | **10.42** |

**Kết luận:** PPL của Toolformer không hề tăng mà thậm chí giảm nhẹ. Điều này chứng minh rằng phương pháp tự giám sát của Toolformer giúp mô hình làm chủ các công cụ bên ngoài mà **không hề làm suy giảm bất kỳ năng lực ngôn ngữ cốt lõi nào**.

---

## 6. Những Hạn Chế Hiện Tại (Limitations)

1. **Không thể nối chuỗi công cụ phụ thuộc (*No Tool Chaining*):** Toolformer hiện tại chỉ hỗ trợ gọi các công cụ độc lập trong từng bước sinh, chưa thể lấy đầu ra của công cụ này nạp trực tiếp làm tham số cho công cụ khác.
2. **Không có tính tương tác nhiều lượt (*No Multi-turn Interactive Exploration*):** Mô hình không thể duyệt qua nhiều trang kết quả tìm kiếm nếu kết quả đầu tiên không khớp.
3. **Nhạy cảm với định dạng Prompt ban đầu:** Quá trình tự sinh dữ liệu ở Bước 1 phụ thuộc vào chất lượng của vài ví dụ mẫu ban đầu.
4. **Chi phí tính toán khi gán nhãn:** Việc lấy mẫu và lọc trên quy mô toàn bộ kho ngữ liệu lớn đòi hỏi chi phí suy luận đáng kể trong giai đoạn tiền xử lý.

---

## 7. Kết Luận (Conclusion)

Toolformer là công trình tiên phong chứng minh rằng: **các mô hình ngôn ngữ lớn hoàn toàn có khả năng tự dạy mình sử dụng các công cụ bên ngoài một cách tự giám sát**. 

Bằng cách tự quyết định thời điểm, công cụ và tham số cần gọi thông qua cơ chế lọc suy giảm hàm mất mát, Toolformer vượt qua các rào cản truyền thống về số học, tra cứu sự thật và nhận thức thời gian, mang lại hiệu năng tương đương các mô hình lớn hơn nó hàng chục lần. Công trình này đặt nền tảng kiến trúc vững chắc cho sự phát triển của các **tác tử AI tự chủ sử dụng công cụ (*Tool-Augmented Autonomous Agents*)** hiện đại.

---

## 8. Tài Liệu Tham Khảo (References - Trích dẫn Chọn lọc)

1. **Brown, T., Mann, B., Ryder, N., et al.** (2020). *Language models are few-shot learners*. In NeurIPS.
2. **Chowdhery, A., Narang, S., Devlin, J., et al.** (2022). *PaLM: Scaling language modeling with Pathways*. arXiv:2204.02311.
3. **Izacard, G., Lewis, P., Lomeli, M., et al.** (2022). *Few-shot learning with retrieval augmented language models*. arXiv:2208.03299.
4. **Petroni, F., Rocktäschel, T., Riedel, S., et al.** (2019). *Language models as knowledge bases?* In EMNLP.
5. **Team, N., Costa-jussà, M. R., Cross, J., et al.** (2022). *No language left behind: Scaling human-centered machine translation*. arXiv:2207.04672.
6. **Wang, B., & Komatsuzaki, A.** (2021). *GPT-J-6B: A 6 billion parameter autoregressive language model*.
7. **Wenzek, G., Lachaux, M. A., Conneau, A., et al.** (2020). *CCNet: Extracting high quality monolingual datasets from web crawl data*. In LREC.
8. **Zhang, S., Roller, S., Goyal, N., et al.** (2022). *OPT: Open pre-trained transformer language models*. arXiv:2205.01068.
