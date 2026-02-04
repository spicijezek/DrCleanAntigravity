-- Migration to allow clients to self-assign the 'client' role during registration
-- This is needed because RLS currently only allows admins to insert roles

-- First, we need to add 'client' to the app_role enum if it doesn't exist
DO $$
BEGIN
    -- Check if 'client' already exists in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'client' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
    ) THEN
        ALTER TYPE public.app_role ADD VALUE 'client';
    END IF;
END $$;

-- Add policy for users to insert their own 'client' role during registration
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can self-assign client role" ON public.user_roles;

-- Create new policy allowing users to insert only their own client role
CREATE POLICY "Users can self-assign client role"
ON public.user_roles FOR INSERT
WITH CHECK (
    auth.uid() = user_id 
    AND role = 'client'
);
