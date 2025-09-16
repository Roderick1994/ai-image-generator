import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration is missing. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.')
}

// Create Supabase client with better error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false // For this demo, we don't need persistent sessions
  }
})

// Database table names
export const TABLES = {
  GENERATED_IMAGES: 'generated_images'
} as const

// Storage bucket names
export const BUCKETS = {
  IMAGES: 'images'
} as const

// Types for database
export interface GeneratedImageRecord {
  id: string
  prompt: string
  image_url: string
  storage_path?: string
  quality: 'standard' | 'hd'
  size: string
  width?: number
  height?: number
  model: string
  created_at: string
  updated_at: string
  user_id?: string
  tags?: string[]
  is_favorite: boolean
}

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey)
}

// Helper function to get storage URL
export const getStorageUrl = (path: string): string => {
  if (!isSupabaseConfigured()) return ''
  return supabase.storage.from(BUCKETS.IMAGES).getPublicUrl(path).data.publicUrl
}