'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from '@/lib/i18n'
import { X, FlaskConical } from 'lucide-react'

import { useDemoStore } from '@/lib/stores/demo-store'

const BANNER_HEIGHT = '40px'

export function DemoBanner() {
    const { isDemo: isDemoMode, disableDemo: exitDemoMode } = useDemoStore()

    const router = useRouter()
    const { t } = useTranslations()

    // Add padding-top to body when in demo mode so sidebar and all content is pushed down
    useEffect(() => {
        if (isDemoMode) {
            document.body.style.paddingTop = BANNER_HEIGHT
        } else {
            document.body.style.paddingTop = '0'
        }
        return () => {
            document.body.style.paddingTop = '0'
        }
    }, [isDemoMode])

    if (!isDemoMode) return null

    const handleExit = () => {
        exitDemoMode()
        router.push('/auth/login')
    }

    return (
        <div
            className="fixed top-0 left-0 right-0 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white py-2 px-4 shadow-lg z-[9999]"
            style={{ height: BANNER_HEIGHT }}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between h-full">
                <div className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4" />
                    <span className="text-sm font-medium">
                        {t.demoModeActive || 'Estás en modo demo'}
                    </span>
                    <span className="text-xs opacity-80 hidden sm:inline">
                        — {t.demoDescription || 'Explora la plataforma con datos de ejemplo'}
                    </span>
                </div>
                <button
                    onClick={handleExit}
                    className="flex items-center gap-1 text-sm font-medium hover:bg-white/20 rounded-md px-3 py-1 transition-colors"
                >
                    <span>{t.exitDemo || 'Salir del demo'}</span>
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}

