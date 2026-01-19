-- Fix search path for the trigger function
CREATE OR REPLACE FUNCTION update_checklist_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.client_checklists
  SET last_updated = now()
  WHERE id = (
    SELECT checklist_id FROM public.checklist_rooms WHERE id = NEW.room_id
  );
  RETURN NEW;
END;
$$;