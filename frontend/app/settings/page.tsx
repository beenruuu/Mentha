'use client'

import { useEffect, useState } from "react"
import { Search, Bell, User, Lock, CreditCard, Palette, Settings, Languages, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, Shield, Zap, Globe, Building2, Users, Plus } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { createClient } from '@/lib/supabase/client'
import { Switch } from "@/components/ui/switch"
import { useRouter, useSearchParams } from "next/navigation"
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

type Member = {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: "owner" | "admin" | "member" | "viewer";
}

export default function SettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') || 'organization'
  const [lang, setLangState] = useState<Language>('es')
  const t = getTranslations(lang)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Profile state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

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

  const { data: members, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["orgMembers"],
    queryFn: async () => {
      // Mock data until endpoint is fully linked
      return [
        { id: "1", full_name: "Rubén (Tú)", email: "ruben@mentha.ai", role: "owner", avatar_url: "" },
        { id: "2", full_name: "Demo User", email: "demo@mentha.ai", role: "viewer", avatar_url: "" }
      ] as Member[];
    }
  });

  const handleInvite = () => {
    toast.info("Funcionalidad de invitación en desarrollo.");
  }

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

  const saveNotificationPreferences = (newPrefs: NotificationPreferences) => {
    try {
      localStorage.setItem('notificationPreferences', JSON.stringify(newPrefs))
      toast.success(t.notificationPrefsSaved)
    } catch (error) {
      console.error('Failed to save notification preferences:', error)
      toast.error(t.errorSavingNotificationPrefs)
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
      toast.error(t.nameRequired)
      return
    }

    setIsSavingProfile(true)
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      })

      if (error) throw error

      toast.success(t.profileUpdatedSuccess, {
        description: t.changesSaved
      })
      await loadUser()
      router.refresh()
    } catch (error: any) {
      console.error('Failed to update profile:', error)
      toast.error(t.errorUpdatingProfile, {
        description: error.message || t.tryAgain
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_WIDTH = 300
          const MAX_HEIGHT = 300
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob)
              else reject(new Error('Canvas to Blob failed'))
            },
            'image/jpeg',
            0.7 // Quality 0.7 for compression
          )
        }
        img.onerror = (error) => reject(error)
      }
      reader.onerror = (error) => reject(error)
    })
  }

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingAvatar(true)
    try {
      // 1. Compress image
      const compressedBlob = await compressImage(file)
      const compressedFile = new File([compressedBlob], file.name, {
        type: 'image/jpeg',
      })

      // 2. Upload to Supabase Storage
      const fileExt = 'jpg' // We converted to jpeg
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressedFile)

      if (uploadError) throw uploadError

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // 4. Update User Metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      })

      if (updateError) throw updateError

      toast.success(t.profileUpdatedSuccess)
      await loadUser()
      router.refresh()

      // Force reload to update header immediately if needed, 
      // though router.refresh() should handle server components, 
      // client components might need context update or window event.
      window.dispatchEvent(new CustomEvent('user-updated'))

    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      toast.error('Error al subir la imagen', {
        description: error.message
      })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error(t.completePasswordFields)
      return
    }
    if (newPassword.length < 6) {
      toast.error(t.passwordMinLength)
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error(t.passwordsNoMatch)
      return
    }

    setIsUpdatingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      toast.success(t.passwordUpdatedSuccess)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('Failed to update password:', error)
      toast.error(t.errorUpdatingPassword, {
        description: error.message || t.tryAgain
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
    toast.success(`${t.languageChangedTo} ${newLang === 'es' ? 'Español' : 'English'}`)
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
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-1" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t.configuration}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t.settingsDescription}</p>
            </div>
          </div>
          <UserAvatarMenu />
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-[#fdfdfc] dark:bg-[#050505]">
          <div className="max-w-4xl mx-auto">
            <Tabs defaultValue={defaultTab} className="space-y-8">
              <TabsList className="bg-secondary/50 p-1 rounded-xl border border-border/40">
                <TabsTrigger value="organization" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#1E1E24] data-[state=active]:shadow-sm">
                  <Building2 className="w-4 h-4 mr-2" />
                  {"Organización"}
                </TabsTrigger>
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

              {/* Organization Content */}
              <TabsContent value="organization" className="space-y-6">
                <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-gray-500" />
                      Detalles de Empresa
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-gray-500 block mb-1">Nombre</label>
                        <p className="text-lg font-medium">Mentha Inc.</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 block mb-1">Plan Actual</label>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs font-bold border-none">PRO</span>
                          <span className="text-xs text-muted-foreground">Renueva el 01/01/2026</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-500" />
                        Miembros del Equipo
                      </CardTitle>
                      <CardDescription>Personas con acceso a este espacio de trabajo.</CardDescription>
                    </div>
                    <Button onClick={handleInvite} size="sm" className="gap-2">
                      <Plus className="w-4 h-4" /> Invitar
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isLoadingMembers ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-3 w-full">
                              <div className="h-10 w-10 rounded-full bg-secondary animate-pulse" />
                              <div className="space-y-2 flex-1">
                                <div className="h-4 w-[200px] bg-secondary animate-pulse rounded" />
                                <div className="h-3 w-[150px] bg-secondary animate-pulse rounded" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="divide-y dark:divide-gray-800">
                        {members?.map((member) => (
                          <div key={member.id} className="flex items-center justify-between py-4">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={member.avatar_url} />
                                <AvatarFallback>{member.full_name[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{member.full_name}</p>
                                <p className="text-xs text-muted-foreground">{member.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${member.role === 'owner' ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'}`}>
                                {member.role === 'owner' && <Shield className="w-3 h-3" />}
                                {member.role.toUpperCase()}
                              </span>
                              {member.role !== 'owner' && (
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8">
                                  Eliminar
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Profile Content */}
              <TabsContent value="profile" className="space-y-6">
                <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>{t.personalInformation}</CardTitle>
                    <CardDescription>{t.personalInfoDescription}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <Avatar className="w-24 h-24 ring-4 ring-secondary/50">
                          <AvatarImage src={user?.user_metadata?.avatar_url || ""} />
                          <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                            {user?.email?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {isUploadingAvatar && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="avatar-upload" className="cursor-pointer">
                          <div className="flex items-center gap-2 px-4 py-2 border border-border/40 rounded-md hover:bg-secondary/50 transition-colors">
                            <span className="text-sm font-medium">{t.changeAvatar}</span>
                          </div>
                          <Input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                            disabled={isUploadingAvatar}
                          />
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG. Max 2MB.
                        </p>
                      </div>
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
                    <CardTitle>{t.passwordSecurity}</CardTitle>
                    <CardDescription>{t.passwordSecurityDescription}</CardDescription>
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
                    <CardTitle>{t.emailNotifications}</CardTitle>
                    <CardDescription>{t.emailNotificationsDescription}</CardDescription>
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
                    <CardTitle>{t.currentPlan}</CardTitle>
                    <CardDescription>{t.currentPlanDescription}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{t.freePlan}</h3>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20">{t.activeStatus}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{t.basicFeatures}</p>
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
                    <CardTitle>{t.appearanceTitle}</CardTitle>
                    <CardDescription>{t.appearanceDescription}</CardDescription>
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
