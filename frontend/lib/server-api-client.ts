'use server'

import { createClient } from '@/lib/supabase/server'

const API_BASE_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

interface FetchOptions extends RequestInit {
    headers?: Record<string, string>
}

/**
 * Server-side API client for use in Server Components and Server Actions
 * Unlike the client-side fetchAPI, this runs on the server and can access
 * server-only environment variables
 */
export async function serverFetchAPI<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers,
    }

    if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        // Next.js cache options
        cache: options.cache || 'no-store',
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = typeof errorData.detail === 'string'
            ? errorData.detail
            : (typeof errorData.detail === 'object' ? JSON.stringify(errorData.detail) : null)

        throw new Error(errorMessage || `API Error: ${response.statusText}`)
    }

    return response.json()
}

/**
 * Get the current user from server-side session
 */
export async function getServerUser() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

/**
 * Check if user is authenticated on server
 */
export async function requireAuth() {
    const user = await getServerUser()
    if (!user) {
        throw new Error('Not authenticated')
    }
    return user
}
