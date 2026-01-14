-- Fix search_path for generate_invoice_number function
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  next_number INTEGER;
  invoice_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.invoices
  WHERE invoice_number ~ '^INV-[0-9]+$';
  
  invoice_number := 'INV-' || LPAD(next_number::TEXT, 6, '0');
  RETURN invoice_number;
END;
$function$;

-- Fix search_path for generate_job_number function
CREATE OR REPLACE FUNCTION public.generate_job_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
$function$;

-- Fix search_path for generate_quote_number function
CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;