-- Add scheduled_dates array column to jobs table for multiple dates support
ALTER TABLE public.jobs 
ADD COLUMN scheduled_dates timestamp with time zone[] DEFAULT '{}';

-- Add index for better performance when querying scheduled_dates
CREATE INDEX idx_jobs_scheduled_dates ON public.jobs USING GIN(scheduled_dates);