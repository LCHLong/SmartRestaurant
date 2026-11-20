# 02. BẢNG TEST CASES CHI TIẾT: THÊM MÓN VÀO GIỎ NGAY TRONG CHAT

**Mã phân hệ:** `TC-ATC` (Add to Cart In-Chat)  
**Tiêu chí nghiệm thu cốt lõi:**
- Thẻ món ăn (Product Card) hiển thị trực quan, hình ảnh rõ nét, đầy đủ thông tin chuẩn giá.
- Nút "Thêm vào giỏ" phản hồi nhanh (< 200ms), có trạng thái xác nhận trực quan (Feedback Animation).
- Đồng bộ tức thì giữa giỏ hàng trong chat và giỏ hàng toàn cục của ứng dụng.

---

## 1. Danh sách Test Cases Chi tiết

| Test Case ID | Phân loại kiểm thử | Mục tiêu & Kịch bản kiểm thử | Dữ liệu đầu vào (User Prompt / Action) | Kết quả kỳ vọng trên giao diện (Expected Output) | Mức độ nghiêm trọng nếu lỗi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-ATC-01** | Giao diện thẻ món (UI Component) | Hiển thị Thẻ món ăn tương tác hoàn chỉnh khi khách hỏi hoặc bot gợi ý. | *"Cho tôi xem món Bò bít tết sốt tiêu đen."* | Khung chat xuất hiện Thẻ món ăn gồm: Ảnh món sắc nét (tỷ lệ 16:9 hoặc 4:3), Tên món in đậm, Giá tiền định dạng chuẩn VNĐ (VD: `185.000đ`), Đoạn mô tả ngắn và Nút bấm `[+ Thêm vào giỏ]` nổi bật. | **P1 - Critical** |
| **TC-ATC-02** | Thao tác 1 chạm cơ bản | Thực khách nhấn nút `[+ Thêm vào giỏ]` trên thẻ món ăn. | Chạm/Click nút `[+ Thêm vào giỏ]` trên thẻ Bò bít tết. | Nút chuyển ngay sang trạng thái phản hồi: Đổi màu/Hiện icon loading $\rightarrow$ Đổi thành `[Đã thêm ✓]`. Icon giỏ hàng trên thanh điều hướng tăng số lượng tức thì `0 -> 1`. Aria gửi tin nhắn xác nhận: *"Đã thêm Bò bít tết vào giỏ hàng."* | **P1 - Critical** |
| **TC-ATC-03** | Thêm món qua câu lệnh ngôn ngữ tự nhiên | Thực khách không bấm nút mà gõ trực tiếp câu lệnh yêu cầu thêm món. | *"Cho 1 phần Cơm chiên hải sản và 2 ly Nước chanh dây vào giỏ nhé."* | Aria tự động thêm chính xác 1 Cơm chiên hải sản và 2 Nước chanh dây vào giỏ hàng; cập nhật badge giỏ hàng lên `+3` và hiển thị tóm tắt ngắn. | **P1 - Critical** |
| **TC-ATC-04** | Tùy biến món & Ghi chú hương vị (Modifiers) | Thêm món kèm yêu cầu riêng về đường, đá, ớt, rau thơm. | *"Thêm 1 Trà sữa Ô Long 50% đường 70% đá, trân châu đen và 1 Phở bò không hành lá nhiều ớt."* | Giỏ hàng ghi nhận chính xác từng món kèm ghi chú chi tiết: Trà sữa (50% đường, 70% đá, +trân châu đen); Phở bò (Không hành lá, nhiều ớt). Hiển thị tag ghi chú rõ ràng trên giỏ hàng. | **P1 - Critical** |
| **TC-ATC-05** | Tăng/Giảm số lượng trực tiếp trên thẻ món | Thẻ món ăn có bộ điều chỉnh số lượng `[-] [1] [+]`. | Khách bấm nút `[+]` 3 lần để chọn 4 phần trước khi bấm Thêm. | Số lượng trên thẻ tăng mượt mà từ 1 lên 4. Khi nhấn Thêm vào giỏ, hệ thống ghi nhận đúng 4 phần, tổng tiền tạm tính nhân chính xác với 4. | **P2 - Major** |
| **TC-ATC-06** | Xử lý click liên tục (Debounce / Rapid Click) | Khách bấm nút `[Thêm vào giỏ]` liên tục 5 lần trong 1 giây để kiểm tra race conditions. | Spam click nút thêm món liên hồi. | Nút xử lý debounce tốt, không gửi request trùng lặp vô tội vạ; chỉ tăng đúng số lần hợp lệ hoặc disable nút trong thời gian xử lý; không gây crash giao diện. | **P1 - Critical** |
| **TC-ATC-07** | Món đã hết hàng trong ngày (Out of Stock) | Thẻ món ăn của một món đã ngưng phục vụ trong kho. | Xem món đang hết hàng (ví dụ: Cua hoàng đế hấp). | Nút bấm chuyển sang màu xám mờ với nhãn `[Tạm hết món]`, không cho phép click. Aria gợi ý khéo léo: *"Món này hôm nay đã hết, bạn có thể thử món Tôm hùm bỏ lò phô mai tương tự nhé."* | **P1 - Critical** |
| **TC-ATC-08** | Món hết hàng tại thời điểm bấm (Race condition) | Món còn 1 suất cuối, khách bấm thêm đúng lúc quầy thu ngân vừa bán hết. | Bấm thêm suất cuối cùng khi tồn kho vừa về 0. | Hệ thống bắt lỗi nhẹ nhàng, hiển thị thông báo popup hoặc tin nhắn từ Aria: *"Rất tiếc, suất cuối cùng của món này vừa được đặt trước. Bạn có muốn đổi sang món khác không?"* | **P1 - Critical** |
| **TC-ATC-09** | Xem tóm tắt giỏ hàng (Mini Cart in Chat) | Yêu cầu xem lại toàn bộ giỏ hàng đang có trong cuộc trò chuyện. | *"Cho tôi xem lại giỏ hàng hiện tại gồm những gì và tổng tiền?"* | Xuất hiện Thẻ Tóm Tắt Giỏ Hàng gồm danh sách các món đã chọn, số lượng, đơn giá, tổng tiền tạm tính, kèm 2 nút hành động: `[Xem chi tiết giỏ]` và `[Tiến hành đặt món]`. | **P2 - Major** |
| **TC-ATC-10** | Xóa hoặc giảm món khỏi giỏ ngay trong chat | Khách đổi ý muốn bỏ bớt món hoặc hủy món đã chọn qua chat. | *"Bỏ bớt 1 ly nước chanh dây và xóa món cơm chiên ra khỏi giỏ cho tôi."* | Aria cập nhật giỏ hàng: Trừ 1 ly nước chanh và xóa hoàn toàn món cơm chiên; thông báo số lượng và tổng tiền mới cập nhật. | **P2 - Major** |
| **TC-ATC-11** | Giới hạn số lượng món tối đa (Boundary Limit) | Thêm số lượng cực lớn cho một món ăn. | *"Thêm 999 phần Bò bít tết vào giỏ."* | Hệ thống có chặn ngưỡng tối đa (ví dụ tối đa 20 phần/món trên đơn lẻ). Aria nhắc nhở nhẹ nhàng và đề xuất liên hệ hotline nếu đặt tiệc lớn. | **P2 - Major** |
| **TC-ATC-12** | Duy trì trạng thái giỏ hàng khi chuyển trang/tải lại | Khách thêm 3 món vào giỏ, sau đó F5 làm mới trình duyệt hoặc chuyển tab. | Tải lại trang web nhà hàng. | Giỏ hàng vẫn giữ nguyên 3 món và tổng tiền; khi mở lại khung chat, Aria vẫn nhớ giỏ hàng hiện tại. | **P1 - Critical** |

---

## 2. Tiêu chí Đánh giá & Phân loại Lỗi của Phân hệ Giỏ Hàng
- **Lỗi P0 (Blocker):** Bấm "Thêm vào giỏ" không có bất kỳ phản hồi nào; giỏ hàng bị tính sai tổng tiền (sai số học); trừ tiền hoặc ghi nhận món sai hoàn toàn với món khách chọn.
- **Lỗi P1 (Critical):** Thẻ món ăn bị vỡ layout trên điện thoại; nút bấm bị đè che khuất; món hết hàng nhưng vẫn cho thêm vào giỏ; mất toàn bộ giỏ hàng khi tải lại trang.
- **Lỗi P2 (Major):** Bỏ sót ghi chú gia vị tùy biến của khách (như ghi chú không hành, ít đá); không cập nhật số lượng badge giỏ hàng ngay lập tức.
- **Lỗi P3 (Minor):** Hiệu ứng hoạt họa (animation) khi thêm món bị giật nhẹ; chữ trên nút bấm chưa tối ưu về mặt thẩm mỹ.
