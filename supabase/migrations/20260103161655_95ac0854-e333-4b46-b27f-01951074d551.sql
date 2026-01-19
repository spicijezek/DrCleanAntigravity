-- Add RLS policy to allow cleaners to view client data for their assigned bookings
CREATE POLICY "Cleaners can view clients for their assigned bookings"
ON public.clients
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM bookings b
    JOIN team_members tm ON tm.id = ANY(b.team_member_ids)
    WHERE b.client_id = clients.id
      AND tm.user_id = auth.uid()
      AND b.status = 'approved'
  )
);