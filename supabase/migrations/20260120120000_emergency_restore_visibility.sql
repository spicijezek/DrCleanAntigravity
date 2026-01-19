-- EMERGENCY SCRIPT V2 (Robust)
-- Goal: Reset RLS policies to "Allow All" for existing tables only.

DO $$ 
DECLARE 
    r RECORD; 
    t_name text;
    tables text[] := ARRAY['clients', 'jobs', 'bookings', 'invoices', 'team_members', 'client_checklists', 'checklist_rooms', 'checklist_tasks'];
BEGIN 
    -- 1. Drop ALL existing policies on relevant tables
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = ANY(tables)
    ) 
    LOOP 
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON "public"."' || r.tablename || '";'; 
    END LOOP;

    -- 2. Enable RLS and add "Allow All" policy for each table (IF it exists)
    FOREACH t_name IN ARRAY tables
    LOOP
        -- Check if table exists
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = t_name) THEN
            EXECUTE 'ALTER TABLE "public"."' || t_name || '" ENABLE ROW LEVEL SECURITY;';
            -- Drop specific emergency policy if it already exists (to avoid duplicate error)
            EXECUTE 'DROP POLICY IF EXISTS "Emergency: View All" ON "public"."' || t_name || '";';
            EXECUTE 'CREATE POLICY "Emergency: View All" ON "public"."' || t_name || '" FOR ALL USING (true);';
            RAISE NOTICE 'Applied Emergency Policy to %', t_name;
        ELSE
            RAISE NOTICE 'Table % does not exist, skipping.', t_name;
        END IF;
    END LOOP;
END $$;
