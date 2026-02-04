-- Add onboarding tracking columns to clients table

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1;

-- Update existing clients to be considered "onboarded" so they aren't locked out
-- We assume anyone who already exists in the system has completed the previous flow
UPDATE clients 
SET onboarding_completed = TRUE 
WHERE onboarding_completed IS FALSE;

-- Force the column to be false for NEW records by keeping the default
-- The UPDATE above only affects rows that existed at the moment of migration run
