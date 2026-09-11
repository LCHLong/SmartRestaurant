# Chuyển dịch Lời thoại Dựa trên Whisper từ Video trên Nhiều Ngôn ngữ Phục vụ Sự Hiểu biết Đa Văn hóa (Whisper-Based Speech Transcription from Videos Across Multiple Languages for Cross-Cultural Understanding)

**Tác giả:** Michael Picheny  
*NYU Courant Institute School of Mathematics, Computing, and Data Science, New York University (NYU), New York, USA*  
`map22@nyu.edu`

---

## Tóm tắt (Abstract)
Hiểu biết đa văn hóa (cross-cultural understanding) ngày càng trở nên quan trọng trong một thế giới kết nối cao và xuyên quốc gia ngày nay. Sự thành công của các công nghệ dựa trên Mô hình Ngôn ngữ Lớn (LLM) hiện đang thúc đẩy việc phát triển các công cụ tự động nhằm hỗ trợ sự thấu hiểu cho những người ngoại quốc đang nỗ lực hòa nhập trong các môi trường đa văn hóa. Việc xây dựng các công cụ tự động như vậy thường được thực hiện bằng cách tận dụng dữ liệu văn bản, âm thanh và video trong tự nhiên (in-the-wild). 

Bài báo này trình bày các kỹ thuật nhằm cải thiện việc tạo văn bản chép lời (transcript) dựa trên nhận dạng giọng nói từ video trên nhiều ngôn ngữ, nhằm huấn luyện tốt hơn cho các công cụ tự động này. Trọng tâm nghiên cứu là các quy trình và công cụ nhận dạng giọng nói có thể dễ dàng sử dụng bởi những người xây dựng công cụ đa văn hóa mà không đòi hỏi chuyên môn sâu về xử lý tiếng nói. 

Sử dụng các video công khai từ YouTube và các công cụ dựa trên Whisper, tỷ lệ lỗi phiên âm trung bình trên **7 ngôn ngữ** (Tây Ban Nha, Nhật Bản, Hàn Quốc, Quan Thoại/Trung Quốc, Thổ Nhĩ Kỳ, Nga và Do Thái) ban đầu đạt mức **30%**. Với một lượng dữ liệu tinh chỉnh (fine-tuning) vừa phải, tỷ lệ lỗi trung bình có thể giảm xuống còn **20%**, giúp đầu ra này trở nên hữu dụng hơn nhiều cho các quá trình xử lý hạ nguồn (downstream processing). Dữ liệu tiếng nói và siêu dữ liệu (metadata) liên quan đến các video này cũng được công bố cho cộng đồng nhằm tiếp tục cải tiến các thử nghiệm này.

**Chỉ số thuật ngữ (Index Terms):** Nhận dạng giọng nói (speech recognition), whisper, phiên âm video (video transcription), hiểu biết đa văn hóa (cross-cultural understanding).

---

## I. Giới thiệu (Introduction)

Hiểu biết đa văn hóa ngày càng trở nên quan trọng trong thế giới kết nối chặt chẽ ngày nay. Thành công của công nghệ LLM đang thúc đẩy phát triển các công cụ tự động giúp người không phải bản xứ thích nghi trong môi trường đa văn hóa. Việc xây dựng các công cụ này thường dựa vào việc phân tích dữ liệu đa phương thức (multimodal), gồm văn bản, âm thanh và video [1]–[5].

Một cách để tận dụng dữ liệu âm thanh cho các mục đích này là chuyển đổi dữ liệu âm thanh thành dữ liệu văn bản, sau đó sử dụng các công cụ LLM dựa trên văn bản để trích xuất thông tin văn hóa liên quan (xem [6] để biết tổng quan về các công cụ này). Mức độ dữ liệu âm thanh có thể được tận dụng phụ thuộc vào hiệu năng của quá trình trích xuất. Học sâu (deep learning) đã cải thiện đáng kể hiệu năng nhận dạng giọng nói trong vài năm qua. Các bảng xếp hạng mã nguồn mở [7] có thể khiến người dùng thông thường nghĩ rằng tỷ lệ lỗi từ (Word Error Rate - WER) hiện nay đã xuống dưới 10% trên nhiều tác vụ, và do đó không ảnh hưởng đến nghiên cứu hiểu biết văn hóa. Tuy nhiên, các tác vụ này thường chứa lời nói theo kịch bản hoặc được chuẩn hóa từ các diễn giả chuyên nghiệp và được ghi âm trong môi trường tương đối lý tưởng. 

Đối với hiểu biết văn hóa, trọng tâm là trích xuất thông tin từ lời nói tự nhiên trong đời thực ("in-the-wild"). Việc trích xuất lời thoại chính xác từ dữ liệu âm thanh thực tế như vậy vẫn còn đầy thách thức, đặc biệt là với các ngôn ngữ không giàu tài nguyên dữ liệu như tiếng Anh. Độ chính xác có thể được cải thiện bằng cách xây dựng các hệ thống tùy chỉnh tận dụng hàng nghìn giờ dữ liệu, nhưng các phương pháp này thường không khả thi đối với các nhà nghiên cứu quan tâm đến hiểu biết đa văn hóa. Những nhà nghiên cứu này thường không phải là chuyên gia về tiếng nói và mong muốn các phương pháp luận dễ dàng, chi phí thấp để trích xuất lời thoại từ âm thanh. Cuối cùng, vì các chỉ dấu văn hóa (cultural markers) có mật độ xuất hiện thấp so với số giờ âm thanh, nên cần phải phân tích hàng nghìn giờ âm thanh để tạo ra lượng dữ liệu đủ lớn cho việc huấn luyện các mô hình hiểu biết văn hóa ở hạ nguồn, khiến thời gian và chi phí xử lý trở thành vấn đề thực tế quan trọng.

Xuất phát từ sự quan tâm ngày càng tăng đối với việc phát triển các công cụ tự động cho hiểu biết đa văn hóa, và nhận thấy bước tiền xử lý quan trọng là trích xuất bản chép lời âm thanh từ lượng lớn dữ liệu đa phương thức, đa ngôn ngữ, nghiên cứu này được khởi xướng với ba mục tiêu:
1. Đánh giá độ chính xác của các công cụ nhận dạng giọng nói mã nguồn mở đối với dữ liệu liên quan đến hiểu biết đa văn hóa trên nhiều ngôn ngữ.
2. Phác thảo một quy trình thực tế mà các nhà nghiên cứu không chuyên về tiếng nói với nguồn lực hạn chế có thể sử dụng để thu thập dữ liệu và xây dựng hệ thống chép lời tiếng nói có thể dùng được.
3. Chia sẻ dữ liệu tiếng nói tiêu biểu với cộng đồng để thúc đẩy các nghiên cứu mới nhằm đạt được những cải tiến hiệu năng cao hơn.

Xét đến tính dễ sử dụng, thời gian xử lý và ràng buộc chi phí, phương pháp tạo bản chép lời dựa trên **Whisper** [8] đã được sử dụng. Một biến thể của Whisper được phát triển tại Đại học Oxford có tên là **WhisperX** [9] tỏ ra đặc biệt phù hợp cho mục đích này. Bản thân Whisper là một hệ thống nhận dạng giọng nói mã nguồn mở hiệu năng cao với khả năng đa ngôn ngữ tốt và có khả năng tinh chỉnh (fine-tuning), cùng API dễ sử dụng. WhisperX bổ sung một số cải tiến tăng tốc đáng kể so với xử lý Whisper cơ bản và có khả năng phân tách người nói (speaker diarization - quan trọng đối với phân tích hội thoại).

Phần còn lại của bài báo mô tả chi tiết phương pháp luận:
- Mục II-A mô tả việc lựa chọn bộ nhận dạng,
- Mục II-B mô tả việc lựa chọn ngôn ngữ,
- Mục II-C mô tả quy trình xử lý,
- Mục II-D mô tả việc chọn lọc video,
- Mục III mô tả các thử nghiệm mặc định (out-of-the-box) và tinh chỉnh,
- Mục IV thảo luận kết quả và ý nghĩa về tính khả dụng,
- Mục V tổng quan về việc phát hành dữ liệu và siêu dữ liệu,
- Mục VI tóm tắt kết luận.

---

## II. Xử lý Dữ liệu (Data Processing)

### A. Lựa chọn Bộ nhận dạng (Recognizer Choice)
Xử lý dựa trên Whisper được chọn vì API dễ sử dụng và hiệu năng mặc định (out-of-the-box) xuất sắc. Whisper được huấn luyện trên 680.000 giờ âm thanh (563.000 giờ tiếng Anh và 117.000 giờ cho 96 ngôn ngữ khác [8]). 13 trong số 96 ngôn ngữ có ít nhất 2.000 giờ âm thanh, do đó hiệu năng mặc định tốt là điều hoàn toàn có thể kỳ vọng.

Cả Whisper và biến thể phái sinh **WhisperX** đều được đánh giá. WhisperX do Đại học Oxford phát triển, không chỉ thực hiện nhận dạng tiếng nói mà còn phân tách người nói bằng cách tích hợp gói mã nguồn mở `Pyannote` [10], [11]. Đối với nghiên cứu văn hóa, phân tách người nói là tính năng then chốt để xác định lượt lời trong hội thoại. WhisperX cũng chứa phiên bản tăng tốc của Whisper (tuyên bố nhanh hơn gấp 10 lần cho mô hình `large-v2`). Tất cả các thử nghiệm của chúng tôi đều sử dụng mô hình **large-v2** (các thảo luận trên GitHub [12] cho thấy `large-v3` dễ gặp ảo giác hơn đối với dữ liệu nhiễu).

### B. Dữ liệu Ngôn ngữ (Language Data)
Việc chọn ngôn ngữ nghiên cứu được lấy cảm hứng từ các ngôn ngữ trong chương trình Hiểu biết Văn hóa Tính toán (CCU) của DARPA [13] (tiếng Quan Thoại, Tây Ban Nha, Hàn Quốc, Nhật Bản, Nga và Thổ Nhĩ Kỳ). Trong CCU, nhận dạng tiếng nói cần thiết để trích xuất lời thoại nhưng không có bản chép lời thủ công đi kèm, do đó không thể đánh giá hiệu năng ASR trực tiếp trên đó.

6 ngôn ngữ CCU đều có hơn 4.000 giờ âm thanh trong dữ liệu huấn luyện của Whisper (**Bảng I**). **Tiếng Do Thái (Hebrew)** được thêm vào như một ngôn ngữ thử thách vì lượng dữ liệu trong Whisper ít hơn đáng kể (688 giờ).

| Ngôn ngữ (Language) | Số giờ trong dữ liệu Whisper (Hours) |
| :--- | :---: |
| Tiếng Quan Thoại (Mandarin) | 23.446 |
| Tiếng Tây Ban Nha (Spanish) | 11.000 |
| Tiếng Nga (Russian) | 9.761 |
| Tiếng Hàn (Korean) | 7.793 |
| Tiếng Nhật (Japanese) | 7.064 |
| Tiếng Thổ Nhĩ Kỳ (Turkish) | 4.333 |
| Tiếng Do Thái (Hebrew) | 688 |

*Bảng I: Dung lượng dữ liệu huấn luyện của Whisper cho các ngôn ngữ được chọn.*

### C. Quy trình Xử lý (Processing Pipeline)
Một phần lớn dữ liệu CCU đến từ YouTube. Nền tảng YouTube xử lý các yêu cầu HTTP GET với các bộ lọc trong URI [14], [15] (giới hạn theo năm/tháng/tuần, video có phụ đề, giấy phép Creative Commons). Các công cụ như `yt-dlp` [16] và kho lưu trữ `Jtubespeech` [17] giúp thu thập dữ liệu dễ dàng.

Các video CCU từ YouTube được lọc để chọn các video có phụ đề thủ công và giấy phép Creative Commons. Đối với tiếng Quan Thoại, Hàn, Thổ Nhĩ Kỳ và Do Thái, dữ liệu được thu thập từ đầu trên YouTube trong khoảng thời gian từ giữa năm 2024 đến giữa năm 2025 (riêng tiếng Quan Thoại giới hạn trong tháng 4/2025).

Các bước xử lý gồm:
1. Trích xuất danh sách từ tạo từ tiêu đề trong tệp dump chỉ mục Wikimedia (`make_search_word`) [18].
2. Dùng danh sách từ này tìm kiếm video có phụ đề, giấy phép Creative Commons trong khoảng thời gian xác định (`obtain_search_word`).
3. Trích xuất thông tin xem phụ đề là tự động hay thủ công (`retrieve_subtitle_exists`).
4. Tải video có phụ đề thủ công, trích xuất âm thanh và chuyển đổi tần số lấy mẫu thành **16 kHz mono** (`download_video`).

Các tệp phụ đề thu được ở định dạng `.vtt` [19] thường có mốc thời gian không khớp chính xác với ranh giới từ/câu âm thanh. Do đó, quy trình căn chỉnh sau được áp dụng:
1. Nối các phân đoạn `.vtt` liên tiếp cho đến khi đạt 20 giây âm thanh hoặc phát hiện khoảng lặng đo được (chọn 0.1 giây).
2. Dùng mô hình căn chỉnh ngữ âm (phonetic alignment) của WhisperX để xác định thời điểm bắt đầu và kết thúc chính xác hơn cho các từ.
3. Cắt đoạn lại (resegment) tại các khoảng lặng $\ge 0.5$ giây.

### D. Quy trình Tuyển chọn Video (Video Selection Process)
Các đoạn mới tạo được giải mã bằng WhisperX và tính điểm bằng bộ công cụ chấm điểm NIST SCTK [20] để tính tỷ lệ lỗi từ (WER) và lỗi ký tự (CER), lấy phụ đề làm mẫu đối chiếu. Các video có **WER > 50% bị loại bỏ** để tránh dữ liệu kém chất lượng. Các video ngắn hơn 5 phút hoặc dài hơn 2 giờ cũng bị loại bỏ.

Dữ liệu âm thanh được chia thành các tập huấn luyện (Train), phát triển (Dev) và kiểm thử (Test). Một phiên bản "nhỏ" (Small) chiếm khoảng 10% dữ liệu cũng được tạo ra để phục vụ thử nghiệm tinh chỉnh nhanh (**Bảng II**).

| Kích thước (Size) | Loại (Type) | Chỉ số (Stat) | Quan Thoại (Man.) | Tây Ban Nha (Spa.) | Nga (Rus.) | Nhật (Jap.) | Hàn (Kor.) | Thổ Nhĩ Kỳ (Tur.) | Do Thái (Heb.) |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Tất cả (All)** | **Train** | Số Video | 127 | 20 | 186 | 82 | 247 | 740 | 135 |
| | | Số Đoạn | 57.819 | 9.063 | 72.979 | 10.465 | 48.319 | 205.018 | 61.210 |
| | | Thời lượng (h) | 50.35 | 8.45 | 117.30 | 31.01 | 53.58 | 207.22 | 63.88 |
| | **Dev** | Số Video | 10 | 3 | 6 | 8 | 13 | 29 | 8 |
| | | Số Đoạn | 3.738 | 381 | 1.142 | 1.007 | 1.679 | 8.207 | 5.266 |
| | | Thời lượng (h) | 3.37 | 0.31 | 3.57 | 2.18 | 1.68 | 8.36 | 5.18 |
| | **Test** | Số Video | 21 | 10 | 12 | 11 | 23 | 58 | 13 |
| | | Số Đoạn | 7.572 | 1.713 | 7.464 | 1.354 | 3.391 | 15.317 | 6.758 |
| | | Thời lượng (h) | 7.65 | 1.58 | 8.23 | 5.72 | 4.21 | 15.10 | 7.44 |
| **Nhỏ (Small)**| **Train** | Số Đoạn | 5.782 | 9.063 | 6.999 | 3.488 | 8.053 | 10.250 | 6.121 |
| | | Thời lượng (h) | 5.01 | 8.45 | 11.04 | 10.35 | 8.98 | 10.34 | 6.32 |
| | **Dev** | Số Đoạn | 373 | 381 | 1.142 | 336 | 560 | 820 | 526 |
| | | Thời lượng (h) | 0.32 | 0.31 | 3.57 | 0.74 | 0.57 | 0.83 | 0.52 |
| | **Test** | Số Đoạn | 757 | 1.713 | 746 | 451 | 1.130 | 1.531 | 675 |
| | | Thời lượng (h) | 0.75 | 1.58 | 0.83 | 1.88 | 1.40 | 1.51 | 0.74 |

*Bảng II: Siêu dữ liệu ngôn ngữ hợp nhất (Thời lượng tính theo Giờ).*

---

## III. Các Thử nghiệm (Experiments)

Ba nhóm thử nghiệm đã được chạy trên cả 7 ngôn ngữ:
1. Đánh giá nhận dạng mặc định (**out-of-the-box**) của Whisper và WhisperX.
2. Tinh chỉnh (**fine-tuning**) Whisper và WhisperX trên tập dữ liệu "nhỏ" (Small train).
3. Tinh chỉnh trên toàn bộ tập dữ liệu huấn luyện đầy đủ ("all" train).

Tỷ lệ lỗi từ (WER) được tính cho các ngôn ngữ, riêng tiếng Quan Thoại và tiếng Nhật sử dụng tỷ lệ lỗi ký tự (CER). Các thử nghiệm sử dụng PyTorch 2.7.1 trên các GPU A100 / RTX6000.

### A. Hiệu năng Mặc định (Out-of-Box Performance)
**Hình 1** trình bày hiệu năng mặc định. Tỷ lệ WER dao động từ 25% đến 30%. WhisperX có ưu thế nhẹ về độ chính xác và nhanh hơn đáng kể so với Whisper. 
- Tiếng Quan Thoại có tỷ lệ lỗi thấp hơn đáng kể (do đo bằng CER).
- Tiếng Nhật (cũng đo bằng CER) lại có tỷ lệ lỗi cao, chủ yếu do lỗi xóa từ (deletion error).
- Không có sự khác biệt rõ rệt giữa dữ liệu CCU và phi CCU, hay giữa tiếng Do Thái (ít dữ liệu huấn luyện) so với các ngôn ngữ khác.

```
Tỷ lệ lỗi (%) mặc định trên các ngôn ngữ:
- Quan Thoại: ~18% (CER)
- Tây Ban Nha: ~28%
- Nga: ~27%
- Nhật Bản: ~33% (CER)
- Hàn Quốc: ~29%
- Thổ Nhĩ Kỳ: ~27%
- Do Thái: ~28%
```
*Hình 1: Hiệu năng mặc định của Whisper so với WhisperX theo từng ngôn ngữ.*

### B. Hiệu năng sau khi Tinh chỉnh (Performance after Fine-Tuning)
Khi tinh chỉnh đơn giản bằng cách mở đóng băng tất cả tham số và huấn luyện 2 epoch (learning rate $1\text{e-}5$, weight decay $0.005$):
- **Fine-tuning trên tập "nhỏ" ban đầu làm kết quả tệ hơn mặc định (WER tăng từ 29.7% lên 35.4%)!** Nguyên nhân chủ yếu là do sự gia tăng đột biến của lỗi chèn từ (insertions), bắt nguồn từ hiện tượng **ảo giác (hallucinations)**.
- Khắc phục ảo giác bằng cách giới hạn số lượng token sinh ra thông qua `generation_config.max_new_tokens = 256` (giá trị 64 gây cụt lời thoại, 256 cho kết quả tối ưu với phân đoạn tối đa 20 giây). Sau khi tối ưu, WER của Whisper giảm xuống **26.0%**.
- Đối với WhisperX, sau khi tinh chỉnh trên tập nhỏ đạt **24.4%**. WhisperX ít bị ảo giác hơn nhờ thuật toán VAD (Voice Activity Detection) tốt hơn.
- Khi tinh chỉnh trên **toàn bộ dữ liệu huấn luyện đầy đủ (All)**, WhisperX đạt WER trung bình là **21.7%** (**Hình 2**).

```
So sánh WER trung bình qua các cấu hình (%):
[Whisper OOB]      : 29.7%
[Whisper FT]       : 35.4% (Tăng lỗi do ảo giác)
[Whisper FT Opt]   : 26.0% (Giới hạn max_new_tokens=256)
[WhisperX FT]      : 24.4%
[WhisperX FT (All)]: 21.7% (Huấn luyện đầy đủ)
```
*Hình 2: Hiệu năng trung bình sau khi tinh chỉnh.*

Kiểm định ý nghĩa thống kê (paired bootstrap tests [22]) trên 10 cặp so sánh cho thấy tất cả đều đạt ý nghĩa thống kê ($p < 0.001$), ngoại trừ Whisper OOB so với Whisper FT Opt ($p = 0.012$).

---

## IV. Thảo luận (Discussion)

Các kết quả chứng minh tỷ lệ lỗi phiên âm cho lời nói khó trong thực tế có thể giảm gần **33% tương đối** (từ 30% xuống gần 20%) bằng các công cụ mã nguồn mở và tài nguyên tính toán vừa phải (nhiều nhất 200 giờ dữ liệu cho tiếng Thổ Nhĩ Kỳ).

**Mức WER ~20% có đủ để trích xuất chính xác các chỉ dấu văn hóa hay không?**  
Nghiên cứu tham chiếu đánh giá tác động của độ suy giảm WER lên các thành phần NLP [23] thông qua chỉ số **Điểm dung nạp nhiễu (Noise Toleration Point - NTP)**:

| Thành phần NLP (Metric) | Mức dung nạp WER (NTP Tolerance) |
| :--- | :---: |
| Tóm tắt văn bản (Summarization) | 7% – 30% |
| Hỏi đáp (Question Answering - Q&A) | 5% – 34% |
| Phân loại hành động đối thoại (Dialog Act Classification - DAC) | 44% – 71% |

*Bảng III: Mức dung nạp độ suy giảm tỷ lệ lỗi từ ước tính cho ba thành phần NLP (từ [23]).*

Phân loại hành động đối thoại (DAC) ít nhạy cảm nhất với WER (chịu được 44%–71%), tương tự như nhận diện chủ đề (topic spotting) [24]. Tóm tắt và Hỏi đáp nhạy cảm hơn nhưng vẫn tương đối vững vàng trong khoảng WER 20%–30%. Do đó, mức WER ~20% sau tinh chỉnh là hoàn toàn khả thi cho các mô hình phân tích văn hóa hạ nguồn.

---

## V. Công bố Dữ liệu (Data Release)

Mặc dù bộ lọc YouTube API đã chọn giấy phép Creative Commons, quá trình kiểm tra phát hiện khoảng một nửa số video thiếu thông tin giấy phép rõ ràng trong metadata hoặc video đã bị xóa (**Bảng IV**).

| Ngôn ngữ (Language) | Gốc (Original) | Có bản quyền CC (Present) | Thiếu CC (Absent) | Video đã biến mất (Vanished) |
| :--- | :---: | :---: | :---: | :---: |
| Tiếng Quan Thoại (Mandarin) | 158 | 130 | 6 | 22 |
| Tiếng Tây Ban Nha (Spanish) | 33 | 0 | 33 | 0 |
| Tiếng Nga (Russian) | 204 | 1 | 199 | 4 |
| Tiếng Nhật (Japanese) | 101 | 1 | 100 | 0 |
| Tiếng Hàn (Korean) | 283 | 211 | 1 | 71 |
| Tiếng Thổ Nhĩ Kỳ (Turkish) | 827 | 441 | 14 | 372 |
| Tiếng Do Thái (Hebrew) | 156 | 148 | 0 | 8 |

*Bảng IV: Sự hiện diện của giấy phép Creative Commons trong siêu dữ liệu video.*

Để đảm bảo an toàn pháp lý, tập dữ liệu công bố [25] tập trung vào 4 ngôn ngữ có đầy đủ giấy phép: **Hàn Quốc, Quan Thoại, Do Thái và Thổ Nhĩ Kỳ** với tổng cộng **260 giờ âm thanh** (**Bảng V**).

| Chỉ số (Metric) | Tiếng Hàn (Korean) | Tiếng Quan Thoại (Mandarin) | Tiếng Do Thái (Hebrew) | Tiếng Thổ Nhĩ Kỳ (Turkish) |
| :--- | :---: | :---: | :---: | :---: |
| Số đoạn Train (Train Segments) | 41.865 | 25.930 | 59.128 | 102.615 |
| Số giờ Train (Train Hours) | 43.48 | 30.42 | 61.38 | 105.07 |
| Số đoạn Dev (Dev Segments) | 1.113 | 1.402 | 5.255 | 7.285 |
| Số giờ Dev (Dev Hours) | 1.09 | 2.88 | 5.16 | 7.74 |
| Số đoạn Test (Test Segments) | 3.027 | 5.250 | 6.558 | 13.847 |
| Số giờ Test (Test Hours) | 3.44 | 6.42 | 7.28 | 13.61 |
| Tỷ lệ lỗi % chưa train (Error % No-Train) | 32.1% | 21.4% | 27.8% | 29.4% |
| Tỷ lệ lỗi % đã train (Error % Train) | **23.4%** | **10.2%** | **22.1%** | **18.2%** |

*Bảng V: Thống kê trên bộ dữ liệu được công bố.*

---

## VI. Tóm tắt (Summary)

Bài báo đã trình bày phương pháp luận giúp các nhà nghiên cứu về hiểu biết đa văn hóa tạo ra dữ liệu mới phục vụ huấn luyện hệ thống mà không cần chuyên môn sâu về tiếng nói, tận dụng dữ liệu và công cụ mã nguồn mở. Kết quả chỉ ra rằng ngay cả với lượng dữ liệu tinh chỉnh tương đối nhỏ (30–200 giờ), hiệu năng nhận dạng tiếng nói có thể cải thiện đáng kể bằng Whisper và WhisperX khi có sẵn phụ đề thủ công. Đồng thời, **260 giờ dữ liệu** trên 4 ngôn ngữ (Quan Thoại, Hàn, Thổ Nhĩ Kỳ, Do Thái) đã được phát hành cho cộng đồng [25].

---

## Lời cảm ơn (Acknowledgment)
Tác giả cảm ơn GS. He He và GS. Kyunghyun Cho (NYU) cùng các sinh viên NYU thuộc chương trình CCU: Nikhil Verma, Sukrit Rao, Jash Rathod và Sriphani Bellamkonda.  
Hỗ trợ AI: ChatGPT 4.3 hỗ trợ định dạng bảng/hình vẽ và tối ưu I/O code; Claude Sonnet 4.6 đề xuất phương pháp bootstrap kiểm định ý nghĩa thống kê và chạy kiểm thử.

---

## Tài liệu tham khảo (References)

[1] O. Li, M. Subramanian, A. Saakyan, S. C.-W. Wang, and S. Muresan, “Normdial: A comparable bilingual synthetic dialogue dataset for modeling social norm adherence and violation,” in *Proceedings of EMNLP 2023*, pp. 15732–15744.  
[2] Y. R. Fung, T. Chakrabarty, H. Guo, O. Rambow, S. Muresan, and H. Ji, “Normsage: Multi-lingual multi-cultural norm discovery from conversations on-the-fly,” in *Proceedings of EMNLP 2023*, pp. 15217–15230.  
[3] S. C. Wang, O. Li, S. Muresan et al., “Normgenesis: A benchmark for generating and repairing social norm violations in dialogue,” in *Proceedings of ACL 2024*.  
[4] Y. Yuan, K. Tang, J. Shen, M. Zhang, and C. Wang, “Measuring social norms of large language models,” in *Findings of NAACL 2024*, pp. 650–699.  
[5] P. Sahu, A. Som, A. Divakaran, and D. Vergyri, “Minds: A cross-cultural dialogue corpus for social norm classification and adherence detection,” in *Findings of IJCNLP & AACL 2025*, pp. 2039–2052.  
[6] S. Pawar et al., “Survey of cultural awareness in language models: Text and beyond,” *Computational Linguistics*, vol. 51, no. 3, pp. 907–1004, 2025.  
[7] V. Srivastav et al., “Open asr leaderboard: Towards reproducible and transparent multilingual and long-form speech recognition evaluation,” *arXiv preprint arXiv:2510*, 2025.  
[8] A. Radford et al., “Robust speech recognition via large-scale weak supervision,” in *ICML*, PMLR, 2023, pp. 28492–28518.  
[9] M. Bain, J. Huh, T. Han, and A. Zisserman, “WhisperX: Time-Accurate Speech Transcription of Long-Form Audio,” in *Interspeech 2023*, pp. 4489–4493.  
[10] A. Plaquet and H. Bredin, “Powerset multi-class cross entropy loss for neural speaker diarization,” in *Proc. INTERSPEECH 2023*.  
[11] H. Bredin, “pyannote.audio 2.1 speaker diarization pipeline: principle, benchmark, and recipe,” in *Proc. INTERSPEECH 2023*.  
[12] GitHub Community, “Differences in large-v1, v2 v3 models? #338,” 2024.  
[13] DARPA, “CCU: Computational cultural understanding,” 2021.  
[14] “Youtube data api,” 2026.  
[15] “Paginating, sorting, and filtering with the youtube api,” 2026.  
[16] “Yt-dlp a feature-rich command-line audio/video downloader,” 2020.  
[17] S. Takamichi et al., “Jtubespeech: corpus of japanese speech collected from youtube for speech recognition and speaker verification,” 2021.  
[18] “How to read a wikipedia dump,” 2020.  
[19] “Web video text tracks format (webvtt),” 2025.  
[20] “Sctk, the nist scoring toolkit,” 2021.  
[21] Z. Song et al., “LoRA-Whisper: Parameter-Efficient and Extensible Multilingual ASR,” in *Interspeech 2024*, pp. 3934–3938.  
[22] M. Bisani and H. Ney, “Bootstrap estimates for confidence intervals in ASR performance evaluation,” in *Proc. IEEE ICASSP*, vol. 1, 2004, pp. 409–412.  
[23] O. Shapira, S. Chazan, and A. D. N. Cohen, “Measuring the effect of transcription noise on downstream language understanding tasks,” in *Proceedings of ACL 2025*, pp. 29978–30004.  
[24] B. Peskin et al., “Topic and speaker identification via large vocabulary continuous speech recognition,” in *Proc. HLT ’93*, pp. 119–124, 1993.  
[25] M. Picheny, “ccu-hf-data (revision 38103b7),” 2026, `https://huggingface.co/datasets/picheny/ccu-hf-data`.
