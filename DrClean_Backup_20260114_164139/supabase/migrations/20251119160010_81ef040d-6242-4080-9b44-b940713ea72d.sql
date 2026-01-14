-- Add RLS policy to allow clients to delete their own checklists
CREATE POLICY "Clients can delete their own checklists"
ON public.client_checklists
FOR DELETE
TO authenticated
USING (
  client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
);