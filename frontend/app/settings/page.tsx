'use client'

import { useEffect, useState } from "react"
import { Search, Bell, User, Lock, CreditCard, Palette, Settings, Languages, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, Shield, Zap, Globe } from "lucide-react"
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { createClient } from '@/lib/supabase/client'
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { getTranslations, getLanguage, setLanguage, type Language } from "@/lib/i18n"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { UserAvatarMenu } from "@/components/layout/user-avatar-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SettingsPageSkeleton } from "@/components/skeletons"

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

      toast.success('Contraseña actualizada correctamente')
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
    return <SettingsPageSkeleton />
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#fdfdfc] dark:bg-[#050505] h-screen overflow-hidden flex flex-col">
        <header className="flex items-center justify-between px-8 py-6 bg-[#fdfdfc] dark:bg-[#050505] border-b border-border/40">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t.configuration}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your account and preferences</p>
          </div>
          <UserAvatarMenu />
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-[#fdfdfc] dark:bg-[#050505]">
          <div className="max-w-4xl mx-auto">
            <Tabs defaultValue="profile" className="space-y-8">
              <TabsList className="bg-secondary/50 p-1 rounded-xl border border-border/40">
                <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#1E1E24] data-[state=active]:shadow-sm">
                  <User className="w-4 h-4 mr-2" />
                  {t.profile}
                </TabsTrigger>
                <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#1E1E24] data-[state=active]:shadow-sm">
                  <Shield className="w-4 h-4 mr-2" />
                  {t.security}
                </TabsTrigger>
                <TabsTrigger value="notifications" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#1E1E24] data-[state=active]:shadow-sm">
                  <Bell className="w-4 h-4 mr-2" />
                  {t.notifications}
                </TabsTrigger>
                <TabsTrigger value="billing" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#1E1E24] data-[state=active]:shadow-sm">
                  <CreditCard className="w-4 h-4 mr-2" />
                  {t.billing}
                </TabsTrigger>
                <TabsTrigger value="appearance" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#1E1E24] data-[state=active]:shadow-sm">
                  <Palette className="w-4 h-4 mr-2" />
                  {t.appearance}
                </TabsTrigger>
              </TabsList>

              {/* Profile Content */}
              <TabsContent value="profile" className="space-y-6">
                <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your personal details and public profile.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-6">
                      <Avatar className="w-24 h-24 ring-4 ring-secondary/50">
                        <AvatarImage src={user?.user_metadata?.avatar_url || ""} />
                        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                          {user?.email?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <Button variant="outline" className="border-border/40">Change Avatar</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">{t.firstName}</Label>
                        <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">{t.lastName}</Label>
                        <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t.email}</Label>
                      <Input id="email" value={user?.email || ""} disabled className="bg-secondary/50" />
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                        {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t.saveChanges}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Content */}
              <TabsContent value="security" className="space-y-6">
                <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Password & Security</CardTitle>
                    <CardDescription>Manage your password and security settings.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">{t.currentPassword}</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">{t.newPassword}</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleUpdatePassword} disabled={isUpdatingPassword}>
                        {isUpdatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t.updatePassword}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notifications Content */}
              <TabsContent value="notifications" className="space-y-6">
                <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Email Notifications</CardTitle>
                    <CardDescription>Choose what updates you want to receive.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">{t.rankingChanges}</Label>
                        <p className="text-sm text-muted-foreground">{t.receiveAlertsWhenBrandsChange}</p>
                      </div>
                      <Switch
                        checked={notifications.rankingChanges}
                        onCheckedChange={() => handleNotificationToggle('rankingChanges')}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">{t.newMentions}</Label>
                        <p className="text-sm text-muted-foreground">{t.notificationsWhenNewMentions}</p>
                      </div>
                      <Switch
                        checked={notifications.newMentions}
                        onCheckedChange={() => handleNotificationToggle('newMentions')}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">{t.weeklyReports}</Label>
                        <p className="text-sm text-muted-foreground">{t.weeklyPerformanceSummary}</p>
                      </div>
                      <Switch
                        checked={notifications.weeklyReports}
                        onCheckedChange={() => handleNotificationToggle('weeklyReports')}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Billing Content */}
              <TabsContent value="billing" className="space-y-6">
                <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription>Manage your subscription and billing details.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{t.freePlan}</h3>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20">Active</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Basic features for personal use</p>
                      </div>
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Zap className="w-4 h-4 mr-2" />
                        {t.upgradeToPro}
                      </Button>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-4">{t.billingHistory}</h4>
                      <div className="text-center py-8 border-2 border-dashed border-border/40 rounded-lg">
                        <p className="text-sm text-muted-foreground">{t.noInvoicesAvailable}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Appearance Content */}
              <TabsContent value="appearance" className="space-y-6">
                <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>Customize the look and feel of the application.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="space-y-4">
                      <Label className="text-base">{t.theme}</Label>
                      <ThemeToggle />
                    </div>
                    <Separator />
                    <div className="space-y-4">
                      <Label className="text-base">{t.language}</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div
                          onClick={() => handleLanguageChange('es')}
                          className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${lang === 'es'
                              ? 'border-primary bg-primary/5'
                              : 'border-border/40 hover:border-border/80'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm text-lg">🇪🇸</div>
                            <div>
                              <p className="font-medium">{t.spanish}</p>
                              <p className="text-xs text-muted-foreground">Español</p>
                            </div>
                          </div>
                        </div>
                        <div
                          onClick={() => handleLanguageChange('en')}
                          className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${lang === 'en'
                              ? 'border-primary bg-primary/5'
                              : 'border-border/40 hover:border-border/80'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm text-lg">🇺🇸</div>
                            <div>
                              <p className="font-medium">{t.english}</p>
                              <p className="text-xs text-muted-foreground">English</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
