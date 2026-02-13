import { fetchAPI } from '@/lib/api-client'
import type { Notification } from '@/lib/types'

// Re-export type for backward compatibility
export type { Notification }

export const notificationsService = {
  getAll: async (status?: Notification['status']) => {
    const query = status ? `?status=${status}` : ''
    return fetchAPI<Notification[]>(`/notifications/${query}`)
  },

  markAsRead: async (id: string) => {
    return fetchAPI<Notification>(`/notifications/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'read' }),
    })
  },

  markAllRead: async () => {
    return fetchAPI<{ updated: number }>(`/notifications/mark-all-read`, {
      method: 'POST',
    })
  },
}
