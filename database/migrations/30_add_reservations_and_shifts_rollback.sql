-- ==============================================================================
-- Rollback Migration 30: Drop Reservations & Staff Shifts Tables
-- ==============================================================================

DROP TABLE IF EXISTS shift_swap_requests CASCADE;
DROP TABLE IF EXISTS shift_assignments CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;

DROP TYPE IF EXISTS shift_status CASCADE;
DROP TYPE IF EXISTS deposit_status CASCADE;
DROP TYPE IF EXISTS reservation_status CASCADE;
