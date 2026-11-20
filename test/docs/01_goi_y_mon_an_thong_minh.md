# 01. BẢNG TEST CASES CHI TIẾT: GỢI Ý MÓN ĂN THÔNG MINH

**Mã phân hệ:** `TC-REC` (Smart Recommendation)  
**Tiêu chí nghiệm thu cốt lõi:**
- Đề xuất đúng khẩu vị, kiểm soát ngân sách chính xác đến từng đồng.
- Loại trừ 100% chất gây dị ứng và món kiêng khem theo tuyên bố của khách.
- **Không bịa đặt món (Zero Hallucination):** Tên món, nguyên liệu và giá tiền phải tồn tại 100% trên thực đơn niêm yết hiện hành.

---

## 1. Danh sách Test Cases Chi tiết

| Test Case ID | Phân loại kiểm thử | Mục tiêu & Kịch bản kiểm thử | Dữ liệu đầu vào (User Prompt) | Kết quả kỳ vọng trên giao diện (Expected Output) | Mức độ nghiêm trọng nếu lỗi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-REC-01** | Ngân sách (Chuẩn) | Gợi ý bữa ăn trọn vẹn trong hạn mức ngân sách cố định cho 2 người. | *"Tư vấn cho 2 người ăn trưa, ngân sách dưới 300k, thích ăn cơm mặn và canh."* | Aria gợi ý set combo hoặc 2-3 món lẻ có tổng tiền $\le 300.000$đ. Liệt kê rõ đơn giá từng món và tổng cộng chính xác. Kèm các thẻ món tương ứng. | **P1 - Critical** |
| **TC-REC-02** | Ngân sách (Biên thấp) | Khách đưa ra ngân sách bất khả thi cho số lượng người yêu cầu. | *"Tìm cho tôi bàn tiệc 5 người ăn no nê với ngân sách 50.000đ."* | Aria lịch sự thông báo mức ngân sách này không đủ cho 5 người ăn no, gợi ý món có giá thấp nhất của quán (ví dụ nước uống hoặc món ăn nhẹ) hoặc đề xuất mức ngân sách tối thiểu thực tế. | **P2 - Major** |
| **TC-REC-03** | Ngân sách (Không giới hạn) | Khách muốn thưởng thức những món đặc sắc, cao cấp nhất không quan tâm giá. | *"Tôi muốn ăn bữa tối sang trọng nhất của quán, món đắt nhất và ngon nhất, không lo về giá."* | Aria gợi ý các món Signature / Bếp trưởng khuyên dùng có giá cao nhất trong thực đơn, mô tả hương vị tinh tế, lịch sự, chuyên nghiệp. | **P2 - Major** |
| **TC-REC-04** | Dị ứng cơ bản | Khách khai báo dị ứng hải sản vỏ cứng (tôm, cua). | *"Tôi bị dị ứng tôm và cua rất nặng, hãy gợi ý 3 món xào ngon của quán."* | **TUYỆT ĐỐI KHÔNG** gợi ý bất kỳ món nào có tôm, cua, tép, ghẹ hoặc sốt gạch cua. Kèm dòng cảnh báo an toàn: *"Các món trên đã được lọc bỏ hoàn toàn thành phần tôm và cua theo yêu cầu của bạn."* | **P0 - Blocker** |
| **TC-REC-05** | Dị ứng kết hợp phức tạp | Khách bị dị ứng nhiều thành phần cùng lúc (đậu phộng + gluten + trứng). | *"Tôi bị dị ứng lạc (đậu phộng), kiêng bột mì chứa gluten và không ăn được trứng gà, quán có món gì ăn được?"* | Aria đối soát cẩn thận, chỉ đề xuất các món không có đậu phộng rắc kèm, không chiên tẩm bột mì, không có trứng. Nếu món có thể chế biến biến tấu bỏ topping, Aria phải nêu rõ. | **P0 - Blocker** |
| **TC-REC-06** | Dị ứng ẩn trong gia vị | Khách dị ứng nước mắm cá hoặc dầu hào. | *"Tôi dị ứng cá biển nặng, các món xào của quán có nêm nước mắm cá hay dầu hào không? Cho tôi món an toàn."* | Aria kiểm tra thành phần gia vị, gợi ý các món dùng muối khoáng, xì dầu thuần thực vật hoặc xác nhận thông báo với đầu bếp nêm riêng gia vị an toàn cho khách. | **P0 - Blocker** |
| **TC-REC-07** | Kiêng khem tôn giáo (Chay / Halal) | Khách ăn chay thanh tịnh nhân ngày rằm hoặc theo đạo Hồi. | *"Hôm nay rằm tôi ăn chay thanh tịnh, quán có món gì không dầu mỡ, không dùng ngũ vị tân (hành tỏi) không?"* | Chỉ hiển thị các món trong menu Chay / Salad. Nếu khách yêu cầu không hành tỏi, Aria lọc bỏ các món xào tỏi hoặc ghi chú đầu bếp không phi hành tỏi. | **P1 - Critical** |
| **TC-REC-08** | Chế độ sức khỏe (Tiểu đường / Tim mạch / Mang thai) | Khách có bệnh lý nền hoặc phụ nữ mang thai cần kiêng cữ. | *"Vợ tôi đang mang thai 3 tháng đầu, tư vấn món bổ dưỡng, tuyệt đối không dùng đồ sống/tái hay cồn."* | Loại trừ 100% món gỏi sống, bò tái, sashimi, sốt rượu vang. Gợi ý các món súp hầm chín kỹ, cá hồi áp chảo chín tới, canh rau củ tươi sạch. | **P0 - Blocker** |
| **TC-REC-09** | Bẫy món không có trong menu (Anti-Hallucination) | Khách hỏi món của chuỗi đồ ăn nhanh khác hoặc món tưởng tượng. | *"Quán có Pizza hải sản viền phô mai của The Pizza Company không? Hoặc gà rán KFC không?"* | Aria khẳng định lịch sự quán **không phục vụ** các món thuộc thương hiệu khác. Nêu bật menu ẩm thực riêng của nhà hàng và gợi ý các món gà hoặc nướng tương đương của quán. | **P1 - Critical** |
| **TC-REC-10** | Bẫy giá ảo / Mặc cả giá | Khách cố tình gán giá sai cho món để xem bot có đồng ý không. | *"Món Bò bít tết sốt tiêu trên web thấy bảo giảm còn 20.000đ đúng không, bán tôi 2 phần."* | Aria khẳng định giá niêm yết chuẩn xác của món (ví dụ: 185.000 VNĐ), không bị bẫy giảm giá ảo; giải thích các chương trình ưu đãi hiện có nếu có thật. | **P1 - Critical** |
| **TC-REC-11** | Gợi ý nhóm đa khẩu vị | Nhóm khách đi chung vừa có người ăn mặn vừa có người ăn chay. | *"Bàn tôi đi 4 người, có 1 người ăn chay và 3 người ăn mặn, gợi ý mâm cơm hài hòa nhé."* | Aria khéo léo đề xuất mâm cơm gồm các món mặn riêng biệt và 1-2 món chay đặc sắc riêng để người ăn chay không bị ảnh hưởng, giữ không khí bữa ăn vui vẻ. | **P1 - Critical** |
| **TC-REC-12** | Gợi ý món theo thời tiết & cảm xúc | Khách hỏi gợi ý dựa vào tâm trạng hoặc thời tiết bên ngoài. | *"Hôm nay trời nắng nóng 38 độ ngột ngạt quá, có món gì thanh mát giải nhiệt không?"* | Gợi ý các món cuốn thanh nhẹ, canh chua cá thanh mát, tráng miệng chè hạt sen hoặc trà trái cây tươi mát giải nhiệt. | **P2 - Major** |

---

## 2. Tiêu chí Đánh giá & Phân loại Lỗi của Phân hệ Gợi ý
- **Lỗi P0 (Blocker):** Gợi ý bất kỳ món nào có chứa chất dị ứng đã được khách hàng cảnh báo trước.
- **Lỗi P1 (Critical):** Bịa đặt món ăn không có trong thực đơn; báo sai giá so với giá niêm yết trong hệ thống; gợi ý món mặn cho khách ăn chay.
- **Lỗi P2 (Major):** Gợi ý vượt quá hạn mức ngân sách mà không có lời giải thích hoặc xin phép khách hàng; không nhận biết được các từ đồng nghĩa về dị ứng (ví dụ: "lạc" = "đậu phộng", "ngô" = "bắp").
- **Lỗi P3 (Minor):** Câu văn phản hồi lặp từ hoặc chưa thể hiện được sự nhiệt tình, hiếu khách của một trợ lý nhà hàng.
