'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslations } from '@/lib/i18n'

export default function ForgotPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const router = useRouter()
  const { t } = useTranslations()

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`,
      })

      if (error) throw error

      setSent(true)
    } catch (err: any) {
      setError(err.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-foreground">{t.authForgotTitle}</h1>
        <p className="text-muted-foreground">{t.authForgotDescription}</p>
      </div>

      {sent ? (
        <div className="space-y-6">
          <div className="text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-4 rounded border border-green-100 dark:border-green-900">
            {t.authEmailSentDescription}
          </div>
          <Button onClick={() => router.push('/auth/login')} className="w-full bg-mentha hover:bg-mentha/90 text-white">
            {t.authBackToLogin}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSend} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">{t.authEmail}</Label>
            <Input
              id="email"
              name="email"
              autoComplete="email"
              type="email"
              placeholder={t.authEmailPlaceholder}
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="bg-background border-input text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-100 dark:border-red-900">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full bg-mentha hover:bg-mentha/90 text-white h-11" disabled={loading}>
            {loading ? t.authSendingLink : t.authSendLink}
          </Button>
        </form>
      )}

      <div className="mt-6 text-center text-sm">
        <span className="text-muted-foreground">{t.authHaveAccount} </span>
        <Link href="/auth/login" className="font-medium text-mentha hover:underline">
          {t.authSignIn}
        </Link>
      </div>
    </div>
  )
}
