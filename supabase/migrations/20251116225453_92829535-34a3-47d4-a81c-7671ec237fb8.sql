-- Add booking_id to invoices table to link invoices to bookings
ALTER TABLE public.invoices
ADD COLUMN booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_invoices_booking_id ON public.invoices(booking_id);

COMMENT ON COLUMN public.invoices.booking_id IS 'Links invoice to a specific booking (optional)';