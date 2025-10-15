"use client"

import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

function applyTheme(theme: Theme) {
  if (theme === 'dark') document.documentElement.classList.add('dark')
  else if (theme === 'light') document.documentElement.classList.remove('dark')
  else {
    const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
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
    } catch (_) {}
  }, [theme])

  return (
    <div className="grid grid-cols-3 gap-3">
      <button
        aria-pressed={theme === 'light'}
        onClick={() => setTheme('light')}
        className={`p-4 border-2 rounded-lg ${theme === 'light' ? 'border-black' : 'border-gray-200'} bg-white`}
      >
        <div className="w-full h-12 bg-white border border-gray-200 rounded mb-2"></div>
        <p className="text-xs font-medium">Claro</p>
      </button>
      <button
        aria-pressed={theme === 'dark'}
        onClick={() => setTheme('dark')}
        className={`p-4 border-2 rounded-lg ${theme === 'dark' ? 'border-black bg-gray-900 text-white' : 'border-gray-200 bg-white'}`}
      >
        <div className="w-full h-12 bg-gray-900 rounded mb-2"></div>
        <p className="text-xs font-medium">Oscuro</p>
      </button>
      <button
        aria-pressed={theme === 'system'}
        onClick={() => setTheme('system')}
        className={`p-4 border-2 rounded-lg ${theme === 'system' ? 'border-black' : 'border-gray-200'} bg-white`}
      >
        <div className="w-full h-12 bg-gradient-to-r from-white to-gray-900 rounded mb-2"></div>
        <p className="text-xs font-medium">Sistema</p>
      </button>
    </div>
  )
}


