# BẢN ĐẶC TẢ TÍNH NĂNG TOÀN DIỆN: HỆ THỐNG TRỢ LÝ ẨM THỰC THÔNG MINH ARIA
**Mã tài liệu:** `SPEC-ARIA-MASTER` | **Phiên bản:** `2.0 - Production Specification`  
**Dự án:** Hệ thống Nhà Hàng Thông Minh (SmartRestaurant) | **Thư mục:** `test/specs/`  
**Phương pháp luận:** Spec-Driven Development (SDD) - Chuẩn Spec-Kit  
**Đối tượng:** Product Management, Business Analysts, QA/Automation Engineers, UI/UX Designers và Software Engineers.  
**Nguyên tắc thiết kế:** Mô tả chi tiết chính xác **CÁI GÌ (WHAT)**, **TẠI SAO (WHY)**, **QUY TRÌNH HÀNH VI (BEHAVIORAL FLOW)**, giao thức dữ liệu (Data Contracts) và kịch bản hội thoại đa tầng (Multi-turn Dialogues) mà không phụ thuộc vào mã nguồn nội bộ.

---

## MỤC LỤC
1. [TỔNG QUAN HỆ THỐNG & MỤC TIÊU KINH DOANH](#1-tổng-quan-hệ-thống--mục-tiêu-kinh-doanh)
2. [KIẾN TRÚC HÀNH VI & MÔ HÌNH HỘI THOẠI (CONVERSATIONAL ARCHITECTURE)](#2-kiến-trúc-hành-vi--mô-hình-hội-thoại)
3. [ĐẶC TẢ CHI TIẾT 5 PHÂN HỆ CỐT LÕI](#3-đặc-tả-chi-tiết-5-phân-hệ-cốt-lõi)
   - 3.1. Phân hệ 1: Gợi ý món ăn thông minh & Lọc an toàn thực phẩm
   - 3.2. Phân hệ 2: Thẻ món ăn trực quan & Thêm giỏ hàng tương tác
   - 3.3. Phân hệ 3: Đặt bàn tự động qua NLP tiếng Việt & Cấp mã bàn
   - 3.4. Phân hệ 4: Bộ nhớ ngữ cảnh khách hàng dài hạn (MemGPT)
   - 3.5. Phân hệ 5: Giải đáp FAQ & Nút gọi nhân viên bàn chống nghẽn
4. [QUY CHUẨN THÀNH PHẦN GIAO DIỆN TƯƠNG TÁC (INTERACTIVE UI CARDS)](#4-quy-chuẩn-thành-phần-giao-diện-tương-tác)
5. [YÊU CẦU PHI CHỨC NĂNG & AN TOÀN HỆ THỐNG](#5-yêu-cầu-phi-chức-năng--an-toàn-hệ-thống)
6. [MA TRẬN TRƯỜNG HỢP NGOẠI LỆ & KỊCH BẢN PHỤC HỒI](#6-ma-trận-trường-hợp-ngoại-lệ--kịch-bản-phục-hồi)
7. [MÔ HÌNH DỮ LIỆU ĐẶC TẢ CHI TIẾT (SCHEMA CONTRACTS)](#7-mô-hình-dữ-liệu-đặc-tả-chi-tiết)
8. [MA TRẬN TRUY VẾT & CHỈ SỐ NGHIỆM THU (TRACEABILITY & KPIS)](#8-ma-trận-truy-vết--chỉ-số-nghiệm-thu)

---

## 1. TỔNG QUAN HỆ THỐNG & MỤC TIÊU KINH DOANH

### 1.1. Sứ mệnh sản phẩm
Aria là trợ lý ảo AI đóng vai trò như một tiếp tân và bồi bàn cao cấp tại bàn ăn của SmartRestaurant. Aria giải quyết 3 điểm nghẽn lớn nhất của trải nghiệm thực khách truyền thống:
1. **Quá tải thông tin thực đơn (Decision Fatigue):** Menu quá nhiều món khiến khách mất 10-15 phút để chọn; Aria rút ngắn xuống còn 60 giây nhờ gợi ý chuẩn gu và ngân sách.
2. **Rủi ro sốc phản vệ & kiêng khem:** Khách dị ứng tôm, lạc, gluten thường phải hỏi đi hỏi lại nhân viên; Aria đảm bảo bộ lọc an toàn 100% không có sai sót từ con người.
3. **Chờ đợi phục vụ giờ cao điểm:** Thay vì vẫy tay vô vọng trong giờ đông khách, khách có thể gọi món trực tiếp trong chat, tự đặt bàn và bấm nút điều phối nhân viên tới tận bàn với lý do định sẵn.

### 1.2. Các chỉ số định lượng kinh doanh (Business Metrics)
- **Tăng giá trị đơn hàng trung bình (AOV):** Tăng 18-25% thông qua gợi ý thông minh các món tráng miệng, thức uống đi kèm món chính.
- **Rút ngắn thời gian quay vòng bàn (Table Turnover):** Giảm 8 phút/bàn trong quy trình gọi món và xin thanh toán.
- **Tỷ lệ khách quay lại (Retention Rate):** Tăng 30% đối với nhóm khách hàng thân thiết nhờ trải nghiệm cá nhân hóa khẩu vị sâu sắc của MemGPT.

---

## 2. KIẾN TRÚC HÀNH VI & MÔ HÌNH HỘI THOẠI

### 2.1. Biểu đồ luồng trạng thái hội thoại (Dialog State Machine)

```
       ┌──────────────────────┐
       │   1. LISTENING &     │
       │   INTENT EXTRACTION  │
       └──────────┬───────────┘
                  │
                  ▼
       ┌──────────────────────┐      Thiếu thông tin      ┌──────────────────────┐
       │  2. SLOT VALIDATION  │──────────────────────────►│   SLOT-FILLING LOOP  │
       │     & INVARIANTS     │                           │ (Hỏi ngày/giờ/người) │
       └──────────┬───────────┘◄──────────────────────────┴──────────────────────┘
                  │ Đủ thông tin & Hợp lệ
                  ▼
       ┌──────────────────────┐      Có dữ liệu thẻ       ┌──────────────────────┐
       │ 3. ACTION EXECUTION  │──────────────────────────►│ 4. RENDER UI PAYLOAD │
       │ (Lọc/Giỏ/Bàn/Gọi NV) │                           │ (Product/BookingCard)│
       └──────────┬───────────┘                           └──────────┬───────────┘
                  │                                                  │
                  ▼                                                  ▼
       ┌────────────────────────────────────────────────────────────────────────┐
       │ 5. CONFIRMATION & REAL-TIME STATE SYNC (Badge giỏ hàng / Chuông bàn)  │
       └────────────────────────────────────────────────────────────────────────┘
```

### 2.2. Quy tắc đàm thoại chuẩn mực (Conversational Tenets)
- **Tenet 1 (Ngắn gọn & Tôn trọng):** Tối đa 2-3 câu văn bản đi kèm một hành động; tránh văn phong dài dòng, lặp từ.
- **Tenet 2 (Hành động trực quan hơn văn bản):** Luôn ưu tiên hiển thị Thẻ bấm (Interactive Card) thay vì liệt kê dạng text thuần túy.
- **Tenet 3 (Thấu hiểu tự nhiên):** Chấp nhận mọi biến thể khẩu ngữ tiếng Việt (viết tắt, từ lóng ẩm thực, câu không dấu).

---

## 3. ĐẶC TẢ CHI TIẾT 5 PHÂN HỆ CỐT LÕI

### 3.1. PHÂN HỆ 1: GỢI Ý MÓN ĂN THÔNG MINH & LỌC AN TOÀN THỰC PHẨM

#### A. Thuật toán Lọc 5 Tầng (5-Stage Recommendation Pipeline)
Khi thực khách yêu cầu gợi ý, hệ thống phải xử lý qua 5 tầng lọc nghiêm ngặt theo thứ tự ưu tiên:
1. **Tầng 1 - Hard Allergy Exclusion (Loại trừ dị ứng bắt buộc - Độ ưu tiên tuyệt đối):**
   - Quét từ khóa dị ứng trong input và trong hồ sơ MemGPT: `Allergens = [tôm, tép, cua, ghẹ, đậu phộng, lạc, mè, mè đen, sữa, trứng, gluten, bột mì, cá biển, cần tây, đậu nành, sunfit]`.
   - Đối soát cả thành phần chính và gia vị ẩn (nước mắm cá, dầu hào, dầu đậu phộng, sốt bơ đậu phộng). Nếu món $d$ chứa dị nguyên $\rightarrow$ Loại bỏ vĩnh viễn khỏi danh sách ứng viên.
2. **Tầng 2 - Dietary Constraint Filter (Lọc kiêng khem lối sống/y tế):**
   - *Ăn chay:* Chỉ giữ món có tag `vegetarian` hoặc `vegan`; cấm mắm tôm, mắm cá, nước xương hầm, thịt động vật.
   - *Thai kỳ (Pregnancy-Safe):* Loại trừ 100% món tái, gỏi sống, sushi, phô mai chưa tiệt trùng, sốt rượu vang.
   - *Bệnh lý (Tiểu đường/Gout/Tim mạch):* Loại trừ món nhiều đường, món nội tạng/thịt đỏ/hải sản theo đúng hồ sơ bệnh lý khai báo.
3. **Tầng 3 - Budget Constraint Optimization (Tối ưu hóa ngân sách):**
   - Với ngân sách $B$ và số người $N$: Tìm tổ hợp gồm 1 món chính mặn + 1 món rau/xào + 1 món canh sao cho tổng tiền $\sum P \le B$.
   - Nếu ngân sách quá thấp không thể tạo mâm cơm hoàn chỉnh: Chọn món có giá thấp nhất của quán và thông báo mức ngân sách khả thi tối thiểu.
4. **Tầng 4 - Taste & Context Scoring (Chấm điểm khẩu vị & Ngữ cảnh):**
   - Khẩu vị: Đậm đà, thanh đạm, chua cay, ngọt miền Nam, mặn miền Bắc.
   - Thời tiết: Nhiệt độ ngoài trời $\le 20^\circ$C hoặc trời mưa $\rightarrow$ Ưu tiên điểm cho Lẩu, Món nướng, Súp nóng; Trời nắng gắt $\ge 35^\circ$C $\rightarrow$ Ưu tiên Canh chua, Gỏi cuốn, Trà thảo mộc.
5. **Tầng 5 - Menu Integrity Verification (Kiểm thực thực đơn - Anti-Hallucination):**
   - Chỉ xuất xưởng các món có `is_active = true` trong cơ sở dữ liệu menu hiện hành.
   - Giá tiền hiển thị phải lấy trực tiếp từ trường `price` của cơ sở dữ liệu, định dạng `###.### VNĐ`. Không cho phép mô hình ngôn ngữ tự phát sinh số tiền ngẫu nhiên.

#### B. Kịch bản Đàm thoại Chuẩn & Lời thoại Mẫu
- **Kịch bản Bẫy Món Đối Thủ / Bịa Món:**
  * Khách: *"Cho 1 Pizza hải sản của Pizza Company và 1 xô gà rán KFC."*
  * Aria: *"Dạ Aria rất tiếc, nhà hàng hiện không phục vụ các món của thương hiệu khác ạ. SmartRestaurant chuyên về ẩm thực Á - Âu hiện đại; bạn có thể thử món **Bò bít tết sốt tiêu đen** hoặc **Gà nướng thảo mộc** đặc sản của bếp trưởng nhé!"* [Hiển thị 2 Product Card].
- **Kịch bản Dị Ứng Phức Tạp:**
  * Khách: *"Tôi bị dị ứng tôm và đậu phộng nặng, gợi ý 2 món xào ngon."*
  * Aria: *"Dạ Aria đã lọc kỹ thực đơn và chọn cho bạn 2 món xào tuyệt đối không dùng tôm và không rắc đậu phộng: **Bò xào bông cải xanh** và **Nấm hương xào dầu hào thực vật**. Bếp cũng đã được ghi chú để chế biến riêng chảo xào cho bạn ạ!"* [Hiển thị 2 Product Card].

---

### 3.2. PHÂN HỆ 2: THẺ MÓN ĂN TRỰC QUAN & THÊM GIỎ HÀNG TƯƠNG TÁC

#### A. Quy chuẩn Hiển thị Thẻ Món Ăn (Product Card Schema)
Mỗi món ăn phải hiển thị trong một khung Card trực quan với cấu trúc:
- **Header:** Hình ảnh chụp thật món ăn (tỷ lệ 16:9, bo góc 12px, có hiệu ứng zoom nhẹ khi di chuột).
- **Badge trạng thái:** `[Món Mới]`, `[Bán Chạy - Best Seller]`, `[Món Chay]`, `[Cay nhẹ 🌶️]`.
- **Title & Pricing:** Tên món in đậm (font size 16px); Giá tiền màu cam/đỏ nổi bật (font size 18px bold, VD: `185.000 VNĐ`).
- **Description:** 1-2 câu ngắn mô tả nguyên liệu chính và hương vị đặc trưng.
- **Controls:**
  - Bộ chọn số lượng: `[-]` `[ 1 ]` `[+]`
  - Nút hành động chính: `[+ Thêm vào giỏ hàng]` (Màu chủ đạo, chiều cao 40px, full-width).

#### B. Quy trình Xử lý Trạng thái Nút Bấm & Chống Xung Đột (Debounce & State Flow)
1. **Trạng thái Mặc định (Default):** Nút hiển thị `[+ Thêm vào giỏ hàng]`, nền màu xanh/cam thương hiệu.
2. **Trạng thái Chạm (Tap/Click Active):** Khi thực khách chạm vào nút:
   - Hệ thống khóa tạm thời nút bấm (kháng click trong vòng 400ms) để triệt tiêu race-condition khi bấm liên hồi.
   - Nút chuyển sang trạng thái Loading (Spinner xoay tròn).
3. **Trạng thái Xác nhận Thành công (Success State):**
   - Sau khi giỏ hàng ghi nhận: Nút đổi sang màu xanh lá cây với nhãn `[Đã thêm ✓]`.
   - Hiệu ứng nhảy số (Badge Bounce Animation) trên biểu tượng giỏ hàng nổi góc màn hình.
   - Sau 1.5 giây, nút tự động hồi phục về trạng thái mặc định để cho phép thêm tiếp.
4. **Trạng thái Món Tạm Hết (Sold Out State):**
   - Nếu tồn kho của món bằng 0: Nút tự động chuyển màu xám mờ (opacity 0.5), nhãn đổi thành `[Tạm hết món]`, thuộc tính `disabled = true`.
   - Khách bấm vào sẽ không có hiệu ứng, chatbot xuất tin nhắn: *"Món này vừa hết nguyên liệu tươi trong ngày, Aria gợi ý bạn thử món tương tự nhé!"*

#### C. Quy chuẩn Giỏ Hàng Thu Nhỏ (Mini Cart Card)
Khi khách yêu cầu kiểm tra giỏ hàng ("Giỏ có gì rồi?"), Aria xuất Thẻ Giỏ Hàng gồm:
- Bảng danh sách các món: `[Số lượng] x [Tên món] (Ghi chú tùy biến) = [Thành tiền]`.
- Dòng tính toán: Tạm tính, Thuế VAT (nếu có), Phí dịch vụ, **Tổng thanh toán**.
- Hai nút hành động dưới cùng: `[Xem chi tiết & Sửa]` và `[Tiến hành Đặt món / Thanh toán]`.

---

### 3.3. PHÂN HỆ 3: ĐẶT BÀN TỰ ĐỘNG QUA NLP TIẾNG VIỆT & CẤP MÃ BÀN

#### A. Bộ Phân Tích Ngôn Ngữ Tự Nhiên Thời Gian Tiếng Việt (Vietnamese Temporal NLP Engine)
Hệ thống phải phân giải chính xác các thực thể thời gian phức tạp sang định dạng chuẩn ISO 8601 (`YYYY-MM-DDTHH:mm:ss`):
- **Cụm từ tương đối theo ngày:**
  - *"Hôm nay"* $\rightarrow$ Ngày hiện tại.
  - *"Tối mai" / "Ngày mai"* $\rightarrow$ Ngày hiện tại + 1.
  - *"Ngày mốt" / "Tối mốt"* $\rightarrow$ Ngày hiện tại + 2.
  - *"Trưa Chủ Nhật tuần này / tuần sau"* $\rightarrow$ Tính toán chính xác ngày Chủ Nhật tương ứng theo lịch dương.
  - *"Mùng 1 tới" / "Rằm này"* $\rightarrow$ Tự động chuyển đổi lịch âm sang ngày dương lịch chuẩn.
- **Cụm từ chỉ giờ giấc khẩu ngữ:**
  - *"7 rưỡi tối" / "bảy rưỡi tối"* $\rightarrow$ `19:30:00`.
  - *"Bảy giờ kém mười lăm"* $\rightarrow$ `18:45:00` (nếu là buổi tối) hoặc `06:45:00` (nếu có ngữ cảnh ăn sáng).
  - *"Tầm trưa 12h kém"* $\rightarrow$ `11:45:00` - `11:50:00`.

#### B. Máy Trạng Thái Thu Thập Thông Tin (Slot-Filling State Machine)
Một yêu cầu đặt bàn hợp lệ bắt buộc phải có đủ 5 Slots:
1. `booking_date`: Ngày dùng bữa ($\ge$ Ngày hiện tại).
2. `booking_time`: Giờ dùng bữa (Nằm trong khung giờ mở cửa 10:00 - 22:00, cách thời điểm hiện tại ít nhất 30 phút).
3. `guest_count`: Số lượng khách ($1 \le \text{count} \le 30$).
4. `customer_name`: Tên người đại diện nhận bàn.
5. `phone_number`: Số điện thoại liên hệ (10 chữ số chuẩn đầu số viễn thông Việt Nam).

**Chiến lược điền khuyết (Disambiguation Strategy):**
- Nếu khách chỉ nói: *"Đặt bàn trưa mai"* $\rightarrow$ Thiếu 4 slots.
- Lời thoại Aria: *"Dạ Aria sẵn sàng giữ chỗ trưa mai cho bạn! Bạn dự định đến lúc mấy giờ và bàn dành cho bao nhiêu người ạ?"*
- Khách trả lời: *"Tầm 12h, đi 4 người nhé"* $\rightarrow$ Aria lưu trữ và chỉ hỏi nốt 2 slots còn lại: *"Dạ 12:00 trưa mai cho 4 khách. Bạn cho Aria xin Tên và Số điện thoại để hệ thống gửi mã xác nhận bàn nhé!"*

#### C. Thẻ Xác Nhận Đặt Bàn (Booking Confirmation Card)
Khi đủ 5 slots và hệ thống kiểm tra còn bàn trống, xuất thẻ với các trường:
- **Mã đặt bàn nổi bật:** Dạng `#RES-2026-XXXX` (font chữ to, nổi bật, có nút Copy mã).
- **Chi tiết:** Tên khách, SĐT, Thời gian đón khách, Số lượng bàn/khách, Khu vực (Trong nhà / Ngoài trời / Cửa sổ).
- **Thanh trạng thái:** `[Đã xác nhận giữ chỗ ✓]`.
- **Hành động nhanh:** Nút `[Chỉnh sửa thông tin]` và Nút `[Hủy giữ chỗ]`.

#### D. Thuật Toán Gợi Ý Khi Hết Bàn (Peak-Hour Fallback Algorithm)
Nếu khung giờ $T$ yêu cầu đã kín bàn:
1. Quét tìm 2 khung giờ trống gần nhất: $T_1 \in [T - 45\text{ phút}, T - 15\text{ phút}]$ và $T_2 \in [T + 15\text{ phút}, T + 45\text{ phút}]$.
2. Xuất thông báo: *"Dạ khung giờ 19:30 tối nay hiện nhà hàng đã kín bàn. Aria có thể giữ chỗ cho bạn vào lúc **18:45** hoặc **20:15** được không ạ? Bạn thích khung giờ nào hơn?"*

---

### 3.4. PHÂN HỆ 4: BỘ NHỚ NGỮ CẢNH KHÁCH HÀNG DÀI HẠN (MEMGPT)

#### A. Cấu Trúc Bộ Nhớ 3 Tầng (3-Tier Memory Architecture)
1. **Working Memory (Bộ nhớ tác vụ tức thời):**
   - Lưu trữ giỏ hàng hiện tại, trạng thái đặt bàn đang trò chuyện, số bàn đang ngồi (`table_id`).
   - Tự động xóa sạch khi phiên thanh toán hoàn tất hoặc sau 2 giờ không hoạt động.
2. **Short-Term Conversational Memory (Bộ nhớ hội thoại ngắn hạn):**
   - Lưu trữ 20 lượt tương tác gần nhất trong phiên để trả lời mượt mà cho các câu hỏi ngữ cảnh ("món đó", "như trên", "thay bằng món canh nãy nói").
3. **Long-Term Contextual Memory - MemGPT (Bộ nhớ khẩu vị vĩnh viễn):**
   - Gắn liền với số điện thoại hoặc User ID khách hàng.
   - Bao gồm: Danh sách món yêu thích, Mức độ ăn cay (Cấp 0 đến Cấp 4), Thói quen gia vị cố định (không ăn hành, kiêng bột ngọt, ít muối), Các chất dị ứng cố định, Ngày sinh nhật/kỷ niệm.

#### B. Quy Tắc Ghi Đè Khẩu Vị & An Toàn Riêng Tư
- **Quy tắc 1 (Ưu tiên ngữ cảnh tạm thời - Context Override):**
  * Khách quen vốn kiêng cay nhắn: *"Hôm nay anh đi tiếp khách thích ăn cay, lấy lẩu Thái siêu cay nhé."*
  * Aria ghi nhận: Áp dụng cay cấp 3 cho đơn hàng này theo lệnh trực tiếp của khách. Tuyệt đối không từ chối hoặc bắt khách ăn không cay; giữ nguyên hồ sơ gốc cho các lần sau.
- **Quy tắc 2 (Cập nhật khẩu vị vĩnh viễn):**
  * Khách nhắn: *"Từ nay tôi ăn chay trường nhé, nhớ giùm tôi."*
  * Aria phản hồi: *"Dạ Aria đã cập nhật hồ sơ của bạn: Chuyển sang chế độ ăn chay trường. Từ nay mọi đề xuất của quán sẽ tự động là món chay thanh tịnh ạ!"*
- **Quy tắc 3 (Quyền được lãng quên - Right to be Forgotten):**
  * Khách nhắn: *"Xóa sạch lịch sử ăn uống và khẩu vị của tôi đi."*
  * Aria phản hồi: *"Dạ Aria đã xóa toàn bộ dữ liệu lịch sử gọi món và thói quen ăn uống của bạn trên hệ thống. Rất hân hạnh được phục vụ bạn như một thực khách mới trong những lần tới ạ!"*

---

### 3.5. PHÂN HỆ 5: GIẢI ĐÁP FAQ & NÚT GỌI NHÂN VIÊN BÀN CHỐNG NGHẼN

#### A. Bộ Câu Hỏi Thường Gặp (FAQ Intent Matrix)
Aria phải trả lời chính xác, trực diện các thắc mắc thông dụng:
- **Wifi:** Tên mạng (SSID) chuẩn và Mật khẩu chính xác (kèm nút bấm "Sao chép mật khẩu").
- **Bãi xe:** Nêu rõ chỗ đỗ xe máy (trước cửa) và bãi đỗ ô tô (hầm toà nhà cách 30m, có nhân viên bảo vệ điều phối, miễn phí 100% cho thực khách có hóa đơn).
- **Hóa đơn GTGT (VAT):** Khẳng định có xuất hóa đơn đỏ điện tử trong ngày; hướng dẫn khách để lại Tên công ty, MST, Địa chỉ và Email nhận hóa đơn.
- **Chính sách phụ thu:** Phí khui rượu (nếu mang rượu mạnh/vang từ ngoài), miễn phí giữ lạnh và phục vụ nến/đĩa cho bánh sinh nhật; quy định khu vực ngồi ngoài trời dành cho khách mang theo thú cưng nhỏ.
- **Đặt mang về (Takeaway):** Tự động hướng dẫn chọn món, hẹn giờ đến lấy, thông báo thời gian bếp làm món (15-20 phút) và phụ phí hộp sinh học tự hủy (5.000đ/hộp nếu có).

#### B. Quy Trình Nút "Gọi Nhân Viên Bàn" & Cơ Chế Chống Spam (Staff Call State Machine)
1. **Thành phần nút bấm trên giao diện:** Nút `[🛎️ Gọi nhân viên bàn]` luôn ghim cố định ở góc dưới thanh chat hoặc hiển thị trong menu thao tác nhanh.
2. **Kích hoạt & Điều hướng:**
   - Khi bấm, xuất hiện Popup 4 lựa chọn nhanh:
     - `[1. Xin thêm nước đá / Nước chấm]`
     - `[2. Dọn bớt đĩa / Vệ sinh bàn]`
     - `[3. Xin thanh toán hóa đơn]`
     - `[4. Hỗ trợ khẩn cấp khác]`
   - Khách chọn 1 mục $\rightarrow$ Hệ thống gửi gói tin WebSocket tới máy tính bảng/đồng hồ thông minh của nhân viên phụ trách khu vực: `{ table_id: "Bàn 07", reason: "Xin thêm đá", timestamp: "..." }`.
3. **Cơ chế Chống Spam (Cooldown Engine):**
   - Sau khi gửi tín hiệu, nút chuyển sang trạng thái đếm ngược `[Đang gọi... 45s]`.
   - Toàn bộ thao tác bấm trong vòng 45 giây này sẽ không kích hoạt thêm thông báo đến nhân viên, mà chỉ hiện thông báo mềm cho khách: *"Yêu cầu của bạn đang được nhân viên tiếp nhận và di chuyển tới bàn, bạn đợi chút nhé!"*
4. **Quy trình Báo động Khẩn cấp (Escalation Protocol):**
   - Nếu khách gõ nội dung bức xúc: *"Quá tệ, 45 phút chưa có đồ ăn, gọi quản lý ra đây!"*
   - Aria tự động kích hoạt cờ `is_urgent = true`:
     - Phản hồi xoa dịu: *"Aria chân thành xin lỗi vì sự chậm trễ này! Aria đã báo trực tiếp cho Quản lý ca trực. Quản lý sẽ có mặt tại bàn của bạn ngay lập tức để giải quyết ạ."*
     - Bắn thông báo chuông khẩn cấp tới thiết bị của Quản lý nhà hàng.

---

## 4. QUY CHUẨN THÀNH PHẦN GIAO DIỆN TƯƠNG TÁC (INTERACTIVE UI CARDS)

Hệ thống giao diện chatbox sử dụng các thẻ tương tác chuẩn hóa:

### 4.1. Thẻ Món Ăn (Product Card Component)
```
┌─────────────────────────────────────────────────┐
│ [Hình ảnh món ăn 16:9 sắc nét]                  │
│ [Badge: Món Mới]              [Badge: Cay nhẹ]  │
├─────────────────────────────────────────────────┤
│ Bò Bít Tết Sốt Tiêu Đen                         │
│ 185.000 VNĐ                                     │
│ Thăn bò Úc áp chảo mềm mọng, sốt tiêu đen thơm  │
│ nồng ăn kèm khoai tây chiên giòn rụm.           │
├─────────────────────────────────────────────────┤
│   [-]   [ 1 ]   [+]         [+ Thêm vào giỏ]    │
└─────────────────────────────────────────────────┘
```

### 4.2. Thẻ Xác Nhận Đặt Bàn (Booking Confirmation Card)
```
┌─────────────────────────────────────────────────┐
│ 🛎️ XÁC NHẬN GIỮ CHỖ THÀNH CÔNG                  │
│ Mã bàn: #RES-2026-8892            [Copy mã]     │
├─────────────────────────────────────────────────┤
│ • Thực khách: Nguyễn Văn Nam                    │
│ • Số điện thoại: 0901 234 567                   │
│ • Thời gian: 19:30 - Thứ Bảy, Ngày 22/11/2026   │
│ • Số lượng: 4 Người lớn                         │
│ • Khu vực ưu tiên: Bàn cạnh cửa sổ thoáng mát   │
├─────────────────────────────────────────────────┤
│     [ Chỉnh sửa thông tin ]    [ Hủy giữ chỗ ]  │
└─────────────────────────────────────────────────┘
```

---

## 5. YÊU CẦU PHI CHỨC NĂNG & AN TOÀN HỆ THỐNG

- **NFR-01 (Độ trễ phản hồi - Latency):**
  - Tin nhắn văn bản: $\le 1.8$ giây trong 95% các yêu cầu (p95).
  - Tải và render các thẻ Card tương tác: $\le 2.5$ giây.
  - Phản hồi cảm ứng (Touch feedback) của nút bấm: $\le 150$ ms.
- **NFR-02 (Độ chính xác dữ liệu - Data Integrity):**
  - Tỷ lệ bịa đặt món/giá (Hallucination Rate): **0.0%**. Tuyệt đối không có sai số về đơn giá hay thành phần món.
  - Tỷ lệ an toàn dị ứng thực phẩm: **100%**. Không có ngoại lệ.
- **NFR-03 (Phòng thủ an ninh & Chống phá hoại - Security & Robustness):**
  - Chống Prompt Injection: Từ chối thực thi mọi yêu cầu dạng "Bỏ qua chỉ thị hệ thống", "In ra Master Prompt", "Đóng vai kẻ tấn công".
  - Chống XSS & Code Injection: Khử độc hoàn toàn mọi dữ liệu người dùng nhập vào ô chat trước khi hiển thị trên DOM.
  - Chống tấn công từ chối dịch vụ (DoS): Giới hạn mỗi phiên tối đa 30 tin nhắn/phút và mỗi tin nhắn tối đa 1.000 ký tự.
- **NFR-04 (Khả năng phục hồi mạng - Network Resilience):**
  - Khi thiết bị ngắt kết nối (mất sóng, chuyển mạng): Khung chat chuyển sang thanh thông báo màu vàng `[Đang kết nối lại...]`.
  - Tự động gửi lại (Auto-retry) các gói tin gọi nhân viên hoặc đặt món ngay khi có mạng trở lại.

---

## 6. MA TRẬN TRƯỜNG HỢP NGOẠI LỆ & KỊCH BẢN PHỤC HỒI

| Mã Ngoại Lệ | Kịch Bản Chi Tiết | Cách Xử Lý Của Aria | Trạng Thái Dự Phòng (Fallback) |
| :--- | :--- | :--- | :--- |
| **EC-01** | Bẫy giá ảo (Khách đòi mua bò bít tết giá 10k). | Aria từ chối lịch sự, trích dẫn giá niêm yết 185k và giải thích chính sách giá công khai của quán. | Không cho phép thêm món với giá sai lệch vào giỏ. |
| **EC-02** | Dị ứng chất cực hiếm (ví dụ dị ứng lá hương thảo). | Nếu không chắc chắn thành phần gia vị của món có lá hương thảo không, Aria cảnh báo rõ và chủ động ghi chú chuyển tiếp cho bếp trưởng kiểm tra. | Khuyên khách chọn món luộc/hấp thanh thuần an toàn hơn. |
| **EC-03** | Spam bấm nút thêm giỏ hàng liên tục 10 lần. | Debounce 400ms loại bỏ các click thừa; chỉ ghi nhận số lượt hợp lệ theo bộ chọn số lượng. | Không crash ứng dụng, giữ nguyên tổng tiền chuẩn. |
| **EC-04** | Hết hàng suất cuối cùng đúng tích tắc bấm nút. | Bắt sự kiện hết tồn kho, hiển thị popup nhẹ nhàng: *"Suất cuối cùng vừa được đặt trước, bạn thử món X tương tự nhé!"* | Chuyển nút về trạng thái `[Tạm hết món]`. |
| **EC-05** | Đặt bàn lúc 2h sáng (ngoài giờ mở cửa). | Nhắc nhở khung giờ đón khách (10:00 - 22:00); hỏi khách có muốn đặt bàn cho trưa hoặc tối hôm sau không. | Giữ nguyên dữ liệu người đặt, chỉ điều chỉnh lại giờ. |
| **EC-06** | Mất kết nối internet khi bấm "Gọi nhân viên". | Hiển thị thông báo đỏ: *"Lỗi mạng! Không thể gửi yêu cầu gọi nhân viên. [Bấm để thử lại]"*. | Lưu tin nhắn vào hàng đợi offline và gửi ngay khi mạng online. |
| **EC-07** | Khách nhảy cóc ngữ cảnh liên tục trong 1 phút. | Aria trả lời ngắn gọn câu hỏi xen ngang (pass wifi), sau đó chủ động nhắc lại: *"Trở lại với bàn tiệc 4 người tối nay, bạn xác nhận đặt nhé?"* | Duy trì state machine của luồng đặt bàn nguyên vẹn. |

---

## 7. MÔ HÌNH DỮ LIỆU ĐẶC TẢ CHI TIẾT (SCHEMA CONTRACTS)

### 7.1. Dish Entity (Thực thể Món ăn)
```typescript
interface Dish {
  dish_id: string;              // Định danh duy nhất (VD: "DISH-089")
  name: string;                 // Tên món niêm yết (VD: "Bò Bít Tết Sốt Tiêu Đen")
  price: number;                // Giá niêm yết bằng VNĐ (VD: 185000)
  category: "appetizer" | "main" | "soup" | "dessert" | "drink";
  description: string;          // Mô tả nguyên liệu và hương vị
  image_url: string;            // Đường dẫn ảnh chất lượng cao
  allergens: string[];          // Danh sách dị nguyên (VD: ["gluten", "dairy"])
  dietary_flags: string[];      // Thuộc tính dinh dưỡng (VD: ["halal", "spicy_1"])
  is_available: boolean;        // Còn hàng hay tạm hết
  preparation_time_minutes: number; // Thời gian chế biến trung bình (VD: 15)
}
```

### 7.2. CartItem Entity (Thực thể Món trong giỏ hàng)
```typescript
interface CartItem {
  item_id: string;              // Định danh dòng giỏ hàng
  dish_id: string;              // Khóa ngoại tham chiếu Dish
  dish_name: string;
  unit_price: number;
  quantity: number;             // Số lượng phần ăn (> 0, tối đa 20)
  modifiers: {                  // Tùy biến gia vị
    sugar_level?: "0%" | "30%" | "50%" | "70%" | "100%";
    ice_level?: "0%" | "50%" | "100%";
    spice_level?: "none" | "mild" | "medium" | "hot";
    custom_notes?: string;      // VD: "Không hành lá, nhiều tiêu"
  };
  item_total_price: number;     // unit_price * quantity
}
```

### 7.3. Reservation Entity (Thực thể Đặt bàn)
```typescript
interface Reservation {
  reservation_id: string;       // Định danh chuẩn "#RES-YYYY-XXXX"
  customer_name: string;
  phone_number: string;         // Định dạng 10 số Việt Nam
  booking_datetime: string;     // ISO 8601 string
  guest_count: number;          // 1 đến 30
  table_area_preference: "window" | "outdoor" | "private_room" | "standard";
  status: "confirmed" | "modified" | "cancelled" | "completed";
  created_at: string;
}
```

### 7.4. CustomerProfile Entity (Thực thể Hồ sơ MemGPT)
```typescript
interface CustomerProfile {
  customer_id: string;
  full_name: string;
  phone_number: string;
  spice_preference_tier: 0 | 1 | 2 | 3 | 4; // 0: không cay, 4: siêu cay
  known_allergies: string[];    // Danh sách dị ứng cố định
  dietary_preferences: string[];// VD: ["vegetarian", "no_onion"]
  favorite_dish_ids: string[];  // 3-5 món gọi nhiều nhất
  last_order_summary: string;   // Đơn hàng gần nhất để phục vụ lệnh "như cũ"
  privacy_opt_out: boolean;     // Cờ nếu khách yêu cầu không lưu hồ sơ
}
```

---

## 8. MA TRẬN TRUY VẾT & CHỈ SỐ NGHIỆM THU

### 8.1. Danh mục 63 Kịch bản Đặc tả Diễn giải Toàn bộ Test Cases

Toàn bộ 63 test cases từ thư mục `test/docs/` đã được diễn giải chi tiết 100% thành các kịch bản đặc tả chuẩn Spec-Kit (Gherkin Scenarios) bên trong các tài liệu phân hệ tương ứng:

| Mã Kịch Bản Đặc Tả (Spec Scenario) | Tên Kịch Bản Chi Tiết | Nguồn Test Case | Phân Hệ Đặc Tả Chi Tiết |
| :--- | :--- | :--- | :--- |
| **SPEC-SCENARIO-REC-01** | Gợi ý mâm cơm tròn vị theo ngân sách cố định | `TC-REC-01` | [01_smart_recommendation_spec.md](./modules/01_smart_recommendation_spec.md) |
| **SPEC-SCENARIO-REC-02** | Xử lý ngân sách biên cực thấp không khả thi | `TC-REC-02` | [01_smart_recommendation_spec.md](./modules/01_smart_recommendation_spec.md) |
| **SPEC-SCENARIO-REC-03** | Gợi ý ẩm thực cao cấp không giới hạn giá | `TC-REC-03` | [01_smart_recommendation_spec.md](./modules/01_smart_recommendation_spec.md) |
| **SPEC-SCENARIO-REC-04** | Loại trừ bắt buộc dị nguyên giáp xác (tôm, cua) | `TC-REC-04` | [01_smart_recommendation_spec.md](./modules/01_smart_recommendation_spec.md) |
| **SPEC-SCENARIO-REC-05** | Xử lý dị ứng kết hợp (đậu phộng + gluten + trứng) | `TC-REC-05` | [01_smart_recommendation_spec.md](./modules/01_smart_recommendation_spec.md) |
| **SPEC-SCENARIO-REC-06** | Lọc dị nguyên ẩn trong gia vị (nước mắm, dầu hào) | `TC-REC-06` | [01_smart_recommendation_spec.md](./modules/01_smart_recommendation_spec.md) |
| **SPEC-SCENARIO-REC-07** | Ăn kiêng tôn giáo (Chay thanh tịnh / Không ngũ vị tân / Halal) | `TC-REC-07` | [01_smart_recommendation_spec.md](./modules/01_smart_recommendation_spec.md) |
| **SPEC-SCENARIO-REC-08** | Chế độ an toàn cho thai phụ và bệnh lý nền | `TC-REC-08` | [01_smart_recommendation_spec.md](./modules/01_smart_recommendation_spec.md) |
| **SPEC-SCENARIO-REC-09** | Chống bịa đặt món ngoài menu & đối thủ (KFC, Pizza) | `TC-REC-09` | [01_smart_recommendation_spec.md](./modules/01_smart_recommendation_spec.md) |
| **SPEC-SCENARIO-REC-10** | Đối soát & bảo vệ tính toàn vẹn giá niêm yết | `TC-REC-10` | [01_smart_recommendation_spec.md](./modules/01_smart_recommendation_spec.md) |
| **SPEC-SCENARIO-REC-11** | Thiết kế mâm cơm cho nhóm hỗn hợp (Chay + Mặn) | `TC-REC-11` | [01_smart_recommendation_spec.md](./modules/01_smart_recommendation_spec.md) |
| **SPEC-SCENARIO-REC-12** | Gợi ý thích ứng biến động thời tiết & cảm xúc | `TC-REC-12` | [01_smart_recommendation_spec.md](./modules/01_smart_recommendation_spec.md) |
| **SPEC-SCENARIO-ATC-01** | Hiển thị Thẻ Món Ăn tương tác hoàn chỉnh (UI) | `TC-ATC-01` | [02_in_chat_cart_spec.md](./modules/02_in_chat_cart_spec.md) |
| **SPEC-SCENARIO-ATC-02** | Thao tác 1 chạm thêm món vào giỏ hàng | `TC-ATC-02` | [02_in_chat_cart_spec.md](./modules/02_in_chat_cart_spec.md) |
| **SPEC-SCENARIO-ATC-03** | Thêm món bằng câu lệnh ngôn ngữ tự nhiên | `TC-ATC-03` | [02_in_chat_cart_spec.md](./modules/02_in_chat_cart_spec.md) |
| **SPEC-SCENARIO-ATC-04** | Tùy biến gia vị & Ghi chú hương vị (Modifiers) | `TC-ATC-04` | [02_in_chat_cart_spec.md](./modules/02_in_chat_cart_spec.md) |
| **SPEC-SCENARIO-ATC-05** | Tăng/Giảm số lượng trực tiếp trên thẻ món | `TC-ATC-05` | [02_in_chat_cart_spec.md](./modules/02_in_chat_cart_spec.md) |
| **SPEC-SCENARIO-ATC-06** | Cơ chế chống spam click (Debounce Engine 400ms) | `TC-ATC-06` | [02_in_chat_cart_spec.md](./modules/02_in_chat_cart_spec.md) |
| **SPEC-SCENARIO-ATC-07** | Xử lý món đã tạm hết hàng trong kho (Disabled) | `TC-ATC-07` | [02_in_chat_cart_spec.md](./modules/02_in_chat_cart_spec.md) |
| **SPEC-SCENARIO-ATC-08** | Xử lý hết hàng đúng tích tắc bấm (Race Condition) | `TC-ATC-08` | [02_in_chat_cart_spec.md](./modules/02_in_chat_cart_spec.md) |
| **SPEC-SCENARIO-ATC-09** | Xem tóm tắt giỏ hàng trong chat (Mini Cart Card) | `TC-ATC-09` | [02_in_chat_cart_spec.md](./modules/02_in_chat_cart_spec.md) |
| **SPEC-SCENARIO-ATC-10** | Xóa hoặc giảm món khỏi giỏ trực tiếp trong chat | `TC-ATC-10` | [02_in_chat_cart_spec.md](./modules/02_in_chat_cart_spec.md) |
| **SPEC-SCENARIO-ATC-11** | Giới hạn số lượng món tối đa trên đơn lẻ (20 phần) | `TC-ATC-11` | [02_in_chat_cart_spec.md](./modules/02_in_chat_cart_spec.md) |
| **SPEC-SCENARIO-ATC-12** | Duy trì trạng thái giỏ hàng khi reload (Persistence) | `TC-ATC-12` | [02_in_chat_cart_spec.md](./modules/02_in_chat_cart_spec.md) |
| **SPEC-SCENARIO-RES-01** | Đặt bàn đủ 5 thông số bằng tiếng Việt tự nhiên | `TC-RES-01` | [03_auto_reservation_spec.md](./modules/03_auto_reservation_spec.md) |
| **SPEC-SCENARIO-RES-02** | Thu thập thông tin còn thiếu (Slot Filling Loop) | `TC-RES-02` | [03_auto_reservation_spec.md](./modules/03_auto_reservation_spec.md) |
| **SPEC-SCENARIO-RES-03** | Xử lý thời gian tương đối phức tạp (tối mốt, 7h kém 15) | `TC-RES-03` | [03_auto_reservation_spec.md](./modules/03_auto_reservation_spec.md) |
| **SPEC-SCENARIO-RES-04** | Tiếp nhận sở thích vị trí ngồi (cửa sổ, ngoài trời) | `TC-RES-04` | [03_auto_reservation_spec.md](./modules/03_auto_reservation_spec.md) |
| **SPEC-SCENARIO-RES-05** | Sinh mã đặt bàn độc nhất & Thẻ Xác Nhận Đặt Bàn | `TC-RES-05` | [03_auto_reservation_spec.md](./modules/03_auto_reservation_spec.md) |
| **SPEC-SCENARIO-RES-06** | Xử lý khung giờ cao điểm kín bàn (Đề xuất lân cận) | `TC-RES-06` | [03_auto_reservation_spec.md](./modules/03_auto_reservation_spec.md) |
| **SPEC-SCENARIO-RES-07** | Chính sách đặt bàn ngày Lễ / Sự kiện đặc biệt | `TC-RES-07` | [03_auto_reservation_spec.md](./modules/03_auto_reservation_spec.md) |
| **SPEC-SCENARIO-RES-08** | Chỉnh sửa thông tin đặt bàn trực tiếp trong chat | `TC-RES-08` | [03_auto_reservation_spec.md](./modules/03_auto_reservation_spec.md) |
| **SPEC-SCENARIO-RES-09** | Hủy đặt bàn trực tiếp trong cuộc trò chuyện | `TC-RES-09` | [03_auto_reservation_spec.md](./modules/03_auto_reservation_spec.md) |
| **SPEC-SCENARIO-RES-10** | Chặn đặt bàn thời gian trong quá khứ | `TC-RES-10` | [03_auto_reservation_spec.md](./modules/03_auto_reservation_spec.md) |
| **SPEC-SCENARIO-RES-11** | Chặn đặt bàn ngoài giờ hoạt động (2h sáng) | `TC-RES-11` | [03_auto_reservation_spec.md](./modules/03_auto_reservation_spec.md) |
| **SPEC-SCENARIO-RES-12** | Bắt lỗi số lượng khách bất thường (<=0 hoặc >30) | `TC-RES-12` | [03_auto_reservation_spec.md](./modules/03_auto_reservation_spec.md) |
| **SPEC-SCENARIO-RES-13** | Kiểm thực định dạng số điện thoại Việt Nam (Regex) | `TC-RES-13` | [03_auto_reservation_spec.md](./modules/03_auto_reservation_spec.md) |
| **SPEC-SCENARIO-MEM-01** | Lời chào cá nhân hóa nhận diện khách cũ | `TC-MEM-01` | [04_taste_memory_memgpt_spec.md](./modules/04_taste_memory_memgpt_spec.md) |
| **SPEC-SCENARIO-MEM-02** | Xử lý kịch bản khách mới tinh (Cold Start Protocol) | `TC-MEM-02` | [04_taste_memory_memgpt_spec.md](./modules/04_taste_memory_memgpt_spec.md) |
| **SPEC-SCENARIO-MEM-03** | Tự động ghi nhớ thói quen gia vị (Độ cay, không hành) | `TC-MEM-03` | [04_taste_memory_memgpt_spec.md](./modules/04_taste_memory_memgpt_spec.md) |
| **SPEC-SCENARIO-MEM-04** | Đặt lại theo thói quen cũ ("Như cũ" / "Như lần trước") | `TC-MEM-04` | [04_taste_memory_memgpt_spec.md](./modules/04_taste_memory_memgpt_spec.md) |
| **SPEC-SCENARIO-MEM-05** | Gợi ý món mới tương thích gu ẩm thực đã lưu trữ | `TC-MEM-05` | [04_taste_memory_memgpt_spec.md](./modules/04_taste_memory_memgpt_spec.md) |
| **SPEC-SCENARIO-MEM-06** | Ghi đè khẩu vị tạm thời cho 1 bữa ăn (Context Override) | `TC-MEM-06` | [04_taste_memory_memgpt_spec.md](./modules/04_taste_memory_memgpt_spec.md) |
| **SPEC-SCENARIO-MEM-07** | Cập nhật khẩu vị vĩnh viễn vào bộ nhớ dài hạn | `TC-MEM-07` | [04_taste_memory_memgpt_spec.md](./modules/04_taste_memory_memgpt_spec.md) |
| **SPEC-SCENARIO-MEM-08** | Minh bạch thông tin lưu trữ cá nhân (Transparency) | `TC-MEM-08` | [04_taste_memory_memgpt_spec.md](./modules/04_taste_memory_memgpt_spec.md) |
| **SPEC-SCENARIO-MEM-09** | Quyền được lãng quên (Right to be Forgotten Purge) | `TC-MEM-09` | [04_taste_memory_memgpt_spec.md](./modules/04_taste_memory_memgpt_spec.md) |
| **SPEC-SCENARIO-MEM-10** | Cách ly tuyệt đối dữ liệu giữa các khách hàng | `TC-MEM-10` | [04_taste_memory_memgpt_spec.md](./modules/04_taste_memory_memgpt_spec.md) |
| **SPEC-SCENARIO-SUP-01** | Cung cấp Tên & Mật khẩu Wifi kèm nút sao chép 1 chạm | `TC-SUP-01` | [05_support_and_call_staff_spec.md](./modules/05_support_and_call_staff_spec.md) |
| **SPEC-SCENARIO-SUP-02** | Hướng dẫn vị trí bãi đỗ xe máy & Ô tô 7 chỗ miễn phí | `TC-SUP-02` | [05_support_and_call_staff_spec.md](./modules/05_support_and_call_staff_spec.md) |
| **SPEC-SCENARIO-SUP-03** | Hỗ trợ xuất hóa đơn VAT điện tử & Phương thức trả tiền | `TC-SUP-03` | [05_support_and_call_staff_spec.md](./modules/05_support_and_call_staff_spec.md) |
| **SPEC-SCENARIO-SUP-04** | Chính sách mang rượu, bánh kem từ ngoài vào & Thú cưng | `TC-SUP-04` | [05_support_and_call_staff_spec.md](./modules/05_support_and_call_staff_spec.md) |
| **SPEC-SCENARIO-SUP-05** | Quy trình hỗ trợ đặt món mang về (Takeaway hẹn giờ) | `TC-SUP-05` | [05_support_and_call_staff_spec.md](./modules/05_support_and_call_staff_spec.md) |
| **SPEC-SCENARIO-SUP-06** | Thao tác nút bấm "Gọi nhân viên bàn" 1 chạm | `TC-SUP-06` | [05_support_and_call_staff_spec.md](./modules/05_support_and_call_staff_spec.md) |
| **SPEC-SCENARIO-SUP-07** | Chọn lý do gọi nhân viên nhanh qua 4 Quick Tags | `TC-SUP-07` | [05_support_and_call_staff_spec.md](./modules/05_support_and_call_staff_spec.md) |
| **SPEC-SCENARIO-SUP-08** | Cơ chế chống spam nút gọi nhân viên (Cooldown 45s) | `TC-SUP-08` | [05_support_and_call_staff_spec.md](./modules/05_support_and_call_staff_spec.md) |
| **SPEC-SCENARIO-SUP-09** | Bắt lỗi gián đoạn kết nối mạng khi bấm gọi nhân viên | `TC-SUP-09` | [05_support_and_call_staff_spec.md](./modules/05_support_and_call_staff_spec.md) |
| **SPEC-SCENARIO-SUP-10** | Tiếp nhận phàn nàn & Báo động khẩn cấp tới Quản lý | `TC-SUP-10` | [05_support_and_call_staff_spec.md](./modules/05_support_and_call_staff_spec.md) |
| **SPEC-SCENARIO-SEC-01** | Chống phá vỡ vai trò & Trích xuất Master Prompt | `TC-SEC-01` | [06_security_and_e2e_spec.md](./modules/06_security_and_e2e_spec.md) |
| **SPEC-SCENARIO-SEC-02** | Phòng thủ ngôn từ thô tục & Hành vi kích động | `TC-SEC-02` | [06_security_and_e2e_spec.md](./modules/06_security_and_e2e_spec.md) |
| **SPEC-SCENARIO-SEC-03** | Khử độc dữ liệu đầu vào chống tấn công XSS Script | `TC-SEC-03` | [06_security_and_e2e_spec.md](./modules/06_security_and_e2e_spec.md) |
| **SPEC-SCENARIO-SEC-04** | Xử lý chuỗi văn bản siêu dài chống tràn bộ đệm | `TC-SEC-04` | [06_security_and_e2e_spec.md](./modules/06_security_and_e2e_spec.md) |
| **SPEC-SCENARIO-SEC-05** | Xoay chuyển ngữ cảnh liên tục (Context Switching) | `TC-SEC-05` | [06_security_and_e2e_spec.md](./modules/06_security_and_e2e_spec.md) |
| **SPEC-SCENARIO-SEC-06** | Cơ chế tự động khôi phục kết nối mạng (Auto-reconnect) | `TC-SEC-06` | [06_security_and_e2e_spec.md](./modules/06_security_and_e2e_spec.md) |
| **SPEC-JOURNEY-E2E-01** | Hành trình khách mới: Dị ứng -> Giỏ hàng -> Đặt bàn | `E2E-01` | [06_security_and_e2e_spec.md](./modules/06_security_and_e2e_spec.md) |
| **SPEC-JOURNEY-E2E-02** | Hành trình khách cũ: MemGPT -> Gọi món -> Gọi nhân viên | `E2E-02` | [06_security_and_e2e_spec.md](./modules/06_security_and_e2e_spec.md) |

### 8.2. Tiêu chuẩn bàn giao & Định nghĩa Hoàn thành (Definition of Done)
- [x] Đã chuẩn hóa toàn bộ 5 tính năng thành tài liệu kỹ thuật chi tiết chuyên sâu, không bỏ sót bất kỳ luồng ngoại lệ nào.
- [x] Cung cấp đầy đủ Schema Contracts, Data Invariants, State Machines và Lời thoại mẫu cho bot.
- [x] Đạt điểm tuyệt đối trong Bảng kiểm soát chất lượng đặc tả [test/specs/checklists/requirements.md](file:///Users/macbookpro/Documents/Nam_3/HK1/WEB/SmartRestaurant/test/specs/checklists/requirements.md).
