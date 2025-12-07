'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import PasswordStrength, { passwordScore } from '@/components/ui/password-strength'
import { useTranslations } from '@/lib/i18n'

export default function ResetPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [hasRecovery, setHasRecovery] = useState(false)
  const router = useRouter()
  const { t } = useTranslations()

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search)
    const type = qs.get('type')
    const accessToken = qs.get('access_token') || qs.get('token')
    if (type === 'recovery' || accessToken) setHasRecovery(true)
  }, [])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

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

      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-foreground">{t.authResetTitle}</h1>
        <p className="text-muted-foreground">{t.authResetDescription}</p>
      </div>

      {!hasRecovery && (
        <div className="space-y-6">
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded border border-red-100 dark:border-red-900">
            {t.authInvalidLink}
          </div>
          <Button onClick={() => router.push('/auth/forgot')} className="w-full bg-mentha hover:bg-mentha/90 text-white">
            {t.authRequestLink}
          </Button>
        </div>
      )}

      {hasRecovery && !success && (
        <form onSubmit={handleReset} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">{t.authNewPassword}</Label>
            <Input
              id="password"
              name="password"
              autoComplete="new-password"
              className="pr-10 bg-background border-input text-foreground placeholder:text-muted-foreground"
              type="password"
              placeholder={t.authNewPasswordPlaceholder}
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={loading}
            />
            <PasswordStrength password={password} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-foreground">{t.authConfirmPassword}</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              className="pr-10 bg-background border-input text-foreground placeholder:text-muted-foreground"
              type="password"
              placeholder={t.authNewPasswordPlaceholder}
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
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
            {loading ? t.authSaving : t.authResetButton}
          </Button>
        </form>
      )}

      {success && (
        <div className="space-y-6">
          <div className="text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-4 rounded border border-green-100 dark:border-green-900">
            {t.authResetSuccessMessage}
          </div>
          <Button onClick={() => router.push('/auth/login')} className="w-full bg-mentha hover:bg-mentha/90 text-white">
            {t.authGoToLogin}
          </Button>
        </div>
      )}

      <div className="mt-6 text-center text-sm">
        <span className="text-muted-foreground">{t.authNoAccount} </span>
        <Link href="/auth/signup" className="font-medium text-mentha hover:underline">
          {t.authSignUp}
        </Link>
      </div>
    </div>
  )
}
