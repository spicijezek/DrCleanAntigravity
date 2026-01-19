-- Add job-level totals for supplies and transport, and refactor job_expenses to hold only cleaner (work) expense
-- 1) jobs: add totals
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS supplies_expense_total NUMERIC DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS transport_expense_total NUMERIC DEFAULT 0.00;

-- 2) job_expenses: add cleaner_expense, backfill from old columns, then drop old columns
ALTER TABLE public.job_expenses
ADD COLUMN IF NOT EXISTS cleaner_expense NUMERIC DEFAULT 0.00;

-- Backfill cleaner_expense = supplies_expense + transport_expense when old columns exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'job_expenses' AND column_name = 'supplies_expense'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'job_expenses' AND column_name = 'transport_expense'
  ) THEN
    UPDATE public.job_expenses
    SET cleaner_expense = COALESCE(supplies_expense, 0) + COALESCE(transport_expense, 0)
    WHERE cleaner_expense IS NULL OR cleaner_expense = 0;

    ALTER TABLE public.job_expenses DROP COLUMN supplies_expense;
    ALTER TABLE public.job_expenses DROP COLUMN transport_expense;
  END IF;
END $$;

-- keep existing RLS, trigger remains valid
-- ensure uniqueness across job and member
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'job_expenses'
      AND indexname = 'uniq_job_member_expense'
  ) THEN
    CREATE UNIQUE INDEX uniq_job_member_expense ON public.job_expenses(job_id, team_member_id);
  END IF;
END $$;