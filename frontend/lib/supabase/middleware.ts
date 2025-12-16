import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Cookie name for demo mode (must match demo-context.tsx)
const DEMO_MODE_COOKIE = 'mentha_demo_mode'

export async function updateSession(request: NextRequest) {
  // Check if user is in demo mode via cookie or localStorage simulation
  // Note: We check cookies here since localStorage is not available in middleware
  const isDemoMode = request.cookies.get(DEMO_MODE_COOKIE)?.value === 'true'

  // If in demo mode, allow access to protected routes
  if (isDemoMode) {
    return NextResponse.next()
  }

  // Verificar que las variables de entorno estén configuradas
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase URL and Key are required for production mode.')
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes
  // Añadir aquí todas las rutas que requieren sesión activa.
  const protectedPaths = [
    '/dashboard',
    '/brand',
    '/settings',
    '/keywords',
    '/competitors',
    '/upgrade',
    '/search',
    '/notifications',
    '/admin',
    '/onboarding',
  ]
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Auth routes (redirect to dashboard if already logged in)
  const authPaths = ['/auth/login', '/auth/signup']
  const isAuthPath = authPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (user && isAuthPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
