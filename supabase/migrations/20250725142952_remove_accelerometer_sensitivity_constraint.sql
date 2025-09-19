-- Remove the existing check constraint on accelerometer_sensitivity
ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_accelerometer_sensitivity_check;
