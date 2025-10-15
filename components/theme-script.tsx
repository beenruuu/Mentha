"use client"

import { useEffect } from "react"

/**
 * ThemeScript: applies stored theme preference on mount to avoid flash.
 * Reads 'theme' from localStorage: 'light' | 'dark' (default 'light').
 */
export function ThemeScript() {
  useEffect(() => {
    try {
      const theme = localStorage.getItem('theme') || 'light'
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } catch {
      // ignore in restricted environments
    }
  }, [])

  return null
}


