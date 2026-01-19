-- Add cleaner role to admin user
INSERT INTO public.user_roles (user_id, role)
VALUES ('8a751222-9ec6-49b7-9f6d-e4d519f325ca', 'cleaner')
ON CONFLICT (user_id, role) DO NOTHING;