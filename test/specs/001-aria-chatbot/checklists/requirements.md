# BẢNG ĐỐI SOÁT CHẤT LƯỢNG ĐẶC TẢ CHI TIẾT (SPECIFICATION QUALITY CHECKLIST)
**Dự án:** SmartRestaurant - Chatbox Trợ Lý Ẩm Thực Thông Minh Aria  
**Mã tài liệu:** `SPEC-ARIA-CHECKLIST-v2.0`  
**Liên kết đặc tả chính:** [spec.md](../spec.md)  
**Ngày lập & Kiểm toán:** 2026-11-21  

---

## 1. Kiểm tra Độ Sâu & Chi Tiết Nội Dung (Content Depth & Completeness)

- [x] **Mô hình kiến trúc hội thoại đa tầng (Dialog State Machine):** Mô tả chi tiết 5 bước từ trích xuất ý định, slot-filling, hành động nghiệp vụ đến render payload thẻ UI trực quan.
- [x] **Quy trình xử lý phân tầng (Layered Pipelines):** Phân hệ 1 có quy trình lọc 5 tầng toán học chi tiết (Hard Allergy -> Dietary -> Budget -> Context -> Integrity).
- [x] **Cấu trúc hình học & Thiết kế UI chi tiết:** Thẻ món ăn và Thẻ đặt bàn có quy chuẩn hình ảnh (16:9), typography, mã màu hex (`#1E293B`, `#EA580C`, `#2563EB`), kích thước nút và hiệu ứng chuyển trạng thái.
- [x] **State Machine & Cơ chế chống spam (Debounce / Rate Limit):** Quy chuẩn chi tiết khóa debounce 400ms và bộ đếm cooldown 45 giây cho nút gọi nhân viên và thêm món.
- [x] **Xử lý thời gian tự nhiên tiếng Việt phức tạp:** Bảng quy tắc toán học phân giải "tối mai", "tối mốt", "7 rưỡi tối", "bảy giờ kém 15", "trưa Chủ Nhật tuần sau".
- [x] **Bộ nhớ 3 tầng MemGPT:** Định nghĩa rõ ràng Working Memory, Short-term Conversational Memory và Long-term Profile, kèm quy tắc ghi đè khẩu vị tạm thời và quyền được lãng quên.
- [x] **Kịch bản hội thoại mẫu (Dialogue Scripts):** Cung cấp các câu thoại mẫu chi tiết cho tình huống bẫy món ảo, dị ứng kết hợp, mang thai, hết bàn và than phiền dịch vụ.

---

## 2. Kiểm tra Hợp Đồng Dữ Liệu (Schema & Data Contracts)

- [x] Đầy đủ interface TypeScript cho 4 thực thể cốt lõi: `Dish`, `CartItem`, `Reservation`, `CustomerProfile`.
- [x] Đầy đủ cấu trúc mẫu JSON Payload trả về cho UI Product Cards.
- [x] Định dạng chuẩn cho mã đặt bàn (`#RES-YYYY-XXXX`), số điện thoại Việt Nam (Regex), và đơn vị tiền tệ (`VNĐ`).

---

## 3. Tính Khả Thi Kiểm Thử & Truy Vết (Testability & Traceability)

- [x] Ánh xạ 100% không sót một test case nào từ `TC-REC-01..12`, `TC-ATC-01..12`, `TC-RES-01..13`, `TC-MEM-01..10`, `TC-SUP-01..10`, `TC-SEC-01..06`.
- [x] Tiêu chuẩn nghiệm thu định lượng rõ ràng: 0.0% Hallucination, 100% an toàn dị ứng, độ trễ $\le 1.8$s, độ nhạy nút bấm $\le 150$ms.

---

## 4. Kết luận Đánh giá Chất lượng
Bộ đặc tả tính năng phiên bản 2.0 tại `test/specs/` đã đạt **CẤP ĐỘ CHI TIẾT SẢN PHẨM SẴN SÀNG TRIỂN KHAI (PRODUCTION-READY DEEP SPECIFICATION)**, hoàn toàn đáp ứng các tiêu chuẩn khắt khe nhất của Spec-Kit SDD.
