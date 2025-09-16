-- Create the generated_images table
CREATE TABLE generated_images (
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
  is_favorite BOOLEAN DEFAULT FALSE,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_generated_images_created_at ON generated_images(created_at DESC);
CREATE INDEX idx_generated_images_favorites ON generated_images(is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX idx_generated_images_prompt_search ON generated_images USING gin(to_tsvector('english', prompt));
CREATE INDEX idx_generated_images_tags ON generated_images USING gin(tags);

-- Enable Row Level Security
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Allow public read access" ON generated_images
  FOR SELECT USING (TRUE);

CREATE POLICY "Allow authenticated users to insert" ON generated_images
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow authenticated users to update" ON generated_images
  FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow authenticated users to delete" ON generated_images
  FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Allow public read access to images" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'images');

CREATE POLICY "Allow authenticated users to update images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'images');

CREATE POLICY "Allow authenticated users to delete images" ON storage.objects
  FOR DELETE USING (bucket_id = 'images');

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

-- Grant permissions to anon and authenticated roles
GRANT ALL PRIVILEGES ON generated_images TO anon;
GRANT ALL PRIVILEGES ON generated_images TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;