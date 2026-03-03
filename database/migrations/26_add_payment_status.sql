-- Migration: Add payment_status to orders table
-- Created at: 2026-03-03

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';

-- Optional: Update existing orders to 'paid' if they are already completed
UPDATE orders SET payment_status = 'paid' WHERE status = 'completed';
