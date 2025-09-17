import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration is missing. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.')
}

// Create Supabase client with better error handling
// Use placeholder values if environment variables are missing to prevent build errors
const safeSupabaseUrl = supabaseUrl || 'https://placeholder.supabase.co'
const safeSupabaseAnonKey = supabaseAnonKey || 'placeholder-key'

export const supabase = createClient(safeSupabaseUrl, safeSupabaseAnonKey, {
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
  negative_prompt?: string
  image_url: string
  file_path?: string
  file_size?: number
  quality: string
  style?: string
  width: number
  height: number
  steps: number
  guidance_scale: number
  seed?: number
  model: string
  created_at: string
  updated_at: string
  tags?: string[]
  is_favorite: boolean
}

// Helper function to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  // In browser environment, check process.env
  // In server environment, also check process.env
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Check if environment variables exist and are not placeholder values
  const hasValidUrl = supabaseUrl && 
    supabaseUrl !== 'your-supabase-url' && 
    supabaseUrl !== 'https://your-project-id.supabase.co' &&
    supabaseUrl.includes('.supabase.co');
    
  const hasValidKey = supabaseAnonKey && 
    supabaseAnonKey !== 'your-supabase-anon-key' &&
    supabaseAnonKey.startsWith('eyJ') && // JWT tokens start with eyJ
    supabaseAnonKey.length > 100; // Anon keys are typically long
  
  return !!(hasValidUrl && hasValidKey);
}

// Helper function to get storage URL
export const getStorageUrl = (path: string): string => {
  if (!isSupabaseConfigured()) return ''
  return supabase.storage.from(BUCKETS.IMAGES).getPublicUrl(path).data.publicUrl
}