-- Allow cleaners to view checklists for properties they have bookings for
CREATE POLICY "Cleaners can view checklists for their assigned bookings"
ON client_checklists
FOR SELECT
USING (
  property_address IN (
    SELECT b.address
    FROM bookings b
    JOIN team_members tm ON tm.id = ANY(b.team_member_ids)
    WHERE tm.user_id = auth.uid()
    AND b.status = 'approved'
  )
);

-- Allow cleaners to view checklist rooms for their assigned bookings
CREATE POLICY "Cleaners can view rooms for their assigned bookings"
ON checklist_rooms
FOR SELECT
USING (
  checklist_id IN (
    SELECT c.id
    FROM client_checklists c
    WHERE c.property_address IN (
      SELECT b.address
      FROM bookings b
      JOIN team_members tm ON tm.id = ANY(b.team_member_ids)
      WHERE tm.user_id = auth.uid()
      AND b.status = 'approved'
    )
  )
);

-- Allow cleaners to view checklist tasks for their assigned bookings
CREATE POLICY "Cleaners can view tasks for their assigned bookings"
ON checklist_tasks
FOR SELECT
USING (
  room_id IN (
    SELECT r.id
    FROM checklist_rooms r
    JOIN client_checklists c ON r.checklist_id = c.id
    WHERE c.property_address IN (
      SELECT b.address
      FROM bookings b
      JOIN team_members tm ON tm.id = ANY(b.team_member_ids)
      WHERE tm.user_id = auth.uid()
      AND b.status = 'approved'
    )
  )
);