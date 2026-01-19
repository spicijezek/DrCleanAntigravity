-- Add admin override delete policies to allow proper cascading deletes from the app UI
-- NOTE: We are only adding policies; existing user-specific policies remain intact.

-- Clients: allow admins to delete any client
create policy "Admins can delete any clients"
  on public.clients
  for delete
  using (has_role(auth.uid(), 'admin'::app_role));

-- Jobs: allow admins to delete any job
create policy "Admins can delete any jobs"
  on public.jobs
  for delete
  using (has_role(auth.uid(), 'admin'::app_role));

-- Job earnings: allow admins to delete
create policy "Admins can delete any job_earnings"
  on public.job_earnings
  for delete
  using (has_role(auth.uid(), 'admin'::app_role));

-- Job expenses: allow admins to delete
create policy "Admins can delete any job_expenses"
  on public.job_expenses
  for delete
  using (has_role(auth.uid(), 'admin'::app_role));

-- Job extra services: allow admins to delete
create policy "Admins can delete any job_extra_services"
  on public.job_extra_services
  for delete
  using (has_role(auth.uid(), 'admin'::app_role));

-- Client feedback: allow admins to delete
create policy "Admins can delete any client_feedback"
  on public.client_feedback
  for delete
  using (has_role(auth.uid(), 'admin'::app_role));

-- Loyalty transactions: allow admins to delete
create policy "Admins can delete any loyalty_transactions"
  on public.loyalty_transactions
  for delete
  using (has_role(auth.uid(), 'admin'::app_role));

-- Client notifications: allow admins to delete
create policy "Admins can delete any client_notifications"
  on public.client_notifications
  for delete
  using (has_role(auth.uid(), 'admin'::app_role));

-- Invoices and invoice_items are not directly tied to client deletion here; skipping to avoid unintended data loss.
