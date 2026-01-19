-- Add special_requirements column to client_checklists
ALTER TABLE public.client_checklists 
ADD COLUMN IF NOT EXISTS special_requirements TEXT;