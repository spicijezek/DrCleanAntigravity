-- Fix duplicate clients by merging their data
-- Step 1: For each user_id, identify the client to keep (most recent) and ones to merge

DO $$
DECLARE
  user_record RECORD;
  keep_client_id UUID;
  merge_client_ids UUID[];
BEGIN
  -- For each user with duplicate clients
  FOR user_record IN 
    SELECT user_id, COUNT(*) as count
    FROM clients
    GROUP BY user_id
    HAVING COUNT(*) > 1
  LOOP
    -- Get the most recent client (the one we'll keep)
    SELECT id INTO keep_client_id
    FROM clients
    WHERE user_id = user_record.user_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Get all other client IDs to merge
    SELECT ARRAY_AGG(id) INTO merge_client_ids
    FROM clients
    WHERE user_id = user_record.user_id AND id != keep_client_id;
    
    -- Update all related records to point to the kept client
    UPDATE invoices SET client_id = keep_client_id WHERE client_id = ANY(merge_client_ids);
    UPDATE quotes SET client_id = keep_client_id WHERE client_id = ANY(merge_client_ids);
    UPDATE jobs SET client_id = keep_client_id WHERE client_id = ANY(merge_client_ids);
    UPDATE loyalty_credits SET client_id = keep_client_id WHERE client_id = ANY(merge_client_ids);
    UPDATE loyalty_transactions SET client_id = keep_client_id WHERE client_id = ANY(merge_client_ids);
    UPDATE client_checklists SET client_id = keep_client_id WHERE client_id = ANY(merge_client_ids);
    UPDATE client_notifications SET client_id = keep_client_id WHERE client_id = ANY(merge_client_ids);
    UPDATE client_feedback SET client_id = keep_client_id WHERE client_id = ANY(merge_client_ids);
    
    -- Now delete the duplicate clients
    DELETE FROM clients WHERE id = ANY(merge_client_ids);
  END LOOP;
END $$;

-- Add a unique constraint to prevent future duplicates
ALTER TABLE clients
ADD CONSTRAINT clients_user_id_unique UNIQUE (user_id);

-- Add a helpful comment
COMMENT ON CONSTRAINT clients_user_id_unique ON clients 
IS 'Ensures each user can only have one client record';