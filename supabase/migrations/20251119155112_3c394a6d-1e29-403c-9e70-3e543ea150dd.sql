-- Add RLS policy to allow clients to insert their own checklists
CREATE POLICY "Clients can create their own checklists"
ON public.client_checklists
FOR INSERT
TO authenticated
WITH CHECK (
  client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
);