-- Add voice_id column with default value
ALTER TABLE settings 
ADD COLUMN voice_id text NOT NULL DEFAULT '1SM7GgM6IMuvQlz2BwM3';

-- Rename assistant_id to agent_id
ALTER TABLE settings 
RENAME COLUMN assistant_id TO agent_id;

-- Drop old index
DROP INDEX idx_settings_assistant_id;

-- Create new index with updated name
CREATE INDEX idx_settings_agent_id ON settings(agent_id);

-- Add index for voice_id for faster lookups
CREATE INDEX idx_settings_voice_id ON settings(voice_id); 