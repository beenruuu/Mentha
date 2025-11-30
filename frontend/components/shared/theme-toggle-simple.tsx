"use client"

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

type Theme = 'light' | 'dark' | 'system'

function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return
  
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else if (theme === 'light') {
    document.documentElement.classList.remove('dark')
  } else {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
}

export function ThemeToggleSimple({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system'
    try {
      return (localStorage.getItem('theme') as Theme) || 'system'
    } catch (_) {
      return 'system'
    }
  })

  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    applyTheme(theme)
    try {
      localStorage.setItem('theme', theme)
    } catch (_) {}
    
    // Check if currently dark
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [theme])

  const toggleTheme = () => {
    const currentlyDark = document.documentElement.classList.contains('dark')
    const newTheme = currentlyDark ? 'light' : 'dark'
    setTheme(newTheme)
    setIsDark(!currentlyDark)
  }

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-white/10 ${className}`}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-gray-600 dark:text-white/70" />
      ) : (
        <Moon className="w-5 h-5 text-gray-600 dark:text-white/70" />
      )}
    </button>
  )
}
