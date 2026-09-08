-- Migration: Bổ sung các trường phục vụ AI Consultant "Aria"
-- Chạy script này trong Supabase SQL Editor nếu muốn AI hiểu chi tiết nguyên liệu, dị ứng, calo...
-- Lưu ý: Tất cả các cột đều có thể NULL để không ảnh hưởng dữ liệu cũ.

ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS ingredients    TEXT[]    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS allergens      TEXT[]    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS spice_level    INTEGER   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS calories       INTEGER   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_description TEXT      DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_trending    BOOLEAN   DEFAULT FALSE;
