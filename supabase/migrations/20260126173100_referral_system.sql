-- Migration: Referral Program Setup
-- Adds referral code infrastructure to clients table

-- 1. Add columns to public.clients
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by_id UUID REFERENCES public.clients(id);

-- 2. Create function to generate unique 6-digit alphanumeric codes (DRXXXX)
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

-- 3. Trigger to auto-assign a code to new clients
CREATE OR REPLACE FUNCTION public.on_client_created_referral()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := public.generate_referral_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_client_referral_code ON public.clients;
CREATE TRIGGER tr_client_referral_code
BEFORE INSERT ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.on_client_created_referral();

-- 4. Initialize codes for existing clients
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM public.clients WHERE referral_code IS NULL LOOP
        UPDATE public.clients 
        SET referral_code = public.generate_referral_code() 
        WHERE id = r.id;
    END LOOP;
END $$;
