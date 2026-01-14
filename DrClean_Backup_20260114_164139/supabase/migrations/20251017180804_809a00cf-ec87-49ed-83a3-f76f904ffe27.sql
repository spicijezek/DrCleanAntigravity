-- Fix client registration RLS issue
-- Update the handle_new_user trigger to create client records automatically

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name'
  );
  
  -- Check if this is a client signup (has phone in metadata or specific flag)
  -- If user_metadata contains phone, create a client record
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
  END IF;
  
  -- Assign default user role (will be overridden if client role is assigned separately)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;