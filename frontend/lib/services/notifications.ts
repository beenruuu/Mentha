import { fetchAPI } from '@/lib/api-client'

export interface Notification {
  id: string
  brand_id?: string | null
  title: string
  message: string
  type: 'analysis_complete' | 'analysis_failed' | 'system' | 'reminder'
  status: 'unread' | 'read'
  metadata?: Record<string, any>
  created_at: string
  read_at?: string | null
}

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
