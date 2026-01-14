-- Allow clients to view company info for payment details on their invoices
CREATE POLICY "Clients can view company info for payment"
ON public.company_info
FOR SELECT
USING (true);