-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Cleaners can view clients for their assigned bookings" ON public.clients;