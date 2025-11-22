import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // En modo demo, usar valores dummy para evitar errores
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || (isDemoMode ? 'https://demo.supabase.co' : '')
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (isDemoMode ? 'demo-key' : '')

  if (!supabaseUrl || !supabaseAnonKey) {
    if (!isDemoMode) {
      console.warn('⚠️ Supabase URL and Key are required. Using demo mode.')
    }
    // Retornar un cliente con valores dummy en modo demo
    return createBrowserClient(
      'https://demo.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
