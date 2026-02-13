import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { NotificationsClient } from './notifications-client'
import { DEMO_USER_ID } from '@/lib/demo/constants'

// Types
interface Notification {
    id: string
    user_id: string
    type: 'analysis_complete' | 'reminder' | 'analysis_failed' | 'system' | 'info'
    title: string
    message: string
    status: 'unread' | 'read'
    metadata?: Record<string, any>
    created_at: string
}

// Demo notifications
const DEMO_NOTIFICATIONS: Notification[] = [
    {
        id: 'demo-notif-1',
        user_id: DEMO_USER_ID,
        type: 'analysis_complete',
        title: 'Análisis completado',
        message: 'El análisis de TechVerde Solutions ha finalizado. Tu puntuación de visibilidad ha aumentado a 82.',
        status: 'unread',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    },
    {
        id: 'demo-notif-2',
        user_id: DEMO_USER_ID,
        type: 'reminder',
        title: 'Recomendación pendiente',
        message: 'Tienes 3 recomendaciones de alta prioridad por implementar para mejorar tu visibilidad en IA.',
        status: 'unread',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    },
    {
        id: 'demo-notif-3',
        user_id: DEMO_USER_ID,
        type: 'info',
        title: 'Nueva mención detectada',
        message: 'Tu marca fue mencionada en Perplexity para la consulta "mejores soluciones tecnológicas verdes".',
        status: 'read',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    },
]

async function getNotificationsData(): Promise<{ notifications: Notification[] }> {
    // Check for demo mode via cookie
    const cookieStore = await cookies()
    const isDemoMode = cookieStore.get('mentha_demo_mode')?.value === 'true'

    if (isDemoMode) {
        return { notifications: DEMO_NOTIFICATIONS }
    }

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
