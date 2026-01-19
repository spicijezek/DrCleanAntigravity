-- Add 'client' role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';

-- Update handle_new_user to assign client role for clients
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name'
  );
  
  -- Check if this is a client signup
  IF NEW.raw_user_meta_data ? 'phone' OR NEW.raw_user_meta_data ? 'is_client' THEN
    INSERT INTO public.clients (user_id, name, email, phone)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
      NEW.email,
      NEW.raw_user_meta_data ->> 'phone'
    );
    
    -- Initialize loyalty credits for the client
    INSERT INTO public.loyalty_credits (client_id, current_credits, total_earned, total_spent)
    SELECT id, 0, 0, 0
    FROM public.clients
    WHERE user_id = NEW.id;
    
    -- Assign client role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'client')
    ON CONFLICT DO NOTHING;
  ELSE
    -- Assign default user role for non-clients
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix jobs RLS policies to allow clients to see their jobs
DROP POLICY IF EXISTS "Clients can view their jobs" ON public.jobs;
CREATE POLICY "Clients can view their jobs"
ON public.jobs
FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
);

-- Allow clients to insert job bookings (for service requests)
DROP POLICY IF EXISTS "Clients can create job requests" ON public.jobs;
CREATE POLICY "Clients can create job requests"
ON public.jobs
FOR INSERT
TO authenticated
WITH CHECK (
  client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
);

-- Fix job_extra_services to allow clients to view their job extras
DROP POLICY IF EXISTS "Clients can view their job extras" ON public.job_extra_services;
CREATE POLICY "Clients can view their job extras"
ON public.job_extra_services
FOR SELECT
TO authenticated
USING (
  job_id IN (
    SELECT j.id
    FROM public.jobs j
    JOIN public.clients c ON j.client_id = c.id
    WHERE c.user_id = auth.uid()
  )
);