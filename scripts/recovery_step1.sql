-- STEP 1: Drop the unique constraint on user_id
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_user_id_unique;
