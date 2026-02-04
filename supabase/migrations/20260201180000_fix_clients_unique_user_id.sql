-- First: Clean up any duplicate client records for the same user, keeping the most recently created one.
-- This is necessary because we cannot add a UNIQUE constraint if duplicates exist.
DELETE FROM public.clients
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as r_num
    FROM public.clients
  ) t
  WHERE t.r_num > 1
);

-- Second: Add the unique constraint safely
DO $$
BEGIN
    -- Check if the constraint already exists to avoid errors on re-run
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'clients_user_id_unique'
    ) THEN
        ALTER TABLE public.clients ADD CONSTRAINT clients_user_id_unique UNIQUE (user_id);
    END IF;
END $$;
