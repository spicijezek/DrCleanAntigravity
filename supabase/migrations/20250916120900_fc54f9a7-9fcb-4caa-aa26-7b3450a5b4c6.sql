-- Create job_earnings table for tracking individual team member earnings per job
CREATE TABLE public.job_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0.00,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_earnings ENABLE ROW LEVEL SECURITY;

-- Create policies for job_earnings
CREATE POLICY "Users can view their own job earnings"
ON public.job_earnings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own job earnings"
ON public.job_earnings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job earnings"
ON public.job_earnings
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job earnings"
ON public.job_earnings
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_job_earnings_job_id ON public.job_earnings(job_id);
CREATE INDEX idx_job_earnings_team_member_id ON public.job_earnings(team_member_id);
CREATE INDEX idx_job_earnings_user_id ON public.job_earnings(user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_job_earnings_updated_at
  BEFORE UPDATE ON public.job_earnings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();