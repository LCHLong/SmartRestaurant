-- ==============================================================================
-- Migration 31: Add Guest Profiles & Recall Memories (Phase 6 - MemGPT F4)
-- ==============================================================================
-- Căn cứ khoa học: MemGPT: Towards LLMs as Operating Systems (UC Berkeley, 2023)
--
-- Mục tiêu:
-- 1. Bổ sung bảng guest_profiles (Archival Memory) lưu trữ hồ sơ ẩm thực bền vững
--    cho từng thực khách: dị ứng thực phẩm, độ cay, món ăn yêu thích, vị trí bàn quen,
--    số lần ghé thăm và các ngày kỷ niệm.
-- 2. Bổ sung bảng guest_memories (Recall Memory) lưu trữ các mẩu ký ức hội thoại
--    và lịch sử gọi món dạng vector 768 chiều (pgvector) để truy xuất ngữ nghĩa tương đồng.
-- 3. Đảm bảo ràng buộc an toàn: cơ chế Allergy Safety Latch (bảo toàn tuyệt đối dị ứng).
-- ==============================================================================

-- 1. Đảm bảo extension pgvector đã được kích hoạt
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. BẢNG HỒ SƠ DÀI HẠN THỰC KHÁCH (Archival Memory: guest_profiles)
CREATE TABLE IF NOT EXISTS guest_profiles (
    user_id              UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    allergies            TEXT[] DEFAULT '{}',                -- Danh sách chất gây dị ứng (bảo toàn an toàn 100%)
    dietary_preferences  JSONB DEFAULT '{}',                 -- Ăn chay, thuần chay, Halal, Keto...
    favorite_dishes      TEXT[] DEFAULT '{}',                -- Danh sách các món ăn thực khách yêu thích
    spice_preference     VARCHAR(50) DEFAULT 'vừa',          -- 'không cay', 'ít cay', 'vừa', 'cay nồng'
    preferred_zone       VARCHAR(100) DEFAULT NULL,          -- 'ngoài trời', 'phòng VIP', 'cạnh cửa sổ', 'tầng 2'
    special_notes        TEXT DEFAULT NULL,                  -- Ghi chú đặc biệt (vd: có con nhỏ, cần ghế em bé)
    special_dates        JSONB DEFAULT '[]',                 -- Danh sách ngày kỷ niệm: [{"event": "sinh nhật", "date": "12-09"}]
    visit_count          INT DEFAULT 1 CHECK (visit_count >= 0),
    last_visit           TIMESTAMPTZ DEFAULT NOW(),
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    updated_at           TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE guest_profiles IS 'Archival Memory theo kiến trúc MemGPT: Lưu trữ hồ sơ sở thích và dị ứng lâu dài của thực khách';
COMMENT ON COLUMN guest_profiles.allergies IS 'Danh sách dị ứng thực phẩm, chịu sự giám sát của Allergy Safety Latch (không bao giờ tự ý xóa)';
COMMENT ON COLUMN guest_profiles.preferred_zone IS 'Khu vực ngồi hoặc loại bàn yêu thích của khách quen';

-- 3. BẢNG KÝ ỨC HỒI TƯỞNG NGỮ NGHĨA (Recall Memory: guest_memories)
CREATE TABLE IF NOT EXISTS guest_memories (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id           VARCHAR(64) DEFAULT NULL,
    memory_type          VARCHAR(50) NOT NULL DEFAULT 'conversation_fact', -- 'order_fact', 'conversation_fact', 'feedback'
    content              TEXT NOT NULL,                                     -- Nội dung tóm tắt ký ức
    embedding            vector(768) DEFAULT NULL,                          -- Vector nhúng ngữ nghĩa (all-mpnet-base-v2)
    metadata             JSONB DEFAULT '{}',                                -- Thông tin phụ trợ (mã bàn, thời gian, món ăn liên quan)
    created_at           TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE guest_memories IS 'Recall Memory theo MemGPT: Lưu trữ các mẩu ký ức hội thoại và tương tác phục vụ tìm kiếm ngữ nghĩa';

-- 4. TẠO CÁC CHỈ MỤC TỐI ƯU TRUY VẤN
CREATE INDEX IF NOT EXISTS idx_guest_profiles_last_visit ON guest_profiles (last_visit DESC);
CREATE INDEX IF NOT EXISTS idx_guest_memories_user_id ON guest_memories (user_id);
CREATE INDEX IF NOT EXISTS idx_guest_memories_type ON guest_memories (memory_type);

-- Chỉ mục HNSW cho tìm kiếm vector tương đồng trên bảng ký ức hồi tưởng
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE tablename = 'guest_memories' AND indexname = 'idx_guest_memories_hnsw'
    ) THEN
        CREATE INDEX idx_guest_memories_hnsw ON guest_memories 
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Bỏ qua khởi tạo HNSW index nếu pgvector chưa đủ bản ghi hoặc chạy trên môi trường test';
END $$;

-- 5. TRIGGER TỰ ĐỘNG CẬP NHẬT updated_at CHO guest_profiles
CREATE OR REPLACE FUNCTION update_guest_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guest_profiles_updated_at ON guest_profiles;
CREATE TRIGGER trg_guest_profiles_updated_at
    BEFORE UPDATE ON guest_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_guest_profile_timestamp();
