'use client'

import { useEffect, useState } from "react"
import { Bell, Loader2, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { useTranslations } from "@/lib/i18n"
import { notificationsService, type Notification } from "@/lib/services/notifications"
import { format, isToday, isYesterday } from "date-fns"

export default function NotificationsPage() {
  const { t } = useTranslations()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const data = await notificationsService.getAll()
      const sorted = [...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setNotifications(sorted)
      if (sorted.length > 0 && !selectedId) {
        setSelectedId(sorted[0].id)
      }
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
      // Update local state to reflect change immediately
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' } : n))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'analysis_complete': return <CheckCircle className="w-5 h-5 text-emerald-500" />
      case 'reminder': return <AlertTriangle className="w-5 h-5 text-amber-500" />
      case 'analysis_failed': return <XCircle className="w-5 h-5 text-red-500" />
      default: return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const groupNotifications = (notifs: Notification[]) => {
    const groups: { [key: string]: Notification[] } = {
      'Today': [],
      'Yesterday': [],
      'Earlier': []
    }

    notifs.forEach(n => {
      const date = new Date(n.created_at)
      if (isToday(date)) groups['Today'].push(n)
      else if (isYesterday(date)) groups['Yesterday'].push(n)
      else groups['Earlier'].push(n)
    })

    return groups
  }

  const grouped = groupNotifications(notifications)
  const selectedNotification = notifications.find(n => n.id === selectedId)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#FAFAFA] dark:bg-[#09090b] h-screen overflow-hidden flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">{t.notificationsTitle}</h1>
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-800" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {notifications.filter(n => n.status === 'unread').length} unread
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isMarkingAll || !notifications.some((n) => n.status === 'unread')}
            className="text-muted-foreground hover:text-foreground"
          >
            {isMarkingAll ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCheck className="w-4 h-4 mr-2" />}
            {t.markAllRead}
          </Button>
        </header>

        <main className="flex-1 bg-white dark:bg-black rounded-tl-3xl border-t border-l border-gray-200 dark:border-[#2A2A30] overflow-hidden flex shadow-2xl relative z-10">
          {loading ? (
            <div className="flex items-center justify-center w-full h-full">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center w-full h-full text-center p-8">
              <div className="w-16 h-16 bg-secondary/30 rounded-full flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {t.noNotifications || 'No notifications yet'}
              </h3>
              <p className="text-muted-foreground max-w-sm">
                {t.notificationsDescription || "We'll notify you when there are important updates about your brands."}
              </p>
            </div>
          ) : (
            <div className="flex w-full h-full">
              {/* Left Column: Notification List */}
              <div className="w-full md:w-[400px] border-r border-gray-100 dark:border-[#1A1A20] overflow-y-auto bg-gray-50/30 dark:bg-[#0C0C0E]">
                <div className="p-4 space-y-6">
                  {Object.entries(grouped).map(([label, items]) => items.length > 0 && (
                    <div key={label} className="space-y-2">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-2 mb-2">{label}</h3>
                      <div className="space-y-1">
                        {items.map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() => {
                              setSelectedId(notification.id)
                              if (notification.status === 'unread') handleMarkAsRead(notification.id)
                            }}
                            className={`w-full text-left p-3 rounded-lg transition-all duration-200 flex gap-3 group relative ${selectedId === notification.id
                              ? 'bg-white dark:bg-[#1E1E24] shadow-sm ring-1 ring-gray-200 dark:ring-gray-800'
                              : 'hover:bg-gray-100 dark:hover:bg-[#131316]'
                              } ${notification.status === 'unread' ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                          >
                            {notification.status === 'unread' && (
                              <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-full" />
                            )}
                            <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${notification.status === 'unread' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                              }`}>
                              {getIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className={`text-sm font-medium truncate ${notification.status === 'unread' ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                  {notification.title}
                                </span>
                                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                  {format(new Date(notification.created_at), 'h:mm a')}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2 leading-relaxed">
                                {notification.message}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Detail View */}
              <div className="flex-1 overflow-y-auto bg-white dark:bg-black hidden md:block">
                {selectedNotification ? (
                  <div className="p-8 max-w-2xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedNotification.type === 'analysis_complete' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                        selectedNotification.type === 'reminder' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                          selectedNotification.type === 'analysis_failed' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                            'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                        }`}>
                        {getIcon(selectedNotification.type)}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedNotification.title}</h2>
                        <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                          <Clock className="w-3.5 h-3.5" />
                          {format(new Date(selectedNotification.created_at), 'PPP p')}
                        </p>
                      </div>
                    </div>

                    <div className="prose dark:prose-invert max-w-none">
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base">
                        {selectedNotification.message}
                      </p>

                      {/* Example of rich content that could be in a notification */}
                      <div className="mt-8 p-4 bg-gray-50 dark:bg-[#111114] rounded-lg border border-gray-100 dark:border-[#1A1A20]">
                        <h4 className="text-sm font-semibold mb-2">Related Context</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>Brand:</span>
                          <span className="font-medium text-gray-900 dark:text-white">Mentha AI</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <span>Source:</span>
                          <span className="font-medium text-gray-900 dark:text-white">System Monitor</span>
                        </div>
                      </div>

                      <div className="mt-8 flex gap-3">
                        <Button>View Details</Button>
                        <Button variant="outline">Dismiss</Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-[#111114] rounded-full flex items-center justify-center mb-4">
                      <Info className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                    </div>
                    <p>Select a notification to view details</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
