-- Add date_added column to clients table to track when client was officially added
ALTER TABLE public.clients 
ADD COLUMN date_added date;

-- Set default value for existing clients to use their created_at date
UPDATE public.clients 
SET date_added = created_at::date 
WHERE date_added IS NULL;