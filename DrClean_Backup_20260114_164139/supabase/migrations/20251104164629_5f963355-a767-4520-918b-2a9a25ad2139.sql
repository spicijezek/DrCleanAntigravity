-- Make client_id nullable in client_checklists to allow creating checklists without a client
ALTER TABLE public.client_checklists 
ALTER COLUMN client_id DROP NOT NULL;

-- Update RLS policies to allow admins to create checklists without a client
DROP POLICY IF EXISTS "Admins can manage all checklists" ON public.client_checklists;

CREATE POLICY "Admins can manage all checklists"
ON public.client_checklists
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow clients to view checklists even if client_id is null (for unassigned checklists)
DROP POLICY IF EXISTS "Clients can view their own checklists" ON public.client_checklists;

CREATE POLICY "Clients can view their own checklists"
ON public.client_checklists
FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);