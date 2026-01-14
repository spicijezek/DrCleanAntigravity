-- Add client_source field to clients table
ALTER TABLE public.clients 
ADD COLUMN client_source text;