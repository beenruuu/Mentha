'use client'

import { useEffect, useState } from "react"
import { Search, Bell, User, Lock, CreditCard, Palette, Settings, Languages, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react"
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
import { toast } from 'sonner'

interface NotificationPreferences {
  rankingChanges: boolean
  newMentions: boolean
  weeklyReports: boolean
  productUpdates: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const [lang, setLangState] = useState<Language>('es')
  const t = getTranslations(lang)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Profile state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
        // Load name from user metadata
        const fullName = user.user_metadata?.full_name || ''
        const nameParts = fullName.split(' ')
        setFirstName(nameParts[0] || '')
        setLastName(nameParts.slice(1).join(' ') || '')
      }
    } catch (error) {
      console.error('Failed to load user:', error)
      toast.error('Error al cargar el usuario')
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

  const saveNotificationPreferences = (newPrefs: NotificationPreferences) => {
    try {
      localStorage.setItem('notificationPreferences', JSON.stringify(newPrefs))
      toast.success('Preferencias de notificaciones guardadas')
    } catch (error) {
      console.error('Failed to save notification preferences:', error)
      toast.error('Error al guardar preferencias')
    }
  }

  const handleNotificationToggle = (key: keyof NotificationPreferences) => {
    const newNotifications = {
      ...notifications,
      [key]: !notifications[key]
    }
    setNotifications(newNotifications)
    saveNotificationPreferences(newNotifications)
  }

  const handleSaveProfile = async () => {
    if (!firstName.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    setIsSavingProfile(true)
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()

      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      })

      if (error) throw error

      toast.success('Perfil actualizado correctamente', {
        description: 'Tus cambios han sido guardados'
      })

      // Reload user to get updated data
      await loadUser()
    } catch (error: any) {
      console.error('Failed to update profile:', error)
      toast.error('Error al actualizar perfil', {
        description: error.message || 'Inténtalo de nuevo'
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleUpdatePassword = async () => {
    // Validation
    if (!newPassword || !confirmPassword) {
      toast.error('Por favor completa todos los campos de contraseña')
      return
    }

    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    setIsUpdatingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      toast.success('Contraseña actualizada correctamente', {
        description: 'Tu contraseña ha sido cambiada exitosamente'
      })

      // Clear password fields
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('Failed to update password:', error)
      toast.error('Error al actualizar contraseña', {
        description: error.message || 'Inténtalo de nuevo'
      })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang)
    setLangState(newLang)
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLang
    }
    toast.success(`Idioma cambiado a ${newLang === 'es' ? 'Español' : 'English'}`)
    router.refresh()
  }

  if (loading) {
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
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-gradient-to-r from-white to-emerald-50/30 dark:from-black dark:to-emerald-950/10">
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
            <Card className="p-6 bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30] transition-all duration-200 hover:shadow-lg hover:border-emerald-500/20">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-[#1A1A20]">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.profile}</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20 ring-4 ring-emerald-500/10 transition-all hover:ring-emerald-500/30">
                    <AvatarImage src={user?.user_metadata?.avatar_url || ""} alt={user?.email || t.user} />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-xl font-medium">
                      {user?.email?.substring(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{firstName} {lastName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t.firstName}
                    </Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="transition-all focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t.lastName}
                    </Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="transition-all focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t.email}
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      className="pr-10"
                      disabled
                    />
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                  </div>
                </div>
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white transition-all duration-200 hover:shadow-lg disabled:opacity-50"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    t.saveChanges
                  )}
                </Button>
              </div>
            </Card>

            {/* Security Settings */}
            <Card className="p-6 bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30] transition-all duration-200 hover:shadow-lg hover:border-emerald-500/20">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-[#1A1A20]">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.security}</h2>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t.currentPassword}
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="pr-10 transition-all focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t.newPassword}
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pr-10 transition-all focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t.confirmPassword}
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pr-10 transition-all focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  onClick={handleUpdatePassword}
                  disabled={isUpdatingPassword}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-all duration-200 hover:shadow-lg disabled:opacity-50"
                >
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    t.updatePassword
                  )}
                </Button>
              </div>
            </Card>

            {/* Notifications Settings */}
            <Card className="p-6 bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30] transition-all duration-200 hover:shadow-lg hover:border-emerald-500/20">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-[#1A1A20]">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.notifications}</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-gray-50 to-transparent dark:from-[#0A0A0A] dark:to-transparent transition-all hover:from-purple-50 dark:hover:from-purple-950/20">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{t.rankingChanges}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.receiveAlertsWhenBrandsChange}</p>
                  </div>
                  <Switch
                    checked={notifications.rankingChanges}
                    onCheckedChange={() => handleNotificationToggle('rankingChanges')}
                    className="data-[state=checked]:bg-emerald-600"
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-gray-50 to-transparent dark:from-[#0A0A0A] dark:to-transparent transition-all hover:from-purple-50 dark:hover:from-purple-950/20">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{t.newMentions}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.notificationsWhenNewMentions}</p>
                  </div>
                  <Switch
                    checked={notifications.newMentions}
                    onCheckedChange={() => handleNotificationToggle('newMentions')}
                    className="data-[state=checked]:bg-emerald-600"
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-gray-50 to-transparent dark:from-[#0A0A0A] dark:to-transparent transition-all hover:from-purple-50 dark:hover:from-purple-950/20">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{t.weeklyReports}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.weeklyPerformanceSummary}</p>
                  </div>
                  <Switch
                    checked={notifications.weeklyReports}
                    onCheckedChange={() => handleNotificationToggle('weeklyReports')}
                    className="data-[state=checked]:bg-emerald-600"
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-gray-50 to-transparent dark:from-[#0A0A0A] dark:to-transparent transition-all hover:from-purple-50 dark:hover:from-purple-950/20">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{t.productUpdates}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.newsAboutFeatures}</p>
                  </div>
                  <Switch
                    checked={notifications.productUpdates}
                    onCheckedChange={() => handleNotificationToggle('productUpdates')}
                    className="data-[state=checked]:bg-emerald-600"
                  />
                </div>
              </div>
            </Card>

            {/* Billing Settings */}
            <Card className="p-6 bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30] transition-all duration-200 hover:shadow-lg hover:border-emerald-500/20">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-[#1A1A20]">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.billing}</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-6 bg-gradient-to-br from-emerald-50 to-transparent dark:from-emerald-950/20 dark:to-transparent rounded-xl border-2 border-emerald-200 dark:border-emerald-900/30 transition-all hover:border-emerald-300 dark:hover:border-emerald-800/50">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      {t.freePlan}
                      <span className="px-2 py-0.5 bg-emerald-600 text-white text-xs rounded-full">Activo</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.tokensUsedThisMonth}</p>
                  </div>
                  <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white transition-all duration-200 hover:shadow-lg">
                    {t.upgradeToPro}
                  </Button>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">{t.billingHistory}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.noInvoicesAvailable}</p>
                </div>
              </div>
            </Card>

            {/* Appearance Settings */}
            <Card className="p-6 bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30] transition-all duration-200 hover:shadow-lg hover:border-emerald-500/20">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-[#1A1A20]">
                <div className="p-2 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg">
                  <Palette className="w-5 h-5 text-white" />
                </div>
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
                      className={`p-4 border-2 rounded-xl transition-all duration-200 ${lang === 'es'
                          ? 'border-emerald-600 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-950/30 text-emerald-900 dark:text-emerald-100 shadow-lg scale-105'
                          : 'border-gray-200 dark:border-[#2A2A30] bg-white dark:bg-black hover:border-emerald-300 dark:hover:border-emerald-800 text-gray-700 dark:text-gray-300 hover:scale-102'
                        }`}
                    >
                      <Languages className="w-5 h-5 mx-auto mb-2" />
                      <p className="text-xs font-medium">{t.spanish}</p>
                    </button>
                    <button
                      onClick={() => handleLanguageChange('en')}
                      className={`p-4 border-2 rounded-xl transition-all duration-200 ${lang === 'en'
                          ? 'border-emerald-600 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-950/30 text-emerald-900 dark:text-emerald-100 shadow-lg scale-105'
                          : 'border-gray-200 dark:border-[#2A2A30] bg-white dark:bg-black hover:border-emerald-300 dark:hover:border-emerald-800 text-gray-700 dark:text-gray-300 hover:scale-102'
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
