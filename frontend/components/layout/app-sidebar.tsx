"use client"

import { Bell, Settings, X, Users, LogOut, Shield, Wrench, Plus, User, CreditCard, Palette, Zap, Eye, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useSidebar } from "@/components/ui/sidebar"
import { useTranslations } from "@/lib/i18n"
import { brandsService, Brand } from "@/lib/services/brands"
import { UpgradeModal } from "@/components/shared/upgrade-modal"
import { RainbowButton } from "@/components/ui/rainbow-button"

/**
 * Mentha Sidebar - Clean Navigation
 * 
 * Structure:
 * - Panel (main entry, with submenus always visible)
 *   - Competitors
 *   - Optimization
 * - Admin
 * - Notifications  
 * - Settings
 */

export function AppSidebar() {
  const { openMobile, setOpenMobile, isMobile } = useSidebar()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { t } = useTranslations()
  const currentTab = searchParams.get('tab')
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)

  // Extract brand ID from pathname if on brand page
  const brandMatch = pathname.match(/\/brand\/([^\/]+)/)
  const brandIdFromUrl = brandMatch ? brandMatch[1] : null

  // Fetch first brand to use as default for submenus
  useEffect(() => {
    const fetchDefaultBrand = async () => {
      try {
        const brands = await brandsService.getAll()
        if (brands.length > 0) {
          setSelectedBrandId(brandIdFromUrl && brandIdFromUrl !== 'new' ? brandIdFromUrl : brands[0].id)
        }
      } catch (error) {
        console.error('Failed to fetch brands:', error)
      }
    }
    fetchDefaultBrand()
  }, [brandIdFromUrl])

  // Check demo mode safely
  let isDemo = false
  try {
    isDemo = typeof window !== 'undefined' && window.location.hostname === 'demo.mentha.ai'
  } catch {
    // Default to false
  }

  const handleLogout = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Error signing out:', error)
      router.push('/auth/login')
    }
  }

  // Check if current page is related to Panel section
  const isPanelActive = pathname === '/dashboard' || (brandIdFromUrl && brandIdFromUrl !== 'new')

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
        } md:translate-x-0 fixed left-0 top-0 h-screen w-64 bg-[#fafafa] dark:bg-[#08080a] flex flex-col z-50 transition-transform duration-300 ease-in-out`}>
        {/* Logo - Clean header without title */}
        <div className="p-4 flex items-center justify-between">
          <Link href="/dashboard">
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
        <div className="px-4 mb-4">
          <Link href="/brand/new">
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-lg h-9 text-sm font-medium">
              <Plus className="w-4 h-4 mr-2" />
              {t.newBrand}
            </Button>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 overflow-y-auto space-y-1">
          {/* 1. Panel - Main entry with always-visible submenus */}
          <div>
            <Link href="/dashboard">
              <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isPanelActive
                ? 'bg-secondary text-foreground font-medium'
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                }`}>
                <div className={`w-2.5 h-2.5 border-2 rounded-sm ${isPanelActive ? 'border-foreground' : 'border-muted-foreground'}`}></div>
                <span>{t.panel}</span>
              </button>
            </Link>

            {/* Submenus - Always visible */}
            <div className="ml-4 pl-3 border-l border-border/50 mt-1 space-y-0.5">
              {/* Visibility */}
              <Link href={selectedBrandId ? `/brand/${selectedBrandId}?tab=visibility` : '/dashboard'}>
                <button className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors ${currentTab === 'visibility'
                  ? 'text-foreground bg-secondary/50 font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}>
                  <Eye className="w-3 h-3 opacity-70" />
                  {t.brand_visibility}
                </button>
              </Link>

              {/* Competitors */}
              <Link href={selectedBrandId ? `/brand/${selectedBrandId}?tab=competitors` : '/dashboard'}>
                <button className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors ${currentTab === 'competitors'
                  ? 'text-foreground bg-secondary/50 font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}>
                  <Users className="w-3 h-3 opacity-70" />
                  {t.competitors}
                </button>
              </Link>

              {/* Optimization */}
              <Link href={selectedBrandId ? `/brand/${selectedBrandId}?tab=optimize` : '/dashboard'}>
                <button className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors ${currentTab === 'optimize'
                  ? 'text-foreground bg-secondary/50 font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}>
                  <Wrench className="w-3 h-3 opacity-70" />
                  {t.optimization}
                </button>
              </Link>

              {/* Prompts */}
              <Link href={selectedBrandId ? `/brand/${selectedBrandId}?tab=prompts` : '/dashboard'}>
                <button className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors ${currentTab === 'prompts'
                  ? 'text-foreground bg-secondary/50 font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}>
                  <Search className="w-3 h-3 opacity-70" />
                  {t.prompts}
                </button>
              </Link>
            </div>
          </div>

          {/* 2. Admin */}
          {!isDemo && (
            <Link href="/admin">
              <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${pathname === '/admin'
                ? 'bg-secondary text-foreground font-medium'
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                }`}>
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </button>
            </Link>
          )}

          {/* 3. Notifications */}
          <Link href="/notifications">
            <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${pathname === '/notifications'
              ? 'bg-secondary text-foreground font-medium'
              : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
              }`}>
              <Bell className="w-4 h-4" />
              <span>{t.notifications}</span>
            </button>
          </Link>

          {/* 4. Settings */}
          <div>
            <Link href="/settings">
              <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${pathname.startsWith('/settings')
                ? 'bg-secondary text-foreground font-medium'
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                }`}>
                <Settings className="w-4 h-4" />
                <span>{t.settings}</span>
              </button>
            </Link>

            {/* Submenus - Always visible */}
            <div className="ml-4 pl-3 border-l border-border/50 mt-1 space-y-0.5">
              {/* Profile */}
              <Link href="/settings?tab=profile">
                <button className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors ${pathname === '/settings' && (currentTab === 'profile' || !currentTab)
                  ? 'text-foreground bg-secondary/50 font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}>
                  <User className="w-3 h-3 opacity-70" />
                  {t.profile}
                </button>
              </Link>

              {/* Security */}
              <Link href="/settings?tab=security">
                <button className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors ${currentTab === 'security'
                  ? 'text-foreground bg-secondary/50 font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}>
                  <Shield className="w-3 h-3 opacity-70" />
                  {t.security}
                </button>
              </Link>

              {/* Notifications */}
              <Link href="/settings?tab=notifications">
                <button className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors ${currentTab === 'notifications'
                  ? 'text-foreground bg-secondary/50 font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}>
                  <Bell className="w-3 h-3 opacity-70" />
                  {t.notifications}
                </button>
              </Link>

              {/* Billing */}
              <Link href="/settings?tab=billing">
                <button className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors ${currentTab === 'billing'
                  ? 'text-foreground bg-secondary/50 font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}>
                  <CreditCard className="w-3 h-3 opacity-70" />
                  {t.billing}
                </button>
              </Link>

              {/* Appearance */}
              <Link href="/settings?tab=appearance">
                <button className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors ${currentTab === 'appearance'
                  ? 'text-foreground bg-secondary/50 font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}>
                  <Palette className="w-3 h-3 opacity-70" />
                  {t.appearance}
                </button>
              </Link>

              {/* Features */}
              <Link href="/settings?tab=features">
                <button className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors ${currentTab === 'features'
                  ? 'text-foreground bg-secondary/50 font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}>
                  <Zap className="w-3 h-3 opacity-70" />
                  {t.features}
                </button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 bg-secondary/20">
          {/* Analysis usage */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-medium text-foreground">{t.dailyAnalyses}</p>
              <span className="text-[10px] text-muted-foreground">0/10</span>
            </div>
            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                style={{ width: "0%" }}
              ></div>
            </div>
          </div>

          <RainbowButton
            onClick={() => setUpgradeModalOpen(true)}
            className="w-full h-8 text-xs mb-2 border-border/60 shadow-sm"
          >
            {t.upgradeToProArrow}
          </RainbowButton>

          <UpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />

          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 justify-start px-2"
          >
            <LogOut className="mr-2 h-3.5 w-3.5" />
            {t.signOut}
          </Button>
        </div>
      </aside>
    </>
  )
}




