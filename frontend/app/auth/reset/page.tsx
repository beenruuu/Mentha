'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
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
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">{t.authResetTitle}</CardTitle>
          <CardDescription className="text-center">{t.authResetDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {!hasRecovery && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">{t.authInvalidLink}</div>
              <Button onClick={() => router.push('/auth/forgot')}>{t.authRequestLink}</Button>
            </div>
          )}

          {hasRecovery && !success && (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">{t.authNewPassword}</Label>
                <Input id="password" name="password" autoComplete="new-password" className="pr-10" type="password" placeholder={t.authNewPasswordPlaceholder} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} disabled={loading} />
                <PasswordStrength password={password} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t.authConfirmPassword}</Label>
                <Input id="confirmPassword" name="confirmPassword" autoComplete="new-password" className="pr-10" type="password" placeholder={t.authNewPasswordPlaceholder} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} disabled={loading} />
              </div>

              {error && <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded">{error}</div>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t.authSaving : t.authResetButton}
              </Button>
            </form>
          )}

          {success && (
            <div className="space-y-4">
              <div className="text-sm">{t.authResetSuccessMessage}</div>
              <Button onClick={() => router.push('/auth/login')}>{t.authGoToLogin}</Button>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <div className="text-sm text-center w-full text-muted-foreground">
            {t.authNoAccount}{' '}
            <Link href="/auth/signup" className="text-emerald-600 hover:underline">{t.authSignUp}</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
