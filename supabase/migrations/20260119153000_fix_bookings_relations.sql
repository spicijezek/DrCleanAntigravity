-- Add foreign key constraint to bookings.client_id
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_client_id_fkey
FOREIGN KEY (client_id)
REFERENCES public.clients(id)
ON DELETE CASCADE;

-- Also add foreign key for user_id to be safe and consistent
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;
