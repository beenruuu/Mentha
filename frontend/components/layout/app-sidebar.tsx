"use client"

import { Search, Bell, Settings, ChevronRight, X, Bot, Search as SearchIcon, TrendingUp, Users, LogOut, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSidebar } from "@/components/ui/sidebar"
import { useTranslations } from "@/lib/i18n"
import { brandsService, Brand } from "@/lib/services/brands"
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
  const [expanded, setExpanded] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { t } = useTranslations()
  const router = useRouter()

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
    <div>
      <div className="w-full flex items-center justify-between px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#1E1E24] rounded-lg group">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 flex items-center gap-3"
        >
          <div className="w-4 h-4 rounded-full overflow-hidden bg-white flex items-center justify-center border border-gray-100">
            <img
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
              alt={`${name} logo`}
              className="w-3 h-3 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden w-full h-full bg-emerald-600 flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <span className="text-sm truncate max-w-[100px]">{name}</span>
        </button>
        <div className="flex items-center gap-1">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
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
                <AlertDialogAction onClick={handleDeleteBrand} className="bg-red-600 hover:bg-red-700">
                  {isDeleting ? t.deleting : t.delete}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <button onClick={() => setExpanded(!expanded)}>
            <ChevronRight className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="ml-7 mt-1 space-y-1">
          <Link href={`/brand/${id}`}>
            <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1E1E24] rounded">
              {t.overview}
            </button>
          </Link>
          <Link href={`/brand/${id}/queries`}>
            <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1E1E24] rounded">
              <SearchIcon className="w-3 h-3" />
              {t.queries}
            </button>
          </Link>
          <Link href={`/brand/${id}/crawlers`}>
            <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1E1E24] rounded">
              <Bot className="w-3 h-3" />
              {t.aiCrawlers}
            </button>
          </Link>
          <Link href={`/brand/${id}/keywords`}>
            <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1E1E24] rounded">
              <TrendingUp className="w-3 h-3" />
              {t.keywordsAI}
            </button>
          </Link>
          <Link href={`/brand/${id}/competitors`}>
            <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1E1E24] rounded">
              <Users className="w-3 h-3" />
              {t.competition}
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

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const data = await brandsService.getAll()
        setBrands(data)

        // Onboarding check: If no brands and not on onboarding/creation pages, redirect
        if (data.length === 0 && !pathname.startsWith('/brands/new') && !pathname.startsWith('/onboarding')) {
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
    // En modo demo, simplemente redirigir
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

    if (isDemoMode) {
      router.push('/auth/login')
    } else {
      // En producción, usar Supabase
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
  }

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
        } md:translate-x-0 fixed left-0 top-0 h-screen w-64 bg-white dark:bg-black border-r border-gray-200 dark:border-[#2A2A30] flex flex-col z-50 transition-transform duration-300 ease-in-out`}>
        {/* Logo and Close Button */}
        <div className="p-4 flex items-center justify-between">
          <Link href="/">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer">
              {/* Mentha logo - color follows text color: black in light, white in dark */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" className="w-6 h-6 text-black dark:text-white" aria-hidden="true">
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
            className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-[#1E1E24] rounded-lg transition-colors"
            aria-label={t.closeMenu}
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Create Brand Button */}
        <div className="px-4 mb-6">
          <Link href="/brands/new">
            <Button className="w-full bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black rounded-lg">+ {t.createBrand}</Button>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 overflow-y-auto">
          <Link href="/dashboard">
            <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 justify-between ${pathname === '/dashboard'
              ? 'bg-gray-100 dark:bg-[#1E1E24] text-gray-900 dark:text-white font-medium'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1E1E24]'
              }`}>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 flex items-center justify-center">
                  <div className={`w-3 h-3 border-2 rounded ${pathname === '/dashboard'
                    ? 'border-gray-900 dark:border-white'
                    : 'border-gray-600 dark:border-gray-300'
                    }`}></div>
                </div>
                <span className="text-sm">{t.panel}</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
          <Link href="/keywords">
            <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 ${pathname === '/keywords'
              ? 'bg-gray-100 dark:bg-[#1E1E24] text-gray-900 dark:text-white font-medium'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1E1E24]'
              }`}>
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">{t.keywordsAI}</span>
            </button>
          </Link>
          <Link href="/competitors">
            <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 ${pathname === '/competitors'
              ? 'bg-gray-100 dark:bg-[#1E1E24] text-gray-900 dark:text-white font-medium'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1E1E24]'
              }`}>
              <Users className="w-4 h-4" />
              <span className="text-sm">{t.competition}</span>
            </button>
          </Link>
          <Link href="/search">
            <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 ${pathname === '/search'
              ? 'bg-gray-100 dark:bg-[#1E1E24] text-gray-900 dark:text-white font-medium'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1E1E24]'
              }`}>
              <Search className="w-4 h-4" />
              <span className="text-sm">{t.search}</span>
            </button>
          </Link>
          <Link href="/notifications">
            <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 ${pathname === '/notifications'
              ? 'bg-gray-100 dark:bg-[#1E1E24] text-gray-900 dark:text-white font-medium'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1E1E24]'
              }`}>
              <Bell className="w-4 h-4" />
              <span className="text-sm">{t.notifications}</span>
            </button>
          </Link>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-settings-panel'))}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-6 ${pathname === '/settings'
              ? 'bg-gray-100 dark:bg-[#1E1E24] text-gray-900 dark:text-white font-medium'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1E1E24]'
              }`}
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">{t.settings}</span>
          </button>

          {/* Brands Section */}
          <div className="mb-3">
            <div className="flex items-center justify-between px-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t.brands}</span>
                <ChevronRight className="w-3 h-3 text-gray-400 dark:text-gray-500 rotate-90" />
              </div>
              <Link href="/brands/new">
                <Plus className="w-3 h-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer" />
              </Link>
            </div>
            <div className="space-y-1">
              {loading ? (
                <div className="px-3 py-2 text-xs text-gray-400">Loading...</div>
              ) : brands.length === 0 ? (
                <div className="px-3 py-2 text-xs text-gray-400">No brands yet</div>
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
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{t.almostReachedLimit}</p>
            <div className="w-full h-1.5 bg-gray-200 dark:bg-black rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-yellow-500 rounded-full"
                style={{ width: "0%" }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">0 / 10,000 {t.tokensUsed}</p>
          </div>

          <Link href="/upgrade">
            <Button variant="outline" className="w-full text-sm bg-transparent mb-2">
              {t.upgradeToProArrow}
            </Button>
          </Link>

          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 justify-start"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t.logoutButton}
          </Button>
        </div>
      </aside>
    </>
  )
}




