-- Fix handle_new_user to prevent duplicate clients
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public 
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, email, full_name, approval_status)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    'approved'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Check if this is a client signup (has phone or is_client metadata)
  IF NEW.raw_user_meta_data ? 'phone' OR NEW.raw_user_meta_data ? 'is_client' THEN
    -- Only insert if client doesn't already exist for this user
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
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Initialize loyalty credits only if they don't exist
    INSERT INTO public.loyalty_credits (client_id, current_credits, total_earned, total_spent)
    SELECT id, 0, 0, 0
    FROM public.clients
    WHERE user_id = NEW.id
    ON CONFLICT DO NOTHING;
    
    -- Assign client role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'client')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Assign default user role for non-clients
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;