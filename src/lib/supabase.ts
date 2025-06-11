import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Validate URL format
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Check if URL is still a placeholder
const isPlaceholder = (value: string): boolean => {
  return value.includes('your_supabase_project_url') || 
         value.includes('your-project-id') ||
         value === 'your_supabase_project_url'
}

if (isPlaceholder(supabaseUrl) || !isValidUrl(supabaseUrl)) {
  throw new Error(
    'Invalid Supabase URL. Please update VITE_SUPABASE_URL in your .env file with your actual Supabase project URL (e.g., https://your-project-id.supabase.co)'
  )
}

if (isPlaceholder(supabaseAnonKey) || supabaseAnonKey === 'your_supabase_anon_key') {
  throw new Error(
    'Invalid Supabase anon key. Please update VITE_SUPABASE_ANON_KEY in your .env file with your actual Supabase anon key.'
  )
}

// Client for frontend operations (uses anon key)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Admin client for server-side operations (uses service role key)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl, 
  supabaseServiceRoleKey || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error)
  throw new Error(error.message || 'An unexpected error occurred')
}