import { supabase } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/supabase';

/**
 * Database Schema Fixer
 * Automatically detects and fixes missing columns in the generated_images table
 */

// Check if a column exists in the table
const checkColumnExists = async (tableName: string, columnName: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', tableName)
      .eq('column_name', columnName)
      .eq('table_schema', 'public');

    if (error) {
      console.error(`Error checking column ${columnName}:`, error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error(`Failed to check column ${columnName}:`, error);
    return false;
  }
};

// Add missing column with proper type
const addMissingColumn = async (tableName: string, columnName: string, columnType: string, defaultValue?: string | null): Promise<boolean> => {
  try {
    let sql = `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${columnName} ${columnType}`;
    if (defaultValue) {
      sql += ` DEFAULT ${defaultValue}`;
    }
    sql += ';';

    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error(`Error adding column ${columnName}:`, error);
      return false;
    }

    console.log(`✅ Added column ${columnName} to ${tableName}`);
    return true;
  } catch (error) {
    console.error(`Failed to add column ${columnName}:`, error);
    return false;
  }
};

// Main function to fix database schema
export const fixDatabaseSchema = async (): Promise<void> => {
  if (!isSupabaseConfigured()) {
    console.log('⚠️ Supabase not configured, skipping database schema fix');
    return;
  }

  try {
    console.log('🔧 Checking database schema for missing columns...');

    const tableName = 'generated_images';
    const requiredColumns = [
      { name: 'guidance_scale', type: 'DECIMAL(4,2)', defaultValue: '7.5' },
      { name: 'seed', type: 'BIGINT', defaultValue: null },
      { name: 'steps', type: 'INTEGER', defaultValue: '20' },
      { name: 'quality', type: 'TEXT', defaultValue: null },
      { name: 'style', type: 'TEXT', defaultValue: null },
      { name: 'is_favorite', type: 'BOOLEAN', defaultValue: 'false' },
      { name: 'tags', type: 'TEXT[]', defaultValue: 'ARRAY[]::TEXT[]' }
    ];

    let hasChanges = false;

    // Check and add missing columns
    for (const column of requiredColumns) {
      const exists = await checkColumnExists(tableName, column.name);
      if (!exists) {
        console.log(`❌ Missing column: ${column.name}`);
        const added = await addMissingColumn(tableName, column.name, column.type, column.defaultValue || undefined);
        if (added) {
          hasChanges = true;
        }
      } else {
        console.log(`✅ Column exists: ${column.name}`);
      }
    }

    // Update existing records with null values
    if (hasChanges) {
      console.log('🔄 Updating existing records with default values...');
      
      const { error: updateError } = await supabase
        .from(tableName)
        .update({
          guidance_scale: 7.5,
          steps: 20,
          is_favorite: false
        })
        .is('guidance_scale', null);

      if (updateError) {
        console.error('Error updating existing records:', updateError);
      } else {
        console.log('✅ Updated existing records with default values');
      }

      // Refresh schema cache
      console.log('🔄 Refreshing schema cache...');
      const { error: refreshError } = await supabase.rpc('exec_sql', { 
        sql: 'NOTIFY pgrst, \'reload schema\';' 
      });
      
      if (refreshError) {
        console.warn('Warning: Failed to refresh schema cache:', refreshError);
      } else {
        console.log('✅ Schema cache refreshed');
      }
    }

    console.log('✅ Database schema check completed');
  } catch (error) {
    console.error('❌ Database schema fix failed:', error);
    throw error;
  }
};

// Auto-fix database schema on startup
export const autoFixDatabaseOnStartup = async (): Promise<void> => {
  if (!isSupabaseConfigured()) {
    console.log('⚠️ Supabase not configured, skipping database auto-fix');
    return;
  }

  try {
    console.log('🔧 Auto-fixing database schema on startup...');
    await fixDatabaseSchema();
    console.log('✅ Database auto-fix completed successfully');
  } catch (error) {
    console.error('❌ Database auto-fix failed:', error);
    // Don't throw error to prevent app from crashing
  }
};

// Verify table structure
export const verifyTableStructure = async (): Promise<void> => {
  if (!isSupabaseConfigured()) {
    console.log('⚠️ Supabase not configured, skipping table verification');
    return;
  }

  try {
    console.log('🔍 Verifying table structure...');
    
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'generated_images')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (error) {
      console.error('Error verifying table structure:', error);
      return;
    }

    console.log('📋 Current table structure:');
    data?.forEach(column => {
      console.log(`  - ${column.column_name}: ${column.data_type} ${column.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${column.column_default ? `DEFAULT ${column.column_default}` : ''}`);
    });
  } catch (error) {
    console.error('❌ Table verification failed:', error);
  }
};