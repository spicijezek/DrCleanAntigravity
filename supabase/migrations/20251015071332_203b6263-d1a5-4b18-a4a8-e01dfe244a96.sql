-- Add bank_name column to company_info table
ALTER TABLE public.company_info
ADD COLUMN bank_name TEXT;