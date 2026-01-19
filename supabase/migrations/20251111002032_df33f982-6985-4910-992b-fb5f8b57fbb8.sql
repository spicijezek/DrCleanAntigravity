-- Allow clients to view avatars in storage for their assigned cleaners
CREATE POLICY "Clients can view cleaner avatars"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'avatars' 
  AND (
    -- Public access for all avatars
    auth.role() = 'authenticated'
  )
);

-- Make avatars bucket public for easier access
UPDATE storage.buckets 
SET public = true 
WHERE id = 'avatars';