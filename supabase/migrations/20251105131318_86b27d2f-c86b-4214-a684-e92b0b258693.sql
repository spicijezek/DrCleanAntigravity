-- Update RLS policies to allow clients to add and manage rooms
-- Clients should be able to insert their own rooms (not just admins)
DROP POLICY IF EXISTS "Clients can insert rooms in their checklists" ON public.checklist_rooms;

CREATE POLICY "Clients can insert rooms in their checklists"
ON public.checklist_rooms
FOR INSERT
TO authenticated
WITH CHECK (
  checklist_id IN (
    SELECT client_checklists.id
    FROM client_checklists
    WHERE client_checklists.client_id IN (
      SELECT clients.id
      FROM clients
      WHERE clients.user_id = auth.uid()
    )
  )
);

-- Allow clients to delete their own rooms
DROP POLICY IF EXISTS "Clients can delete their rooms" ON public.checklist_rooms;

CREATE POLICY "Clients can delete their rooms"
ON public.checklist_rooms
FOR DELETE
TO authenticated
USING (
  checklist_id IN (
    SELECT client_checklists.id
    FROM client_checklists
    WHERE client_checklists.client_id IN (
      SELECT clients.id
      FROM clients
      WHERE clients.user_id = auth.uid()
    )
  )
);