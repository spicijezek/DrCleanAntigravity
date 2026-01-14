-- Add RLS policy for cleaners to view their assigned bookings
CREATE POLICY "Cleaners can view their assigned bookings"
ON public.bookings
FOR SELECT
USING (
  team_member_ids && ARRAY(
    SELECT id 
    FROM team_members 
    WHERE user_id = auth.uid()
  )
);