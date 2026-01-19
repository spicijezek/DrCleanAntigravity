-- Update function to include in_progress and completed statuses
CREATE OR REPLACE FUNCTION public.is_cleaner_assigned_to_client(_client_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bookings b
    JOIN public.team_members tm ON tm.id = ANY(b.team_member_ids)
    WHERE b.client_id = _client_id
      AND tm.user_id = _user_id
      AND b.status IN ('approved', 'in_progress', 'completed')
  )
$$;

-- Update client_checklists policy
DROP POLICY IF EXISTS "Cleaners can view checklists for their assigned bookings" ON public.client_checklists;
CREATE POLICY "Cleaners can view checklists for their assigned bookings" 
ON public.client_checklists 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM bookings b
    JOIN team_members tm ON tm.id = ANY(b.team_member_ids)
    WHERE tm.user_id = auth.uid() 
    AND b.status IN ('approved', 'in_progress', 'completed')
    AND b.checklist_id = client_checklists.id
  )
);

-- Update checklist_rooms policies
DROP POLICY IF EXISTS "Cleaners can view rooms for their assigned bookings" ON public.checklist_rooms;
CREATE POLICY "Cleaners can view rooms for their assigned bookings" 
ON public.checklist_rooms 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM bookings b
    JOIN team_members tm ON tm.id = ANY(b.team_member_ids)
    WHERE tm.user_id = auth.uid() 
    AND b.status IN ('approved', 'in_progress', 'completed')
    AND b.checklist_id = checklist_rooms.checklist_id
  )
);

DROP POLICY IF EXISTS "Cleaners can mark rooms complete for their bookings" ON public.checklist_rooms;
CREATE POLICY "Cleaners can mark rooms complete for their bookings" 
ON public.checklist_rooms 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 
    FROM bookings b
    JOIN team_members tm ON tm.id = ANY(b.team_member_ids)
    WHERE tm.user_id = auth.uid() 
    AND b.status IN ('approved', 'in_progress', 'completed')
    AND b.checklist_id = checklist_rooms.checklist_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM bookings b
    JOIN team_members tm ON tm.id = ANY(b.team_member_ids)
    WHERE tm.user_id = auth.uid() 
    AND b.status IN ('approved', 'in_progress', 'completed')
    AND b.checklist_id = checklist_rooms.checklist_id
  )
);

-- Update checklist_tasks policy
DROP POLICY IF EXISTS "Cleaners can view tasks for their assigned bookings" ON public.checklist_tasks;
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
    AND b.status IN ('approved', 'in_progress', 'completed')
    AND r.id = checklist_tasks.room_id
  )
);
