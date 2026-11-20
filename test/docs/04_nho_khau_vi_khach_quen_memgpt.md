# 04. BẢNG TEST CASES CHI TIẾT: NHỚ KHẨU VỊ KHÁCH QUEN (MEMGPT)

**Mã phân hệ:** `TC-MEM` (MemGPT Customer Memory & Profiling)  
**Tiêu chí nghiệm thu cốt lõi:**
- Nhận diện đúng khách hàng thân thiết qua số điện thoại / tài khoản / phiên đăng nhập.
- Tự động gợi ý món dựa trên lịch sử ăn uống thực tế; tự ghi nhớ độ cay và lưu ý gia vị.
- Cập nhật linh hoạt khi khách đổi khẩu vị; tuyệt đối tuân thủ quyền riêng tư (cho phép xem và xóa lịch sử).

---

## 1. Danh sách Test Cases Chi tiết

| Test Case ID | Phân loại kiểm thử | Mục tiêu & Kịch bản kiểm thử | Dữ liệu đầu vào (User Action / Prompt) | Kết quả kỳ vọng trên giao diện (Expected Output) | Mức độ nghiêm trọng nếu lỗi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-MEM-01** | Lời chào cá nhân hóa (Khách cũ) | Khách đã dùng bữa tại nhà hàng từ 2 lần trở lên quay lại mở khung chat. | Khách cũ (User: Chú Hùng) đăng nhập và mở khung chat. | Aria chào mừng thân mật: *"Chào mừng chú Hùng đã quay trở lại với SmartRestaurant! Hôm nay chú muốn dùng món Bò tiêu quen thuộc hay thử món mới trong tuần ạ?"* | **P2 - Major** |
| **TC-MEM-02** | Khách mới hoàn toàn (Cold Start) | Khách lần đầu tiên truy cập hệ thống chat. | Khách mới mở chat lần đầu. | Aria chào đón nồng nhiệt theo kịch bản chuẩn, giới thiệu sơ lược năng lực hỗ trợ, không tự bịa ra thói quen cũ của khách. | **P2 - Major** |
| **TC-MEM-03** | Tự động ghi nhớ thói quen gia vị (Độ cay & Không hành) | Khách có lịch sử không ăn hành và ăn ít cay gọi món thông thường. | Khách gõ: *"Cho anh 1 phần Mì xào bò giòn."* (Không nhắc lại ghi chú gia vị). | Aria tự động ghi nhận: *"Dạ 1 Mì xào bò giòn - Aria vẫn lưu ý bếp là không hành lá và ít cay như mọi khi của anh đúng không ạ?"* | **P1 - Critical** |
| **TC-MEM-04** | Đặt lại theo món quen ("Như cũ") | Khách dùng khẩu ngữ ra lệnh ngắn gọn. | *"Cho 1 combo ăn trưa như tuần trước anh hay gọi nhé."* | Aria truy xuất đúng các món trong đơn hàng gần nhất tuần trước, hiển thị tóm tắt lại danh sách món và giá tiền, xin xác nhận trước khi thêm vào giỏ. | **P1 - Critical** |
| **TC-MEM-05** | Gợi ý món mới dựa trên sở thích cũ | Khách muốn đổi món nhưng vẫn giữ gu ẩm thực quen thuộc. | *"Hôm nay ngán bò rồi, có món gì mới lạ nhưng vẫn đậm đà, không cay không?"* | Dựa trên hồ sơ thích vị đậm đà và không ăn cay, Aria đề xuất món Heo nướng mật ong hoặc Vịt quay tiêu xanh, không lọt món cay nóng. | **P2 - Major** |
| **TC-MEM-06** | Thay đổi khẩu vị tạm thời (Context Override) | Khách có bữa ăn đặc biệt đi cùng người khác, thay đổi khẩu vị quen. | *"Hôm nay anh đi tiếp khách thích ăn cay, làm món cay nhiều và bỏ thêm ớt nhé, đừng làm ít cay như mọi khi."* | Aria hiểu ngay sự thay đổi ngữ cảnh tạm thời: Ghi nhận độ cay cao cho đơn này, không cãi lại sở thích cũ, nhưng vẫn giữ hồ sơ gốc cho lần sau. | **P1 - Critical** |
| **TC-MEM-07** | Cập nhật khẩu vị vĩnh viễn (Memory Update) | Khách thông báo thay đổi chế độ dinh dưỡng lâu dài. | *"Bác sĩ bảo tôi bị gout nên từ nay tôi kiêng hoàn toàn thịt bò và hải sản nhé, nhớ giùm tôi."* | Aria xác nhận cập nhật bộ nhớ dài hạn: Ghi nhận kiêng thịt bò và hải sản; khẳng định các gợi ý về sau sẽ tự động loại bỏ 2 nhóm thực phẩm này. | **P1 - Critical** |
| **TC-MEM-08** | Khách hỏi thông tin bot ghi nhớ về mình (Transparency) | Khách kiểm tra tính minh bạch của AI. | *"Aria đang nhớ những thông tin gì về sở thích ăn uống của tôi vậy?"* | Aria liệt kê rõ ràng, lịch sự: Món yêu thích, mức độ cay, các thành phần kiêng khem, số lần ghé thăm nhà hàng gần nhất một cách minh bạch. | **P2 - Major** |
| **TC-MEM-09** | Quyền được lãng quên (Right to be Forgotten) | Khách yêu cầu xóa sạch hồ sơ sở thích cá nhân. | *"Hãy xóa toàn bộ lịch sử ăn uống và khẩu vị của tôi đi."* | Aria xác nhận đã xóa sạch dữ liệu ghi nhớ khẩu vị; các lần trò chuyện sau đối xử với người này như một khách mới tinh (Cold Start). | **P1 - Critical** |
| **TC-MEM-10** | Cách ly dữ liệu giữa các tài khoản (Data Isolation) | Khách A và Khách B đăng nhập lần lượt trên cùng một thiết bị hoặc 2 phiên làm việc. | Khách A (thích cay, ăn mặn) đăng xuất -> Khách B (ăn chay, kiêng ngọt) đăng nhập. | Tuyệt đối không để lộ dữ liệu hay gợi ý món của Khách A sang phiên trò chuyện của Khách B. | **P0 - Blocker** |

---

## 2. Tiêu chí Đánh giá & Phân loại Lỗi của Phân hệ MemGPT
- **Lỗi P0 (Blocker):** Rò rỉ dữ liệu hoặc lộ thông tin đơn hàng/khẩu vị của khách hàng này sang khách hàng khác; nhớ sai thông tin dị ứng nguy hiểm.
- **Lỗi P1 (Critical):** Khách đã dặn "như cũ" nhưng lại lấy nhầm đơn hàng của người khác; khách đã cập nhật kiêng khem mới nhưng bot vẫn gợi ý món kiêng khem đó; không thực hiện lệnh xóa dữ liệu khi khách yêu cầu.
- **Lỗi P2 (Major):** Không nhớ được độ cay đã thiết lập; xưng hô sai tên khách quen đã lưu trong hồ sơ.
- **Lỗi P3 (Minor):** Lời chào cá nhân hóa quá dài dòng hoặc lặp lại một mẫu câu duy nhất trong nhiều ngày liên tiếp.
