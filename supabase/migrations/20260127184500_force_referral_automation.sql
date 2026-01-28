-- 1. Ensure the column exists securely
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'referral_code') THEN
    ALTER TABLE public.clients ADD COLUMN referral_code TEXT UNIQUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'referred_by_id') THEN
    ALTER TABLE public.clients ADD COLUMN referred_by_id UUID REFERENCES public.clients(id);
  END IF;
END $$;

-- 2. Create/Update the generation function
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    i INTEGER;
BEGIN
    LOOP
        new_code := 'DR';
        FOR i IN 1..4 LOOP
            new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
        END LOOP;
        
        -- Check if code is unique
        IF NOT EXISTS (SELECT 1 FROM public.clients WHERE referral_code = new_code) THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger to auto-assign a code ONLY for App-registered clients
CREATE OR REPLACE FUNCTION public.on_client_created_referral_v2()
RETURNS TRIGGER AS $$
BEGIN
    -- Only assign codes to self-registered clients
    IF NEW.client_source = 'App' AND NEW.referral_code IS NULL THEN
        NEW.referral_code := public.generate_referral_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_client_referral_code_v2 ON public.clients;
CREATE TRIGGER tr_client_referral_code_v2
BEFORE INSERT ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.on_client_created_referral_v2();

-- 4. Initialize codes for existing App-registered clients who don't have one
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM public.clients WHERE client_source = 'App' AND referral_code IS NULL LOOP
        UPDATE public.clients 
        SET referral_code = public.generate_referral_code() 
        WHERE id = r.id;
    END LOOP;
END $$;

-- 5. Force Schema Reload (if permission allows)
NOTIFY pgrst, 'reload schema';
