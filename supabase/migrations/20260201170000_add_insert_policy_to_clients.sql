-- Add INSERT policy for clients table to allow new signups to save their data
-- This is required for upsert operations to work correctly for new records

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'clients' 
        AND policyname = 'Users can insert their own client record'
    ) THEN
        CREATE POLICY "Users can insert their own client record" ON public.clients
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Also ensure that during registration (when session might be fresh) 
-- users can check if their own record exists
DROP POLICY IF EXISTS "Clients can view their own data" ON public.clients;
CREATE POLICY "Clients can view their own data" ON public.clients
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
