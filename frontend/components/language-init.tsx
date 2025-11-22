"use client"

import { useEffect } from "react"

/**
 * LanguageInit runs on the client and applies the stored language preference
 * to document.documentElement.lang to ensure proper language rendering.
 */
export function LanguageInit() {
  useEffect(() => {
    try {
      const lang = localStorage.getItem('language') || 'es'
      if (lang === 'es' || lang === 'en') {
        document.documentElement.lang = lang
      }
    } catch (err) {
      // ignore in restricted environments
    }
  }, [])

  return null
}

