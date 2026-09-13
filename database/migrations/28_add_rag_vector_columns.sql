-- ==============================================================================
-- Migration 28: Add Advanced RAG Vector Columns & Policies Table (Paper 01)
-- ==============================================================================
-- Bước 1.1 Pha 1: Chuẩn bị schema CSDL cho Advanced RAG theo nghiên cứu
-- "Advancing RAG for Structured Enterprise Data"
--
-- Nội dung thực hiện:
-- 1. Kích hoạt extension pgvector (vector 768 dimensions - SentenceTransformers MPNet)
-- 2. Bổ sung cột embedding, row_serialized, dietary_tags vào bảng menu_items
-- 3. Tạo bảng restaurant_policies lưu trữ chính sách nhà hàng & seed dữ liệu ban đầu
-- 4. Khởi tạo chỉ mục HNSW (m=32, ef_construction=200) tối ưu Cosine Ops
-- 5. Tạo các hàm RPC tìm kiếm tương đồng vector trên Supabase
-- ==============================================================================

-- 1. Kích hoạt extension pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Bổ sung các cột phục vụ Advanced RAG vào bảng menu_items
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS embedding      vector(768) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS row_serialized TEXT        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS dietary_tags   TEXT[]      DEFAULT NULL;

COMMENT ON COLUMN menu_items.embedding IS 'Vector biểu diễn ngữ nghĩa 768 chiều sinh bởi SentenceTransformer (all-mpnet-base-v2)';
COMMENT ON COLUMN menu_items.row_serialized IS 'Chuỗi văn bản tuần tự hóa cấp hàng bảo toàn cấu trúc bảng biểu theo Paper 01 Mục 3.1.2';
COMMENT ON COLUMN menu_items.dietary_tags IS 'Mảng nhãn ăn kiêng / phân loại (vd: chay, thuần chay, không gluten, ít đường...) phục vụ lọc cứng metadata';

-- 3. Tạo bảng restaurant_policies (Chính sách nhà hàng phục vụ RAG)
CREATE TABLE IF NOT EXISTS restaurant_policies (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_type    VARCHAR(50) NOT NULL, -- 'voucher', 'refund', 'table_booking', 'allergen', 'outside_food', 'general'
    title          VARCHAR(255) NOT NULL,
    content        TEXT NOT NULL,
    row_serialized TEXT DEFAULT NULL,
    embedding      vector(768) DEFAULT NULL,
    is_active      BOOLEAN DEFAULT TRUE,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE restaurant_policies IS 'Bảng lưu trữ chính sách, quy định của nhà hàng phục vụ truy xuất RAG tư vấn chính sách';

-- Seed chính sách mặc định ban đầu nếu bảng còn trống
INSERT INTO restaurant_policies (policy_type, title, content)
SELECT 'voucher', 'Chính sách áp dụng mã giảm giá & Voucher', 'Mỗi hóa đơn chỉ áp dụng tối đa 01 mã voucher giảm giá. Voucher không có giá trị quy đổi thành tiền mặt và không áp dụng đồng thời với các chương trình khuyến mãi theo combo trừ khi có quy định riêng. Voucher phải còn hạn sử dụng tại thời điểm thanh toán.'
WHERE NOT EXISTS (SELECT 1 FROM restaurant_policies WHERE policy_type = 'voucher');

INSERT INTO restaurant_policies (policy_type, title, content)
SELECT 'refund', 'Chính sách đổi trả món & Hoàn tiền', 'Khách hàng có quyền yêu cầu đổi món mới hoặc hủy món nếu món ăn mang lên không đúng theo đơn đặt hàng, có dấu hiệu hư hỏng hoặc phát hiện dị vật. Việc hoàn tiền sẽ được hoàn trả qua đúng phương thức thanh toán ban đầu của khách hàng trong vòng 24 giờ.'
WHERE NOT EXISTS (SELECT 1 FROM restaurant_policies WHERE policy_type = 'refund');

INSERT INTO restaurant_policies (policy_type, title, content)
SELECT 'table_booking', 'Quy định đặt bàn & Giữ chỗ', 'Bàn đặt trước sẽ được giữ chỗ tối đa 15 phút so với giờ hẹn. Trường hợp khách đến trễ hơn 15 phút mà không thông báo trước, nhà hàng có quyền hủy bàn hoặc xếp bàn khác tùy tình trạng bàn trống thực tế. Khách đoàn trên 10 người vui lòng đặt cọc trước ít nhất 2 giờ.'
WHERE NOT EXISTS (SELECT 1 FROM restaurant_policies WHERE policy_type = 'table_booking');

INSERT INTO restaurant_policies (policy_type, title, content)
SELECT 'allergen', 'Cam kết an toàn thực phẩm & Cảnh báo dị ứng', 'Nhà hàng cam kết sử dụng 100% nguyên liệu tươi sạch có nguồn gốc rõ ràng. Thực khách có tiền sử dị ứng thực phẩm (hải sản, đậu phộng, trứng, sữa, gluten...) vui lòng thông báo cho nhân viên hoặc ghi chú trực tiếp khi đặt món trên ứng dụng để bếp xử lý riêng biệt.'
WHERE NOT EXISTS (SELECT 1 FROM restaurant_policies WHERE policy_type = 'allergen');

INSERT INTO restaurant_policies (policy_type, title, content)
SELECT 'outside_food', 'Quy định mang đồ ăn thức uống từ ngoài vào', 'Nhà hàng không khuyến khích mang đồ ăn từ bên ngoài vào nhằm đảm bảo tiêu chuẩn vệ sinh an toàn thực phẩm. Trường hợp khách mang rượu hoặc đồ uống có cồn từ bên ngoài vào sẽ áp dụng phí phục vụ đồ uống (phí khui chai) theo bảng giá niêm yết.'
WHERE NOT EXISTS (SELECT 1 FROM restaurant_policies WHERE policy_type = 'outside_food');

-- 4. Khởi tạo chỉ mục HNSW (Hierarchical Navigable Small World) và GIN
-- Cấu hình HNSW theo khuyến nghị Paper 01: M=32, efConstruction=200
CREATE INDEX IF NOT EXISTS idx_menu_hnsw 
ON menu_items USING hnsw (embedding vector_cosine_ops) 
WITH (m = 32, ef_construction = 200);

CREATE INDEX IF NOT EXISTS idx_policies_hnsw 
ON restaurant_policies USING hnsw (embedding vector_cosine_ops) 
WITH (m = 32, ef_construction = 200);

-- GIN Index cho mảng dietary_tags phục vụ lọc nhanh bằng toán tử @> hoặc &&
CREATE INDEX IF NOT EXISTS idx_menu_dietary_tags 
ON menu_items USING gin (dietary_tags);

-- 5. PostgreSQL RPC Functions phục vụ truy vấn vector từ Supabase Client

-- 5.1. RPC tìm kiếm món ăn tương đồng vector (Cosine Similarity)
CREATE OR REPLACE FUNCTION match_menu_items (
  query_embedding vector(768),
  match_threshold float DEFAULT 0.0,
  match_count int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  name varchar,
  price decimal,
  description text,
  image_url text,
  category_id uuid,
  ingredients text[],
  allergens text[],
  spice_level int,
  calories int,
  dietary_tags text[],
  row_serialized text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.name,
    m.price,
    m.description,
    m.image_url,
    m.category_id,
    m.ingredients,
    m.allergens,
    m.spice_level,
    m.calories,
    m.dietary_tags,
    m.row_serialized,
    (1 - (m.embedding <=> query_embedding))::float AS similarity
  FROM menu_items m
  WHERE m.is_available = true
    AND m.embedding IS NOT NULL
    AND (1 - (m.embedding <=> query_embedding)) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 5.2. RPC tìm kiếm chính sách tương đồng vector (Cosine Similarity)
CREATE OR REPLACE FUNCTION match_restaurant_policies (
  query_embedding vector(768),
  match_threshold float DEFAULT 0.0,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  policy_type varchar,
  title varchar,
  content text,
  row_serialized text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.policy_type,
    p.title,
    p.content,
    p.row_serialized,
    (1 - (p.embedding <=> query_embedding))::float AS similarity
  FROM restaurant_policies p
  WHERE p.is_active = true
    AND p.embedding IS NOT NULL
    AND (1 - (p.embedding <=> query_embedding)) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
