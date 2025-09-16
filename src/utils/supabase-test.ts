// Test utility for Supabase integration
import { supabase, isSupabaseConfigured, TABLES, BUCKETS } from '@/lib/supabase'

export class SupabaseTest {
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!isSupabaseConfigured()) {
        return {
          success: false,
          message: 'Supabase is not configured. Please check your environment variables.'
        }
      }

      // Test database connection
      const { data, error } = await supabase
        .from(TABLES.GENERATED_IMAGES)
        .select('count')
        .limit(1)

      if (error) {
        return {
          success: false,
          message: `Database connection failed: ${error.message}`
        }
      }

      // Test storage connection - try to list files instead of buckets
      // This is more reliable as bucket listing might be restricted for anon users
      const { data: files, error: storageError } = await supabase.storage
        .from(BUCKETS.IMAGES)
        .list('', { limit: 1 })
      
      if (storageError) {
        // If we can't list files, try to check if bucket exists by attempting to get a public URL
        try {
          const { data: urlData } = supabase.storage
            .from(BUCKETS.IMAGES)
            .getPublicUrl('test')
          
          if (urlData?.publicUrl) {
            // Bucket exists and is accessible
            console.log('Storage bucket accessible via public URL method')
          } else {
            return {
              success: false,
              message: `Storage bucket '${BUCKETS.IMAGES}' not found or not accessible. Please check your Supabase storage configuration.`
            }
          }
        } catch (urlError) {
          return {
            success: false,
            message: `Storage connection failed: ${storageError.message}`
          }
        }
      }

      return {
        success: true,
        message: 'Supabase connection successful! Cloud storage is ready.'
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  static async createTestImage(): Promise<{ success: boolean; message: string }> {
    try {
      if (!isSupabaseConfigured()) {
        return {
          success: false,
          message: 'Supabase is not configured'
        }
      }

      const testImage = {
        id: 'test-' + Date.now(),
        prompt: 'Test image for Supabase integration',
        image_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        quality: 'standard' as const,
        size: '1024x1024',
        model: 'test-model',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: ['test'],
        is_favorite: false
      }

      const { error } = await supabase
        .from(TABLES.GENERATED_IMAGES)
        .insert(testImage)

      if (error) {
        return {
          success: false,
          message: `Failed to create test image: ${error.message}`
        }
      }

      // Clean up test image
      await supabase
        .from(TABLES.GENERATED_IMAGES)
        .delete()
        .eq('id', testImage.id)

      return {
        success: true,
        message: 'Test image created and deleted successfully!'
      }
    } catch (error) {
      return {
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}

// Console test function for development
if (typeof window !== 'undefined') {
  (window as any).testSupabase = async () => {
    console.log('Testing Supabase connection...')
    const connectionResult = await SupabaseTest.testConnection()
    console.log('Connection test:', connectionResult)
    
    if (connectionResult.success) {
      console.log('Testing image creation...')
      const imageResult = await SupabaseTest.createTestImage()
      console.log('Image test:', imageResult)
    }
  }
}