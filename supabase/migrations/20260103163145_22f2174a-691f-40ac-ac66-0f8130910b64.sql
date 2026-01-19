-- Create a security definer function to check if cleaner is assigned to client's booking
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
      AND b.status = 'approved'
  )
$$;

-- Now create the RLS policy using the function (avoids recursion)
CREATE POLICY "Cleaners can view clients for assigned bookings"
ON public.clients
FOR SELECT
USING (
  public.is_cleaner_assigned_to_client(id, auth.uid())
);