-- Add missing client form fields to clients table
ALTER TABLE public.clients 
ADD COLUMN client_type text DEFAULT 'person',
ADD COLUMN company_id text,
ADD COLUMN company_legal_name text,
ADD COLUMN reliable_person text;