-- Fix client visibility: allow invoice access via booking_id as well (even if invoices.client_id is NULL)

-- INVOICES: replace client policy
DROP POLICY IF EXISTS "Clients can view their invoices" ON public.invoices;
CREATE POLICY "Clients can view their invoices"
ON public.invoices
FOR SELECT
USING (
  -- via invoices.client_id
  EXISTS (
    SELECT 1
    FROM public.clients c
    WHERE c.id = invoices.client_id
      AND c.user_id = auth.uid()
  )
  OR
  -- via invoices.booking_id -> bookings.client_id
  EXISTS (
    SELECT 1
    FROM public.bookings b
    JOIN public.clients c ON c.id = b.client_id
    WHERE b.id = invoices.booking_id
      AND c.user_id = auth.uid()
  )
);

-- INVOICE_ITEMS: replace client policy
DROP POLICY IF EXISTS "Clients can view their invoice items" ON public.invoice_items;
CREATE POLICY "Clients can view their invoice items"
ON public.invoice_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.invoices i
    LEFT JOIN public.clients c1 ON c1.id = i.client_id
    LEFT JOIN public.bookings b ON b.id = i.booking_id
    LEFT JOIN public.clients c2 ON c2.id = b.client_id
    WHERE i.id = invoice_items.invoice_id
      AND (c1.user_id = auth.uid() OR c2.user_id = auth.uid())
  )
);

-- STORAGE: replace select policy for invoices bucket
DROP POLICY IF EXISTS "Invoice PDFs readable by owner or client" ON storage.objects;
CREATE POLICY "Invoice PDFs readable by owner or client"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'invoices'
  AND EXISTS (
    SELECT 1
    FROM public.invoices i
    LEFT JOIN public.clients c1 ON c1.id = i.client_id
    LEFT JOIN public.bookings b ON b.id = i.booking_id
    LEFT JOIN public.clients c2 ON c2.id = b.client_id
    WHERE i.pdf_path = storage.objects.name
      AND (
        i.user_id = auth.uid()
        OR c1.user_id = auth.uid()
        OR c2.user_id = auth.uid()
      )
  )
);