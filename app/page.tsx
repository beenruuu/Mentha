'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const router = useRouter()
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

  useEffect(() => {
    // En modo demo, redirigir automáticamente al dashboard
    if (isDemoMode) {
      router.push('/dashboard')
    }
  }, [isDemoMode, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-3xl text-center p-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <svg className="h-20 w-20 text-emerald-600" viewBox="0 0 40 40">
            <path fill="currentColor" d="M19.7,26.3l3.2-4.2c1.7-2.6,3.5-5.4,3.9-8.5l-1.8,3.4c-1.3,1.8-2.6,3.8-4.1,5.4s-2.3,2.3-2.7,2.4-.2,0-.2-.2c-1-3.3-1.1-7.5.3-10.7s6.4-8,9.5-10.6,2.5-2.1,2.7-2c2.5,4.1,4.3,9.4,3.1,14.3-1.5,6.1-7.9,10.2-13.9,10.7Z"/>
            <path fill="currentColor" d="M33.7,20.5v15.1c0,1-1.6,2.5-2.6,2.7-2.4.4-4.2-1-4.4-3.4s-.2-6.1,0-8,0-.4.2-.6,1.7-.9,2.1-1.2c1.8-1.2,3.3-2.7,4.7-4.5Z"/>
            <path fill="currentColor" d="M16.3,25.4c-.1.1-.9-.6-1.1-.7-1.6-1.5-3.1-3.8-4-5.8-.3,0-.1.3,0,.4.6,2.5,2.6,4.8,4.1,6.9-3.5-.3-7.2-2.6-8.2-6.2s.4-5.7,1.7-8.4c.1,0,1.4,1,1.6,1.1,1.9,1.6,5,4.4,5.8,6.7s.4,4,0,6Z"/>
            <path fill="currentColor" d="M7.3,24.4c1.9,2,4.3,3.2,7,3.9-.3,2.2.5,6.1-.4,8.1s-3.4,2.6-5.1,1.5-1.5-1.6-1.5-2.2v-11.2Z"/>
            <path fill="currentColor" d="M23.9,27.5v8.1c0,.4-.8,1.6-1.1,1.9-1.6,1.4-4.4,1.1-5.4-.9s-.5-1.4-.5-1.6v-6.7c2.4,0,4.7-.1,7-.8Z"/>
          </svg>
        </div>

        <h1 className="text-5xl font-bold mb-4 text-gray-900 dark:text-white">
          Mentha AEO
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Optimiza tu visibilidad en motores de IA como ChatGPT, Claude, Perplexity y Gemini
        </p>
        
        <div className="flex justify-center gap-4 mb-12">
          <Link 
            href="/dashboard" 
            className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
          >
            Ir al Dashboard
          </Link>
          <Link 
            href="/aeo-analysis" 
            className="inline-block border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
          >
            Analizar Ahora
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Análisis AEO</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Optimización para motores de IA con recomendaciones accionables
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Keywords IA</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Rastrea tu visibilidad en respuestas de ChatGPT, Claude y más
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="text-3xl mb-3">👥</div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Competencia</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Compara tu rendimiento vs. competidores en buscadores IA
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


