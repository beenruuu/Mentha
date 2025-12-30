'use client'

import { useEffect, useState } from "react"
import { Bell, Loader2, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle, Clock, Filter, Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { UserAvatarMenu } from "@/components/layout/user-avatar-menu"
import { useTranslations } from "@/lib/i18n"
import { notificationsService, type Notification } from "@/lib/services/notifications"
import { format, isToday, isYesterday } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface NotificationsClientProps {
    initialNotifications: Notification[]
}

/**
 * NotificationsClient - Client Component for Notifications Page
 * 
 * Receives sorted notifications from server - no loading on first render.
 * Handles marking as read, filtering, and selection.
 */
export function NotificationsClient({ initialNotifications }: NotificationsClientProps) {
    const { t } = useTranslations()

    // Initialize with server data - no loading!
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
    const [isMarkingAll, setIsMarkingAll] = useState(false)
    const [selectedId, setSelectedId] = useState<string | null>(
        initialNotifications.length > 0 ? initialNotifications[0].id : null
    )
    const [filter, setFilter] = useState<'all' | 'unread'>('all')

    const handleMarkAllRead = async () => {
        if (!notifications.some((n) => n.status === 'unread')) return
        setIsMarkingAll(true)
        try {
            await notificationsService.markAllRead()
            setNotifications(prev => prev.map(n => ({ ...n, status: 'read' as const })))
        } catch (error) {
            console.error('Failed to mark notifications:', error)
        } finally {
            setIsMarkingAll(false)
        }
    }

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationsService.markAsRead(id)
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' as const } : n))
        } catch (error) {
            console.error('Failed to mark notification as read:', error)
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'analysis_complete': return <CheckCircle className="w-5 h-5 text-emerald-500" />
            case 'reminder': return <AlertTriangle className="w-5 h-5 text-amber-500" />
            case 'analysis_failed': return <XCircle className="w-5 h-5 text-red-500" />
            default: return <Info className="w-5 h-5 text-mentha" />
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

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return n.status === 'unread'
        return true
    })

    const grouped = groupNotifications(filteredNotifications)
    const selectedNotification = notifications.find(n => n.id === selectedId)

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-[#FAFAFA] dark:bg-[#09090b] h-screen overflow-hidden flex flex-col">
                {/* Header */}
                <header className="flex items-center justify-between px-6 py-4 shrink-0">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger className="-ml-1" />
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">{t.notificationsTitle}</h1>
                    </div>
                    <UserAvatarMenu />
                </header>

                <main className="flex-1 bg-white dark:bg-black rounded-tl-3xl overflow-hidden flex shadow-2xl relative z-10">
                    {filteredNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center w-full h-full text-center p-8 bg-white dark:bg-[#0C0C0E]">
                            <div className="absolute top-6 right-6 flex gap-2">
                                <div className="flex p-1 bg-gray-100 dark:bg-[#1A1A20] rounded-lg">
                                    <button
                                        onClick={() => setFilter('all')}
                                        className={cn(
                                            "px-3 py-1 text-xs font-medium rounded-md transition-all duration-200",
                                            filter === 'all'
                                                ? "bg-white dark:bg-[#2A2A30] text-gray-900 dark:text-white shadow-sm"
                                                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                        )}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setFilter('unread')}
                                        className={cn(
                                            "px-3 py-1 text-xs font-medium rounded-md transition-all duration-200",
                                            filter === 'unread'
                                                ? "bg-white dark:bg-[#2A2A30] text-gray-900 dark:text-white shadow-sm"
                                                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                        )}
                                    >
                                        Unread
                                        {notifications.filter(n => n.status === 'unread').length > 0 && (
                                            <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold text-white bg-mentha rounded-full">
                                                {notifications.filter(n => n.status === 'unread').length}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="w-20 h-20 bg-gray-50 dark:bg-[#1A1A20] rounded-full flex items-center justify-center mb-6"
                            >
                                {filter === 'unread' ? (
                                    <CheckCheck className="w-10 h-10 text-emerald-500/50" />
                                ) : (
                                    <Inbox className="w-10 h-10 text-gray-400/50" />
                                )}
                            </motion.div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                {filter === 'unread' ? "You're all caught up!" : (t.noNotifications || 'No notifications yet')}
                            </h3>
                            <p className="text-muted-foreground max-w-sm">
                                {filter === 'unread'
                                    ? "No unread notifications to display."
                                    : (t.notificationsDescription || "We'll notify you when there are important updates about your brands.")}
                            </p>
                            {filter === 'unread' && (
                                <Button variant="outline" className="mt-6" onClick={() => setFilter('all')}>
                                    View all notifications
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="flex w-full h-full">
                            {/* Left Column: Notification List */}
                            <div className="w-full md:w-[420px] border-r border-gray-200 dark:border-[#1A1A20] overflow-y-auto bg-white dark:bg-[#0C0C0E] flex flex-col">
                                {/* List Header with Controls */}
                                <div className="p-4 border-b border-gray-100 dark:border-[#1A1A20] bg-white/80 dark:bg-[#0C0C0E]/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between gap-2">
                                    <div className="flex p-1 bg-gray-100 dark:bg-[#1A1A20] rounded-lg shrink-0">
                                        <button
                                            onClick={() => setFilter('all')}
                                            className={cn(
                                                "px-3 py-1 text-xs font-medium rounded-md transition-all duration-200",
                                                filter === 'all'
                                                    ? "bg-white dark:bg-[#2A2A30] text-gray-900 dark:text-white shadow-sm"
                                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                            )}
                                        >
                                            All
                                        </button>
                                        <button
                                            onClick={() => setFilter('unread')}
                                            className={cn(
                                                "px-3 py-1 text-xs font-medium rounded-md transition-all duration-200",
                                                filter === 'unread'
                                                    ? "bg-white dark:bg-[#2A2A30] text-gray-900 dark:text-white shadow-sm"
                                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                            )}
                                        >
                                            Unread
                                            {notifications.filter(n => n.status === 'unread').length > 0 && (
                                                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold text-white bg-mentha rounded-full">
                                                    {notifications.filter(n => n.status === 'unread').length}
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleMarkAllRead}
                                        disabled={isMarkingAll || !notifications.some((n) => n.status === 'unread')}
                                        className="h-8 w-8 text-muted-foreground hover:text-mentha hover:bg-mentha/10"
                                        title={t.markAllRead}
                                    >
                                        {isMarkingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                                    </Button>
                                </div>

                                <div className="p-4 space-y-6 flex-1 overflow-y-auto">
                                    <AnimatePresence mode="popLayout">
                                        {Object.entries(grouped).map(([label, items]) => items.length > 0 && (
                                            <motion.div
                                                key={label}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="space-y-2"
                                            >
                                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-3 mb-3 sticky top-0 bg-white/90 dark:bg-[#0C0C0E]/90 backdrop-blur-sm py-2 z-10">
                                                    {label}
                                                </h3>
                                                <div className="space-y-1">
                                                    {items.map((notification) => (
                                                        <motion.button
                                                            layout
                                                            key={notification.id}
                                                            onClick={() => {
                                                                setSelectedId(notification.id)
                                                                if (notification.status === 'unread') handleMarkAsRead(notification.id)
                                                            }}
                                                            className={cn(
                                                                "w-full text-left p-4 rounded-xl transition-all duration-200 flex gap-4 group relative border border-transparent",
                                                                selectedId === notification.id
                                                                    ? "bg-white dark:bg-[#1A1A20] border-mentha/20 shadow-[0_0_20px_-5px_rgba(0,0,0,0.1)] dark:shadow-none"
                                                                    : "hover:bg-white/50 dark:hover:bg-[#131316] hover:border-gray-200 dark:hover:border-[#2A2A30]",
                                                                notification.status === 'unread' ? "bg-mentha/5 dark:bg-mentha/5" : ""
                                                            )}
                                                        >
                                                            {notification.status === 'unread' && (
                                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-mentha rounded-r-full" />
                                                            )}
                                                            <div className={cn(
                                                                "mt-0.5 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border transition-colors",
                                                                notification.status === 'unread'
                                                                    ? "bg-mentha/10 text-mentha border-mentha/20"
                                                                    : "bg-gray-50 dark:bg-[#1A1A20] text-gray-400 border-gray-100 dark:border-[#2A2A30] group-hover:border-gray-200 dark:group-hover:border-[#3A3A40]"
                                                            )}>
                                                                {getIcon(notification.type)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between mb-1.5">
                                                                    <span className={cn(
                                                                        "text-sm font-semibold truncate",
                                                                        notification.status === 'unread' ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"
                                                                    )}>
                                                                        {notification.title}
                                                                    </span>
                                                                    <span className="text-[11px] text-gray-400 whitespace-nowrap ml-2 font-medium">
                                                                        {format(new Date(notification.created_at), 'h:mm a')}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2 leading-relaxed font-medium">
                                                                    {notification.message}
                                                                </p>
                                                            </div>
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Right Column: Detail View */}
                            <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-[#09090b] hidden md:block p-6">
                                <AnimatePresence mode="wait">
                                    {selectedNotification ? (
                                        <motion.div
                                            key={selectedNotification.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.3, ease: "easeOut" }}
                                            className="h-full"
                                        >
                                            <Card className="h-full border-none shadow-lg bg-white dark:bg-[#0C0C0E] overflow-hidden flex flex-col">
                                                <div className="p-8 flex-1 overflow-y-auto">
                                                    <div className="flex items-start gap-6 mb-8">
                                                        <div className={cn(
                                                            "w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm border transition-colors",
                                                            selectedNotification.type === 'analysis_complete' ? "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 border-emerald-100 dark:border-emerald-900/20" :
                                                                selectedNotification.type === 'reminder' ? "bg-amber-50 dark:bg-amber-900/10 text-amber-600 border-amber-100 dark:border-amber-900/20" :
                                                                    selectedNotification.type === 'analysis_failed' ? "bg-red-50 dark:bg-red-900/10 text-red-600 border-red-100 dark:border-red-900/20" :
                                                                        "bg-mentha/10 text-mentha border-mentha/20"
                                                        )}>
                                                            {getIcon(selectedNotification.type)}
                                                        </div>
                                                        <div className="flex-1 pt-1">
                                                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">{selectedNotification.title}</h2>
                                                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                                                <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-[#1A1A20] px-3 py-1.5 rounded-full font-medium text-xs">
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                    {format(new Date(selectedNotification.created_at), 'PPP p')}
                                                                </span>
                                                                {selectedNotification.status === 'read' && (
                                                                    <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 px-3 py-1.5 rounded-full font-medium text-xs">
                                                                        <CheckCheck className="w-3.5 h-3.5" />
                                                                        Read
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="prose dark:prose-invert max-w-none">
                                                        <div className="bg-gray-50/50 dark:bg-[#1A1A20]/50 p-8 rounded-2xl border border-gray-100 dark:border-[#2A2A30]">
                                                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg m-0">
                                                                {selectedNotification.message}
                                                            </p>
                                                        </div>

                                                        {selectedNotification.metadata && Object.keys(selectedNotification.metadata).length > 0 && (
                                                            <div className="mt-8">
                                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Additional Details</h4>
                                                                <div className="bg-gray-900 text-gray-100 rounded-xl p-6 text-sm font-mono overflow-x-auto shadow-inner">
                                                                    <pre>{JSON.stringify(selectedNotification.metadata, null, 2)}</pre>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="p-6 bg-gray-50 dark:bg-[#111114] border-t border-gray-100 dark:border-[#2A2A30] flex gap-4">
                                                    <Button className="bg-mentha hover:bg-mentha/90 text-white shadow-lg shadow-mentha/20 h-11 px-6 text-base">
                                                        View Related Analysis
                                                    </Button>
                                                    <Button variant="outline" className="h-11 px-6 text-base bg-white dark:bg-transparent">
                                                        Dismiss
                                                    </Button>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                            <div className="w-24 h-24 bg-gray-100 dark:bg-[#1A1A20] rounded-full flex items-center justify-center mb-6 animate-pulse">
                                                <Info className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                                            </div>
                                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No notification selected</h3>
                                            <p className="text-gray-500 text-lg">Select a notification from the list to view details</p>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
