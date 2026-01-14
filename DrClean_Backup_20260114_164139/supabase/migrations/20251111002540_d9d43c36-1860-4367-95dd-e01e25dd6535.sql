-- Allow clients to view profiles of cleaners assigned to their bookings
CREATE POLICY "Clients can view profiles of assigned cleaners"
ON public.profiles
FOR SELECT
USING (
  user_id IN (
    SELECT tm.user_id
    FROM public.team_members tm
    JOIN public.bookings b ON tm.id = ANY(b.team_member_ids)
    JOIN public.clients c ON b.client_id = c.id
    WHERE c.user_id = auth.uid()
  )
);