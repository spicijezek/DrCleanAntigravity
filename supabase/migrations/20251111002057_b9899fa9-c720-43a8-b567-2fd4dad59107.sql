-- Allow admins to delete team members
CREATE POLICY "Admins can delete team members"
ON public.team_members
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));