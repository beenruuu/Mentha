'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Clock, TrendingUp, Sparkles, Command, ArrowRight, MessageSquare } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { useTranslations } from '@/lib/i18n'
import { brandsService, type Brand } from '@/lib/services/brands'
import { SearchInput } from '@/components/search/search-input'

export default function SearchPage() {
  const { t } = useTranslations()
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    loadBrands()
  }, [])

  const loadBrands = async () => {
    try {
      const data = await brandsService.getAll()
      setBrands(data)
    } catch (error) {
      console.error('Failed to load brands:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    // Simulate search delay
    setTimeout(() => {
      setIsSearching(false)
    }, 2000)
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#fdfdfc] dark:bg-[#050505] h-screen overflow-hidden flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-6 bg-[#fdfdfc] dark:bg-[#050505]">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t.searchTitle}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">AI-powered analysis command center</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 pb-8 bg-[#fdfdfc] dark:bg-[#050505]">
          <div className="max-w-4xl mx-auto space-y-12 pt-8">

            {/* Hero Search Section */}
            <div className="text-center space-y-8">
              <div className="space-y-2">
                <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                  What do you want to analyze?
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Test prompts, analyze competitors, or discover new keywords across all major AI models.
                </p>
              </div>

              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={handleSearch}
                className="max-w-2xl mx-auto"
              />

              {/* Quick Prompts */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mr-2">Try asking:</span>
                <Button variant="outline" size="sm" className="rounded-full bg-white dark:bg-[#1E1E24] border-border/40 hover:bg-secondary/50 text-xs" onClick={() => setSearchQuery("How does my brand compare to competitors?")}>
                  <Sparkles className="w-3 h-3 mr-1.5 text-emerald-500" />
                  Compare vs competitors
                </Button>
                <Button variant="outline" size="sm" className="rounded-full bg-white dark:bg-[#1E1E24] border-border/40 hover:bg-secondary/50 text-xs" onClick={() => setSearchQuery("What are users asking about my product?")}>
                  <MessageSquare className="w-3 h-3 mr-1.5 text-blue-500" />
                  User questions
                </Button>
                <Button variant="outline" size="sm" className="rounded-full bg-white dark:bg-[#1E1E24] border-border/40 hover:bg-secondary/50 text-xs" onClick={() => setSearchQuery("Generate SEO keywords for my landing page")}>
                  <TrendingUp className="w-3 h-3 mr-1.5 text-purple-500" />
                  Keyword ideas
                </Button>
              </div>
            </div>

            {/* Recent & Popular Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Searches */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/40 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <CardTitle className="text-base">Recent Analyses</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {[1, 2, 3].map((_, i) => (
                      <div key={i} className="group flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-secondary/30 flex items-center justify-center text-xs font-medium text-muted-foreground group-hover:bg-white dark:group-hover:bg-zinc-800 transition-colors">
                            <Search className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">"Best CRM for startups"</p>
                            <p className="text-xs text-muted-foreground">2 hours ago</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Popular Trends */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/40 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <CardTitle className="text-base">Trending in Your Industry</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">AI Integration</span>
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">+12%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Data Privacy</span>
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">+8%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Automation Tools</span>
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">+5%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Access Brands */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Quick Access</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {brands.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic col-span-full">{t.noBrandsFound || "No brands found"}</p>
                ) : (
                  brands.map((brand) => (
                    <Link key={brand.id} href={`/brand/${brand.id}`}>
                      <Card className="p-4 hover:shadow-md transition-all duration-300 cursor-pointer bg-card/50 backdrop-blur-sm border-border/40 hover:border-primary/30 group">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-800 border border-border/50 flex items-center justify-center overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${brand.domain}&sz=128`}
                              alt={brand.name}
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                e.currentTarget.parentElement!.innerText = brand.name.substring(0, 2).toUpperCase()
                              }}
                            />
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{brand.name}</span>
                            <p className="text-xs text-muted-foreground">View Dashboard</p>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))
                )}
              </div>
            </div>

          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
