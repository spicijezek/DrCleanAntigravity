-- Grant permissions on invoice_items
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_items TO service_role;

-- Ensure RLS is enabled
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Re-create the owner policy just in case
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
