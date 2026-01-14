-- Fix the generate_job_number function to resolve column ambiguity
CREATE OR REPLACE FUNCTION public.generate_job_number()
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
  next_number INTEGER;
  result_job_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(j.job_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.jobs j
  WHERE j.job_number ~ '^CL-[0-9]+$';
  
  result_job_number := 'CL-' || LPAD(next_number::TEXT, 4, '0');
  RETURN result_job_number;
END;
$function$