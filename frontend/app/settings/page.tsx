'use client'

import { useEffect, useState } from "react"
import { Search, Bell, User, Lock, CreditCard, Palette, Settings, Languages } from "lucide-react"
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { UserAvatarMenu } from '@/components/user-avatar-menu'
import { getLanguage, setLanguage, getTranslations, type Language } from '@/lib/i18n'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const router = useRouter()
  const [lang, setLangState] = useState<Language>('es')
  const t = getTranslations(lang)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    setLangState(getLanguage())
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Fetch profile if needed, but user metadata might be enough
        setUser(user)
      }
    } catch (error) {
      console.error('Failed to load user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang)
    setLangState(newLang)
    // Update HTML lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLang
    }
    router.refresh()
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-emerald-600" />
            <h1 className="text-xl font-semibold">{t.configuration}</h1>
          </div>
          <div className="flex-1" />
          <UserAvatarMenu />
        </header>

        <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
          <div className="max-w-4xl space-y-6">
            {/* Profile Settings */}
            <Card className="p-6 bg-white dark:bg-black">
              <div className="flex items-center gap-3 mb-6">
                <User className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.profile}</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={user?.user_metadata?.avatar_url || ""} alt={user?.email || t.user} />
                    <AvatarFallback className="bg-emerald-600 text-white text-lg font-medium">
                      {user?.email?.substring(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t.firstName}
                    </Label>
                    <Input id="firstName" defaultValue={user?.user_metadata?.full_name?.split(' ')[0] || ""} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t.lastName}
                    </Label>
                    <Input id="lastName" defaultValue={user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || ""} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t.email}
                  </Label>
                  <Input id="email" type="email" defaultValue={user?.email || ""} className="mt-1" disabled />
                </div>
                <Button className="bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black">{t.saveChanges}</Button>
              </div>
            </Card>

            {/* Security Settings */}
            <Card className="p-6 bg-white dark:bg-black">
              <div className="flex items-center gap-3 mb-6">
                <Lock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.security}</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t.currentPassword}
                  </Label>
                  <Input id="currentPassword" type="password" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t.newPassword}
                  </Label>
                  <Input id="newPassword" type="password" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t.confirmPassword}
                  </Label>
                  <Input id="confirmPassword" type="password" className="mt-1" />
                </div>
                <Button className="bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black">{t.updatePassword}</Button>
              </div>
            </Card>

            {/* Notifications Settings */}
            <Card className="p-6 bg-white dark:bg-black">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.notifications}</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{t.rankingChanges}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.receiveAlertsWhenBrandsChange}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{t.newMentions}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.notificationsWhenNewMentions}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{t.weeklyReports}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.weeklyPerformanceSummary}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{t.productUpdates}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.newsAboutFeatures}</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </Card>

            {/* Billing Settings */}
            <Card className="p-6 bg-white dark:bg-black">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.billing}</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white dark:bg-[#0A0A0A] rounded-lg border border-gray-200 dark:border-[#2A2A30]">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{t.freePlan}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.tokensUsedThisMonth}</p>
                  </div>
                  <Button className="bg-black dark:bg-[#0A0A0A] hover:bg-gray-800 dark:hover:bg-[#0A0A0A] text-white">{t.upgradeToPro}</Button>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">{t.billingHistory}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.noInvoicesAvailable}</p>
                </div>
              </div>
            </Card>

            {/* Appearance Settings */}
            <Card className="p-6 bg-white dark:bg-black">
              <div className="flex items-center gap-3 mb-6">
                <Palette className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.appearance}</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">{t.theme}</Label>
                  <ThemeToggle />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">{t.language}</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleLanguageChange('es')}
                      className={`p-4 border-2 rounded-lg transition-colors ${
                        lang === 'es'
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100'
                          : 'border-gray-200 dark:border-[#2A2A30] bg-white dark:bg-black hover:border-gray-300 dark:hover:border-[#3A3A40] text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Languages className="w-5 h-5 mx-auto mb-2" />
                      <p className="text-xs font-medium">{t.spanish}</p>
                    </button>
                    <button
                      onClick={() => handleLanguageChange('en')}
                      className={`p-4 border-2 rounded-lg transition-colors ${
                        lang === 'en'
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100'
                          : 'border-gray-200 dark:border-[#2A2A30] bg-white dark:bg-black hover:border-gray-300 dark:hover:border-[#3A3A40] text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Languages className="w-5 h-5 mx-auto mb-2" />
                      <p className="text-xs font-medium">{t.english}</p>
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}





