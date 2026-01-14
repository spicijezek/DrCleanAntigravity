-- Update handle_new_user function to handle cleaner linking
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  existing_team_member_id uuid;
BEGIN
  -- Insert or update profile
  INSERT INTO public.profiles (user_id, email, full_name, approval_status)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    'approved'
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = now();
  
  -- Check if this is a client signup (has phone or is_client metadata)
  IF NEW.raw_user_meta_data ? 'phone' OR NEW.raw_user_meta_data ? 'is_client' THEN
    -- Insert client only if not exists
    IF NOT EXISTS (SELECT 1 FROM public.clients WHERE user_id = NEW.id) THEN
      INSERT INTO public.clients (
        user_id, 
        name, 
        email, 
        phone, 
        client_source
      )
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
        NEW.email,
        NEW.raw_user_meta_data ->> 'phone',
        'App'
      );
      
      -- Initialize loyalty credits
      INSERT INTO public.loyalty_credits (client_id, current_credits, total_earned, total_spent)
      SELECT id, 0, 0, 0
      FROM public.clients
      WHERE user_id = NEW.id
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Assign client role only if not exists
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'client')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Check if this user is a cleaner (has existing team_member with matching email)
    SELECT id INTO existing_team_member_id
    FROM public.team_members
    WHERE email = NEW.email AND (user_id IS NULL OR user_id = NEW.id)
    LIMIT 1;
    
    IF existing_team_member_id IS NOT NULL THEN
      -- Link the existing team_member to this user
      UPDATE public.team_members
      SET user_id = NEW.id
      WHERE id = existing_team_member_id;
      
      -- Assign cleaner role
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'cleaner')
      ON CONFLICT (user_id, role) DO NOTHING;
    ELSE
      -- Assign default user role for non-clients and non-cleaners
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'user')
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Link any existing team_members to auth users by matching email
UPDATE public.team_members tm
SET user_id = au.id
FROM auth.users au
WHERE tm.email = au.email
  AND (tm.user_id IS NULL OR tm.user_id != au.id);