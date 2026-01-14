-- Drop old policies that use address matching
DROP POLICY IF EXISTS "Cleaners can view checklists for their assigned bookings" ON public.client_checklists;
DROP POLICY IF EXISTS "Cleaners can view rooms for their assigned bookings" ON public.checklist_rooms;
DROP POLICY IF EXISTS "Cleaners can mark rooms complete for their bookings" ON public.checklist_rooms;
DROP POLICY IF EXISTS "Cleaners can view tasks for their assigned bookings" ON public.checklist_tasks;

-- Create new policies using checklist_id from bookings
CREATE POLICY "Cleaners can view checklists for their assigned bookings" 
ON public.client_checklists 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM bookings b
    JOIN team_members tm ON tm.id = ANY(b.team_member_ids)
    WHERE tm.user_id = auth.uid() 
    AND b.status = 'approved' 
    AND b.checklist_id = client_checklists.id
  )
);

CREATE POLICY "Cleaners can view rooms for their assigned bookings" 
ON public.checklist_rooms 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM bookings b
    JOIN team_members tm ON tm.id = ANY(b.team_member_ids)
    WHERE tm.user_id = auth.uid() 
    AND b.status = 'approved' 
    AND b.checklist_id = checklist_rooms.checklist_id
  )
);

CREATE POLICY "Cleaners can mark rooms complete for their bookings" 
ON public.checklist_rooms 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 
    FROM bookings b
    JOIN team_members tm ON tm.id = ANY(b.team_member_ids)
    WHERE tm.user_id = auth.uid() 
    AND b.status = 'approved' 
    AND b.checklist_id = checklist_rooms.checklist_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM bookings b
    JOIN team_members tm ON tm.id = ANY(b.team_member_ids)
    WHERE tm.user_id = auth.uid() 
    AND b.status = 'approved' 
    AND b.checklist_id = checklist_rooms.checklist_id
  )
);

CREATE POLICY "Cleaners can view tasks for their assigned bookings" 
ON public.checklist_tasks 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM checklist_rooms r
    JOIN bookings b ON b.checklist_id = r.checklist_id
    JOIN team_members tm ON tm.id = ANY(b.team_member_ids)
    WHERE tm.user_id = auth.uid() 
    AND b.status = 'approved' 
    AND r.id = checklist_tasks.room_id
  )
);