-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Cleaners can view their assigned bookings" ON public.bookings;

-- Create a security definer function to check if a user is assigned to a booking
CREATE OR REPLACE FUNCTION public.is_cleaner_assigned_to_booking(_booking_id uuid, _user_id uuid)
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
    WHERE b.id = _booking_id
      AND tm.user_id = _user_id
  )
$$;

-- Create a new policy using the security definer function
CREATE POLICY "Cleaners can view their assigned bookings"
ON public.bookings
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())) OR
  is_cleaner_assigned_to_booking(id, auth.uid())
);