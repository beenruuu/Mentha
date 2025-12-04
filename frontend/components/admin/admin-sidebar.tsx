"use client"

import { 
  Users, 
  CreditCard, 
  ClipboardList, 
  Tags, 
  FileText,
  Shield,
  ChevronRight,
  X,
  LogOut,
  ArrowLeft,
  Bell,
  Settings
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useSidebar } from "@/components/ui/sidebar"

const navigation = [
  { name: 'Usuarios', href: '/admin/users', icon: Users },
  { name: 'Suscripciones', href: '/admin/subscriptions', icon: CreditCard },
  { name: 'Onboarding', href: '/admin/onboarding', icon: ClipboardList },
  { name: 'Categorías', href: '/admin/categories', icon: Tags },
  { name: 'Audit Log', href: '/admin/audit-log', icon: FileText },
]

// Mentha Logo Component
function MenthaLogo() {
  return (
    <div className="mentha-logo-outline w-full h-9 rounded-lg px-4 py-2 flex items-center justify-center relative">
      <svg className="mentha-outline-svg absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 120 36" preserveAspectRatio="none" aria-hidden="true">
        <rect className="mentha-outline-stroke" x="2" y="2" width="116" height="32" rx="8" ry="8" fill="transparent" />
      </svg>
      <div className="mentha-logo-inner z-10 flex items-center justify-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" className="w-5 h-5" aria-hidden="true">
          <path d="M19.7,26.3l3.2-4.2c1.7-2.6,3.5-5.4,3.9-8.5l-1.8,3.4c-1.3,1.8-2.6,3.8-4.1,5.4s-2.3,2.3-2.7,2.4-.2,0-.2-.2c-1-3.3-1.1-7.5.3-10.7s6.4-8,9.5-10.6,2.5-2.1,2.7-2c2.5,4.1,4.3,9.4,3.1,14.3-1.5,6.1-7.9,10.2-13.9,10.7Z" fill="currentColor" />
          <path d="M33.7,20.5v15.1c0,1-1.6,2.5-2.6,2.7-2.4.4-4.2-1-4.4-3.4s-.2-6.1,0-8,0-.4.2-.6,1.7-.9,2.1-1.2c1.8-1.2,3.3-2.7,4.7-4.5Z" fill="currentColor" />
          <path d="M16.3,25.4c-.1.1-.9-.6-1.1-.7-1.6-1.5-3.1-3.8-4-5.8-.3,0-.1.3,0,.4.6,2.5,2.6,4.8,4.1,6.9-3.5-.3-7.2-2.6-8.2-6.2s.4-5.7,1.7-8.4c.1,0,1.4,1,1.6,1.1,1.9,1.6,5,4.4,5.8,6.7s.4,4,0,6Z" fill="currentColor" />
          <path d="M7.3,24.4c1.9,2,4.3,3.2,7,3.9-.3,2.2.5,6.1-.4,8.1s-3.4,2.6-5.1,1.5-1.5-1.6-1.5-2.2v-11.2Z" fill="currentColor" />
          <path d="M23.9,27.5v8.1c0,.4-.8,1.6-1.1,1.9-1.6,1.4-4.4,1.1-5.4-.9s-.5-1.4-.5-1.6v-6.7c2.4,0,4.7-.1,7-.8Z" fill="currentColor" />
        </svg>
        <span className="text-xs font-semibold text-muted-foreground">ADMIN</span>
      </div>
    </div>
  )
}

// Panel Icon (same as dashboard)
function PanelIcon({ active }: { active: boolean }) {
  return (
    <div className="w-4 h-4 flex items-center justify-center">
      <div className={`w-2.5 h-2.5 border-2 rounded-sm ${active ? 'border-foreground' : 'border-muted-foreground'}`}></div>
    </div>
  )
}

export function AdminSidebar() {
  const { openMobile, setOpenMobile, isMobile } = useSidebar()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      router.push('/auth/login')
    }
  }

  const isPanelActive = pathname === '/admin'

  return (
    <>
      {/* Overlay for mobile */}
      {openMobile && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpenMobile(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${openMobile ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed left-0 top-0 h-screen w-64 bg-background flex flex-col z-50 transition-transform duration-300 ease-in-out`}>
        
        {/* Logo and Close Button */}
        <div className="p-4 flex items-center justify-between">
          <Link href="/admin" className="flex-1">
            <MenthaLogo />
          </Link>
          <button
            onClick={() => setOpenMobile(false)}
            className="md:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Back to Dashboard Button */}
        <div className="px-4 mb-6">
          <Link href="/dashboard">
            <Button variant="outline" className="w-full bg-background hover:bg-secondary border-border/60 shadow-sm rounded-lg h-9 text-sm font-medium">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Dashboard
            </Button>
          </Link>
        </div>

        {/* Navigation - Same order as user sidebar */}
        <nav className="flex-1 px-3 overflow-y-auto space-y-0.5">
          {/* Panel (Dashboard) */}
          <Link href="/admin">
            <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isPanelActive
                ? 'bg-secondary text-foreground font-medium'
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
            }`}>
              <PanelIcon active={isPanelActive} />
              <span>Panel</span>
            </button>
          </Link>

          {/* Notifications */}
          <Link href="/admin/notifications">
            <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === '/admin/notifications'
                ? 'bg-secondary text-foreground font-medium'
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
            }`}>
              <Bell className="w-4 h-4" />
              <span>Notificaciones</span>
            </button>
          </Link>
          
          {/* Settings */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-admin-settings'))}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-muted-foreground hover:bg-secondary/50 hover:text-foreground mb-6"
          >
            <Settings className="w-4 h-4" />
            <span>Configuración</span>
          </button>

          {/* Admin Section */}
          <div className="pt-4 border-t border-border/40">
            <div className="px-3 mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Administración
              </span>
            </div>
            
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              
              return (
                <Link key={item.name} href={item.href}>
                  <button 
                    onClick={() => setOpenMobile(false)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-secondary text-foreground font-medium'
                        : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-4 h-4 ${isActive ? 'text-emerald-500' : ''}`} />
                      <span>{item.name}</span>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 text-emerald-500" />}
                  </button>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border/40 bg-secondary/20">
          <div className="mb-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Super Admin</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Acceso completo al panel de administración
            </p>
          </div>

          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 justify-start px-2"
          >
            <LogOut className="mr-2 h-3.5 w-3.5" />
            Cerrar sesión
          </Button>
        </div>
      </aside>
    </>
  )
}
