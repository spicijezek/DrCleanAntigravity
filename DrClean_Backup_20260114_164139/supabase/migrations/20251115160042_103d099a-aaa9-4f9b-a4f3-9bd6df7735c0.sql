-- Drop policies that depend on property_address
DROP POLICY IF EXISTS "Cleaners can view checklists for their assigned bookings" ON public.client_checklists;
DROP POLICY IF EXISTS "Cleaners can view rooms for their assigned bookings" ON public.checklist_rooms;
DROP POLICY IF EXISTS "Cleaners can view tasks for their assigned bookings" ON public.checklist_tasks;

-- Add new address fields to client_checklists
ALTER TABLE public.client_checklists
ADD COLUMN street TEXT,
ADD COLUMN city TEXT,
ADD COLUMN postal_code TEXT;

-- Migrate existing data (copy property_address to street field)
UPDATE public.client_checklists
SET street = property_address
WHERE property_address IS NOT NULL;

-- Drop the old property_address column
ALTER TABLE public.client_checklists
DROP COLUMN property_address CASCADE;

-- Make street NOT NULL after migration
ALTER TABLE public.client_checklists
ALTER COLUMN street SET NOT NULL;

-- Recreate policy for cleaners to view checklists with new address matching
CREATE POLICY "Cleaners can view checklists for their assigned bookings"
ON public.client_checklists
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.bookings b
    JOIN public.team_members tm ON tm.id = ANY(b.team_member_ids)
    WHERE tm.user_id = auth.uid()
      AND b.status = 'approved'
      AND b.address = CONCAT_WS(', ', client_checklists.street, client_checklists.city, client_checklists.postal_code)
  )
);

-- Recreate policy for cleaners to view rooms
CREATE POLICY "Cleaners can view rooms for their assigned bookings"
ON public.checklist_rooms
FOR SELECT
TO authenticated
USING (
  checklist_id IN (
    SELECT c.id
    FROM public.client_checklists c
    WHERE EXISTS (
      SELECT 1
      FROM public.bookings b
      JOIN public.team_members tm ON tm.id = ANY(b.team_member_ids)
      WHERE tm.user_id = auth.uid()
        AND b.status = 'approved'
        AND b.address = CONCAT_WS(', ', c.street, c.city, c.postal_code)
    )
  )
);

-- Recreate policy for cleaners to view tasks
CREATE POLICY "Cleaners can view tasks for their assigned bookings"
ON public.checklist_tasks
FOR SELECT
TO authenticated
USING (
  room_id IN (
    SELECT r.id
    FROM public.checklist_rooms r
    JOIN public.client_checklists c ON r.checklist_id = c.id
    WHERE EXISTS (
      SELECT 1
      FROM public.bookings b
      JOIN public.team_members tm ON tm.id = ANY(b.team_member_ids)
      WHERE tm.user_id = auth.uid()
        AND b.status = 'approved'
        AND b.address = CONCAT_WS(', ', c.street, c.city, c.postal_code)
    )
  )
);