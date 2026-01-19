-- Drop the existing check constraint
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_check;

-- Add new check constraint that includes 'pending' status
ALTER TABLE public.jobs 
ADD CONSTRAINT jobs_status_check 
CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled', 'paid'));