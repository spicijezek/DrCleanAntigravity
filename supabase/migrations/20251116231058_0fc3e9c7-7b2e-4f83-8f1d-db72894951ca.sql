-- Add invoice_id column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_invoice_id ON public.bookings(invoice_id);