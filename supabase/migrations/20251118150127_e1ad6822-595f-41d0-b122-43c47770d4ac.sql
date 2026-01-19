-- Drop the problematic policy
DROP POLICY IF EXISTS "Cleaners can complete their assigned bookings" ON public.bookings;

-- Recreate it using the security definer function to avoid recursion
CREATE POLICY "Cleaners can complete their assigned bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (is_cleaner_assigned_to_booking(id, auth.uid()))
WITH CHECK (is_cleaner_assigned_to_booking(id, auth.uid()));