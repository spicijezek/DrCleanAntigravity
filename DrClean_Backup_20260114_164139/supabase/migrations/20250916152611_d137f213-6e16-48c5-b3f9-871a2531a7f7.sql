-- Add support for multiple team members and expense distribution
-- Change team_member_id to an array to support multiple team members
ALTER TABLE public.jobs 
ADD COLUMN team_member_ids UUID[] DEFAULT '{}';

-- Create a table for expense distribution per team member per job
CREATE TABLE public.job_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL,
  team_member_id UUID NOT NULL,
  supplies_expense NUMERIC DEFAULT 0.00,
  transport_expense NUMERIC DEFAULT 0.00,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(job_id, team_member_id)
);

-- Enable RLS on job_expenses table
ALTER TABLE public.job_expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for job_expenses
CREATE POLICY "Users can view their own job expenses" 
ON public.job_expenses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own job expenses" 
ON public.job_expenses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job expenses" 
ON public.job_expenses 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job expenses" 
ON public.job_expenses 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_job_expenses_updated_at
BEFORE UPDATE ON public.job_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();