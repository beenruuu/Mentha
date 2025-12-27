'use client'

import { useEffect, useState } from "react"
import { Bell, User, Shield, CreditCard, Palette, Building2 } from "lucide-react"
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { getTranslations, getLanguage, type Language } from "@/lib/i18n"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { UserAvatarMenu } from "@/components/layout/user-avatar-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SettingsPageSkeleton } from "@/components/skeletons"
import {
  ProfileTab,
  SecurityTab,
  NotificationsTab,
  BillingTab,
  AppearanceTab,
  FeaturesTab
} from "@/components/settings"

interface NotificationPreferences {
  rankingChanges: boolean
  newMentions: boolean
  weeklyReports: boolean
  productUpdates: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') || 'profile'
  const [lang, setLangState] = useState<Language>('es')
  const t = getTranslations(lang)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Profile state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  // Notification preferences
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    rankingChanges: true,
    newMentions: true,
    weeklyReports: true,
    productUpdates: false,
  })

  useEffect(() => {
    setLangState(getLanguage())
    loadUser()
    loadNotificationPreferences()
  }, [])

  const loadUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const fullName = user.user_metadata?.full_name || ''
        const nameParts = fullName.split(' ')
        setFirstName(nameParts[0] || '')
        setLastName(nameParts.slice(1).join(' ') || '')
      }
    } catch (error) {
      console.error('Failed to load user:', error)
      toast.error(t.errorLoadingUser)
    } finally {
      setLoading(false)
    }
  }

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

  if (loading) {
    return <SettingsPageSkeleton />
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#FAFAFA] dark:bg-[#09090b] h-screen overflow-hidden flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 shrink-0">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">{t.configuration}</h1>
          </div>
          <UserAvatarMenu />
        </header>

        <main className="flex-1 bg-white dark:bg-black rounded-tl-3xl overflow-hidden flex flex-col shadow-2xl relative z-10">
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="mx-auto w-full">
              <Tabs
                value={defaultTab}
                onValueChange={(value) => {
                  router.push(`/settings?tab=${value}`)
                }}
                className="space-y-8"
              >



                <TabsContent value="profile">
                  <ProfileTab
                    t={t}
                    user={user}
                    firstName={firstName}
                    setFirstName={setFirstName}
                    lastName={lastName}
                    setLastName={setLastName}
                    onUserUpdated={loadUser}
                  />
                </TabsContent>

                <TabsContent value="security">
                  <SecurityTab t={t} />
                </TabsContent>

                <TabsContent value="notifications">
                  <NotificationsTab
                    t={t}
                    notifications={notifications}
                    onToggle={handleNotificationToggle}
                  />
                </TabsContent>

                <TabsContent value="billing">
                  <BillingTab t={t} />
                </TabsContent>

                <TabsContent value="appearance">
                  <AppearanceTab
                    t={t}
                    lang={lang}
                    onLanguageChange={setLangState}
                  />
                </TabsContent>

                <TabsContent value="features">
                  <FeaturesTab t={t} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
