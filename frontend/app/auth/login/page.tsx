'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
      
      if (isDemoMode) {
        // En modo demo, simplemente redirigir
        router.push('/dashboard')
        return
      }

      // En producción, usar Supabase
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')

    try {
      const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
      
      if (isDemoMode) {
        // En modo demo, simplemente redirigir
        router.push('/dashboard')
        return
      }

      // En producción, usar Supabase
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (error) throw error
    } catch (error: any) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <svg className="h-12 w-12 text-emerald-600" viewBox="0 0 40 40">
              <path fill="currentColor" d="M19.7,26.3l3.2-4.2c1.7-2.6,3.5-5.4,3.9-8.5l-1.8,3.4c-1.3,1.8-2.6,3.8-4.1,5.4s-2.3,2.3-2.7,2.4-.2,0-.2-.2c-1-3.3-1.1-7.5.3-10.7s6.4-8,9.5-10.6,2.5-2.1,2.7-2c2.5,4.1,4.3,9.4,3.1,14.3-1.5,6.1-7.9,10.2-13.9,10.7Z"/>
              <path fill="currentColor" d="M33.7,20.5v15.1c0,1-1.6,2.5-2.6,2.7-2.4.4-4.2-1-4.4-3.4s-.2-6.1,0-8,0-.4.2-.6,1.7-.9,2.1-1.2c1.8-1.2,3.3-2.7,4.7-4.5Z"/>
              <path fill="currentColor" d="M16.3,25.4c-.1.1-.9-.6-1.1-.7-1.6-1.5-3.1-3.8-4-5.8-.3,0-.1.3,0,.4.6,2.5,2.6,4.8,4.1,6.9-3.5-.3-7.2-2.6-8.2-6.2s.4-5.7,1.7-8.4c.1,0,1.4,1,1.6,1.1,1.9,1.6,5,4.4,5.8,6.7s.4,4,0,6Z"/>
              <path fill="currentColor" d="M7.3,24.4c1.9,2,4.3,3.2,7,3.9-.3,2.2.5,6.1-.4,8.1s-3.4,2.6-5.1,1.5-1.5-1.6-1.5-2.2v-11.2Z"/>
              <path fill="currentColor" d="M23.9,27.5v8.1c0,.4-.8,1.6-1.1,1.9-1.6,1.4-4.4,1.1-5.4-.9s-.5-1.4-.5-1.6v-6.7c2.4,0,4.7-.1,7-.8Z"/>
            </svg>
          </div>
          <CardTitle className="text-2xl text-center">Iniciar Sesión</CardTitle>
          <CardDescription className="text-center">
            Accede a tu cuenta de Mentha AEO
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && (
              <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">O continúa con</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </Button>
        </CardContent>
        <CardFooter>
          <div className="text-sm text-center w-full text-muted-foreground">
            ¿No tienes cuenta?{' '}
            <Link href="/auth/signup" className="text-emerald-600 hover:underline">
              Regístrate
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
