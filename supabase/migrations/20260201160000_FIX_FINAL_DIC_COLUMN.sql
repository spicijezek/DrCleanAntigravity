-- FINAL FIX: Add dic column to clients table and RELOAD SCHEMA CACHE
-- This script ensures the column exists and forces PostgREST to see it.

DO $$ 
BEGIN 
  -- 1. Add the column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'dic') THEN
    ALTER TABLE public.clients ADD COLUMN dic TEXT;
    COMMENT ON COLUMN public.clients.dic IS 'VAT ID for companies (DIČ)';
  END IF;

  -- 2. Force a schema reload for PostgREST
  -- This is the most reliable way to fix "column not in schema cache" errors
  NOTIFY pgrst, 'reload schema';
END $$;
