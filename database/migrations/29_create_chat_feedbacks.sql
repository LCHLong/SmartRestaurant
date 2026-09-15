-- ==============================================================================
-- Migration 29: Create Chat Feedbacks Table (Paper 01 - Telemetry & Feedback Loop)
-- ==============================================================================
-- Bước 4.2 Pha 4: Lưu trữ và quan trắc phản hồi người dùng (Thumbs Up / Down)
-- theo nghiên cứu "Advancing RAG for Structured Enterprise Data" (IIT Roorkee, 2025 - Mục 3.4 & 4.1)
--
-- Nội dung thực hiện:
-- 1. Tạo bảng chat_feedbacks lưu vết session_id, table_id, query, answer, feedback_type,
--    rejected_items, context_ids, rating, comment, metadata, created_at.
-- 2. Tạo chỉ mục tối ưu truy vấn theo session_id, feedback_type, và created_at.
-- 3. Hỗ trợ phân tích telemetry, giám sát mức độ hài lòng và tối ưu tự động trọng số Alpha.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS chat_feedbacks (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id     VARCHAR(100) NOT NULL,
    table_id       VARCHAR(50) DEFAULT NULL,
    user_id        UUID DEFAULT NULL,
    query          TEXT NOT NULL,
    answer         TEXT DEFAULT NULL,
    feedback_type  VARCHAR(30) NOT NULL, -- 'thumbs_up', 'thumbs_down', 'detailed'
    rating         SMALLINT DEFAULT NULL, -- 1 (thích), -1 (không thích), hoặc thang 1-5
    rejected_items JSONB DEFAULT '[]'::jsonb, -- Danh sách tên món hoặc ID món khách từ chối
    context_ids    JSONB DEFAULT '[]'::jsonb, -- Danh sách candidate IDs đã được RAG gợi ý
    comment        TEXT DEFAULT NULL,
    metadata       JSONB DEFAULT '{}'::jsonb, -- Chứa latency, ttft, alpha, rewrite_strategy...
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE chat_feedbacks IS 'Bảng lưu vết phản hồi đánh giá câu trả lời của trợ lý Aria (Thumbs Up / Down) phục vụ Telemetry và RAG Tuning';
COMMENT ON COLUMN chat_feedbacks.session_id IS 'Khóa phiên hội thoại của khách tại bàn';
COMMENT ON COLUMN chat_feedbacks.feedback_type IS 'Phân loại phản hồi: thumbs_up, thumbs_down, hoặc detailed';
COMMENT ON COLUMN chat_feedbacks.rejected_items IS 'Mảng JSON chứa danh sách món bị khách từ chối hoặc chê';
COMMENT ON COLUMN chat_feedbacks.context_ids IS 'Mảng JSON chứa ID các món ăn đã được truy xuất neo trong Grounded Prompt';

-- Chỉ mục hỗ trợ truy vấn telemetry & giám sát SLA
CREATE INDEX IF NOT EXISTS idx_chat_feedbacks_session_id ON chat_feedbacks (session_id);
CREATE INDEX IF NOT EXISTS idx_chat_feedbacks_feedback_type ON chat_feedbacks (feedback_type);
CREATE INDEX IF NOT EXISTS idx_chat_feedbacks_created_at ON chat_feedbacks (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_feedbacks_table_id ON chat_feedbacks (table_id) WHERE table_id IS NOT NULL;
