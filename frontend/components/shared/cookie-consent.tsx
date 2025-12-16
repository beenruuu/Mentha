'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Cookie, Settings, Check, X } from 'lucide-react'
import { useTranslations } from '@/lib/i18n'

interface CookiePreferences {
  essential: boolean // Always true, cannot be disabled
  analytics: boolean
  functional: boolean
}

const CONSENT_COOKIE_NAME = 'mentha_cookie_consent'
const CONSENT_VERSION = '2.0' // GDPR-compliant version with granular opt-in

export function CookieConsent() {
  const { t } = useTranslations()
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    functional: false,
  })

  useEffect(() => {
    // Check if user has already consented with current version
    const consent = localStorage.getItem(CONSENT_COOKIE_NAME)
    if (consent) {
      try {
        const parsed = JSON.parse(consent)
        if (parsed.version === CONSENT_VERSION) {
          setPreferences(parsed.preferences)
          applyConsent(parsed.preferences)
          return // Don't show banner
        }
      } catch {
        // Invalid consent, show banner
      }
    }
    // Also check old format for migration
    const oldConsent = localStorage.getItem('cookie-consent')
    if (oldConsent) {
      // Migrate old consent - if they accepted before, migrate to all
      const migratedPrefs = {
        essential: true,
        analytics: oldConsent === 'accepted',
        functional: oldConsent === 'accepted',
      }
      saveConsent(migratedPrefs)
      localStorage.removeItem('cookie-consent') // Clean up old key
      return
    }

    // Show banner after a small delay for better UX
    setTimeout(() => setIsVisible(true), 1000)
  }, [])

  const applyConsent = (prefs: CookiePreferences) => {
    // Apply consent settings
    if (prefs.analytics) {
      // Enable analytics - Vercel Analytics is already loaded in layout
      // For Google Analytics, you'd initialize it here
      console.log('[Cookies] Analytics enabled')
      // @ts-ignore - window.gtag might exist
      if (typeof window !== 'undefined' && window.gtag) {
        // @ts-ignore
        window.gtag('consent', 'update', {
          analytics_storage: 'granted',
        })
      }
    } else {
      console.log('[Cookies] Analytics disabled')
      // @ts-ignore
      if (typeof window !== 'undefined' && window.gtag) {
        // @ts-ignore
        window.gtag('consent', 'update', {
          analytics_storage: 'denied',
        })
      }
    }

    if (prefs.functional) {
      console.log('[Cookies] Functional cookies enabled')
    }
  }

  const saveConsent = (prefs: CookiePreferences) => {
    const consentData = {
      version: CONSENT_VERSION,
      preferences: prefs,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem(CONSENT_COOKIE_NAME, JSON.stringify(consentData))

    // Also set a cookie for server-side detection (if needed)
    document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(prefs))}; max-age=31536000; path=/; SameSite=Lax`

    applyConsent(prefs)
    setIsVisible(false)
  }

  const acceptAll = () => {
    const allAccepted = { essential: true, analytics: true, functional: true }
    setPreferences(allAccepted)
    saveConsent(allAccepted)
  }

  const acceptSelected = () => {
    saveConsent(preferences)
  }

  const rejectNonEssential = () => {
    const essentialOnly = { essential: true, analytics: false, functional: false }
    setPreferences(essentialOnly)
    saveConsent(essentialOnly)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t shadow-2xl">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Main content */}
          <div className="flex items-start gap-3 flex-1">
            <Cookie className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">
                {t.cookieTitle || 'Utilizamos cookies'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t.cookieDescription || 'Usamos cookies para mejorar tu experiencia. Puedes aceptar todas, solo las esenciales, o personalizar tus preferencias.'}
                {' '}
                <Link href="/legal/cookies" className="underline hover:text-primary">
                  {t.cookiePolicy || 'Política de Cookies'}
                </Link>.
              </p>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline mt-1 flex items-center gap-1"
              >
                <Settings className="w-4 h-4" />
                {showDetails ? (t.hideDetails || 'Ocultar detalles') : (t.showDetails || 'Personalizar')}
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-2 lg:flex-nowrap">
            <Button variant="outline" onClick={rejectNonEssential}>
              {t.cookieDecline || 'Solo esenciales'}
            </Button>
            <Button onClick={acceptAll} className="gap-1">
              <Check className="w-4 h-4" />
              {t.cookieAccept || 'Aceptar todas'}
            </Button>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground md:hidden"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">{t.close || 'Cerrar'}</span>
          </button>
        </div>

        {/* Detailed preferences */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid gap-4 md:grid-cols-3">
              {/* Essential */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">
                    {t.essentialCookies || 'Esenciales'}
                  </span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    {t.alwaysActive || 'Siempre activas'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t.essentialCookiesDesc || 'Necesarias para el funcionamiento básico del sitio, autenticación y seguridad.'}
                </p>
              </div>

              {/* Analytics */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">
                    {t.analyticsCookies || 'Analíticas'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer dark:bg-zinc-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t.analyticsCookiesDesc || 'Nos ayudan a entender cómo usas el sitio para mejorar la experiencia.'}
                </p>
              </div>

              {/* Functional */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">
                    {t.functionalCookies || 'Funcionales'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.functional}
                      onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer dark:bg-zinc-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t.functionalCookiesDesc || 'Permiten recordar tus preferencias como idioma y tema.'}
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button onClick={acceptSelected}>
                {t.savePreferences || 'Guardar preferencias'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
