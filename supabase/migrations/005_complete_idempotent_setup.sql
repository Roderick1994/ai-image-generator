-- Complete idempotent database setup script
-- This script handles all edge cases and can be run multiple times safely

-- Step 1: Create table with all required columns
CREATE TABLE IF NOT EXISTS generated_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  width INTEGER NOT NULL DEFAULT 1024,
  height INTEGER NOT NULL DEFAULT 1024,
  steps INTEGER NOT NULL DEFAULT 20,
  guidance_scale DECIMAL(4,2) NOT NULL DEFAULT 7.5,
  seed BIGINT,
  model VARCHAR(100) NOT NULL DEFAULT 'stable-diffusion',
  quality VARCHAR(20) NOT NULL DEFAULT 'standard',
  style VARCHAR(50),
  image_url TEXT NOT NULL,
  file_path TEXT,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add missing columns if table already exists
DO $$
BEGIN
    -- Add is_favorite column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'generated_images' 
        AND column_name = 'is_favorite'
    ) THEN
        ALTER TABLE generated_images ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add tags column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'generated_images' 
        AND column_name = 'tags'
    ) THEN
        ALTER TABLE generated_images ADD COLUMN tags TEXT[];
    END IF;
    
    -- Add other potentially missing columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'generated_images' 
        AND column_name = 'negative_prompt'
    ) THEN
        ALTER TABLE generated_images ADD COLUMN negative_prompt TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'generated_images' 
        AND column_name = 'file_path'
    ) THEN
        ALTER TABLE generated_images ADD COLUMN file_path TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'generated_images' 
        AND column_name = 'file_size'
    ) THEN
        ALTER TABLE generated_images ADD COLUMN file_size INTEGER;
    END IF;
END $$;

-- Step 3: Create indexes (now all columns exist)
CREATE INDEX IF NOT EXISTS idx_generated_images_created_at ON generated_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_images_favorites ON generated_images(is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX IF NOT EXISTS idx_generated_images_prompt_search ON generated_images USING gin(to_tsvector('english', prompt));
CREATE INDEX IF NOT EXISTS idx_generated_images_tags ON generated_images USING gin(tags);

-- Step 4: Enable Row Level Security
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies and recreate them
DROP POLICY IF EXISTS "Allow public read access" ON generated_images;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON generated_images;
DROP POLICY IF EXISTS "Allow authenticated users to update" ON generated_images;
DROP POLICY IF EXISTS "Allow authenticated users to delete" ON generated_images;

-- Create RLS policies
CREATE POLICY "Allow public read access" ON generated_images
  FOR SELECT USING (TRUE);

CREATE POLICY "Allow authenticated users to insert" ON generated_images
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow authenticated users to update" ON generated_images
  FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow authenticated users to delete" ON generated_images
  FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Step 6: Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Step 7: Storage policies
DROP POLICY IF EXISTS "Allow public read access to images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete images" ON storage.objects;

CREATE POLICY "Allow public read access to images" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'images');

CREATE POLICY "Allow authenticated users to update images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'images');

CREATE POLICY "Allow authenticated users to delete images" ON storage.objects
  FOR DELETE USING (bucket_id = 'images');

-- Step 8: Create trigger function and trigger
DROP TRIGGER IF EXISTS update_generated_images_updated_at ON generated_images;
DROP FUNCTION IF EXISTS update_updated_at();

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_generated_images_updated_at
  BEFORE UPDATE ON generated_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Step 9: Grant permissions
GRANT ALL PRIVILEGES ON generated_images TO anon;
GRANT ALL PRIVILEGES ON generated_images TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database setup completed successfully! All tables, indexes, policies, and triggers are now configured.';
END $$;