-- Fix jobs.status constraint to include 'finished' and 'paid'
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS job_status_check;

ALTER TABLE public.jobs
ADD CONSTRAINT jobs_status_check
CHECK (status IN ('scheduled', 'in_progress', 'finished', 'paid', 'cancelled'));
