'use client'

import { useEffect, useState } from "react"
import { Bell, Loader2, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { PageHeader } from "@/components/layout/page-header"
import { useTranslations } from "@/lib/i18n"
import { notificationsService, type Notification } from "@/lib/services/notifications"

export default function NotificationsPage() {
  const { t } = useTranslations()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [isMarkingAll, setIsMarkingAll] = useState(false)

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const data = await notificationsService.getAll()
      const sorted = [...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setNotifications(sorted)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const handleMarkAllRead = async () => {
    if (!notifications.some((n) => n.status === 'unread')) return
    setIsMarkingAll(true)
    try {
      await notificationsService.markAllRead()
      await loadNotifications()
    } catch (error) {
      console.error('Failed to mark notifications:', error)
    } finally {
      setIsMarkingAll(false)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id)
      await loadNotifications()
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const renderStatusDot = (status: Notification['status']) => (
    <span
      className={`w-2 h-2 rounded-full ${status === 'unread' ? 'bg-emerald-500' : 'bg-gray-400'} inline-block`}
    />
  )

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader
          icon={<Bell className="h-5 w-5 text-emerald-600" />}
          title={t.notificationsTitle}
        />

        <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 bg-[#f5f5f5] dark:bg-[#0A0A0A]">
          <div className="flex items-center justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={isMarkingAll || !notifications.some((n) => n.status === 'unread')}
            >
              {isMarkingAll ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCheck className="w-4 h-4 mr-2" />}
              {t.markAllRead}
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t.noNotifications || 'No notifications yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                {t.notificationsDescription || "We'll notify you when there are important updates about your brands."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => {
                const severity = notification.metadata?.severity || 'info'
                return (
                  <Card key={notification.id} className={`p-5 bg-white dark:bg-black border ${notification.status === 'unread' ? 'border-emerald-200 dark:border-emerald-900/40' : 'border-gray-200 dark:border-[#1E1E24]'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {renderStatusDot(notification.status)}
                          <Badge variant="secondary" className="bg-gray-100 dark:bg-[#1E1E24] capitalize">
                            {notification.type.replace('_', ' ')}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="capitalize border-gray-300 dark:border-gray-700 text-xs"
                          >
                            {severity}
                          </Badge>
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{notification.message}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      {notification.status === 'unread' && (
                        <Button size="sm" variant="ghost" onClick={() => handleMarkAsRead(notification.id)}>
                          {t.markAsRead || 'Mark as read'}
                        </Button>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}





