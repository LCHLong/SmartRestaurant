-- ==============================================================================
-- Rollback Migration 31: Drop Guest Profiles & Recall Memories
-- ==============================================================================

DROP TRIGGER IF EXISTS trg_guest_profiles_updated_at ON guest_profiles;
DROP FUNCTION IF EXISTS update_guest_profile_timestamp();

DROP INDEX IF EXISTS idx_guest_profiles_allergies;
DROP INDEX IF EXISTS idx_guest_profiles_dietary_preferences;
DROP INDEX IF EXISTS idx_guest_profiles_last_visit;
DROP INDEX IF EXISTS idx_guest_memories_user_created;
DROP INDEX IF EXISTS idx_guest_memories_user_id;
DROP INDEX IF EXISTS idx_guest_memories_type;
DROP INDEX IF EXISTS idx_guest_memories_hnsw;

DROP TABLE IF EXISTS guest_memories CASCADE;
DROP TABLE IF EXISTS guest_profiles CASCADE;

