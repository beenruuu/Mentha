'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { DEMO_BRAND_ID, DEMO_USER_ID, isDemoMode, setDemoMode } from './constants'

interface DemoContextType {
    isDemo: boolean
    enableDemo: () => void
    disableDemo: () => void
    toggleDemo: () => void
    demoBrandId: string
    demoUserId: string
}

const DemoContext = createContext<DemoContextType | undefined>(undefined)

interface DemoProviderProps {
    children: ReactNode
}

export function DemoProvider({ children }: DemoProviderProps) {
    const [isDemo, setIsDemo] = useState(false)

    useEffect(() => {
        setIsDemo(isDemoMode())
    }, [])

    const enableDemo = () => {
        setDemoMode(true)
        setIsDemo(true)
    }

    const disableDemo = () => {
        setDemoMode(false)
        setIsDemo(false)
    }

    const toggleDemo = () => {
        if (isDemo) {
            disableDemo()
        } else {
            enableDemo()
        }
    }

    return (
        <DemoContext.Provider
            value={{
                isDemo,
                enableDemo,
                disableDemo,
                toggleDemo,
                demoBrandId: DEMO_BRAND_ID,
                demoUserId: DEMO_USER_ID,
            }}
        >
            {children}
        </DemoContext.Provider>
    )
}

export function useDemo(): DemoContextType {
    const context = useContext(DemoContext)
    if (context === undefined) {
        throw new Error('useDemo must be used within a DemoProvider')
    }
    return context
}
