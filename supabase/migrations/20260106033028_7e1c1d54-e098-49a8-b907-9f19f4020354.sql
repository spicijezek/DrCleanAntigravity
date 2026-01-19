-- Ensure invoices & invoice_items are readable by the right people (business owner + the client)

-- Enable RLS (safe if already enabled)
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- INVOICES: SELECT
DROP POLICY IF EXISTS "Owners can view their invoices" ON public.invoices;
CREATE POLICY "Owners can view their invoices"
ON public.invoices
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Clients can view their invoices" ON public.invoices;
CREATE POLICY "Clients can view their invoices"
ON public.invoices
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.clients c
    WHERE c.id = invoices.client_id
      AND c.user_id = auth.uid()
  )
);

-- INVOICE_ITEMS: SELECT (owner + client via invoice)
DROP POLICY IF EXISTS "Owners can view their invoice items" ON public.invoice_items;
CREATE POLICY "Owners can view their invoice items"
ON public.invoice_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.invoices i
    WHERE i.id = invoice_items.invoice_id
      AND i.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Clients can view their invoice items" ON public.invoice_items;
CREATE POLICY "Clients can view their invoice items"
ON public.invoice_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.invoices i
    JOIN public.clients c ON c.id = i.client_id
    WHERE i.id = invoice_items.invoice_id
      AND c.user_id = auth.uid()
  )
);

-- Storage: allow the invoice owner OR the invoice's client to download the PDF from the private 'invoices' bucket
DROP POLICY IF EXISTS "Invoice PDFs readable by owner or client" ON storage.objects;
CREATE POLICY "Invoice PDFs readable by owner or client"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'invoices'
  AND EXISTS (
    SELECT 1
    FROM public.invoices i
    LEFT JOIN public.clients c ON c.id = i.client_id
    WHERE i.pdf_path = storage.objects.name
      AND (
        i.user_id = auth.uid()
        OR c.user_id = auth.uid()
      )
  )
);