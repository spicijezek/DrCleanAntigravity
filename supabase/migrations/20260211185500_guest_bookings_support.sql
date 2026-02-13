-- 1. Make user_id nullable in clients and bookings
ALTER TABLE public.clients ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN user_id DROP NOT NULL;

-- 2. Allow anon role to insert into clients and bookings
-- This enables public booking forms without prior registration
CREATE POLICY "Allow anon to insert guest clients" ON public.clients
    FOR INSERT TO anon WITH CHECK (user_id IS NULL);

CREATE POLICY "Allow anon to insert guest bookings" ON public.bookings
    FOR INSERT TO anon WITH CHECK (user_id IS NULL);

-- 3. Allow anon to select their just-created client record (needed for booking linking in same session)
-- We use a simple check or rely on the response from insert
-- For better security, we could use a session-based token, but for now we follow the user's request
CREATE POLICY "Allow anon to select guest clients" ON public.clients
    FOR SELECT TO anon USING (user_id IS NULL);

CREATE POLICY "Allow anon to select guest bookings" ON public.bookings
    FOR SELECT TO anon USING (user_id IS NULL);
