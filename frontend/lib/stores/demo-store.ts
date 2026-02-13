import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const DEMO_MODE_KEY = 'mentha_demo_mode'

// Helper to set cookie (needed for middleware which can't read localStorage)
function setDemoCookie(value: boolean) {
    if (typeof document === 'undefined') return
    if (value) {
        document.cookie = `${DEMO_MODE_KEY}=true; path=/; max-age=86400; SameSite=Lax` // 1 day
    } else {
        document.cookie = `${DEMO_MODE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    }
}

interface DemoState {
    isDemo: boolean
    setIsDemo: (value: boolean) => void
    enableDemo: () => void
    disableDemo: () => void
}

export const useDemoStore = create<DemoState>()(
    persist(
        (set) => ({
            isDemo: typeof window !== 'undefined' ? localStorage.getItem(DEMO_MODE_KEY) === 'true' : false,
            setIsDemo: (value) => {
                setDemoCookie(value)
                set({ isDemo: value })
            },
            enableDemo: () => {
                setDemoCookie(true)
                set({ isDemo: true })
            },
            disableDemo: () => {
                setDemoCookie(false)
                set({ isDemo: false })
            },
        }),
        {
            name: DEMO_MODE_KEY,
        }
    )
)
