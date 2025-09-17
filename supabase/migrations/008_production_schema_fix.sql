-- Production Database Schema Fix
-- This migration fixes the missing guidance_scale column and other schema issues in production

-- Enable detailed logging
SET client_min_messages TO NOTICE;

DO $$
BEGIN
    RAISE NOTICE 'Starting production database schema fix...';
    
    -- Create generated_images table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'generated_images'
    ) THEN
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
        RAISE NOTICE 'Created generated_images table';
    ELSE
        RAISE NOTICE 'generated_images table already exists';
    END IF;
    
    -- Add missing columns one by one
    
    -- guidance_scale column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'generated_images' 
        AND column_name = 'guidance_scale'
    ) THEN
        ALTER TABLE generated_images ADD COLUMN guidance_scale DECIMAL(4,2) NOT NULL DEFAULT 7.5;
        RAISE NOTICE 'Added guidance_scale column';
    ELSE
        RAISE NOTICE 'guidance_scale column already exists';
    END IF;
    
    -- negative_prompt column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'generated_images' 
        AND column_name = 'negative_prompt'
    ) THEN
        ALTER TABLE generated_images ADD COLUMN negative_prompt TEXT;
        RAISE NOTICE 'Added negative_prompt column';
    ELSE
        RAISE NOTICE 'negative_prompt column already exists';
    END IF;
    
    -- seed column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'generated_images' 
        AND column_name = 'seed'
    ) THEN
        ALTER TABLE generated_images ADD COLUMN seed BIGINT;
        RAISE NOTICE 'Added seed column';
    ELSE
        RAISE NOTICE 'seed column already exists';
    END IF;
    
    -- steps column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'generated_images' 
        AND column_name = 'steps'
    ) THEN
        ALTER TABLE generated_images ADD COLUMN steps INTEGER NOT NULL DEFAULT 20;
        RAISE NOTICE 'Added steps column';
    ELSE
        RAISE NOTICE 'steps column already exists';
    END IF;
    
    -- file_path column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'generated_images' 
        AND column_name = 'file_path'
    ) THEN
        ALTER TABLE generated_images ADD COLUMN file_path TEXT;
        RAISE NOTICE 'Added file_path column';
    ELSE
        RAISE NOTICE 'file_path column already exists';
    END IF;
    
    -- file_size column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'generated_images' 
        AND column_name = 'file_size'
    ) THEN
        ALTER TABLE generated_images ADD COLUMN file_size INTEGER;
        RAISE NOTICE 'Added file_size column';
    ELSE
        RAISE NOTICE 'file_size column already exists';
    END IF;
    
    -- is_favorite column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'generated_images' 
        AND column_name = 'is_favorite'
    ) THEN
        ALTER TABLE generated_images ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_favorite column';
    ELSE
        RAISE NOTICE 'is_favorite column already exists';
    END IF;
    
    -- tags column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'generated_images' 
        AND column_name = 'tags'
    ) THEN
        ALTER TABLE generated_images ADD COLUMN tags TEXT[];
        RAISE NOTICE 'Added tags column';
    ELSE
        RAISE NOTICE 'tags column already exists';
    END IF;
    
    RAISE NOTICE 'Schema fix completed successfully';
END $$;

-- Force schema cache refresh
NOTIFY pgrst, 'reload schema';

-- Grant permissions to ensure API access works
GRANT ALL PRIVILEGES ON generated_images TO anon;
GRANT ALL PRIVILEGES ON generated_images TO authenticated;

-- Create indexes for better performance if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'generated_images' 
        AND indexname = 'idx_generated_images_created_at'
    ) THEN
        CREATE INDEX idx_generated_images_created_at ON generated_images(created_at DESC);
        RAISE NOTICE 'Created index on created_at';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Index creation skipped or failed: %', SQLERRM;
END $$;

-- Final verification
DO $$
DECLARE
    col_record RECORD;
BEGIN
    RAISE NOTICE 'Final table structure verification:';
    FOR col_record IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'generated_images'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE 'Column: % | Type: % | Nullable: % | Default: %', 
            col_record.column_name, 
            col_record.data_type, 
            col_record.is_nullable, 
            col_record.column_default;
    END LOOP;
END $$;

RAISE NOTICE 'Production database schema fix completed!';