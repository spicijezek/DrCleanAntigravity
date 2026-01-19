-- Add payment_type field to jobs table
ALTER TABLE public.jobs 
ADD COLUMN payment_type text DEFAULT 'cash' CHECK (payment_type IN ('cash', 'bank'));