-- Allow admins to view all team members
CREATE POLICY "Admins can view all team members"
ON public.team_members
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));