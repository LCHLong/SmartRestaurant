# 🤖 Tài Liệu Kế Hoạch & Triển Khai AI Đặt Bàn (Aria AI Reservation)

Thư mục này chứa toàn bộ tài liệu nghiên cứu, đề xuất kiến trúc và đặc tả kỹ thuật chi tiết cho tính năng **Mở rộng trợ lý AI Aria hỗ trợ Đặt bàn qua hội thoại (Conversational Table Reservation)** — thuộc **Phase 5 (Giai đoạn 2)** của hệ thống SmartRestaurant.

---

## 📂 Danh mục tài liệu

| Thứ tự | Tên tài liệu | Mô tả nội dung | Trạng thái |
|:---:|---|---|:---:|
| **01** | [**01_proposal_ai_dat_ban.md**](01_proposal_ai_dat_ban.md) | **Đề xuất Kiến trúc & Nghiên cứu Khả thi (Proposal v2.0):**<br>- Cơ sở lý luận, giải pháp hybrid (LLM Function Calling + Rule-based FSM)<br>- Phân tích bài toán kỹ thuật, ma trận so sánh các phương án<br>- Kế hoạch nguồn lực 2.5 tuần, bộ 25 test cases kiểm thử và tiêu chuẩn Go/No-Go | ✅ Đã duyệt |
| **02** | [**02_coding_spec_ai_dat_ban.md**](02_coding_spec_ai_dat_ban.md) | **Đặc tả Kỹ thuật Triển khai (Coding Spec):**<br>- Danh sách 10 Tasks chi tiết kèm code mẫu chuẩn (Python FastAPI + Node.js Express)<br>- Thiết kế State Machine trên Redis, Tool Layer, Date/time parser tiếng Việt<br>- Bảng tổng hợp các vấn đề kỹ thuật và backlog cần đồng bộ kiến trúc | ⚠️ Đang rà soát |

---

## 🔗 Tài liệu liên quan trong dự án

- Kế hoạch tổng thể Phase 5: [`Phase5.md`](../Phase5.md)
- Đề xuất kiến trúc AI Consultant hiện tại: [`06_ai_consultant_proposal.md`](../../06_ai_consultant_proposal.md)
