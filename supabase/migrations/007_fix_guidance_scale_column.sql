-- Fix guidance_scale column issue
-- This migration ensures the guidance_scale column exists and has the correct type

DO $$
BEGIN
    -- Check if guidance_scale column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'generated_images' 
        AND column_name = 'guidance_scale'
    ) THEN
        -- Add guidance_scale column
        ALTER TABLE generated_images ADD COLUMN guidance_scale DECIMAL(4,2) NOT NULL DEFAULT 7.5;
        RAISE NOTICE 'Added guidance_scale column with type DECIMAL(4,2)';
    ELSE
        -- Check if the column has the correct type
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND table_name = 'generated_images' 
            AND column_name = 'guidance_scale'
            AND data_type != 'numeric'
        ) THEN
            -- Fix the column type if it's incorrect
            ALTER TABLE generated_images ALTER COLUMN guidance_scale TYPE DECIMAL(4,2);
            RAISE NOTICE 'Fixed guidance_scale column type to DECIMAL(4,2)';
        END IF;
        
        RAISE NOTICE 'guidance_scale column already exists with correct type';
    END IF;
    
    -- Ensure other critical columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'generated_images' 
        AND column_name = 'seed'
    ) THEN
        ALTER TABLE generated_images ADD COLUMN seed BIGINT;
        RAISE NOTICE 'Added seed column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'generated_images' 
        AND column_name = 'steps'
    ) THEN
        ALTER TABLE generated_images ADD COLUMN steps INTEGER NOT NULL DEFAULT 20;
        RAISE NOTICE 'Added steps column';
    END IF;
    
    -- Update any existing records that might have NULL guidance_scale
    UPDATE generated_images 
    SET guidance_scale = 7.5 
    WHERE guidance_scale IS NULL;
    
    RAISE NOTICE 'Database schema fix completed successfully';
END $$;

-- Refresh the schema cache to ensure PostgREST picks up the changes
NOTIFY pgrst, 'reload schema';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON generated_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON generated_images TO authenticated;

-- Verify the table structure
DO $$
DECLARE
    col_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'generated_images';
    
    RAISE NOTICE 'generated_images table has % columns', col_count;
    
    -- List all columns for verification
    FOR col_count IN 
        SELECT column_name FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'generated_images'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE 'Column: %', col_count;
    END LOOP;
END $$;