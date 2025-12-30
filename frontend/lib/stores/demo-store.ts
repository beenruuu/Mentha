import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Store para el modo demo
// Reemplaza demo-context.tsx con updates más granulares

interface DemoState {
    isDemo: boolean
    setIsDemo: (value: boolean) => void
    enableDemo: () => void
    disableDemo: () => void
}

export const useDemoStore = create<DemoState>()(
    persist(
        (set) => ({
            isDemo: false,
            setIsDemo: (value) => set({ isDemo: value }),
            enableDemo: () => set({ isDemo: true }),
            disableDemo: () => set({ isDemo: false }),
        }),
        {
            name: 'demo-mode',
        }
    )
)
