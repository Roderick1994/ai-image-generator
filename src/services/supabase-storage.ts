import { supabase, TABLES, BUCKETS, GeneratedImageRecord, isSupabaseConfigured } from '@/lib/supabase'
import { GeneratedImage } from '@/types/image-generation'

export class SupabaseImageStorage {
  private isConfigured: boolean

  constructor() {
    this.isConfigured = isSupabaseConfigured()
    if (!this.isConfigured) {
      console.warn('Supabase is not configured. Storage operations will fail.')
    }
  }

  // Convert database record to GeneratedImage
  private recordToImage(record: GeneratedImageRecord): GeneratedImage {
    return {
      id: record.id,
      url: record.image_url,
      prompt: record.prompt,
      negative_prompt: record.negative_prompt,
      width: record.width,
      height: record.height,
      num_inference_steps: record.steps,
      guidance_scale: record.guidance_scale,
      seed: record.seed,
      scheduler: record.style,
      model_version: record.model,
      created_at: record.created_at,
      quality: record.quality,
      tags: record.tags || [],
      is_favorite: record.is_favorite,
      // Legacy properties for backward compatibility
      imageUrl: record.image_url,
      model: record.model,
      createdAt: record.created_at,
      isFavorite: record.is_favorite
    }
  }

  // Convert GeneratedImage to database record
  private imageToRecord(image: GeneratedImage): Partial<GeneratedImageRecord> {
    return {
      id: image.id,
      prompt: image.prompt,
      negative_prompt: image.negative_prompt || undefined,
      image_url: image.url,
      file_path: `generated/${image.id}.png`,
      width: image.width || 1024,
      height: image.height || 1024,
      steps: image.num_inference_steps || 20,
      guidance_scale: image.guidance_scale || 7.5,
      seed: image.seed || undefined,
      model: image.model_version || 'doubao',
      quality: 'standard',
      style: image.scheduler || 'natural',
      tags: [],
      is_favorite: image.is_favorite || false,
      created_at: image.created_at
    }
  }

  // Note: File upload functionality removed due to network issues
  // Images are now stored using direct URLs from the image generation service

  // Load all images from Supabase
  async loadImages(): Promise<GeneratedImage[]> {
    if (!this.isConfigured) return []

    try {
      const { data, error } = await supabase
        .from(TABLES.GENERATED_IMAGES)
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading images:', error)
        return []
      }

      return data.map(record => this.recordToImage(record))
    } catch (error) {
      console.error('Error loading images:', error)
      return []
    }
  }

  // Save image to Supabase (database only, no file upload)
  async saveImage(image: GeneratedImage): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('Supabase is not configured')
    }

    try {
      // Prepare record for database with original image URL
      const record = this.imageToRecord(image)
      
      // Save the database record with the original image URL
      // This ensures the image appears in gallery immediately
      const { error: dbError } = await supabase
        .from(TABLES.GENERATED_IMAGES)
        .upsert(record)

      if (dbError) {
        console.error('Error saving image to database:', dbError)
        throw new Error(`Failed to save image to database: ${dbError.message}`)
      }

      console.log('Image saved successfully to database:', image.id)
    } catch (error) {
      console.error('Error saving image:', error)
      throw error
    }
  }

  // Delete image from Supabase
  async deleteImage(id: string): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('Supabase is not configured')
    }

    try {
      // Get image record to find file path
      const { data: imageRecord } = await supabase
        .from(TABLES.GENERATED_IMAGES)
        .select('file_path')
        .eq('id', id)
        .single()

      // Delete from storage if file path exists
      if (imageRecord?.file_path) {
        await supabase.storage
          .from(BUCKETS.IMAGES)
          .remove([imageRecord.file_path])
      }

      // Delete from database
      const { error } = await supabase
        .from(TABLES.GENERATED_IMAGES)
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting image:', error)
        throw new Error(`Failed to delete image: ${error.message}`)
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      throw error
    }
  }

  // Update image in Supabase
  async updateImage(image: GeneratedImage): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('Supabase is not configured')
    }

    try {
      const record = this.imageToRecord(image)
      
      const { error } = await supabase
        .from(TABLES.GENERATED_IMAGES)
        .update(record)
        .eq('id', image.id)

      if (error) {
        console.error('Error updating image:', error)
        throw new Error(`Failed to update image: ${error.message}`)
      }
    } catch (error) {
      console.error('Error updating image:', error)
      throw error
    }
  }

  // Get paginated images
  async getImages(page: number = 1, pageSize: number = 12): Promise<{ images: GeneratedImage[], total: number }> {
    if (!this.isConfigured) return { images: [], total: 0 }

    try {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      const { data, error, count } = await supabase
        .from(TABLES.GENERATED_IMAGES)
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) {
        console.error('Error getting paginated images:', error)
        return { images: [], total: 0 }
      }

      return {
        images: data.map(record => this.recordToImage(record)),
        total: count || 0
      }
    } catch (error) {
      console.error('Error getting paginated images:', error)
      return { images: [], total: 0 }
    }
  }

  // Search images
  async searchImages(query: string): Promise<GeneratedImage[]> {
    if (!this.isConfigured) return []

    try {
      const { data, error } = await supabase
        .from(TABLES.GENERATED_IMAGES)
        .select('*')
        .or(`prompt.ilike.%${query}%,tags.cs.{"${query}"}`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error searching images:', error)
        return []
      }

      return data.map(record => this.recordToImage(record))
    } catch (error) {
      console.error('Error searching images:', error)
      return []
    }
  }

  // Get favorite images
  async getFavoriteImages(): Promise<GeneratedImage[]> {
    if (!this.isConfigured) return []

    try {
      const { data, error } = await supabase
        .from(TABLES.GENERATED_IMAGES)
        .select('*')
        .eq('is_favorite', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error getting favorite images:', error)
        return []
      }

      return data.map(record => this.recordToImage(record))
    } catch (error) {
      console.error('Error getting favorite images:', error)
      return []
    }
  }

  // Clear all images
  async clearAllImages(): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('Supabase is not configured')
    }

    try {
      // Get all storage paths
      const { data: images } = await supabase
        .from(TABLES.GENERATED_IMAGES)
        .select('storage_path')

      // Delete all files from storage
      if (images && images.length > 0) {
        const storagePaths = images
          .map(img => img.storage_path)
          .filter(path => path) as string[]
        
        if (storagePaths.length > 0) {
          await supabase.storage
            .from(BUCKETS.IMAGES)
            .remove(storagePaths)
        }
      }

      // Delete all records from database
      const { error } = await supabase
        .from(TABLES.GENERATED_IMAGES)
        .delete()
        .neq('id', '')

      if (error) {
        console.error('Error clearing all images:', error)
        throw new Error(`Failed to clear images: ${error.message}`)
      }
    } catch (error) {
      console.error('Error clearing all images:', error)
      throw error
    }
  }

  // Check if Supabase is available
  isAvailable(): boolean {
    return this.isConfigured
  }
}