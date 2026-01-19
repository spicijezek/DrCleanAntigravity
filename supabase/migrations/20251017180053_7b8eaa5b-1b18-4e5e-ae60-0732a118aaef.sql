-- Phase 1: Dr.Clean Client Portal Foundation

-- 1. Add 'client' role to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'client';

-- 2. Add client preferences and auth fields to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS contact_preference text CHECK (contact_preference IN ('call', 'no_doorbell', 'both')),
ADD COLUMN IF NOT EXISTS has_children boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_pets boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_allergies boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS allergies_notes text,
ADD COLUMN IF NOT EXISTS special_instructions text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);

-- 3. Create loyalty_credits table
CREATE TABLE IF NOT EXISTS public.loyalty_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  current_credits integer DEFAULT 0,
  total_earned integer DEFAULT 0,
  total_spent integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.loyalty_credits ENABLE ROW LEVEL SECURITY;

-- 4. Create loyalty_transactions table
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  type text NOT NULL CHECK (type IN ('earned', 'redeemed')),
  description text,
  related_job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- 5. Create educational_content table
CREATE TABLE IF NOT EXISTS public.educational_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  content_type text NOT NULL CHECK (content_type IN ('pdf', 'video', 'article')),
  file_url text,
  video_url text,
  category text NOT NULL,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.educational_content ENABLE ROW LEVEL SECURITY;

-- 6. Create client_feedback table
CREATE TABLE IF NOT EXISTS public.client_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.client_feedback ENABLE ROW LEVEL SECURITY;

-- 7. Create client_notifications table
CREATE TABLE IF NOT EXISTS public.client_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('reminder', 'cleaner_arrival', 'cleaner_finish', 'loyalty', 'education')),
  is_read boolean DEFAULT false,
  related_job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.client_notifications ENABLE ROW LEVEL SECURITY;

-- 8. Create extra_services table
CREATE TABLE IF NOT EXISTS public.extra_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(10,2),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.extra_services ENABLE ROW LEVEL SECURITY;

-- 9. Create job_extra_services junction table
CREATE TABLE IF NOT EXISTS public.job_extra_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  extra_service_id uuid NOT NULL REFERENCES public.extra_services(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(job_id, extra_service_id)
);

ALTER TABLE public.job_extra_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients table (update existing)
DROP POLICY IF EXISTS "Clients can view their own data" ON public.clients;
CREATE POLICY "Clients can view their own data" ON public.clients
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Clients can update their own data" ON public.clients;
CREATE POLICY "Clients can update their own data" ON public.clients
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for loyalty_credits
CREATE POLICY "Clients can view their own loyalty credits" ON public.loyalty_credits
  FOR SELECT USING (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  );

CREATE POLICY "System can manage loyalty credits" ON public.loyalty_credits
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for loyalty_transactions
CREATE POLICY "Clients can view their own transactions" ON public.loyalty_transactions
  FOR SELECT USING (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  );

-- RLS Policies for educational_content
CREATE POLICY "Clients can view published content" ON public.educational_content
  FOR SELECT USING (is_published = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage content" ON public.educational_content
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for client_feedback
CREATE POLICY "Clients can view their own feedback" ON public.client_feedback
  FOR SELECT USING (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  );

CREATE POLICY "Clients can create feedback" ON public.client_feedback
  FOR INSERT WITH CHECK (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  );

-- RLS Policies for client_notifications
CREATE POLICY "Clients can view their own notifications" ON public.client_notifications
  FOR SELECT USING (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  );

CREATE POLICY "Clients can update their own notifications" ON public.client_notifications
  FOR UPDATE USING (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  );

-- RLS Policies for extra_services
CREATE POLICY "Clients can view active extra services" ON public.extra_services
  FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage extra services" ON public.extra_services
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for job_extra_services
CREATE POLICY "Clients can view their job extras" ON public.job_extra_services
  FOR SELECT USING (
    job_id IN (
      SELECT j.id FROM public.jobs j 
      JOIN public.clients c ON j.client_id = c.id 
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can add extras to their jobs" ON public.job_extra_services
  FOR INSERT WITH CHECK (
    job_id IN (
      SELECT j.id FROM public.jobs j 
      JOIN public.clients c ON j.client_id = c.id 
      WHERE c.user_id = auth.uid()
    )
  );

-- Update trigger for loyalty_credits
CREATE TRIGGER update_loyalty_credits_updated_at
  BEFORE UPDATE ON public.loyalty_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update trigger for educational_content
CREATE TRIGGER update_educational_content_updated_at
  BEFORE UPDATE ON public.educational_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();