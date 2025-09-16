-- Fix script for is_favorite column issue
-- This script handles the case where the table exists but is missing the is_favorite column

-- First, check if the column exists and add it if it doesn't
DO $$
BEGIN
    -- Add is_favorite column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'generated_images' 
        AND column_name = 'is_favorite'
    ) THEN
        ALTER TABLE generated_images ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add tags column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'generated_images' 
        AND column_name = 'tags'
    ) THEN
        ALTER TABLE generated_images ADD COLUMN tags TEXT[];
    END IF;
END $$;

-- Now create the indexes (they will work since columns exist)
CREATE INDEX IF NOT EXISTS idx_generated_images_created_at ON generated_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_images_favorites ON generated_images(is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX IF NOT EXISTS idx_generated_images_prompt_search ON generated_images USING gin(to_tsvector('english', prompt));
CREATE INDEX IF NOT EXISTS idx_generated_images_tags ON generated_images USING gin(tags);

-- Enable Row Level Security (idempotent)
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Allow public read access" ON generated_images;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON generated_images;
DROP POLICY IF EXISTS "Allow authenticated users to update" ON generated_images;
DROP POLICY IF EXISTS "Allow authenticated users to delete" ON generated_images;

-- Create policies for RLS
CREATE POLICY "Allow public read access" ON generated_images
  FOR SELECT USING (TRUE);

CREATE POLICY "Allow authenticated users to insert" ON generated_images
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow authenticated users to update" ON generated_images
  FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow authenticated users to delete" ON generated_images
  FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Create storage bucket for images (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist and recreate them
DROP POLICY IF EXISTS "Allow public read access to images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete images" ON storage.objects;

-- Create storage policies
CREATE POLICY "Allow public read access to images" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'images');

CREATE POLICY "Allow authenticated users to update images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'images');

CREATE POLICY "Allow authenticated users to delete images" ON storage.objects
  FOR DELETE USING (bucket_id = 'images');

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS update_generated_images_updated_at ON generated_images;
DROP FUNCTION IF EXISTS update_updated_at();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_generated_images_updated_at
  BEFORE UPDATE ON generated_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Grant permissions to anon and authenticated roles (idempotent)
GRANT ALL PRIVILEGES ON generated_images TO anon;
GRANT ALL PRIVILEGES ON generated_images TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;