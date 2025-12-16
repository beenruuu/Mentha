'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from '@/lib/i18n'
import { X, Cookie, Settings, Check } from 'lucide-react'

interface CookiePreferences {
    essential: boolean // Always true, cannot be disabled
    analytics: boolean
    functional: boolean
}

const CONSENT_COOKIE_NAME = 'mentha_cookie_consent'
const CONSENT_VERSION = '1.0' // Increment when cookie policy changes

export default function CookieConsentBanner() {
    const { t } = useTranslations()
    const [isVisible, setIsVisible] = useState(false)
    const [showDetails, setShowDetails] = useState(false)
    const [preferences, setPreferences] = useState<CookiePreferences>({
        essential: true,
        analytics: false,
        functional: false,
    })

    useEffect(() => {
        // Check if user has already consented
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
        // Show banner after a small delay for better UX
        setTimeout(() => setIsVisible(true), 1000)
    }, [])

    const applyConsent = (prefs: CookiePreferences) => {
        // Apply consent settings
        if (prefs.analytics) {
            // Enable Google Analytics or similar
            // This is where you'd initialize GA
            console.log('[Cookies] Analytics enabled')
        } else {
            // Disable/remove analytics cookies
            console.log('[Cookies] Analytics disabled')
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

        // Also set a cookie for server-side detection
        document.cookie = `${CONSENT_COOKIE_NAME}=${JSON.stringify(prefs)}; max-age=31536000; path=/; SameSite=Lax`

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
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-white/10 shadow-2xl">
            <div className="container mx-auto max-w-6xl">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Main content */}
                    <div className="flex items-start gap-3 flex-1">
                        <Cookie className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                {t.cookieConsentTitle || 'Utilizamos cookies'}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {t.cookieConsentDescription || 'Usamos cookies para mejorar tu experiencia. Puedes aceptar todas, solo las esenciales, o personalizar tus preferencias.'}
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
                        <button
                            onClick={rejectNonEssential}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                        >
                            {t.rejectNonEssential || 'Solo esenciales'}
                        </button>
                        <button
                            onClick={acceptAll}
                            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1"
                        >
                            <Check className="w-4 h-4" />
                            {t.acceptAllCookies || 'Aceptar todas'}
                        </button>
                    </div>
                </div>

                {/* Detailed preferences */}
                {showDetails && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
                        <div className="grid gap-4 md:grid-cols-3">
                            {/* Essential */}
                            <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {t.essentialCookies || 'Esenciales'}
                                    </span>
                                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                        {t.alwaysActive || 'Siempre activas'}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {t.essentialCookiesDesc || 'Necesarias para el funcionamiento básico del sitio, autenticación y seguridad.'}
                                </p>
                            </div>

                            {/* Analytics */}
                            <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-gray-900 dark:text-white">
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
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {t.analyticsCookiesDesc || 'Nos ayudan a entender cómo usas el sitio para mejorar la experiencia.'}
                                </p>
                            </div>

                            {/* Functional */}
                            <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-gray-900 dark:text-white">
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
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {t.functionalCookiesDesc || 'Permiten recordar tus preferencias como idioma y tema.'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={acceptSelected}
                                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                            >
                                {t.savePreferences || 'Guardar preferencias'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Links */}
                <div className="mt-3 flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <a href="/legal/cookies" className="hover:text-emerald-600 dark:hover:text-emerald-400">
                        {t.cookiePolicy || 'Política de Cookies'}
                    </a>
                    <a href="/legal/privacy" className="hover:text-emerald-600 dark:hover:text-emerald-400">
                        {t.privacyPolicy || 'Política de Privacidad'}
                    </a>
                </div>
            </div>
        </div>
    )
}
