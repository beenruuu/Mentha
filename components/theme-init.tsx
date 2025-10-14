"use client"

import { useEffect } from "react"

/**
 * ThemeInit runs on the client as early as possible and applies the stored
 * preference to document.documentElement to avoid hydration mismatches.
 *
 * Behavior:
 * - reads `theme` from localStorage: 'light' | 'dark' | 'system' (default 'system')
 * - if 'dark', adds 'dark' class to <html>
 * - if 'light', ensures 'dark' is not present
 * - if 'system', uses window.matchMedia to apply a match
 */
export function ThemeInit() {
  useEffect(() => {
    try {
      const raw = localStorage.getItem('theme') || 'system'
      const apply = (theme: string) => {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else if (theme === 'light') {
          document.documentElement.classList.remove('dark')
        } else {
          // system
          const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
          if (prefersDark) document.documentElement.classList.add('dark')
          else document.documentElement.classList.remove('dark')
        }
      }

      apply(raw)

      // respond to system changes when set to 'system'
      const mql = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)')
      const listener = (e: MediaQueryListEvent) => {
        const current = localStorage.getItem('theme') || 'system'
        if (current === 'system') {
          if (e.matches) document.documentElement.classList.add('dark')
          else document.documentElement.classList.remove('dark')
        }
      }
      if (mql && mql.addEventListener) mql.addEventListener('change', listener)

      return () => {
        if (mql && mql.removeEventListener) mql.removeEventListener('change', listener)
      }
    } catch (err) {
      // ignore in restricted environments
    }
  }, [])

  return null
}
