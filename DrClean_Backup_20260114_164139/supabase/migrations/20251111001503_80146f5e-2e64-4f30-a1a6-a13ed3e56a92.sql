-- Allow clients to view team members assigned to their bookings
CREATE POLICY "Clients can view team members assigned to their bookings"
ON public.team_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.bookings b
    JOIN public.clients c ON b.client_id = c.id
    WHERE c.user_id = auth.uid()
    AND team_members.id = ANY(b.team_member_ids)
  )
);