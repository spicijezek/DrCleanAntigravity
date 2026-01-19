-- Create comprehensive database schema for cleaning business management system

-- User profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  notes TEXT,
  total_spent DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Team members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT,
  hourly_rate DECIMAL(8,2),
  address TEXT,
  date_of_birth DATE,
  hire_date DATE,
  total_earnings DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Job categories enum
CREATE TYPE job_category AS ENUM (
  'home_cleaning',
  'commercial_cleaning', 
  'window_cleaning',
  'post_construction_cleaning',
  'upholstery_cleaning'
);

-- Jobs table
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  team_member_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  job_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category job_category NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_date TIMESTAMP WITH TIME ZONE,
  duration_hours DECIMAL(4,2),
  revenue DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  expenses DECIMAL(10,2) DEFAULT 0.00,
  supplies_needed TEXT[],
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Quotes table integrated with clients
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  quote_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category job_category NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  valid_until DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Protocols/Documents table
CREATE TABLE public.protocols (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Financial transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('revenue', 'expense')),
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'CZK',
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for clients
CREATE POLICY "Users can view their own clients" ON public.clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own clients" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own clients" ON public.clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own clients" ON public.clients FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for team_members
CREATE POLICY "Users can view their own team members" ON public.team_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own team members" ON public.team_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own team members" ON public.team_members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own team members" ON public.team_members FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for jobs
CREATE POLICY "Users can view their own jobs" ON public.jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own jobs" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own jobs" ON public.jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own jobs" ON public.jobs FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for quotes
CREATE POLICY "Users can view their own quotes" ON public.quotes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own quotes" ON public.quotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quotes" ON public.quotes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own quotes" ON public.quotes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for protocols
CREATE POLICY "Users can view their own protocols" ON public.protocols FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own protocols" ON public.protocols FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own protocols" ON public.protocols FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own protocols" ON public.protocols FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- Functions for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_protocols_updated_at BEFORE UPDATE ON public.protocols FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for protocols/documents
INSERT INTO storage.buckets (id, name, public) VALUES ('protocols', 'protocols', false);

-- Storage policies for protocols
CREATE POLICY "Users can view their own protocol files" ON storage.objects FOR SELECT USING (bucket_id = 'protocols' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload their own protocol files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'protocols' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own protocol files" ON storage.objects FOR UPDATE USING (bucket_id = 'protocols' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own protocol files" ON storage.objects FOR DELETE USING (bucket_id = 'protocols' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to generate job numbers
CREATE OR REPLACE FUNCTION public.generate_job_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  job_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(job_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.jobs
  WHERE job_number ~ '^CL-[0-9]+$';
  
  job_number := 'CL-' || LPAD(next_number::TEXT, 4, '0');
  RETURN job_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate quote numbers
CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  quote_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.quotes
  WHERE quote_number ~ '^Q-[0-9]+$';
  
  quote_number := 'Q-' || LPAD(next_number::TEXT, 4, '0');
  RETURN quote_number;
END;
$$ LANGUAGE plpgsql;