'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import PasswordStrength, { passwordScore } from '@/components/ui/password-strength'
import { useTranslations } from '@/lib/i18n'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { t } = useTranslations()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    if (password !== confirmPassword) {
      setError(t.authPasswordsNoMatch)
      setLoading(false)
      return
    }

    const score = passwordScore(password)
    if (score < 3) {
      setError(t.authPasswordTooWeak)
      setLoading(false)
      return
    }

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setLoading(true)
    setError('')

    try {
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

  if (success) {
    return (
      <div className="w-full text-center">
        <h1 className="text-3xl font-bold mb-4 text-mentha">{t.authSignUpSuccess}</h1>
        <p className="text-muted-foreground mb-8">{t.authSignUpSuccessMessage}</p>
        <Button onClick={() => router.push('/auth/login')} className="bg-mentha hover:bg-mentha/90 text-white">
          {t.authSignIn}
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-foreground">{t.authSignUpTitle}</h1>
        <p className="text-muted-foreground">{t.authSignUpDescription}</p>
      </div>

      <form onSubmit={handleSignup} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-foreground">{t.authFullName}</Label>
          <Input
            id="fullName"
            type="text"
            placeholder={t.authFullNamePlaceholder}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            disabled={loading}
            className="bg-background border-input text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="bg-background border-input text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-foreground">{t.authPassword}</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              autoComplete="new-password"
              className="pr-10 bg-background border-input text-foreground placeholder:text-muted-foreground"
              type={showPassword ? 'text' : 'password'}
              placeholder={t.authNewPasswordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={loading}
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((s) => !s)}
              className="absolute inset-y-0 right-2 flex items-center bg-transparent text-sm text-muted-foreground p-1 rounded hover:bg-accent"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" />
                  <circle cx="12" cy="12" r="2.5" strokeWidth="1.5" />
                </svg>
              )}
            </button>
          </div>
          <PasswordStrength password={password} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-foreground">{t.authConfirmPassword}</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            className="pr-10 bg-background border-input text-foreground placeholder:text-muted-foreground"
            type={showPassword ? 'text' : 'password'}
            placeholder={t.authNewPasswordPlaceholder}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            disabled={loading}
          />
        </div>

        {error && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-100 dark:border-red-900">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full bg-mentha hover:bg-mentha/90 text-white h-11" disabled={loading}>
          {loading ? t.authCreatingAccount : t.authCreateAccount}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        <span className="text-muted-foreground">{t.authHaveAccount} </span>
        <Link href="/auth/login" className="font-medium text-mentha hover:underline">
          {t.authSignIn}
        </Link>
      </div>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">{t.authOrContinueWith}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Button
          type="button"
          variant="outline"
          className="w-full border-input text-foreground hover:bg-accent h-11"
          onClick={handleGoogleSignup}
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
      </div>
    </div>
  )
}
