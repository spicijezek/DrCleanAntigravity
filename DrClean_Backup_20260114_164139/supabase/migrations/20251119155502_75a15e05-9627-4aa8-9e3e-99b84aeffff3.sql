-- Ensure admin user has the admin role
-- First, get the user_id for the admin email
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Find the admin user by email
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'stepan.tomov5@seznam.cz'
  LIMIT 1;
  
  -- If admin user exists, ensure they have the admin role
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Admin role assigned to user %', admin_user_id;
  ELSE
    RAISE NOTICE 'Admin user not found with email stepan.tomov5@seznam.cz';
  END IF;
END $$;