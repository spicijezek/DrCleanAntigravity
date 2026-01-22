-- Create booking_rooms table for booking-specific room completion tracking
-- This ensures each booking has independent room completion state (always starts at 0%)

CREATE TABLE public.booking_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_booking_rooms_booking_id ON public.booking_rooms(booking_id);
CREATE INDEX idx_booking_rooms_completed ON public.booking_rooms(booking_id, is_completed);

-- Enable RLS
ALTER TABLE public.booking_rooms ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Admins can do everything
CREATE POLICY "Admins can manage all booking rooms"
  ON public.booking_rooms FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Cleaners can view rooms for their assigned bookings
CREATE POLICY "Cleaners can view rooms for their bookings"
  ON public.booking_rooms FOR SELECT
  USING (
    booking_id IN (
      SELECT b.id FROM public.bookings b
      WHERE b.team_member_ids @> ARRAY[(
        SELECT id FROM public.team_members WHERE user_id = auth.uid() LIMIT 1
      )]
    )
  );

-- Cleaners can mark rooms complete for their assigned bookings
CREATE POLICY "Cleaners can update rooms for their bookings"
  ON public.booking_rooms FOR UPDATE
  USING (
    booking_id IN (
      SELECT b.id FROM public.bookings b
      WHERE b.team_member_ids @> ARRAY[(
        SELECT id FROM public.team_members WHERE user_id = auth.uid() LIMIT 1
      )]
    )
  );

-- Clients can view rooms for their bookings
CREATE POLICY "Clients can view their booking rooms"
  ON public.booking_rooms FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM public.bookings
      WHERE client_id IN (
        SELECT id FROM public.clients WHERE user_id = auth.uid()
      )
    )
  );

-- Add to realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_rooms;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_booking_rooms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_booking_rooms_timestamp
BEFORE UPDATE ON public.booking_rooms
FOR EACH ROW
EXECUTE FUNCTION update_booking_rooms_updated_at();
