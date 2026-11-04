-- ==============================================================================
-- Rollback Migration 31: Drop Guest Profiles & Recall Memories
-- ==============================================================================

DROP TRIGGER IF EXISTS trg_guest_profiles_updated_at ON guest_profiles;
DROP FUNCTION IF EXISTS update_guest_profile_timestamp();

DROP TABLE IF EXISTS guest_memories CASCADE;
DROP TABLE IF EXISTS guest_profiles CASCADE;
