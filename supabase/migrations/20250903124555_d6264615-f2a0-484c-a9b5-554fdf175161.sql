-- Create storage bucket for protocols
INSERT INTO storage.buckets (id, name, public) VALUES ('protocols', 'protocols', false);

-- Create storage policies for protocols
CREATE POLICY "Users can view their own protocols" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'protocols' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own protocols" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'protocols' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own protocols" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'protocols' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own protocols" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'protocols' AND auth.uid()::text = (storage.foldername(name))[1]);