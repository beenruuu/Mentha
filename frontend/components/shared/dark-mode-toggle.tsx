"use client"

import { useEffect, useState } from 'react'
import { useTranslations } from '@/lib/i18n'

type Theme = 'light' | 'dark'

export function DarkModeToggle() {
  const [theme, setTheme] = useState<Theme>('light')
  const { t } = useTranslations()

  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme') as Theme | null
      if (stored === 'light' || stored === 'dark') {
        setTheme(stored)
        return
      }
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')
      if (prefersDark?.matches) {
        setTheme('dark')
      }
    } catch { }
  }, [])

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    try {
      localStorage.setItem('theme', theme)
    } catch { }
  }, [theme])

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        aria-pressed={theme === 'light'}
        onClick={() => setTheme('light')}
        className={`p-4 border-2 rounded-lg transition-colors ${theme === 'light'
            ? 'border-black bg-white text-gray-900'
            : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
          }`}
      >
        <div className="w-full h-12 bg-white border border-gray-200 rounded mb-2"></div>
        <p className="text-xs font-medium">{t.light}</p>
      </button>
      <button
        aria-pressed={theme === 'dark'}
        onClick={() => setTheme('dark')}
        className={`p-4 border-2 rounded-lg transition-colors ${theme === 'dark'
            ? 'border-white bg-[#0A0A0A] text-white'
            : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
          }`}
      >
        <div className="w-full h-12 bg-[#0A0A0A] rounded mb-2"></div>
        <p className="text-xs font-medium">{t.dark}</p>
      </button>
    </div>
  )
}


