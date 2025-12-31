import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from './settings-client'
import { DEMO_USER } from '@/lib/demo/constants'

// Types
interface UserData {
    id: string
    email?: string
    user_metadata?: {
        full_name?: string
        avatar_url?: string
    }
}

async function getSettingsData(): Promise<{ user: UserData } | null> {
    // Check for demo mode via cookie
    const cookieStore = await cookies()
    const isDemoMode = cookieStore.get('mentha_demo_mode')?.value === 'true'

    if (isDemoMode) {
        return { user: DEMO_USER }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    return {
        user: {
            id: user.id,
            email: user.email,
            user_metadata: user.user_metadata
        }
    }
}

/**
 * Settings Page - Server Component
 * 
 * Fetches user data on server. Notification preferences come from localStorage
 * which must be handled on the client side.
 */
export default async function SettingsPage() {
    const data = await getSettingsData()

    if (!data) {
        redirect('/auth/login')
    }

    return <SettingsClient initialUser={data.user} />
}
