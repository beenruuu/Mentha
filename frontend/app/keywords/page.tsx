'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TrendingUp, TrendingDown, Plus, Search, Filter, ArrowUpDown, MoreHorizontal } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useTranslations } from '@/lib/i18n'
import { keywordsService, Keyword } from '@/lib/services/keywords'
import { Sparkline } from '@/components/ui/sparkline'

export default function KeywordsPage() {
  const { t } = useTranslations()
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newKeyword, setNewKeyword] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    loadKeywords()
  }, [])

  const loadKeywords = async () => {
    try {
      setLoading(true)
      const data = await keywordsService.getAll()
      setKeywords(data)
    } catch (error) {
      console.error('Failed to load keywords:', error)
      toast({
        title: t.errorTitle,
        description: "Failed to load keywords",
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) {
      toast({
        title: t.errorTitle,
        description: t.pleaseEnterKeyword,
        variant: 'destructive',
      })
      return
    }

    try {
      await keywordsService.create({
        keyword: newKeyword,
        tracked: true
      })

      toast({
        title: t.keywordAdded,
        description: t.keywordAddedToTracking.replace('{keyword}', newKeyword),
      })

      setNewKeyword('')
      setIsDialogOpen(false)
      loadKeywords()
    } catch (error) {
      toast({
        title: t.errorTitle,
        description: "Failed to add keyword",
        variant: 'destructive',
      })
    }
  }

  const filteredKeywords = keywords.filter(k =>
    k.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Mock trend data generator (replace with real history later)
  const getMockTrend = () => Array.from({ length: 7 }, () => Math.floor(Math.random() * 100))

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#fdfdfc] dark:bg-[#050505] h-screen overflow-hidden flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-6 bg-[#fdfdfc] dark:bg-[#050505] border-b border-border/40">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t.keywordsTitle}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and track your SEO keywords</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                {t.addKeyword}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t.addNewKeyword}</DialogTitle>
                <DialogDescription>
                  {t.enterKeywordToTrack}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="keyword">{t.keywordLabel}</Label>
                  <Input
                    id="keyword"
                    placeholder={t.keywordPlaceholder}
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t.cancel}
                </Button>
                <Button onClick={handleAddKeyword}>
                  {t.add}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-[#fdfdfc] dark:bg-[#050505]">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-card/50 backdrop-blur-sm border-border/40 shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription>Total Keywords</CardDescription>
                  <CardTitle className="text-2xl">{keywords.length}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm border-border/40 shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription>Avg. Visibility</CardDescription>
                  <CardTitle className="text-2xl">
                    {keywords.length > 0 ? Math.round(keywords.reduce((acc, k) => acc + (k.ai_visibility_score || 0), 0) / keywords.length) : 0}%
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm border-border/40 shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription>High Difficulty</CardDescription>
                  <CardTitle className="text-2xl">
                    {keywords.filter(k => (k.difficulty || 0) > 70).length}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm border-border/40 shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription>Opportunity</CardDescription>
                  <CardTitle className="text-2xl">
                    {keywords.filter(k => (k.search_volume || 0) > 1000 && (k.difficulty || 0) < 50).length}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Filters & Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search keywords..."
                    className="pl-10 bg-white dark:bg-[#1E1E24] border-border/40"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-9 border-border/40 bg-white dark:bg-[#1E1E24]">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm" className="h-9 border-border/40 bg-white dark:bg-[#1E1E24]">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    Sort
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-border/40 bg-white dark:bg-[#1E1E24] shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50/50 dark:bg-[#2A2A30]/50">
                    <TableRow className="hover:bg-transparent border-border/40">
                      <TableHead className="w-[300px]">{t.keyword}</TableHead>
                      <TableHead>{t.volume}</TableHead>
                      <TableHead>{t.difficulty}</TableHead>
                      <TableHead>{t.aiVisibility}</TableHead>
                      <TableHead>Trend (7d)</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredKeywords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                          {loading ? 'Loading keywords...' : 'No keywords found matching your search.'}
                        </TableCell>
                      </TableRow>
                    ) : filteredKeywords.map((kw) => (
                      <TableRow key={kw.id} className="hover:bg-gray-50/50 dark:hover:bg-[#2A2A30]/50 border-border/40 transition-colors">
                        <TableCell className="font-medium text-foreground">
                          {kw.keyword}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md">
                            {kw.search_volume?.toLocaleString() || '—'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${(kw.difficulty || 0) > 70 ? 'bg-red-500' :
                                (kw.difficulty || 0) > 40 ? 'bg-yellow-500' : 'bg-emerald-500'
                              }`} />
                            <span className="text-sm text-muted-foreground">
                              {kw.difficulty ? Math.round(kw.difficulty) : '—'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${(kw.ai_visibility_score || 0) > 70 ? 'text-emerald-600 dark:text-emerald-400' :
                                (kw.ai_visibility_score || 0) > 30 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                              }`}>
                              {kw.ai_visibility_score ? `${Math.round(kw.ai_visibility_score)}%` : '—'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Sparkline
                            data={getMockTrend()}
                            width={80}
                            height={24}
                            color={(kw.ai_visibility_score || 0) > 50 ? "#10b981" : "#ef4444"}
                            className="opacity-80"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>View details</DropdownMenuItem>
                              <DropdownMenuItem>Analyze now</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">Delete keyword</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
