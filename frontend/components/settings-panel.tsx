"use client"

import React, { useEffect, useState } from 'react'
import { X, Languages, Settings, User, Bell, Lock, CreditCard, Palette } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { getLanguage, setLanguage, getTranslations, type Language } from '@/lib/i18n'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function SettingsPanel() {
  const [open, setOpen] = useState(false)
  const [lang, setLangState] = useState<Language>('es')
  const [active, setActive] = useState('general')
  const [user, setUser] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const [notifications, setNotifications] = useState({
    rankingChanges: true,
    newMentions: true,
    weeklyReports: true,
    productUpdates: false,
  })

  const t = getTranslations(lang)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const onOpen = () => setOpen(true)
    const handler = () => onOpen()
    window.addEventListener('open-settings-panel', handler)

    const keydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', keydown)

    setLangState(getLanguage())
    loadUser()
    loadNotificationPreferences()

    return () => {
      window.removeEventListener('open-settings-panel', handler)
      document.removeEventListener('keydown', keydown)
    }
  }, [])

  const loadUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const fullName = user.user_metadata?.full_name || ''
        const parts = fullName.split(' ')
        setFirstName(parts[0] || '')
        setLastName(parts.slice(1).join(' ') || '')
      }
    } catch (err) {
      console.error('loadUser', err)
      toast.error('Error cargando usuario')
    } finally {
      setLoadingUser(false)
    }
  }

  const loadNotificationPreferences = () => {
    try {
      const saved = localStorage.getItem('notificationPreferences')
      if (saved) setNotifications(JSON.parse(saved))
    } catch (err) {
      console.error('loadNotificationPreferences', err)
    }
  }

  const saveNotificationPreferences = (newPrefs: any) => {
    try {
      localStorage.setItem('notificationPreferences', JSON.stringify(newPrefs))
      setNotifications(newPrefs)
      toast.success('Preferencias guardadas')
    } catch (err) {
      console.error(err)
      toast.error('Error guardando preferencias')
    }
  }

  const handleSaveProfile = async () => {
    if (!firstName.trim()) return toast.error('Nombre requerido')
    setIsSavingProfile(true)
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
      const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } })
      if (error) throw error
      toast.success('Perfil actualizado')
      await loadUser()
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Error al guardar')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) return toast.error('Completa los campos')
    if (newPassword.length < 6) return toast.error('La contraseña debe tener al menos 6 caracteres')
    if (newPassword !== confirmPassword) return toast.error('Las contraseñas no coinciden')
    setIsUpdatingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success('Contraseña actualizada')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Error al actualizar contraseña')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang)
    setLangState(newLang)
    if (typeof document !== 'undefined') document.documentElement.lang = newLang
  }

  if (!open) return null

  const sections = [
    { key: 'general', label: t.configuration, icon: <Settings className="w-4 h-4" /> },
    { key: 'profile', label: t.profile || 'Perfil', icon: <User className="w-4 h-4" /> },
    { key: 'notifications', label: t.notifications || 'Notificaciones', icon: <Bell className="w-4 h-4" /> },
    { key: 'security', label: t.security || 'Seguridad', icon: <Lock className="w-4 h-4" /> },
    { key: 'billing', label: t.billing || 'Facturación', icon: <CreditCard className="w-4 h-4" /> },
    { key: 'appearance', label: t.appearance || 'Apariencia', icon: <Palette className="w-4 h-4" /> },
  ]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/45" onClick={() => setOpen(false)} />

      <div className="relative w-[900px] max-w-[96%] h-[640px] max-h-[90vh] bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A30] rounded-xl shadow-2xl overflow-hidden">
        <button
          aria-label={t.closeSettings}
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 z-50 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-[#131316]"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex h-full">
          {/* Left nav */}
          <aside className="w-60 bg-gray-50 dark:bg-[#0F0F12] border-r border-gray-100 dark:border-[#1A1A20] p-4">
            <div className="flex items-center justify-start mb-4">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-semibold">{t.configuration}</h3>
              </div>
            </div>

            <nav className="flex flex-col gap-1">
              {sections.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setActive(s.key)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg ${active === s.key ? 'bg-white dark:bg-[#161619] shadow-sm font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#131316]'}`}
                >
                  <span className="text-gray-500 dark:text-gray-400">{s.icon}</span>
                  <span className="text-sm">{s.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Right content */}
          <div className="flex-1 p-6 overflow-auto">
            <header className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{sections.find((x) => x.key === active)?.label}</h2>
              <div className="text-sm text-gray-500">{active === 'general' ? t.quickSettings : ''}</div>
            </header>

            <div className="space-y-6">
              {active === 'general' && (
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-white dark:bg-black border border-gray-100 dark:border-[#1A1A20] rounded-lg">
                    <p className="text-sm font-medium">{t.theme}</p>
                    <p className="text-xs text-gray-500 mb-3">{t.changeAppTheme}</p>
                    <ThemeToggle />
                  </div>

                  <div className="p-4 bg-white dark:bg-black border border-gray-100 dark:border-[#1A1A20] rounded-lg">
                    <p className="text-sm font-medium">{t.language}</p>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" onClick={() => handleLanguageChange('es')} className={lang === 'es' ? 'ring-2 ring-emerald-600' : ''}>
                        Español
                      </Button>
                      <Button size="sm" onClick={() => handleLanguageChange('en')} className={lang === 'en' ? 'ring-2 ring-emerald-600' : ''}>
                        English
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {active === 'profile' && (
                <div className="p-4 bg-white dark:bg-black border border-gray-100 dark:border-[#1A1A20] rounded-lg">
                  <p className="text-sm font-medium">{t.profile}</p>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">{user?.email?.substring(0,2).toUpperCase() || 'U'}</div>
                      <div>
                        <p className="font-medium">{firstName} {lastName}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium">{t.firstName}</label>
                      <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full mt-1 p-2 border rounded bg-white dark:bg-black" />
                      <label className="text-xs font-medium mt-2 block">{t.lastName}</label>
                      <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full mt-1 p-2 border rounded bg-white dark:bg-black" />
                      <div className="mt-3 flex gap-2">
                        <Button onClick={handleSaveProfile} disabled={isSavingProfile}>{isSavingProfile ? t.saving : t.saveChanges}</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {active === 'notifications' && (
                <div className="p-4 bg-white dark:bg-black border border-gray-100 dark:border-[#1A1A20] rounded-lg">
                  <p className="text-sm font-medium">{t.notifications}</p>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{t.rankingChanges}</p>
                        <p className="text-xs text-gray-500">{t.receiveAlertsWhenBrandsChange}</p>
                      </div>
                      <input type="checkbox" checked={notifications.rankingChanges} onChange={() => saveNotificationPreferences({ ...notifications, rankingChanges: !notifications.rankingChanges })} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{t.newMentions}</p>
                        <p className="text-xs text-gray-500">{t.notificationsWhenNewMentions}</p>
                      </div>
                      <input type="checkbox" checked={notifications.newMentions} onChange={() => saveNotificationPreferences({ ...notifications, newMentions: !notifications.newMentions })} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{t.weeklyReports}</p>
                        <p className="text-xs text-gray-500">{t.weeklyPerformanceSummary}</p>
                      </div>
                      <input type="checkbox" checked={notifications.weeklyReports} onChange={() => saveNotificationPreferences({ ...notifications, weeklyReports: !notifications.weeklyReports })} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{t.productUpdates}</p>
                        <p className="text-xs text-gray-500">{t.newsAboutFeatures}</p>
                      </div>
                      <input type="checkbox" checked={notifications.productUpdates} onChange={() => saveNotificationPreferences({ ...notifications, productUpdates: !notifications.productUpdates })} />
                    </div>
                  </div>
                </div>
              )}

              {active === 'security' && (
                <div className="p-4 bg-white dark:bg-black border border-gray-100 dark:border-[#1A1A20] rounded-lg">
                  <p className="text-sm font-medium">{t.security}</p>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium">{t.currentPassword}</label>
                      <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full mt-1 p-2 border rounded bg-white dark:bg-black" />
                    </div>
                    <div>
                      <label className="text-xs font-medium">{t.newPassword}</label>
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full mt-1 p-2 border rounded bg-white dark:bg-black" />
                      <label className="text-xs font-medium mt-2 block">{t.confirmPassword}</label>
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full mt-1 p-2 border rounded bg-white dark:bg-black" />
                      <div className="mt-3 flex gap-2">
                        <Button onClick={handleUpdatePassword} disabled={isUpdatingPassword}>{isUpdatingPassword ? t.updating : t.updatePassword}</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {active === 'billing' && (
                <div className="p-4 bg-white dark:bg-black border border-gray-100 dark:border-[#1A1A20] rounded-lg">
                  <p className="text-sm font-medium">{t.billing}</p>
                  <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <p className="font-medium">{t.freePlan}</p>
                    <p className="text-xs text-gray-500">{t.tokensUsedThisMonth}</p>
                    <div className="mt-3">
                      <Button onClick={() => router.push('/upgrade')}>{t.upgradeToPro}</Button>
                    </div>
                  </div>
                </div>
              )}

              {active === 'appearance' && (
                <div className="p-4 bg-white dark:bg-black border border-gray-100 dark:border-[#1A1A20] rounded-lg">
                  <p className="text-sm font-medium">{t.appearance}</p>
                  <p className="text-xs text-gray-500">{t.advancedAppearance}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>{t.close}</Button>
                <Button onClick={() => { setOpen(false); router.push('/settings') }}>{t.openFullSettings}</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
