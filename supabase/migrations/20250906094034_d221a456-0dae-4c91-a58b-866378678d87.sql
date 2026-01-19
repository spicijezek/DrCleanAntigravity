-- Add payment_received_date column to jobs table
ALTER TABLE public.jobs 
ADD COLUMN payment_received_date timestamp with time zone;