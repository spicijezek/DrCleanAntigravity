-- Revert destructive uniqueness and add safe partial unique index
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_user_id_unique;

-- Ensure only one App client per auth user, without affecting business-owned clients
CREATE UNIQUE INDEX IF NOT EXISTS clients_user_id_unique_app
ON clients(user_id)
WHERE client_source = 'App';

COMMENT ON INDEX clients_user_id_unique_app IS 'Prevents duplicate App-created client rows per auth user; does not restrict business-owned clients.';