-- Create bookings table for client inquiries
CREATE TABLE public.bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL,
  user_id uuid NOT NULL,
  service_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  scheduled_date timestamp with time zone,
  address text NOT NULL,
  booking_details jsonb NOT NULL,
  team_member_ids uuid[] DEFAULT '{}',
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Clients can create their own bookings
CREATE POLICY "Clients can create bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (client_id IN (
  SELECT id FROM public.clients WHERE user_id = auth.uid()
));

-- Clients can view their own bookings
CREATE POLICY "Clients can view their own bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (client_id IN (
  SELECT id FROM public.clients WHERE user_id = auth.uid()
));

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update all bookings
CREATE POLICY "Admins can update all bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete bookings
CREATE POLICY "Admins can delete bookings"
ON public.bookings
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();