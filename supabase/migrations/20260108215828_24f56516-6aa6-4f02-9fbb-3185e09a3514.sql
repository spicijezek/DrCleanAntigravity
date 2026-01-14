-- Create a table for booking feedback/ratings
CREATE TABLE public.booking_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  comment TEXT,
  declined BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint so each booking can only have one feedback
CREATE UNIQUE INDEX booking_feedback_booking_id_key ON public.booking_feedback(booking_id);

-- Enable Row Level Security
ALTER TABLE public.booking_feedback ENABLE ROW LEVEL SECURITY;

-- Clients can create feedback for their own bookings
CREATE POLICY "Clients can create feedback for their bookings"
ON public.booking_feedback
FOR INSERT
WITH CHECK (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
  AND booking_id IN (
    SELECT b.id FROM bookings b
    JOIN clients c ON b.client_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

-- Clients can view their own feedback
CREATE POLICY "Clients can view their own feedback"
ON public.booking_feedback
FOR SELECT
USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
ON public.booking_feedback
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete feedback
CREATE POLICY "Admins can delete feedback"
ON public.booking_feedback
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));