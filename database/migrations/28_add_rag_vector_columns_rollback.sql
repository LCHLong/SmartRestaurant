-- ==============================================================================
-- Rollback Migration 28: Revert Advanced RAG Vector Columns & Policies Table
-- ==============================================================================
-- Dùng để hoàn tác an toàn các thay đổi của migration 28 nếu cần khôi phục trạng thái cũ.
-- ==============================================================================

-- 1. Hủy các hàm RPC tìm kiếm vector
DROP FUNCTION IF EXISTS match_restaurant_policies(vector(768), float, int);
DROP FUNCTION IF EXISTS match_menu_items(vector(768), float, int);

-- 2. Hủy các chỉ mục HNSW và GIN
DROP INDEX IF EXISTS idx_policies_hnsw;
DROP INDEX IF EXISTS idx_menu_dietary_tags;
DROP INDEX IF EXISTS idx_menu_hnsw;

-- 3. Hủy bảng restaurant_policies (Lưu ý: sẽ xóa dữ liệu chính sách trong bảng này)
DROP TABLE IF EXISTS restaurant_policies;

-- 4. Loại bỏ các cột RAG khỏi bảng menu_items
ALTER TABLE menu_items
  DROP COLUMN IF EXISTS dietary_tags,
  DROP COLUMN IF EXISTS row_serialized,
  DROP COLUMN IF EXISTS embedding;

-- Lưu ý: Không DROP EXTENSION vector vì có thể có các bảng khác dùng pgvector.
-- Nếu muốn hủy hoàn toàn extension vector, hãy bỏ comment dòng sau:
-- DROP EXTENSION IF EXISTS vector;
