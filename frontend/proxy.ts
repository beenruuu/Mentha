import { updateSession } from '@/lib/supabase/middleware'
import { NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  // En modo demo, permitir acceso sin autenticación
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  
  if (isDemoMode) {
    return NextResponse.next()
  }
  
  // En modo producción, validar autenticación
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

