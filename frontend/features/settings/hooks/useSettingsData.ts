import { useState, useEffect, useCallback } from "react"
import { createClient } from '@/lib/supabase/client'
import { toast } from "sonner"
import { getTranslations, getLanguage, type Language } from "@/lib/i18n"

export interface UserData {
    id: string
    email?: string
    user_metadata?: {
        full_name?: string
        avatar_url?: string
    }
}

export interface NotificationPreferences {
    rankingChanges: boolean
    newMentions: boolean
    weeklyReports: boolean
    productUpdates: boolean
}

export function useSettingsData(initialUser: UserData) {
    const [lang, setLangState] = useState<Language>('es')
    const t = getTranslations(lang)
    const supabase = createClient()

    // User State
    const [user, setUser] = useState<UserData>(initialUser)
    
    // Profile State
    const fullName = initialUser.user_metadata?.full_name || ''
    const nameParts = fullName.split(' ')
    const [firstName, setFirstName] = useState(nameParts[0] || '')
    const [lastName, setLastName] = useState(nameParts.slice(1).join(' ') || '')

    // Notifications
    const [notifications, setNotifications] = useState<NotificationPreferences>({
        rankingChanges: true,
        newMentions: true,
        weeklyReports: true,
        productUpdates: false,
    })

    useEffect(() => {
        setLangState(getLanguage())
        loadNotificationPreferences()
    }, [])

    const loadNotificationPreferences = () => {
        try {
            const saved = localStorage.getItem('notificationPreferences')
            if (saved) {
                setNotifications(JSON.parse(saved))
            }
        } catch (error) {
            console.error('Failed to load notification preferences:', error)
        }
    }

    const loadUser = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUser({
                    id: user.id,
                    email: user.email,
                    user_metadata: user.user_metadata
                })
                const fullName = user.user_metadata?.full_name || ''
                const nameParts = fullName.split(' ')
                setFirstName(nameParts[0] || '')
                setLastName(nameParts.slice(1).join(' ') || '')
            }
        } catch (error) {
            console.error('Failed to load user:', error)
            toast.error(t.errorLoadingUser)
        }
    }, [supabase, t.errorLoadingUser])

    const handleNotificationToggle = (key: keyof NotificationPreferences) => {
        const newNotifications = {
            ...notifications,
            [key]: !notifications[key]
        }
        setNotifications(newNotifications)
        try {
            localStorage.setItem('notificationPreferences', JSON.stringify(newNotifications))
            toast.success(t.notificationPrefsSaved)
        } catch (error) {
            console.error('Failed to save notification preferences:', error)
            toast.error(t.errorSavingNotificationPrefs)
        }
    }

    return {
        user,
        firstName, 
        setFirstName,
        lastName, 
        setLastName,
        notifications,
        handleNotificationToggle,
        loadUser,
        lang,
        setLangState,
        t
    }
}
