-- Allow admins to create bookings for any client
CREATE POLICY "Admins can create bookings for any client"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));
