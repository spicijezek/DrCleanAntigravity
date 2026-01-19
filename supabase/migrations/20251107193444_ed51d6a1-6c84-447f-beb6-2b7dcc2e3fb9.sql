-- Create educational_content table
CREATE TABLE public.educational_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('pdf', 'video', 'article')),
  category TEXT NOT NULL,
  file_url TEXT,
  video_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.educational_content ENABLE ROW LEVEL SECURITY;

-- Admins can manage all educational content
CREATE POLICY "Admins can manage educational content"
ON public.educational_content
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Clients can view published content
CREATE POLICY "Clients can view published content"
ON public.educational_content
FOR SELECT
USING (is_published = true OR has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_educational_content_updated_at
BEFORE UPDATE ON public.educational_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();