# 00. TỔNG QUAN VÀ CHIẾN LƯỢC KIỂM THỬ CHATBOX ARIA (SMART RESTAURANT)

## 1. Bối cảnh & Mục tiêu kiểm thử
Tài liệu này xác lập kế hoạch kiểm thử chất lượng toàn diện cho Trợ lý Ảo / Chatbox Aria trong hệ sinh thái SmartRestaurant.
- **Tiếp cận kiểm thử:** 100% Black-Box Testing (Kiểm thử Hộp đen) đứng từ góc độ khách hàng / thực khách tương tác trực tiếp trên giao diện màn hình.
- **Nguyên tắc bất biến:** Tuyệt đối không can thiệp hay đọc mã nguồn nội bộ; đánh giá khách quan qua dữ liệu đầu vào (tin nhắn của khách, thao tác chạm/click) và dữ liệu đầu ra (nội dung phản hồi, thẻ tương tác UI, giỏ hàng, đặt bàn, tín hiệu gọi phục vụ).
- **Mục tiêu tối thượng:** Đạt độ chính xác 100% về thông tin thực đơn (không bịa món, không bịa giá), an toàn tuyệt đối với dị ứng thực phẩm, và mang lại trải nghiệm mượt mà, trực quan cho thực khách.

---

## 2. Phạm vi kiểm thử (Scope of Testing)

### 2.1. Năm tính năng cốt lõi (Core Features)
1. **Gợi ý món ăn thông minh:** Gợi ý theo khẩu vị, ngân sách, tự động loại trừ chất gây dị ứng và món kiêng khem, chống bịa đặt món/giá (Anti-Hallucination).
2. **Thêm món vào giỏ ngay trong chat:** Hiển thị thẻ món ăn (Product Card) tương tác, tùy biến gia vị/số lượng, nút "Thêm vào giỏ" tức thì, đồng bộ giỏ hàng thời gian thực.
3. **Đặt bàn tự động:** Xử lý ngôn ngữ tự nhiên tiếng Việt ngày/giờ, kiểm tra bàn trống thông minh, sinh mã đặt chỗ và hiển thị Thẻ Xác Nhận Đặt Bàn (Booking Card).
4. **Nhớ khẩu vị khách quen (MemGPT):** Nhận diện khách quay lại, tự động nhớ lịch sử gọi món, thói quen gia vị (độ cay, không hành), cập nhật khẩu vị và bảo mật dữ liệu.
5. **Hỗ trợ thực khách & Gọi nhân viên:** Trả lời bộ câu hỏi thường gặp (FAQ: Wifi, bãi xe, chính sách hóa đơn), hỗ trợ đặt mang về (Takeaway), và nút "Gọi nhân viên bàn" với cơ chế chống spam.

### 2.2. Các khía cạnh kiểm thử bổ trợ (Supplementary Aspects)
- **Kiểm thử Ngôn ngữ tự nhiên (Conversational AI / NLP):** Tiếng Việt đa vùng miền, câu viết tắt, tiếng lóng giới trẻ, câu không dấu, đa ngữ cảnh trong một lượt chat.
- **Kiểm thử An toàn & Bẫy Bot (Jailbreak / Prompt Injection):** Chống lừa bot tiết lộ chỉ thị nội bộ, không phản hồi nội dung xúc phạm hoặc ngoài phạm vi nhà hàng.
- **Kiểm thử Trải nghiệm người dùng (UX/UI):** Tính phản hồi của nút chạm (Touch feedback), tính thẩm mỹ của thẻ Card, không sử dụng emoji tùy tiện gây nhiễu giao diện.

---

## 3. Ma trận Chân dung Người dùng Giả lập (Test Personas)

| Persona ID | Chân dung & Tính cách | Nhu cầu chính | Thách thức kiểm thử |
| :--- | :--- | :--- | :--- |
| **P-01: Anh Nam** | Khách mới, tiền sử dị ứng tôm và đậu phộng nặng, ngân sách 400.000đ. | Tìm món an toàn, không chứa dị nguyên, kiểm soát chặt chi phí. | Độ nhạy bộ lọc an toàn dị ứng; kiểm tra tổng tiền chính xác tuyệt đối. |
| **P-02: Chị Lan** | Khách ăn chay ngày rằm, đi cùng gia đình có cả người ăn mặn (8 người). | Tìm thực đơn chay kết hợp món mặn cho trẻ em; đặt bàn tiệc cuối tuần. | Lọc kiêng khem đa luồng; thuật toán kiểm tra bàn lớn vào giờ cao điểm. |
| **P-03: Chú Hùng** | Khách quen VIP (tuần 2 lần), ăn bò, ghét hành lá, ăn cay mức 1/5. | Muốn gọi nhanh "như cũ", không muốn nhắc lại thói quen nhiều lần. | Khả năng truy xuất bộ nhớ MemGPT, nhận diện đúng thực khách. |
| **P-04: Bạn Tú** | Gen Z, gõ nhanh, dùng từ viết tắt ("oder lẹ", "set 2 ngừi", "hôm nai"), đổi ý liên tục. | Đặt món nhanh, chỉnh sửa giỏ hàng liên tục trong lúc chat. | Xử lý NLP tiếng Việt biến thể cao; tính toàn vẹn trạng thái giỏ hàng. |
| **P-05: Bác Thanh** | Người lớn tuổi, gõ câu dài, hỏi nhiều về bãi xe ô tô, cách thanh toán, cần gặp phục vụ. | Cần thông tin rõ ràng, hỗ trợ tận bàn qua nút "Gọi nhân viên". | Độ chính xác FAQ, tính tiện dụng và độ tin cậy của nút gọi phục vụ khẩn. |

---

## 4. Chỉ số Đánh giá Chất lượng Nghiệm thu (Quality Acceptance KPIs)

1. **Tỷ lệ bịa đặt thông tin (Hallucination Rate):** **0.0%** (Tiêu chí chặn phát hành - Blocker). Mọi tên món, thành phần và mức giá phải khớp 100% với thực đơn niêm yết.
2. **Độ an toàn dị ứng thực phẩm (Allergy Safety):** **100%** (Blocker). Tuyệt đối không gợi ý món chứa thành phần khách đã khai báo dị ứng.
3. **Thời gian phản hồi tin nhắn văn bản (Text Latency):** $\le 2.0$ giây trong điều kiện mạng tiêu chuẩn.
4. **Thời gian hiển thị thẻ tương tác (Card Render Latency):** $\le 3.0$ giây.
5. **Độ nhạy phản hồi nút bấm (Button Tap Feedback):** $\le 200$ ms (chuyển trạng thái loading / đổi màu nhận diện ngay lập tức).
6. **Độ chính xác hiểu tiếng Việt tự nhiên (NLP Accuracy):** $\ge 95\%$ trên toàn bộ 100+ mẫu câu kiểm thử.
