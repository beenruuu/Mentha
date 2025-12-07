'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { useTranslations } from '@/lib/i18n'

export function CookieConsent() {
  const { t } = useTranslations()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setIsVisible(true)
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setIsVisible(false)
  }

  const declineCookies = () => {
    localStorage.setItem('cookie-consent', 'declined')
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t p-4 shadow-lg md:p-6">
      <div className="container mx-auto flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 space-y-2">
          <h3 className="text-lg font-semibold">{t.cookieTitle}</h3>
          <p className="text-sm text-muted-foreground">
            {t.cookieDescription}
            <Link href="/legal/cookies" className="underline hover:text-primary">{t.cookiePolicy}</Link>.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={declineCookies}>
            {t.cookieDecline}
          </Button>
          <Button onClick={acceptCookies}>
            {t.cookieAccept}
          </Button>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground md:hidden"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">{t.close}</span>
        </button>
      </div>
    </div>
  )
}
