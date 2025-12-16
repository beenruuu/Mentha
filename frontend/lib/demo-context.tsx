'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

const DEMO_MODE_KEY = 'mentha_demo_mode'

interface DemoContextType {
    isDemoMode: boolean
    enterDemoMode: () => void
    exitDemoMode: () => void
}

const DemoContext = createContext<DemoContextType | undefined>(undefined)

// Helper to set cookie (needed for middleware which can't read localStorage)
function setDemoCookie(value: boolean) {
    if (typeof document === 'undefined') return
    if (value) {
        document.cookie = `${DEMO_MODE_KEY}=true; path=/; max-age=86400` // 1 day
    } else {
        document.cookie = `${DEMO_MODE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    }
}

export function DemoProvider({ children }: { children: ReactNode }) {
    const [isDemoMode, setIsDemoMode] = useState(false)
    const [isHydrated, setIsHydrated] = useState(false)

    useEffect(() => {
        // Check localStorage on mount
        const storedValue = localStorage.getItem(DEMO_MODE_KEY)
        setIsDemoMode(storedValue === 'true')
        setIsHydrated(true)
    }, [])

    const enterDemoMode = () => {
        localStorage.setItem(DEMO_MODE_KEY, 'true')
        setDemoCookie(true)
        setIsDemoMode(true)
    }

    const exitDemoMode = () => {
        localStorage.removeItem(DEMO_MODE_KEY)
        setDemoCookie(false)
        setIsDemoMode(false)
    }

    // Prevent hydration mismatch by not rendering until we've read localStorage
    if (!isHydrated) {
        return <>{children}</>
    }

    return (
        <DemoContext.Provider value={{ isDemoMode, enterDemoMode, exitDemoMode }}>
            {children}
        </DemoContext.Provider>
    )
}

export function useDemo() {
    const context = useContext(DemoContext)
    if (context === undefined) {
        throw new Error('useDemo must be used within a DemoProvider')
    }
    return context
}

// Helper function for checking demo mode outside React components
export function isDemoModeActive(): boolean {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(DEMO_MODE_KEY) === 'true'
}

export function setDemoMode(active: boolean) {
    if (typeof window === 'undefined') return
    if (active) {
        localStorage.setItem(DEMO_MODE_KEY, 'true')
        // Also set cookie for middleware
        document.cookie = `${DEMO_MODE_KEY}=true; path=/; max-age=86400`
    } else {
        localStorage.removeItem(DEMO_MODE_KEY)
        document.cookie = `${DEMO_MODE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    }
}
