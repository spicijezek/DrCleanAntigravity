-- Add client_id column to invoices table for proper linking
ALTER TABLE public.invoices
ADD COLUMN client_id uuid REFERENCES public.clients(id);

-- Create index for better query performance
CREATE INDEX idx_invoices_client_id ON public.invoices(client_id);