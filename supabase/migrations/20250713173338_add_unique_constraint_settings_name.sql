-- Add unique constraint to settings name
ALTER TABLE settings ADD CONSTRAINT settings_name_unique UNIQUE (name); 