# Thư mục Cơ sở dữ liệu (Database)

Thư mục này chứa sơ đồ cơ sở dữ liệu (schema) và các tập lệnh migration cho dự án **Smart Restaurant**.

## Cấu trúc

- **`migrations/`**: Chứa các tập lệnh SQL để thiết lập và cập nhật sơ đồ cơ sở dữ liệu.
  - `01_init_schema.sql`: Khởi tạo các bảng cốt lõi (Người dùng, Bàn ăn, Thực đơn, Đơn hàng, v.v.).
  - Các file tiếp theo (ví dụ: `02_add_reviews.sql`, `03_missing_features.sql`...) áp dụng các tính năng mới và cập nhật theo thứ tự thời gian.
  - `27_add_ai_consultant_fields.sql`: Bổ sung nguyên liệu, dị ứng, calo, độ cay cho menu items.
  - `28_add_rag_vector_columns.sql`: Kích hoạt pgvector, thêm cột vector(768), row_serialized, dietary_tags, bảng restaurant_policies, chỉ mục HNSW và các hàm RPC tìm kiếm vector tương đồng (Advanced RAG).
  - `28_add_rag_vector_columns_rollback.sql`: Kịch bản rollback an toàn cho migration 28.

> 📖 **Tài liệu chi tiết:** Xem đặc tả thiết kế schema và chiến lược chỉ mục RAG tại [docs/10_database_rag_schema.md](../docs/10_database_rag_schema.md).

## Cách Import dữ liệu

### Cách 1: Sử dụng Supabase Dashboard (Khuyên dùng)
1.  Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard) của bạn.
2.  Đi tới tab **SQL Editor**.
3.  Mở các file trong thư mục `migrations/` theo đúng thứ tự (từ `01` trở lên).
4.  Sao chép nội dung của từng file, dán vào SQL Editor và nhấn **Run**.

### Cách 2: Sử dụng TablePlus hoặc DBeaver
1.  Kết nối với cơ sở dữ liệu của bạn bằng chuỗi kết nối (connection string) do Supabase cung cấp.
2.  Chạy các tập lệnh SQL theo đúng thứ tự.

### Cách 3: Sử dụng Supabase CLI
```bash
supabase db reset
```
*(Yêu cầu đã cấu hình `config.toml` đầy đủ và tuân thủ quy tắc đặt tên file migration nếu bạn đang phát triển ở môi trường local)*
