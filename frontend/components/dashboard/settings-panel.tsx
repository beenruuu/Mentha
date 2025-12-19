"use client"

import React, { useEffect, useState } from 'react'
import { X, Languages, Settings, User, Bell, Lock, CreditCard, Palette, Building2 } from 'lucide-react'
import { ThemeToggle } from '@/components/shared/theme-toggle'
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

  // Agregar/quitar clase al body cuando el panel se abre/cierra para aplicar blur al main
  useEffect(() => {
    if (open) {
      document.body.setAttribute('data-settings-open', 'true')
    } else {
      document.body.removeAttribute('data-settings-open')
    }
    return () => {
      document.body.removeAttribute('data-settings-open')
    }
  }, [open])

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
    { key: 'organization', label: t.organization, icon: <Building2 className="w-4 h-4" /> },
    { key: 'profile', label: t.profile || 'Perfil', icon: <User className="w-4 h-4" /> },
    { key: 'notifications', label: t.notifications || 'Notificaciones', icon: <Bell className="w-4 h-4" /> },
    { key: 'security', label: t.security || 'Seguridad', icon: <Lock className="w-4 h-4" /> },
    { key: 'billing', label: t.billing || 'Facturación', icon: <CreditCard className="w-4 h-4" /> },
    { key: 'appearance', label: t.appearance || 'Apariencia', icon: <Palette className="w-4 h-4" /> },
  ]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Overlay transparente para cerrar al hacer click fuera */}
      <div
        className="absolute inset-0"
        onClick={() => setOpen(false)}
      />

      <div className="relative w-[900px] max-w-full h-[600px] max-h-[85vh] bg-[#FAFAFA] dark:bg-[#09090b] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row ring-1 ring-black/5 dark:ring-white/5">
        <button
          aria-label={t.closeSettings}
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 z-50 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-500 dark:text-gray-400"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left nav */}
        <aside className="w-full md:w-64 bg-gray-50/50 dark:bg-[#0C0C0E]/50 border-b md:border-b-0 md:border-r border-gray-200/50 dark:border-white/5 p-6 flex flex-col gap-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Settings className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white tracking-tight">{t.configuration}</h3>
          </div>

          <nav className="flex flex-col gap-1">
            {sections.map((s) => (
              <button
                key={s.key}
                onClick={() => setActive(s.key)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${active === s.key
                  ? 'bg-white dark:bg-white/10 shadow-sm text-gray-900 dark:text-white font-medium ring-1 ring-black/5 dark:ring-white/5'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                <span className={active === s.key ? 'text-emerald-600 dark:text-emerald-500' : 'opacity-70'}>{s.icon}</span>
                <span className="text-sm">{s.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-200/50 dark:border-white/5">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                {user?.email?.substring(0, 2).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{firstName} {lastName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Right content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 max-w-2xl mx-auto space-y-8">
            <header>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{sections.find((x) => x.key === active)?.label}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {active === 'general' && t.quickSettings}
                {active === 'profile' && 'Manage your personal information'}
                {active === 'notifications' && 'Control how you receive updates'}
                {active === 'security' && 'Protect your account'}
                {active === 'billing' && 'Manage your subscription'}
                {active === 'appearance' && 'Customize your experience'}
              </p>
            </header>

            <div className="space-y-6">
              {active === 'general' && (
                <div className="space-y-6">
                  <div className="p-5 bg-white/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/5 rounded-xl transition-all hover:border-gray-300/50 dark:hover:border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{t.theme}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t.changeAppTheme}</p>
                      </div>
                    </div>
                    <ThemeToggle />
                  </div>

                  <div className="p-5 bg-white/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/5 rounded-xl transition-all hover:border-gray-300/50 dark:hover:border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{t.language}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Select your preferred language</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={lang === 'es' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleLanguageChange('es')}
                        className={lang === 'es' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                      >
                        Español
                      </Button>
                      <Button
                        variant={lang === 'en' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleLanguageChange('en')}
                        className={lang === 'en' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                      >
                        English
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {active === 'profile' && (
                <div className="space-y-6">
                  <div className="p-6 bg-[#0C0C0E] border border-white/5 rounded-2xl">
                    <div className="space-y-4">

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-300">{t.firstName || "Nombre"}</label>
                        <input
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full px-3 py-2 bg-[#111114] border border-white/10 rounded-lg text-sm text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none placeholder:text-gray-600"
                          placeholder="Tu nombre"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-300">{t.lastName || "Apellido"}</label>
                        <input
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full px-3 py-2 bg-[#111114] border border-white/10 rounded-lg text-sm text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none placeholder:text-gray-600"
                          placeholder="Tu apellido"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-300">Email</label>
                        <input
                          value={user?.email || ''}
                          disabled
                          className="w-full px-3 py-2 bg-[#111114] border border-white/10 rounded-lg text-sm text-gray-500 cursor-not-allowed"
                        />
                      </div>

                      <div className="pt-4 flex justify-end">
                        <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="bg-white text-black hover:bg-gray-200 font-medium px-6">
                          {isSavingProfile ? t.saving : (t.saveChanges || "Guardar cambios")}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Export Data Section - Tus Datos */}
                  <div className="p-6 bg-[#0C0C0E] border border-white/5 rounded-2xl">
                    <div className="mb-6">
                      <h3 className="text-base font-bold text-white mb-1">{t.yourData || "Tus Datos"}</h3>
                      <p className="text-sm text-gray-400">{t.manageData || "Gestiona tus datos personales y portabilidad (GDPR/LOPD)"}</p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-white">{t.exportData || "Exportar Datos"}</h4>
                      <div className="flex flex-col gap-4">
                        <p className="text-xs text-gray-400 max-w-md leading-relaxed">
                          {t.exportDataDesc || "Descarga una copia de todos tus datos personales en formato JSON."}
                        </p>
                        <Button variant="outline" className="border-white/10 bg-[#111114] text-white hover:bg-white/5 hover:text-white shrink-0 w-fit">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                          {t.exportButton || "Exportar mis datos"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {active === 'notifications' && (
                <div className="space-y-4">
                  {[
                    { key: 'rankingChanges', label: t.rankingChanges, desc: t.receiveAlertsWhenBrandsChange },
                    { key: 'newMentions', label: t.newMentions, desc: t.notificationsWhenNewMentions },
                    { key: 'weeklyReports', label: t.weeklyReports, desc: t.weeklyPerformanceSummary },
                    { key: 'productUpdates', label: t.productUpdates, desc: t.newsAboutFeatures },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-white/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/5 rounded-xl hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                      </div>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(notifications as any)[item.key]}
                          onChange={() => saveNotificationPreferences({ ...notifications, [item.key]: !(notifications as any)[item.key] })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {active === 'security' && (
                <div className="p-6 bg-white/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/5 rounded-xl space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{t.currentPassword}</label>
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{t.newPassword}</label>
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{t.confirmPassword}</label>
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" />
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button onClick={handleUpdatePassword} disabled={isUpdatingPassword} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      {isUpdatingPassword ? t.updating : t.updatePassword}
                    </Button>
                  </div>
                </div>
              )}

              {active === 'billing' && (
                <div className="space-y-6">
                  {/* Current Plan Card */}
                  <div className="p-6 bg-[#0C0C0E] border border-white/5 rounded-2xl">
                    <h3 className="text-base font-semibold text-white mb-1">{t.billing || "Plan Actual"}</h3>
                    <p className="text-sm text-gray-400 mb-6">{t.billingDesc || "Gestiona tu suscripción y detalles de facturación."}</p>

                    <div className="bg-[#111114] border border-white/5 rounded-xl p-6 relative overflow-hidden group">
                      <div className="flex flex-col gap-4 relative z-10">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-xl font-bold text-white">{t.freePlan || "Plan Gratuito"}</h4>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-medium border border-emerald-500/20">
                              {t.active || "Activo"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">{t.freePlanDesc || "Funciones básicas para uso personal"}</p>
                        </div>
                        <Button onClick={() => router.push('/upgrade')} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 whitespace-nowrap w-fit">
                          <CreditCard className="w-4 h-4 mr-2" />
                          {t.upgradeToPro || "Actualizar a Pro"}
                        </Button>
                      </div>

                      {/* Background Gradient Effect */}
                      <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl transition-opacity group-hover:opacity-75" />
                    </div>
                  </div>

                  {/* Billing History */}
                  <div>
                    <h3 className="text-sm font-medium text-white mb-4">{t.billingHistory || "Historial de facturación"}</h3>
                    <div className="border border-dashed border-white/10 rounded-xl p-12 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                        <CreditCard className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-400">{t.noInvoices || "No hay facturas disponibles"}</p>
                    </div>
                  </div>
                </div>
              )}

              {active === 'appearance' && (
                <div className="space-y-6">
                  {/* Theme Section */}
                  <div className="p-6 bg-white/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/5 rounded-xl">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">{t.theme}</h3>
                    <ThemeToggle />
                  </div>

                  {/* Language Section */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">{t.language}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Spanish Option */}
                      <div
                        onClick={() => handleLanguageChange('es')}
                        className={`cursor-pointer relative overflow-hidden p-4 rounded-xl border transition-all duration-200 group flex items-center gap-4 ${lang === 'es'
                          ? 'border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                          : 'border-gray-200/50 dark:border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5'
                          }`}
                      >
                        <span className="text-2xl flex-shrink-0">🇪🇸</span>
                        <div className="flex-1">
                          <p className={`font-medium text-sm ${lang === 'es' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>Español</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Spanish</p>
                        </div>
                        {lang === 'es' && (
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        )}
                      </div>

                      {/* English Option */}
                      <div
                        onClick={() => handleLanguageChange('en')}
                        className={`cursor-pointer relative overflow-hidden p-4 rounded-xl border transition-all duration-200 group flex items-center gap-4 ${lang === 'en'
                          ? 'border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                          : 'border-gray-200/50 dark:border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5'
                          }`}
                      >
                        <span className="text-2xl flex-shrink-0">🇺🇸</span>
                        <div className="flex-1">
                          <p className={`font-medium text-sm ${lang === 'en' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>English</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">United States</p>
                        </div>
                        {lang === 'en' && (
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200/50 dark:border-white/5">
                <Button variant="ghost" onClick={() => setOpen(false)} className="hover:bg-gray-100 dark:hover:bg-white/5">{t.close}</Button>
                <Button onClick={() => { setOpen(false); router.push(`/settings?tab=${active}`) }} variant="outline" className="border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5">
                  {t.openFullSettings}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
