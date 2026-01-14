-- Create checklist tables for real-time collaborative cleaning checklists

-- Main checklist table (one per client/property)
CREATE TABLE public.client_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  property_address TEXT NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Rooms in the checklist
CREATE TABLE public.checklist_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID NOT NULL REFERENCES public.client_checklists(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tasks within each room
CREATE TABLE public.checklist_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.checklist_rooms(id) ON DELETE CASCADE,
  task_text TEXT NOT NULL,
  added_by UUID NOT NULL REFERENCES auth.users(id),
  added_by_role TEXT NOT NULL, -- 'admin' or 'client'
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_checklists
CREATE POLICY "Admins can manage all checklists"
  ON public.client_checklists FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clients can view their own checklists"
  ON public.client_checklists FOR SELECT
  USING (client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  ));

CREATE POLICY "Clients can update their own checklists"
  ON public.client_checklists FOR UPDATE
  USING (client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  ));

-- RLS Policies for checklist_rooms
CREATE POLICY "Admins can manage all rooms"
  ON public.checklist_rooms FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clients can view their rooms"
  ON public.checklist_rooms FOR SELECT
  USING (checklist_id IN (
    SELECT id FROM public.client_checklists
    WHERE client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  ));

CREATE POLICY "Clients can update their rooms"
  ON public.checklist_rooms FOR UPDATE
  USING (checklist_id IN (
    SELECT id FROM public.client_checklists
    WHERE client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  ));

CREATE POLICY "Clients can insert rooms in their checklists"
  ON public.checklist_rooms FOR INSERT
  WITH CHECK (checklist_id IN (
    SELECT id FROM public.client_checklists
    WHERE client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  ));

CREATE POLICY "Clients can delete their rooms"
  ON public.checklist_rooms FOR DELETE
  USING (checklist_id IN (
    SELECT id FROM public.client_checklists
    WHERE client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  ));

-- RLS Policies for checklist_tasks
CREATE POLICY "Admins can manage all tasks"
  ON public.checklist_tasks FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clients can view their tasks"
  ON public.checklist_tasks FOR SELECT
  USING (room_id IN (
    SELECT r.id FROM public.checklist_rooms r
    JOIN public.client_checklists c ON r.checklist_id = c.id
    WHERE c.client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  ));

CREATE POLICY "Clients can insert tasks"
  ON public.checklist_tasks FOR INSERT
  WITH CHECK (room_id IN (
    SELECT r.id FROM public.checklist_rooms r
    JOIN public.client_checklists c ON r.checklist_id = c.id
    WHERE c.client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  ));

CREATE POLICY "Clients can update tasks"
  ON public.checklist_tasks FOR UPDATE
  USING (room_id IN (
    SELECT r.id FROM public.checklist_rooms r
    JOIN public.client_checklists c ON r.checklist_id = c.id
    WHERE c.client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  ));

CREATE POLICY "Clients can delete tasks"
  ON public.checklist_tasks FOR DELETE
  USING (room_id IN (
    SELECT r.id FROM public.checklist_rooms r
    JOIN public.client_checklists c ON r.checklist_id = c.id
    WHERE c.client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  ));

-- Trigger to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_checklist_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.client_checklists
  SET last_updated = now()
  WHERE id = (
    SELECT checklist_id FROM public.checklist_rooms WHERE id = NEW.room_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_checklist_on_room_change
AFTER UPDATE ON public.checklist_rooms
FOR EACH ROW
EXECUTE FUNCTION update_checklist_timestamp();

-- Add realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_checklists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.checklist_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.checklist_tasks;