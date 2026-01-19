-- Register cleaner Malvína
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Insert into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'malvinauklid@seznam.cz',
    crypt('HKud.C5KVCHx@w2', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Malvína","is_cleaner":true}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO new_user_id;

  -- Insert profile
  INSERT INTO public.profiles (user_id, email, full_name, approval_status)
  VALUES (new_user_id, 'malvinauklid@seznam.cz', 'Malvína', 'approved')
  ON CONFLICT (user_id) DO NOTHING;

  -- Assign cleaner role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new_user_id, 'cleaner')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Create team member entry
  INSERT INTO public.team_members (
    user_id,
    name,
    email,
    position,
    is_active
  ) VALUES (
    new_user_id,
    'Malvína',
    'malvinauklid@seznam.cz',
    'Cleaner',
    true
  );

END $$;