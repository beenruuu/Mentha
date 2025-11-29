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
import { Users, Plus, TrendingUp, TrendingDown, Search, ArrowUpDown } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
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
import { competitorsService, Competitor } from '@/lib/services/competitors'

// Extended interface for UI display
interface CompetitorDisplay extends Competitor {
  mentions: string;
  avgPosition: string;
  trend: 'up' | 'down' | 'neutral';
  change: string;
  strengths: string[];
}

export default function CompetitorsPage() {
  const { t } = useTranslations()
  const [competitors, setCompetitors] = useState<CompetitorDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    yourPosition: '-',
    visibilityGap: '0%',
    opportunities: 0
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [competitorName, setCompetitorName] = useState('')
  const [competitorDomain, setCompetitorDomain] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    loadCompetitors()
  }, [])

  const loadCompetitors = async () => {
    try {
      setLoading(true)
      const data = await competitorsService.getAll()
      
      // Map backend data to UI format - only show real data, no derived/fake values
      const mappedData: CompetitorDisplay[] = data.map(c => ({
        ...c,
        mentions: '—', // Real mentions require AI search integration
        avgPosition: '—', // Real position requires SERP tracking
        trend: 'neutral', // Real trend requires historical data
        change: '—', // Real change requires historical tracking
        strengths: [] // Real strengths require competitive analysis
      }))
      setCompetitors(mappedData)

      // Only show real stats - count of tracked competitors
      setStats({
        total: data.length,
        yourPosition: '—', // Requires real competitive analysis
        visibilityGap: '—', // Requires real visibility measurement
        opportunities: 0 // Requires real keyword analysis
      })
    } catch (error) {
      console.error('Failed to load competitors:', error)
      toast({
        title: t.errorTitle,
        description: "Failed to load competitors",
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number | undefined) => {
    if (!score) return 'text-gray-600'
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-yellow-600'
    if (score >= 70) return 'text-orange-600'
    return 'text-red-600'
  }

  const handleAddCompetitor = async () => {
    if (!competitorName.trim() || !competitorDomain.trim()) {
      toast({
        title: t.errorTitle,
        description: t.pleaseCompleteAllFields,
        variant: 'destructive',
      })
      return
    }

    try {
      await competitorsService.create({
        name: competitorName,
        domain: competitorDomain,
        tracked: true
      })

      toast({
        title: t.competitorAdded,
        description: t.competitorAddedToList.replace('{name}', competitorName),
      })
      
      setCompetitorName('')
      setCompetitorDomain('')
      setIsDialogOpen(false)
      loadCompetitors() // Reload list
    } catch (error) {
      toast({
        title: t.errorTitle,
        description: "Failed to add competitor",
        variant: 'destructive',
      })
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader 
          icon={<Users className="h-5 w-5 text-emerald-600" />}
          title={t.competitorsTitle}
        />

        <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 bg-[#f5f5f5] dark:bg-[#0A0A0A]">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
              <CardHeader className="pb-2">
                <CardDescription className="text-gray-500 dark:text-gray-400">{t.competitorsTracked}</CardDescription>
                <CardTitle className="text-3xl text-gray-900 dark:text-white">{stats.total}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t.inYourIndustry}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
              <CardHeader className="pb-2">
                <CardDescription className="text-gray-500 dark:text-gray-400">{t.yourPosition}</CardDescription>
                <CardTitle className="text-3xl text-gray-900 dark:text-white">{stats.yourPosition}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  —
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
              <CardHeader className="pb-2">
                <CardDescription className="text-gray-500 dark:text-gray-400">{t.visibilityGap}</CardDescription>
                <CardTitle className="text-3xl text-gray-900 dark:text-white">{stats.visibilityGap}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  —
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
              <CardHeader className="pb-2">
                <CardDescription className="text-gray-500 dark:text-gray-400">{t.opportunities}</CardDescription>
                <CardTitle className="text-3xl text-gray-900 dark:text-white">{stats.opportunities}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t.keywordsToImprove}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Competitor Comparison */}
          <Card className="w-full bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gray-900 dark:text-white">{t.competitorComparison}</CardTitle>
                  <CardDescription className="text-gray-500 dark:text-gray-400">
                    {t.analyzePerformanceVsCompetitors}
                  </CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      {t.addCompetitor}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t.addNewCompetitor}</DialogTitle>
                      <DialogDescription>
                        {t.enterCompetitorData}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">{t.competitorNameLabel}</Label>
                        <Input
                          id="name"
                          placeholder={t.competitorNamePlaceholder}
                          value={competitorName}
                          onChange={(e) => setCompetitorName(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="domain">{t.domainLabel}</Label>
                        <Input
                          id="domain"
                          placeholder={t.domainPlaceholder}
                          value={competitorDomain}
                          onChange={(e) => setCompetitorDomain(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddCompetitor()}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        {t.cancel}
                      </Button>
                      <Button onClick={handleAddCompetitor}>
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
                  <Input placeholder={t.searchCompetitors} className="pl-10" />
                </div>
              </div>

              <div className="overflow-x-auto -mx-6 md:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden px-6 md:px-0">
                    <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.competitor}</TableHead>
                    <TableHead>{t.domain}</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        {t.visibility}
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>{t.aiMentions}</TableHead>
                    <TableHead>{t.avgPositionShort}</TableHead>
                    <TableHead>{t.trend}</TableHead>
                    <TableHead>{t.strengths}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competitors.map((comp) => (
                    <TableRow key={comp.id}>
                      <TableCell className="font-medium">{comp.name}</TableCell>
                      <TableCell className="text-muted-foreground">{comp.domain}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className={`font-semibold ${getScoreColor(comp.visibility_score)}`}>
                            {comp.visibility_score ? `${comp.visibility_score}/100` : '-'}
                          </div>
                          <Progress value={comp.visibility_score || 0} className="h-1" />
                        </div>
                      </TableCell>
                      <TableCell>{comp.mentions}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">#{comp.avgPosition}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {comp.trend === 'up' ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : comp.trend === 'down' ? (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          ) : (
                            <div className="h-4 w-4 border-t-2 border-gray-400" />
                          )}
                          <span className={
                            comp.trend === 'up' ? 'text-green-600' :
                            comp.trend === 'down' ? 'text-red-600' :
                            'text-gray-600'
                          }>
                            {comp.change}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {comp.strengths.slice(0, 2).map((strength, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {strength}
                            </Badge>
                          ))}
                          {comp.strengths.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{comp.strengths.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gap Analysis */}
          <Card className="w-full bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">{t.gapAnalysis}</CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                {t.identifyAreasWhereCompetitors}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{t.contentQuality}</span>
                    <span className="text-sm text-muted-foreground">—</span>
                  </div>
                  <Progress value={0} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{t.domainAuthority}</span>
                    <span className="text-sm text-muted-foreground">—</span>
                  </div>
                  <Progress value={0} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{t.keywordCoverage}</span>
                    <span className="text-sm text-muted-foreground">—</span>
                  </div>
                  <Progress value={0} className="h-2" />
                </div>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  {t.analysisRequired}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
