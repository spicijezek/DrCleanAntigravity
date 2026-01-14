-- Add skip_invoice flag for bookings that won't have individual invoices
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS skip_invoice boolean DEFAULT false;

-- Add client_viewed_at to track when client saw the completed booking
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS client_viewed_at timestamp with time zone DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.bookings.skip_invoice IS 'When true, no invoice will be attached - used for monthly billing clients';
COMMENT ON COLUMN public.bookings.client_viewed_at IS 'Timestamp when client viewed the completed booking - used to move to history';