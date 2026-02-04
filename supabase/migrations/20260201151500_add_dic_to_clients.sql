-- Add dic column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS dic TEXT;

-- Update the comments/metadata if necessary
COMMENT ON COLUMN clients.dic IS 'VAT ID for companies (DIČ)';
