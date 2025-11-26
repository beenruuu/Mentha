import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Nota: se eliminó el bypass de "demo mode" para forzar autenticación.
  // Si antes se usaba `NEXT_PUBLIC_DEMO_MODE=true`, ahora se ignora.

  // Verificar que las variables de entorno estén configuradas
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase URL and Key are required for production mode. Using demo mode instead.')
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
    '/aeo-analysis',
    '/keywords',
    '/competitors',
    '/upgrade',
    '/search',
    '/notifications',
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
