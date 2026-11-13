-- ==============================================================================
-- Migration 32: Add match_guest_memories RPC (Phase 6 - MemGPT F4 Semantic Memory)
-- ==============================================================================
-- Căn cứ khoa học: MemGPT: Towards LLMs as Operating Systems (UC Berkeley, 2023)
--
-- Mục tiêu:
-- Cung cấp hàm RPC tìm kiếm ngữ nghĩa tương đồng (Cosine Similarity) trên bảng
-- guest_memories sử dụng pgvector và chỉ mục HNSW (idx_guest_memories_hnsw).
-- ==============================================================================

CREATE OR REPLACE FUNCTION match_guest_memories (
  p_user_id uuid,
  query_embedding vector(768),
  match_threshold float DEFAULT 0.0,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  session_id varchar,
  memory_type varchar,
  content text,
  metadata jsonb,
  similarity float,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    gm.id,
    gm.user_id,
    gm.session_id,
    gm.memory_type,
    gm.content,
    gm.metadata,
    (1 - (gm.embedding <=> query_embedding))::float AS similarity,
    gm.created_at
  FROM guest_memories gm
  WHERE gm.user_id = p_user_id
    AND gm.embedding IS NOT NULL
    AND (1 - (gm.embedding <=> query_embedding)) >= match_threshold
  ORDER BY gm.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_guest_memories IS 'Tìm kiếm ký ức hồi tưởng (Recall Memory) theo độ tương đồng Cosine qua pgvector';
