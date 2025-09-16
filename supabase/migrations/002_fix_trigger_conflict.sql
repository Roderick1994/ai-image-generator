-- Fix for trigger conflict: Drop and recreate trigger if exists
-- This script handles the case where the trigger already exists

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS update_generated_images_updated_at ON generated_images;

-- Drop the function if it exists
DROP FUNCTION IF EXISTS update_updated_at();

-- Recreate the function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER update_generated_images_updated_at
  BEFORE UPDATE ON generated_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Ensure permissions are granted (these are idempotent)
GRANT ALL PRIVILEGES ON generated_images TO anon;
GRANT ALL PRIVILEGES ON generated_images TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;