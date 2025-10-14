"use client"

import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

export function DarkModeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light'
    try {
      return (localStorage.getItem('theme') as Theme) || 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    try {
      localStorage.setItem('theme', theme)
    } catch {}
  }, [theme])

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        aria-pressed={theme === 'light'}
        onClick={() => setTheme('light')}
        className={`p-4 border-2 rounded-lg transition-colors ${
          theme === 'light'
            ? 'border-black bg-white'
            : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
      >
        <div className="w-full h-12 bg-white border border-gray-200 rounded mb-2"></div>
        <p className="text-xs font-medium text-gray-900">Claro</p>
      </button>
      <button
        aria-pressed={theme === 'dark'}
        onClick={() => setTheme('dark')}
        className={`p-4 border-2 rounded-lg transition-colors ${
          theme === 'dark'
            ? 'border-white bg-gray-900 text-white'
            : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
      >
        <div className="w-full h-12 bg-gray-900 rounded mb-2"></div>
        <p className="text-xs font-medium">Oscuro</p>
      </button>
    </div>
  )
}
