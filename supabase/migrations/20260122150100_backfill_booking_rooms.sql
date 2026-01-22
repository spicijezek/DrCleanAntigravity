-- Backfill existing bookings with room snapshots from their assigned checklists
-- This creates booking_rooms records for all bookings that have checklists assigned

INSERT INTO public.booking_rooms (booking_id, room_name, sort_order, is_completed, completed_by, completed_at)
SELECT 
  b.id as booking_id,
  cr.room_name,
  cr.sort_order,
  -- For completed bookings, preserve completion state; for others, start fresh
  CASE 
    WHEN b.status = 'completed' THEN cr.is_completed
    ELSE false
  END as is_completed,
  CASE 
    WHEN b.status = 'completed' THEN cr.completed_by
    ELSE NULL
  END as completed_by,
  CASE 
    WHEN b.status = 'completed' THEN cr.completed_at
    ELSE NULL
  END as completed_at
FROM public.bookings b
JOIN public.checklist_rooms cr ON cr.checklist_id = b.checklist_id
WHERE b.checklist_id IS NOT NULL
  -- Only backfill active and recent bookings
  AND b.status IN ('pending', 'approved', 'in_progress', 'completed')
  -- Avoid duplicates if migration runs multiple times
  AND NOT EXISTS (
    SELECT 1 FROM public.booking_rooms br WHERE br.booking_id = b.id
  )
ORDER BY b.created_at DESC, cr.sort_order;

-- Log the backfill results
DO $$
DECLARE
  backfilled_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO backfilled_count FROM public.booking_rooms;
  RAISE NOTICE 'Backfilled % booking room records', backfilled_count;
END $$;
