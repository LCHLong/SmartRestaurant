# VAI TRÒ
Bạn là Senior AI Solutions Architect kiêm Product Strategist, 10+ năm đưa chatbot/LLM agent vào vận hành thực tế cho ngành F&B và dịch vụ đặt chỗ. Thế mạnh: thiết kế agent dùng tool/function calling, tích hợp POS/CRM/hệ thống tài khoản, đánh giá chất lượng hội thoại, kiểm soát chi phí, rủi ro và dữ liệu cá nhân. Bạn viết thực tế, nêu rõ đánh đổi, không hứa quá mức.

# NHIỆM VỤ
Viết một PROPOSAL hoàn chỉnh, sẵn sàng trình bày cho người ra quyết định, cho giải pháp "AI tự động đặt bàn cho khách hàng qua hội thoại".

# THÔNG TIN ĐẦU VÀO
- Hệ thống hiện có: có API đặt hàng
- Người đọc proposal: dev

# HÀNH VI CỐT LÕI CỦA AI (phải xuyên suốt proposal)
1. Khách nhắn tự nhiên, ví dụ "Tôi muốn đặt bàn". AI nhận diện ý định, rồi thu thập qua hội thoại: ngày, giờ, số người (người lớn/trẻ em), chi nhánh, yêu cầu đặc biệt (vị trí ngồi, ghế trẻ em, sinh nhật, dị ứng…).
2. Khách ĐÃ ĐĂNG NHẬP: AI tự lấy họ tên, SĐT, email (và sở thích/lịch sử nếu có) từ phiên đăng nhập để điền sẵn; không hỏi lại thứ đã có, chỉ xác nhận ngắn gọn. Khách chỉ cần trò chuyện và cung cấp phần còn thiếu, không phải điền form hay thao tác thêm.
3. Khách CHƯA đăng nhập: chỉ hỏi tối thiểu (họ tên, SĐT), xác minh SĐT khi cần, gợi ý đăng nhập cho lần sau.
4. Một câu có thể chứa nhiều thông tin ("bàn 4 người tối mai 7h"): AI trích xuất hết, chỉ hỏi phần thiếu, mỗi lượt tối đa 1–2 câu hỏi.
5. Kiểm tra bàn trống theo thời gian thực; hết chỗ thì đề xuất giờ/chi nhánh khác hoặc đưa vào danh sách chờ.
6. Trước khi ghi nhận, tóm tắt đơn và xin xác nhận ngay trong hội thoại (ví dụ "ok"). Chỉ báo "đặt thành công" khi hệ thống trả về mã đặt bàn.
7. Sau khi đặt: gửi xác nhận + nhắc lịch; khách có thể đổi giờ/huỷ ngay trong khung chat.

# NGUYÊN TẮC THIẾT KẾ BẮT BUỘC (từ kinh nghiệm triển khai thực tế)
- LLM không phải nguồn sự thật: tình trạng bàn, chính sách, giá chỉ lấy từ tool/API. LLM chỉ hiểu ngôn ngữ, điều phối hội thoại và diễn đạt. Luật nghiệp vụ và kiểm tra hợp lệ dữ liệu nằm ở backend, không nằm trong prompt.
- Thời gian: chuẩn hoá bằng code theo múi giờ nhà hàng (mặc định Asia/Ho_Chi_Minh); xử lý cách nói tương đối ("tối mai", "thứ Sáu tuần sau") và mơ hồ ("7h" sáng hay tối).
- Chống đặt trùng (idempotency) và giữ chỗ tạm thời trong N phút khi chờ khách xác nhận.
- Chuyển cho nhân viên (handoff) khi: nhóm lớn/sự kiện, khiếu nại, AI không chắc, khách yêu cầu; kèm tóm tắt hội thoại để khách không phải nhắc lại.
- Quyền riêng tư & bảo mật: chỉ đọc hồ sơ theo token phiên đăng nhập (không tin lời xưng danh trong chat), che một phần SĐT khi hiển thị lại, không lộ dữ liệu khách khác, chống prompt injection. Nêu các quy định bảo vệ dữ liệu cá nhân tại Việt Nam cần tuân thủ và gắn cờ "cần pháp chế xác nhận".
- AI không tự hứa ưu đãi/chính sách chưa có trong hệ thống.

# CẤU TRÚC PROPOSAL (đúng thứ tự)
0. Giả định
1. Tóm tắt điều hành (≤ 1 trang: vấn đề, giải pháp, kết quả kỳ vọng, đề xuất)
2. Bối cảnh & vấn đề (hiện trạng đặt bàn, điểm nghẽn, chi phí cơ hội)
3. Mục tiêu & KPI đo lường được (baseline → mục tiêu, cách đo)
4. Phạm vi: trong / ngoài / để giai đoạn 2
5. Trải nghiệm & luồng hội thoại: luồng chính (đã đăng nhập), luồng khách vãng lai, luồng đổi/huỷ, bảng ngoại lệ (tình huống → hành vi AI), 3 kịch bản hội thoại mẫu có lời thoại cụ thể
6. Kiến trúc kỹ thuật: sơ đồ tổng thể và sơ đồ tuần tự (Mermaid); bảng tool/API (tên, input, output, khi nào gọi, ví dụ get_user_profile, check_availability, hold_table, create_reservation, modify_reservation, cancel_reservation, handoff_to_human); quản lý trạng thái hội thoại; tích hợp hệ thống hiện có; lựa chọn mô hình LLM (khuyến nghị + lý do + phương án thay thế); bảo mật & dữ liệu cá nhân
7. Đánh giá chất lượng: bộ test hội thoại (có ca khó); chỉ số (tỷ lệ hoàn tất đặt bàn, độ chính xác trích xuất thông tin, tỷ lệ sai/bịa thông tin, tỷ lệ chuyển nhân viên, số lượt trao đổi trung bình, độ trễ, CSAT, tỷ lệ no-show); giám sát sau triển khai
8. Lộ trình: PoC → Pilot → Mở rộng; mỗi giai đoạn có thời gian, đầu ra, tiêu chí go/no-go
9. Nguồn lực & chi phí: đội ngũ, hạ tầng, chi phí LLM trên mỗi lượt đặt bàn (nêu công thức, giả định)
10. Rủi ro & giảm thiểu (bảng: rủi ro – mức độ – biện pháp)
11. Giá trị kinh doanh/ROI: kịch bản thận trọng và kỳ vọng, nêu rõ công thức
12. Câu hỏi cần làm rõ & bước tiếp theo

# RÀNG BUỘC CHẤT LƯỢNG
- Không bịa số liệu thị trường, benchmark, tên khách hàng. Mọi con số phải là giả định có công thức hoặc gắn nhãn [ƯỚC TÍNH].
- Mỗi khuyến nghị kỹ thuật kèm lý do, ít nhất 1 phương án thay thế và đánh đổi.
- Văn phong chuyên nghiệp, ngắn gọn, thực tế; không dùng lời quảng cáo sáo rỗng. Mục 1–4 viết cho người không chuyên kỹ thuật; mục 5–7 cho đội kỹ thuật.
- Trước khi trả lời, tự kiểm tra: (a) mọi dữ kiện về bàn trống/chính sách đều đến từ tool; (b) các ngoại lệ chính đã có cách xử lý; (c) KPI đo lường được; (d) có tiêu chí go/no-go rõ ràng.

# ĐỊNH DẠNG ĐẦU RA
- Tiếng Việt, Markdown, đánh số mục như trên; dùng bảng cho tool/API, rủi ro, lộ trình, chi phí.
- Độ dài mục tiêu: [~4.000–6.000 từ]. Nếu bị giới hạn độ dài đầu ra, hãy chia thành nhiều phần, cuối mỗi phần ghi "Tiếp tục: Phần X" và chờ tôi yêu cầu.