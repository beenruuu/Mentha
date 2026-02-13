"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from '@/lib/i18n'

type Theme = 'light' | 'dark' | 'system'

function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return

  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else if (theme === 'light') {
    document.documentElement.classList.remove('dark')
  } else {
    // system
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
}

export function ThemeToggle() {
  const router = useRouter()
  const { t } = useTranslations()
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system'
    try {
      return (localStorage.getItem('theme') as Theme) || 'system'
    } catch (_) {
      return 'system'
    }
  })

  useEffect(() => {
    applyTheme(theme)
    try {
      localStorage.setItem('theme', theme)
      // Listen to system changes when theme is 'system'
      if (theme === 'system') {
        const mql = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)')
        const listener = (e: MediaQueryListEvent) => {
          if (localStorage.getItem('theme') === 'system') {
            if (e.matches) {
              document.documentElement.classList.add('dark')
            } else {
              document.documentElement.classList.remove('dark')
            }
          }
        }
        if (mql && mql.addEventListener) {
          mql.addEventListener('change', listener)
          return () => mql.removeEventListener('change', listener)
        }
      }
    } catch (_) { }
  }, [theme])

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    // Force a re-render to ensure theme is applied
    router.refresh()
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      <button
        aria-pressed={theme === 'light'}
        onClick={() => handleThemeChange('light')}
        className={`p-4 border-2 rounded-lg transition-colors ${theme === 'light'
            ? 'border-black dark:border-white bg-white dark:bg-black text-gray-900 dark:text-white'
            : 'border-gray-200 dark:border-[#2A2A30] bg-white dark:bg-black hover:border-gray-300 dark:hover:border-[#3A3A40] text-gray-700 dark:text-gray-300'
          }`}
      >
        <div className="w-full h-12 bg-white border border-gray-200 rounded mb-2" />
        <p className="text-xs font-medium">{t.light}</p>
      </button>
      <button
        aria-pressed={theme === 'dark'}
        onClick={() => handleThemeChange('dark')}
        className={`p-4 border-2 rounded-lg transition-colors ${theme === 'dark'
            ? 'border-black dark:border-white bg-[#0A0A0A] dark:bg-black text-white'
            : 'border-gray-200 dark:border-[#2A2A30] bg-white dark:bg-black hover:border-gray-300 dark:hover:border-[#3A3A40] text-gray-700 dark:text-gray-300'
          }`}
      >
        <div className="w-full h-12 bg-[#0A0A0A] border border-[#2A2A30] rounded mb-2" />
        <p className="text-xs font-medium">{t.dark}</p>
      </button>
      <button
        aria-pressed={theme === 'system'}
        onClick={() => handleThemeChange('system')}
        className={`p-4 border-2 rounded-lg transition-colors ${theme === 'system'
            ? 'border-black dark:border-white bg-white dark:bg-black text-gray-900 dark:text-white'
            : 'border-gray-200 dark:border-[#2A2A30] bg-white dark:bg-black hover:border-gray-300 dark:hover:border-[#3A3A40] text-gray-700 dark:text-gray-300'
          }`}
      >
        <div className="w-full h-12 bg-gradient-to-r from-white via-gray-400 to-[#0A0A0A] rounded mb-2" />
        <p className="text-xs font-medium">{t.system}</p>
      </button>
    </div>
  )
}


