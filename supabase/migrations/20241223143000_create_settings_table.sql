-- Create settings table
CREATE TABLE settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    assistant_id text NOT NULL,
    instructions text NOT NULL,
    accelerometer_sensitivity numeric NOT NULL CHECK (accelerometer_sensitivity >= 0 AND accelerometer_sensitivity <= 1),
    session_length integer NOT NULL CHECK (session_length > 0),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row changes
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create index on name for faster lookups
CREATE INDEX idx_settings_name ON settings(name);

-- Create index on assistant_id for faster lookups
CREATE INDEX idx_settings_assistant_id ON settings(assistant_id); 