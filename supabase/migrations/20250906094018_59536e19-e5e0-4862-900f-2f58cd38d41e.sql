-- Add payment_received_date column to jobs table
ALTER TABLE public.jobs 
ADD COLUMN payment_received_date timestamp with time zone;

-- Update status column to have proper enum values
ALTER TABLE public.jobs 
ALTER COLUMN status TYPE text;

-- Add constraint for valid status values
ALTER TABLE public.jobs 
ADD CONSTRAINT jobs_status_check 
CHECK (status IN ('scheduled', 'finished', 'paid'));

-- Update default status
ALTER TABLE public.jobs 
ALTER COLUMN status SET DEFAULT 'scheduled';