/**
 * Demo Mode Constants
 */

// Demo identifiers
export const DEMO_BRAND_ID = 'demo-brand-001'
export const DEMO_USER_ID = 'demo-user-001'

// Demo brand info
export const DEMO_BRAND_NAME = 'TechVerde Solutions'
export const DEMO_BRAND_DOMAIN = 'techverde.es'

// Demo mode detection
export const isDemoMode = (): boolean => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('demo_mode') === 'true'
}

export const setDemoMode = (enabled: boolean): void => {
    if (typeof window === 'undefined') return
    localStorage.setItem('demo_mode', enabled ? 'true' : 'false')
}
