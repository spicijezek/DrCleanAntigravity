-- Create loyalty_redemptions table
CREATE TABLE IF NOT EXISTS public.loyalty_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  prize_name text NOT NULL,
  points_cost integer NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'fulfilled', 'cancelled')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  fulfilled_at timestamptz
);

-- Enable RLS
ALTER TABLE public.loyalty_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Clients can view their own redemptions" ON public.loyalty_redemptions;
CREATE POLICY "Clients can view their own redemptions" ON public.loyalty_redemptions
  FOR SELECT USING (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Clients can create redemptions" ON public.loyalty_redemptions;
CREATE POLICY "Clients can create redemptions" ON public.loyalty_redemptions
  FOR INSERT WITH CHECK (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can manage redemptions" ON public.loyalty_redemptions;
CREATE POLICY "Admins can manage redemptions" ON public.loyalty_redemptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Add sample record (optional)
-- INSERT INTO public.loyalty_redemptions (client_id, prize_name, points_cost) 
-- SELECT id, 'Vonná svíčka', 2700 FROM public.clients LIMIT 1;
