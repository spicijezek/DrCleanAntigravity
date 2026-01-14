-- Add approval fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN approved_at timestamp with time zone,
ADD COLUMN approved_by uuid,
ADD COLUMN approval_notes text,
ADD COLUMN is_admin boolean DEFAULT false;

-- Update existing profiles to be approved (so current users aren't locked out)
UPDATE public.profiles SET approval_status = 'approved', approved_at = now() WHERE approval_status = 'pending';

-- Create function to check if user is approved
CREATE OR REPLACE FUNCTION public.is_user_approved(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT approval_status = 'approved' FROM public.profiles WHERE user_id = user_uuid),
    false
  );
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_user_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE user_id = user_uuid AND approval_status = 'approved'),
    false
  );
$$;

-- Create RLS policies for admin access to all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (public.is_user_admin(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Admins can update approval status" ON public.profiles
FOR UPDATE TO authenticated
USING (public.is_user_admin(auth.uid()))
WITH CHECK (public.is_user_admin(auth.uid()));

-- Make the first user an admin (replace with your actual user ID if needed)
-- This will make the first registered user an admin automatically
DO $$
DECLARE
    first_user_id uuid;
BEGIN
    SELECT user_id INTO first_user_id 
    FROM public.profiles 
    ORDER BY created_at 
    LIMIT 1;
    
    IF first_user_id IS NOT NULL THEN
        UPDATE public.profiles 
        SET is_admin = true, approval_status = 'approved', approved_at = now()
        WHERE user_id = first_user_id;
    END IF;
END $$;