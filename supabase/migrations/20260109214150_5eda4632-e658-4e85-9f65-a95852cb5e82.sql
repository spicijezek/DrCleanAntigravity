-- Add completed_at column to bookings table for tracking when cleaning finishes
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;