-- Create storage bucket for educational content if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('educational_content', 'educational_content', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can upload educational content" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update educational content" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete educational content" ON storage.objects;
DROP POLICY IF EXISTS "Everyone can view educational content" ON storage.objects;

-- Create RLS policies for educational content bucket
CREATE POLICY "Admins can upload educational content"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'educational_content' AND
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update educational content"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'educational_content' AND
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete educational content"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'educational_content' AND
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "Everyone can view educational content"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'educational_content');