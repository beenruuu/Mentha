import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  // En modo demo, usar valores dummy para evitar errores
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || (isDemoMode ? 'https://demo.supabase.co' : '')
  let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (isDemoMode ? 'demo-key' : '')

  if (!supabaseUrl || !supabaseAnonKey) {
    if (!isDemoMode) {
      console.warn('⚠️ Supabase URL and Key are required. Using demo mode.')
    }
    // Usar valores dummy en modo demo
    supabaseUrl = 'https://demo.supabase.co'
    supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  }

  const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
