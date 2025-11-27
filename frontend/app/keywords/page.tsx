'use client'

import { useState, useEffect } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TrendingUp, TrendingDown, Plus, Search, Minus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useTranslations } from '@/lib/i18n'
import { keywordsService, Keyword } from '@/lib/services/keywords'

export default function KeywordsPage() {
  const { t } = useTranslations()
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    avgVisibility: 0,
    top3: 0,
    improvements: 0,
    lastSync: ''
  })
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

      const total = data.length
      const avgVisibility = total > 0 
        ? Math.round(data.reduce((acc, k) => acc + (k.ai_visibility_score || 0), 0) / total) 
        : 0
      // Calculate keywords in top 3 positions (visibility > 80%)
      const top3 = data.filter(k => (k.ai_visibility_score || 0) >= 80).length
      // Calculate improvement opportunities (keywords with visibility < 50%)
      const improvements = data.filter(k => (k.ai_visibility_score || 0) < 50 && (k.ai_visibility_score || 0) > 0).length
      const lastSyncTimestamp = data.reduce((latest: number, keyword) => {
        const ts = keyword.updated_at ? new Date(keyword.updated_at).getTime() : 0
        return ts > latest ? ts : latest
      }, 0)
      const lastSync = lastSyncTimestamp ? new Date(lastSyncTimestamp).toLocaleString() : '—'

      setStats({ total, avgVisibility, top3, improvements, lastSync })
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

  const getDifficultyColor = (difficulty: number | undefined) => {
    if (!difficulty) return 'text-gray-600'
    if (difficulty >= 70) return 'text-red-600'
    if (difficulty >= 50) return 'text-orange-600'
    return 'text-green-600'
  }

  const getVisibilityColor = (score: number | undefined) => {
    if (!score) return 'text-gray-600'
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
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
      loadKeywords() // Reload list
    } catch (error) {
      toast({
        title: t.errorTitle,
        description: "Failed to add keyword",
        variant: 'destructive',
      })
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader 
          icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
          title={t.keywordsTitle}
        />

        <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 bg-[#f5f5f5] dark:bg-[#0A0A0A]">
          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
              <CardHeader className="pb-2">
                <CardDescription className="text-gray-500 dark:text-gray-400">{t.trackedKeywords}</CardDescription>
                <CardTitle className="text-3xl text-gray-900 dark:text-white">{stats.total}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  0 {t.sinceLastMonth}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
              <CardHeader className="pb-2">
                <CardDescription className="text-gray-500 dark:text-gray-400">{t.averageVisibility}</CardDescription>
                <CardTitle className="text-3xl text-emerald-600">{stats.avgVisibility}%</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  0% {t.thisMonth}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
              <CardHeader className="pb-2">
                <CardDescription className="text-gray-500 dark:text-gray-400">{t.top3Positions}</CardDescription>
                <CardTitle className="text-3xl text-gray-900 dark:text-white">{stats.top3}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  0% {t.ofYourKeywords}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
              <CardHeader className="pb-2">
                <CardDescription className="text-gray-500 dark:text-gray-400">{t.potentialImprovements}</CardDescription>
                <CardTitle className="text-3xl text-gray-900 dark:text-white">{stats.improvements}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t.opportunitiesIdentified}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Add */}
          <Card className="w-full bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-gray-900 dark:text-white">{t.keywordManagement}</CardTitle>
                  <CardDescription className="text-gray-500 dark:text-gray-400">
                    {t.trackKeywordPerformance}
                  </CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="ml-0 md:ml-auto">
                      <Plus className="mr-2 h-4 w-4" />
                      {t.addKeyword}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
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
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={t.searchKeywords} className="pl-10" />
                </div>
              </div>

              <div className="overflow-x-auto -mx-6 md:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden px-6 md:px-0">
                    <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.keyword}</TableHead>
                    <TableHead>{t.volume}</TableHead>
                    <TableHead>{t.difficulty}</TableHead>
                    <TableHead>{t.aiVisibility}</TableHead>
                    <TableHead>{t.position}</TableHead>
                    <TableHead>{t.aiModels}</TableHead>
                    <TableHead>{t.trend}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keywords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                        {loading ? 'Loading...' : t.noKeywords || 'No keywords found. Add your first keyword to start tracking.'}
                      </TableCell>
                    </TableRow>
                  ) : keywords.map((kw) => {
                    // Calculate position from visibility score (higher visibility = better position)
                    const estimatedPosition = kw.ai_visibility_score 
                      ? Math.max(1, Math.round(10 - (kw.ai_visibility_score / 12)))
                      : undefined
                    
                    // Use real trend_direction if available, otherwise infer from visibility
                    let trend: 'up' | 'down' | 'neutral' = 'neutral'
                    if (kw.trend_direction) {
                      // Map real trend_direction to display
                      trend = kw.trend_direction === 'rising' ? 'up' 
                            : kw.trend_direction === 'falling' ? 'down' 
                            : 'neutral'
                    } else if (kw.ai_visibility_score) {
                      trend = kw.ai_visibility_score >= 70 ? 'up' 
                            : kw.ai_visibility_score >= 40 ? 'neutral' 
                            : 'down'
                    }
                    
                    // Infer AI model mentions from visibility score presence
                    const hasMentions = (kw.ai_visibility_score || 0) > 0
                    
                    // Determine data source indicator
                    const isRealData = kw.data_source && kw.data_source !== 'llm_estimated'
                    
                    return (
                    <TableRow key={kw.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {kw.keyword}
                          {isRealData && (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                              {kw.data_source === 'google_trends' ? 'GT' : kw.data_source === 'serpapi' ? 'API' : '✓'}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{kw.search_volume?.toLocaleString() || '-'}</span>
                          {kw.trend_score !== undefined && kw.trend_score !== null && (
                            <span className="text-xs text-gray-500">Trend: {kw.trend_score}/100</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={getDifficultyColor(kw.difficulty)}>
                          {kw.difficulty ? `${Math.round(kw.difficulty)}/100` : '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={getVisibilityColor(kw.ai_visibility_score)}>
                          {kw.ai_visibility_score ? `${Math.round(kw.ai_visibility_score)}%` : '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={estimatedPosition && estimatedPosition <= 3 ? 'default' : 'secondary'}>
                          {estimatedPosition ? `#${estimatedPosition}` : '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {hasMentions && (
                            <>
                              <Badge variant="outline" className="text-xs">GPT</Badge>
                              {(kw.ai_visibility_score || 0) >= 60 && (
                                <Badge variant="outline" className="text-xs">Claude</Badge>
                              )}
                              {(kw.ai_visibility_score || 0) >= 80 && (
                                <>
                                  <Badge variant="outline" className="text-xs">Perp</Badge>
                                  <Badge variant="outline" className="text-xs">Gemini</Badge>
                                </>
                              )}
                            </>
                          )}
                          {!hasMentions && <span className="text-gray-400 text-xs">-</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {trend === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : trend === 'down' ? (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        ) : (
                          <Minus className="h-4 w-4 text-gray-400" />
                        )}
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
