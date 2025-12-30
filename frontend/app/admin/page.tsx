import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminClient } from './admin-client'

// Types
interface AdminPageData {
    isAdmin: boolean
    overview: any | null
    userAnalytics: any | null
    subscriptions: any | null
}

async function getAdminData(): Promise<AdminPageData> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'
    const { data: { session } } = await supabase.auth.getSession()

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    }

    if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
    }

    try {
        // Fetch admin data in parallel
        const [overviewRes, usersRes, subsRes] = await Promise.allSettled([
            fetch(`${API_URL}/admin/overview`, { headers, cache: 'no-store' }),
            fetch(`${API_URL}/admin/analytics/users`, { headers, cache: 'no-store' }),
            fetch(`${API_URL}/admin/analytics/subscriptions`, { headers, cache: 'no-store' })
        ])

        let overview = null
        let userAnalytics = null
        let subscriptions = null

        if (overviewRes.status === 'fulfilled' && overviewRes.value.ok) {
            overview = await overviewRes.value.json()
        }

        if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
            userAnalytics = await usersRes.value.json()
        }

        if (subsRes.status === 'fulfilled' && subsRes.value.ok) {
            subscriptions = await subsRes.value.json()
        }

        return {
            isAdmin: true,
            overview,
            userAnalytics,
            subscriptions
        }
    } catch (error) {
        console.error('Error fetching admin data:', error)
        return {
            isAdmin: false,
            overview: null,
            userAnalytics: null,
            subscriptions: null
        }
    }
}

/**
 * Admin Dashboard - Server Component
 * 
 * Fetches admin overview, user analytics, and subscription data on server.
 */
export default async function AdminPage() {
    const data = await getAdminData()

    if (!data.isAdmin) {
        redirect('/dashboard')
    }

    return (
        <AdminClient
            initialOverview={data.overview}
            initialUserAnalytics={data.userAnalytics}
            initialSubscriptions={data.subscriptions}
        />
    )
}
