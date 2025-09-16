-- Add missing columns to generated_images table
-- This script adds columns that may be missing from the current table structure

DO $$
BEGIN
    -- Add guidance_scale column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'generated_images' 
        AND column_name = 'guidance_scale'
    ) THEN
        ALTER TABLE generated_images ADD COLUMN guidance_scale DECIMAL(4,2) NOT NULL DEFAULT 7.5;
        RAISE NOTICE 'Added guidance_scale column';
    END IF;
    
    -- Add seed column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'generated_images' 
        AND column_name = 'seed'
    ) THEN
        ALTER TABLE generated_images ADD COLUMN seed BIGINT;
        RAISE NOTICE 'Added seed column';
    END IF;
    
    -- Add quality column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'generated_images' 
        AND column_name = 'quality'
    ) THEN
        ALTER TABLE generated_images ADD COLUMN quality VARCHAR(20) NOT NULL DEFAULT 'standard';
        RAISE NOTICE 'Added quality column';
    END IF;
    
    -- Add style column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'generated_images' 
        AND column_name = 'style'
    ) THEN
        ALTER TABLE generated_images ADD COLUMN style VARCHAR(50);
        RAISE NOTICE 'Added style column';
    END IF;
    
    -- Add is_favorite column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'generated_images' 
        AND column_name = 'is_favorite'
    ) THEN
        ALTER TABLE generated_images ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_favorite column';
    END IF;
    
    -- Add tags column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'generated_images' 
        AND column_name = 'tags'
    ) THEN
        ALTER TABLE generated_images ADD COLUMN tags TEXT[];
        RAISE NOTICE 'Added tags column';
    END IF;
    
    RAISE NOTICE 'Column addition check completed';
END $$;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';