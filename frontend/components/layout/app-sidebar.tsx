"use client"

import { Bell, Settings, ChevronRight, X, Bot, TrendingUp, Users, LogOut, Plus, Trash2, Info, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useSidebar } from "@/components/ui/sidebar"
import { useTranslations } from "@/lib/i18n"
import { brandsService, Brand } from "@/lib/services/brands"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useDemo } from "@/lib/demo-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

function BrandItem({ id, name, domain, onDeleted }: { id: string; name: string; domain: string; onDeleted?: () => void }) {
  const [expanded, setExpanded] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const { t } = useTranslations()
  const router = useRouter()
  const pathname = usePathname()

  const handleDeleteBrand = async () => {
    setIsDeleting(true)
    try {
      await brandsService.delete(id)
      onDeleted?.()
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to delete brand:', error)
      setIsDeleting(false)
    }
  }

  return (
    <div className="mb-1">
      <div className={`w-full flex items-center justify-between px-2 py-1.5 text-sm transition-colors rounded-md group ${expanded ? 'bg-secondary/50' : 'hover:bg-secondary/50'}`}>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 flex items-center gap-3 overflow-hidden"
        >
          <div className="w-5 h-5 rounded-md overflow-hidden bg-white dark:bg-zinc-800 flex items-center justify-center border border-border shrink-0 shadow-sm">
            <img
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
              alt={`${name} logo`}
              className="w-3.5 h-3.5 object-contain m-auto"
              style={{ display: 'block' }}
              onError={(e) => {
                const target = e.currentTarget;
                const parent = target.parentElement;
                if (parent) {
                  target.remove();
                  const fallback = document.createElement('span');
                  fallback.className = 'text-[8px] font-bold text-primary flex items-center justify-center w-full h-full';
                  fallback.textContent = name.charAt(0).toUpperCase();
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>
          <span className="truncate font-medium text-foreground/80 group-hover:text-foreground transition-colors">{name}</span>
        </button>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="p-1 hover:bg-destructive/10 rounded-md transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t.areYouSure}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t.deleteWarning.replace('{name}', name)}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteBrand} className="bg-destructive hover:bg-destructive/90">
                  {isDeleting ? t.deleting : t.delete}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-secondary rounded-md">
            <ChevronRight className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="ml-4 pl-3 border-l border-border/50 mt-1 space-y-0.5">
          <Link href={`/brand/${id}`}>
            <button className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-md transition-colors group/item">
              <span>{t.overview}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 opacity-0 group-hover/item:opacity-70 transition-opacity cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[200px]">
                  {t.overviewTooltip || "Panel general con métricas clave, insights y estado de tu marca"}
                </TooltipContent>
              </Tooltip>
            </button>
          </Link>
          <Link href={`/brand/${id}/keywords`}>
            <button className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-md transition-colors group/item">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-3 h-3 opacity-70" />
                {t.keywordsAI}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 opacity-0 group-hover/item:opacity-70 transition-opacity cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[200px]">
                  {t.keywordsTooltip || "Analiza cómo aparece tu marca en respuestas de IA para diferentes keywords"}
                </TooltipContent>
              </Tooltip>
            </button>
          </Link>
          <Link href={`/brand/${id}/competitors`}>
            <button className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-md transition-colors group/item">
              <span className="flex items-center gap-2">
                <Users className="w-3 h-3 opacity-70" />
                {t.competition}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 opacity-0 group-hover/item:opacity-70 transition-opacity cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[200px]">
                  {t.competitionTooltip || "Compara tu visibilidad en IA frente a tus competidores"}
                </TooltipContent>
              </Tooltip>
            </button>
          </Link>
          <Link href={`/brand/${id}/crawlers`}>
            <button className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-md transition-colors group/item">
              <span className="flex items-center gap-2">
                <Bot className="w-3 h-3 opacity-70" />
                {t.crawlersMonitor}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 opacity-0 group-hover/item:opacity-70 transition-opacity cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[200px]">
                  {t.crawlersTooltip || "Monitorea qué bots de IA están rastreando tu sitio web"}
                </TooltipContent>
              </Tooltip>
            </button>
          </Link>
        </div>
      )}
    </div>
  )
}

export function AppSidebar() {
  const { openMobile, setOpenMobile, isMobile } = useSidebar()
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useTranslations()
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Initialize settings open state
  useEffect(() => {
    if (pathname.startsWith('/settings')) {
      setIsSettingsOpen(true)
    }
  }, [pathname])

  // Check if in demo mode to hide admin
  let isDemoMode = false
  try {
    const demo = useDemo()
    isDemoMode = demo.isDemoMode
  } catch {
    // Context not available
  }

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const data = await brandsService.getAll()
        setBrands(data)

        // Onboarding check: If no brands and not on onboarding/creation pages, redirect
        if (!isDemoMode && data.length === 0 && !pathname.startsWith('/brand/new') && !pathname.startsWith('/onboarding')) {
          router.push('/onboarding')
        }
      } catch (error) {
        console.error('Failed to fetch brands:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBrands()
  }, [pathname, router])

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

  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab')

  // Helper to generate consistent colors based on brand name
  const getBrandColors = (name: string) => {
    const colors = [
      { bg: 'bg-red-500', text: 'text-white' },
      { bg: 'bg-blue-500', text: 'text-white' },
      { bg: 'bg-green-500', text: 'text-white' },
      { bg: 'bg-yellow-500', text: 'text-white' },
      { bg: 'bg-purple-500', text: 'text-white' },
      { bg: 'bg-pink-500', text: 'text-white' },
      { bg: 'bg-indigo-500', text: 'text-white' },
      { bg: 'bg-black dark:bg-white', text: 'text-white dark:text-black' },
    ]
    const index = name.length % colors.length
    return colors[index]
  }

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
          <Link href="/">
            <div className="cursor-pointer flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" className="w-8 h-8 text-primary" aria-hidden="true">
                <path d="M19.7,26.3l3.2-4.2c1.7-2.6,3.5-5.4,3.9-8.5l-1.8,3.4c-1.3,1.8-2.6,3.8-4.1,5.4s-2.3,2.3-2.7,2.4-.2,0-.2-.2c-1-3.3-1.1-7.5.3-10.7s6.4-8,9.5-10.6,2.5-2.1,2.7-2c2.5,4.1,4.3,9.4,3.1,14.3-1.5,6.1-7.9,10.2-13.9,10.7Z" fill="currentColor" />
                <path d="M33.7,20.5v15.1c0,1-1.6,2.5-2.6,2.7-2.4.4-4.2-1-4.4-3.4s-.2-6.1,0-8,0-.4.2-.6,1.7-.9,2.1-1.2c1.8-1.2,3.3-2.7,4.7-4.5Z" fill="currentColor" />
                <path d="M16.3,25.4c-.1.1-.9-.6-1.1-.7-1.6-1.5-3.1-3.8-4-5.8-.3,0-.1.3,0,.4.6,2.5,2.6,4.8,4.1,6.9-3.5-.3-7.2-2.6-8.2-6.2s.4-5.7,1.7-8.4c.1,0,1.4,1,1.6,1.1,1.9,1.6,5,4.4,5.8,6.7s.4,4,0,6Z" fill="currentColor" />
                <path d="M7.3,24.4c1.9,2,4.3,3.2,7,3.9-.3,2.2.5,6.1-.4,8.1s-3.4,2.6-5.1,1.5-1.5-1.6-1.5-2.2v-11.2Z" fill="currentColor" />
                <path d="M23.9,27.5v8.1c0,.4-.8,1.6-1.1,1.9-1.6,1.4-4.4,1.1-5.4-.9s-.5-1.4-.5-1.6v-6.7c2.4,0,4.7-.1,7-.8Z" fill="currentColor" />
              </svg>
            </div>
          </Link>
          <button
            onClick={() => setOpenMobile(false)}
            className="md:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
            aria-label={t.closeMenu}
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Create Brand Button */}
        <div className="px-4 mb-6">
          <Link href="/brand/new">
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-lg h-9 text-sm font-medium">+ {t.createBrand}</Button>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 overflow-y-auto space-y-0.5">
          <Link href="/dashboard">
            <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${pathname === '/dashboard'
              ? 'bg-secondary text-foreground font-medium'
              : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
              }`}>
              <div className="w-4 h-4 flex items-center justify-center">
                <div className={`w-2.5 h-2.5 border-2 rounded-sm ${pathname === '/dashboard'
                  ? 'border-foreground'
                  : 'border-muted-foreground'
                  }`}></div>
              </div>
              <span>{t.panel}</span>
            </button>
          </Link>

          {/* Admin - Hidden in demo mode */}
          {!isDemoMode && (
            <Link href="/admin">
              <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${pathname === '/admin'
                ? 'bg-secondary text-foreground font-medium'
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                }`}>
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </button>
            </Link>
          )}

          <Link href="/notifications">
            <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${pathname === '/notifications'
              ? 'bg-secondary text-foreground font-medium'
              : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
              }`}>
              <Bell className="w-4 h-4" />
              <span>{t.notifications}</span>
            </button>
          </Link>
          {/* Settings Section */}
          <div className="mb-0.5">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors group ${pathname.startsWith('/settings')
                ? 'bg-secondary text-foreground font-medium'
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                }`}
            >
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4" />
                <span>{t.configuration || "Configuración"}</span>
              </div>
              <ChevronRight
                className={`w-4 h-4 transition-transform duration-200 ${isSettingsOpen ? 'rotate-90' : ''}`}
              />
            </button>

            {isSettingsOpen && (
              <div className="ml-4 pl-3 border-l border-border/50 mt-1 space-y-0.5">
                <Link href="/settings?tab=organization">
                  <button className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors ${pathname === '/settings' && (!currentTab || currentTab === 'organization')
                    ? 'text-foreground bg-secondary/50 font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}>
                    <span>{t.organization || "Organización"}</span>
                  </button>
                </Link>
                <Link href="/settings?tab=profile">
                  <button className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors ${pathname === '/settings' && currentTab === 'profile'
                    ? 'text-foreground bg-secondary/50 font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}>
                    <span>{t.profile || "Perfil"}</span>
                  </button>
                </Link>
                <Link href="/settings?tab=security">
                  <button className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors ${pathname === '/settings' && currentTab === 'security'
                    ? 'text-foreground bg-secondary/50 font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}>
                    <span>{t.security || "Seguridad"}</span>
                  </button>
                </Link>
                <Link href="/settings?tab=notifications">
                  <button className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors ${pathname === '/settings' && currentTab === 'notifications'
                    ? 'text-foreground bg-secondary/50 font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}>
                    <span>{t.notifications || "Notificaciones"}</span>
                  </button>
                </Link>
                <Link href="/settings?tab=billing">
                  <button className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors ${pathname === '/settings' && currentTab === 'billing'
                    ? 'text-foreground bg-secondary/50 font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}>
                    <span>{t.billing || "Facturación"}</span>
                  </button>
                </Link>
                <Link href="/settings?tab=appearance">
                  <button className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors ${pathname === '/settings' && currentTab === 'appearance'
                    ? 'text-foreground bg-secondary/50 font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}>
                    <span>{t.appearance || "Apariencia"}</span>
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* Brands Section */}
          <div className="pt-4 mt-2 border-t border-border/40">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.brands}</span>
              <Link href="/brand/new">
                <Plus className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
              </Link>
            </div>
            <div className="space-y-0.5">
              {loading ? (
                <div className="px-3 py-2 text-xs text-muted-foreground animate-pulse">{t.loadingText}</div>
              ) : brands.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">{t.noBrandsYet}</div>
              ) : (
                brands.map((brand) => {
                  return (
                    <BrandItem
                      key={brand.id}
                      id={brand.id}
                      name={brand.name}
                      domain={brand.domain}
                      onDeleted={() => setBrands(brands.filter(b => b.id !== brand.id))}
                    />
                  )
                })
              )}
            </div>
          </div>
        </nav>

        {/* Token Usage */}
        <div className="p-4 border-t border-border/40 bg-secondary/20">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-medium text-foreground">{t.almostReachedLimit}</p>
              <span className="text-[10px] text-muted-foreground">0/10k</span>
            </div>
            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                style={{ width: "0%" }}
              ></div>
            </div>
          </div>

          <Link href="/upgrade">
            <Button variant="outline" className="w-full h-8 text-xs bg-background hover:bg-secondary mb-2 border-border/60 shadow-sm">
              {t.upgradeToProArrow}
            </Button>
          </Link>

          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 justify-start px-2"
          >
            <LogOut className="mr-2 h-3.5 w-3.5" />
            {t.logoutButton}
          </Button>
        </div>
      </aside>
    </>
  )
}




