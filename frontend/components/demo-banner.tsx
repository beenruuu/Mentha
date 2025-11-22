'use client'

import { AlertCircle, X } from 'lucide-react'
import { useState } from 'react'

export function DemoBanner() {
  const [isVisible, setIsVisible] = useState(true)
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

  if (!isDemoMode || !isVisible) return null

  return (
    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-3 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div className="text-sm">
            <strong className="font-semibold">Modo Demo Activo</strong>
            {' · '}
            <span className="opacity-90">
              Estás viendo la interfaz con datos de ejemplo. Configura tus APIs para análisis reales.
            </span>
            {' '}
            <a 
              href="/DEMO-MODE.md" 
              target="_blank"
              className="underline hover:no-underline font-medium"
            >
              Ver documentación
            </a>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="p-1 hover:bg-white/20 rounded transition-colors shrink-0"
          aria-label="Cerrar banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
