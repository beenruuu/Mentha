"use client"

import { useEffect } from "react"
import { detectAndSetGeoLanguage, getLanguage, isLanguageManuallySet } from "@/lib/i18n"

/**
 * LanguageInit runs on the client and:
 * 1. Applies the stored language preference to document.documentElement.lang
 * 2. If no manual preference is set, detects user's country via geolocation
 *    - Spain -> Spanish
 *    - Rest of the world -> English
 */
export function LanguageInit() {
  useEffect(() => {
    const initLanguage = async () => {
      try {
        // First apply stored language immediately to prevent flicker
        const storedLang = getLanguage()
        document.documentElement.lang = storedLang
        
        // Then, if no manual preference, try geolocation
        if (!isLanguageManuallySet()) {
          const detectedLang = await detectAndSetGeoLanguage()
          document.documentElement.lang = detectedLang
        }
      } catch (err) {
        // ignore in restricted environments
        console.warn('Language initialization error:', err)
      }
    }
    
    initLanguage()
  }, [])

  return null
}

