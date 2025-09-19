-- Add bump_instruction column with Swedish default value
ALTER TABLE settings 
ADD COLUMN bump_instruction text NOT NULL DEFAULT 'Säg aj - du sprang precis in i en vägg!';

-- Add index for bump_instruction for faster lookups
CREATE INDEX idx_settings_bump_instruction ON settings(bump_instruction); 