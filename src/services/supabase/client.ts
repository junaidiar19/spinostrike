import { createClient } from '@supabase/supabase-js'

const getEnvVar = (keys: string[]): string => {
  for (const k of keys) {
    const val = (import.meta.env as Record<string, string | undefined>)[k]
    if (val && typeof val === 'string' && val.trim().length > 0) {
      return val.trim()
    }
  }
  return ''
}

const supabaseUrl =
  getEnvVar(['VITE_SUPABASE_URL', 'SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL']) ||
  'https://demo-placeholder.supabase.co'

const supabaseAnonKey =
  getEnvVar(['VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']) ||
  'demo-anon-key'

// Supabase client singleton
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const isSupabaseConfigured = () => {
  const url = getEnvVar(['VITE_SUPABASE_URL', 'SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'])
  return Boolean(url) && url !== 'https://demo-placeholder.supabase.co'
}
