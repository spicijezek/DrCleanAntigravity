-- Fix broken trigger function referencing NEW.room_id on checklist_rooms updates
-- The checklist_rooms table has checklist_id, not room_id. This migration replaces
-- the function body to use NEW.checklist_id so updating room_name no longer errors.

CREATE OR REPLACE FUNCTION public.update_checklist_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.client_checklists
  SET last_updated = now()
  WHERE id = NEW.checklist_id; -- correct column on checklist_rooms
  RETURN NEW;
END;
$$;

-- Ensure trigger exists and is using the corrected function
DO $$
BEGIN
  -- If trigger doesn't exist yet, create it (idempotent guard)
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_checklist_on_room_change'
  ) THEN
    CREATE TRIGGER update_checklist_on_room_change
    AFTER UPDATE ON public.checklist_rooms
    FOR EACH ROW
    EXECUTE FUNCTION public.update_checklist_timestamp();
  END IF;
END $$;