import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NotificationsClient } from './notifications-client'

// Types
interface Notification {
    id: string
    user_id: string
    type: string
    title: string
    message: string
    status: 'unread' | 'read'
    metadata?: Record<string, any>
    created_at: string
}

async function getNotificationsData(): Promise<{ notifications: Notification[] }> {
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
        const res = await fetch(`${API_URL}/notifications/`, { headers, cache: 'no-store' })

        if (!res.ok) {
            console.error('Failed to fetch notifications:', res.status)
            return { notifications: [] }
        }

        const notifications = await res.json()
        // Sort by date descending
        const sorted = [...notifications].sort(
            (a: Notification, b: Notification) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        return { notifications: sorted }
    } catch (error) {
        console.error('Error fetching notifications:', error)
        return { notifications: [] }
    }
}

/**
 * Notifications Page - Server Component
 * 
 * Fetches notifications on server, sorted by date.
 */
export default async function NotificationsPage() {
    const { notifications } = await getNotificationsData()

    return <NotificationsClient initialNotifications={notifications} />
}
