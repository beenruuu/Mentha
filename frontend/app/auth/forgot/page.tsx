'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
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
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">{t.authForgotTitle}</CardTitle>
          <CardDescription className="text-center">{t.authForgotDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">{t.authEmailSentDescription}</div>
              <Button onClick={() => router.push('/auth/login')}>{t.authBackToLogin}</Button>
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t.authEmail}</Label>
                <Input id="email" name="email" autoComplete="email" type="email" placeholder={t.authEmailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
              </div>

              {error && <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded">{error}</div>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t.authSendingLink : t.authSendLink}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter>
          <div className="text-sm text-center w-full text-muted-foreground">
            {t.authHaveAccount}{' '}
            <Link href="/auth/login" className="text-emerald-600 hover:underline">{t.authSignIn}</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
