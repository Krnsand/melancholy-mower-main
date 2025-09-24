-- Disable Row Level Security on settings table
-- RLS may be preventing updates even with service role key
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- Ensure service role has full access
GRANT ALL ON settings TO service_role;

-- Add comment explaining the change
COMMENT ON TABLE settings IS 'RLS disabled to allow service role updates for application functionality';
