-- Allow cleaners to mark rooms as completed
CREATE POLICY "Cleaners can mark rooms complete for their bookings"
ON public.checklist_rooms
FOR UPDATE
TO authenticated
USING (
  checklist_id IN (
    SELECT c.id
    FROM client_checklists c
    WHERE EXISTS (
      SELECT 1
      FROM bookings b
      JOIN team_members tm ON tm.id = ANY(b.team_member_ids)
      WHERE tm.user_id = auth.uid()
        AND b.status = 'approved'
        AND b.address = concat_ws(', ', c.street, c.city, c.postal_code)
    )
  )
)
WITH CHECK (
  checklist_id IN (
    SELECT c.id
    FROM client_checklists c
    WHERE EXISTS (
      SELECT 1
      FROM bookings b
      JOIN team_members tm ON tm.id = ANY(b.team_member_ids)
      WHERE tm.user_id = auth.uid()
        AND b.status = 'approved'
        AND b.address = concat_ws(', ', c.street, c.city, c.postal_code)
    )
  )
);

-- Allow cleaners to mark their assigned bookings as completed
CREATE POLICY "Cleaners can complete their assigned bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM team_members tm
    WHERE tm.id = ANY(bookings.team_member_ids)
      AND tm.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM team_members tm
    WHERE tm.id = ANY(bookings.team_member_ids)
      AND tm.user_id = auth.uid()
  )
);