-- ==============================================================================
-- Rollback Migration 32: Drop match_guest_memories RPC
-- ==============================================================================

DROP FUNCTION IF EXISTS match_guest_memories(uuid, vector(768), float, int);
