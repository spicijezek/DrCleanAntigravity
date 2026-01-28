-- Function to ensure a client has a referral code
CREATE OR REPLACE FUNCTION public.ensure_referral_code(p_client_id UUID)
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to ensure code is created even if RLS is tight
AS $$
DECLARE
    v_code TEXT;
    v_chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    v_exists BOOLEAN;
BEGIN
    -- 1. Check if client already has a code
    SELECT referral_code INTO v_code FROM public.clients WHERE id = p_client_id;
    
    IF v_code IS NOT NULL THEN
        RETURN v_code;
    END IF;

    -- 2. Generate and assign a new unique code
    LOOP
        v_code := 'DR';
        FOR i IN 1..4 LOOP
            v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::integer, 1);
        END LOOP;
        
        -- Check for collision
        SELECT EXISTS (SELECT 1 FROM public.clients WHERE referral_code = v_code) INTO v_exists;
        
        IF NOT v_exists THEN
            UPDATE public.clients SET referral_code = v_code WHERE id = p_client_id;
            RETURN v_code;
        END IF;
    END LOOP;
END;
$$;
