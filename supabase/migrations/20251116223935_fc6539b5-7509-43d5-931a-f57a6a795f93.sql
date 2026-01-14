-- Add checklist_id and started_at to bookings table
ALTER TABLE public.bookings
ADD COLUMN checklist_id uuid REFERENCES public.client_checklists(id) ON DELETE SET NULL,
ADD COLUMN started_at timestamp with time zone;

-- Update RLS policy comment for clarity
COMMENT ON COLUMN public.bookings.checklist_id IS 'Links booking to a specific client checklist';
COMMENT ON COLUMN public.bookings.started_at IS 'Timestamp when cleaner started the job';