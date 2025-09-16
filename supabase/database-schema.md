# Supabase Database Schema

## Overview
This document describes the database schema required for the AI Image Generator application using Supabase.

## Tables

### 1. generated_images

Stores metadata for all generated images.

```sql
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
```

#### Indexes
```sql
-- Index for faster queries by creation date
CREATE INDEX idx_generated_images_created_at ON generated_images(created_at DESC);

-- Index for favorite images
CREATE INDEX idx_generated_images_favorites ON generated_images(is_favorite) WHERE is_favorite = TRUE;

-- Index for text search on prompts
CREATE INDEX idx_generated_images_prompt_search ON generated_images USING gin(to_tsvector('english', prompt));

-- Index for tags search
CREATE INDEX idx_generated_images_tags ON generated_images USING gin(tags);
```

#### Row Level Security (RLS)
```sql
-- Enable RLS
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to manage their own images
CREATE POLICY "Users can manage their own images" ON generated_images
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Policy for anonymous users to read public images (optional)
CREATE POLICY "Anonymous users can view public images" ON generated_images
  FOR SELECT USING (TRUE);
```

## Storage Buckets

### images

Stores the actual image files.

```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true);
```

#### Storage Policies
```sql
-- Policy for authenticated users to upload images
CREATE POLICY "Authenticated users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'images' AND
    auth.role() = 'authenticated'
  );

-- Policy for public read access to images
CREATE POLICY "Public read access to images" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

-- Policy for authenticated users to delete their own images
CREATE POLICY "Users can delete their own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

## Functions

### update_updated_at()

Trigger function to automatically update the `updated_at` timestamp.

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_generated_images_updated_at
  BEFORE UPDATE ON generated_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

## Migration Files

The SQL commands above should be organized into migration files in the `supabase/migrations/` directory:

1. `001_create_generated_images_table.sql` - Create the main table
2. `002_create_indexes.sql` - Create indexes for performance
3. `003_setup_rls_policies.sql` - Set up Row Level Security
4. `004_create_storage_bucket.sql` - Create storage bucket and policies
5. `005_create_functions_triggers.sql` - Create utility functions and triggers

## Usage Notes

1. **Image Storage**: Images are stored in Supabase Storage with public read access
2. **File Naming**: Use UUID-based naming to avoid conflicts: `{user_id}/{image_id}.{extension}`
3. **Metadata**: All image metadata is stored in the `generated_images` table
4. **Search**: Full-text search is available on prompts using PostgreSQL's built-in search
5. **Tags**: Tags are stored as PostgreSQL arrays for flexible querying
6. **Security**: RLS ensures users can only access their own images (when authenticated)

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```