'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Users, Plus, TrendingUp, Search, ArrowUpDown, MoreHorizontal, Globe } from 'lucide-react'
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
import { competitorsService, Competitor } from '@/lib/services/competitors'
import { CompetitorCard } from '@/components/competitors/competitor-card'

interface CompetitorDisplay extends Competitor {
  mentions: string;
  avgPosition: string;
  trend: 'up' | 'down' | 'neutral';
  change: string;
  strengths: string[];
  overlap: number;
}

export default function CompetitorsPage() {
  const { t } = useTranslations()
  const [competitors, setCompetitors] = useState<CompetitorDisplay[]>([])
  const [loading, setLoading] = useState(true)
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

      // Mock data enrichment for UI demo
      const mappedData: CompetitorDisplay[] = data.map(c => ({
        ...c,
        mentions: Math.floor(Math.random() * 500).toString(),
        avgPosition: (Math.random() * 10).toFixed(1),
        trend: Math.random() > 0.5 ? 'up' : 'down',
        change: `${Math.floor(Math.random() * 20)}%`,
        strengths: ['Content Depth', 'Backlinks', 'Tech SEO'].slice(0, Math.floor(Math.random() * 3) + 1),
        overlap: Math.floor(Math.random() * 100)
      }))
      setCompetitors(mappedData)
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
      loadCompetitors()
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
      <SidebarInset className="bg-[#fdfdfc] dark:bg-[#050505] h-screen overflow-hidden flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-6 bg-[#fdfdfc] dark:bg-[#050505] border-b border-border/40">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t.competitorsTitle}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor and benchmark against your rivals</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
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
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-[#fdfdfc] dark:bg-[#050505]">
          <div className="max-w-7xl mx-auto space-y-8">

            {/* Top Competitors Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {competitors.slice(0, 3).map((comp) => (
                <CompetitorCard
                  key={comp.id}
                  name={comp.name}
                  domain={comp.domain}
                  score={comp.visibility_score || 0}
                  overlap={comp.overlap}
                  strengths={comp.strengths}
                />
              ))}
              {competitors.length < 3 && (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border/40 rounded-xl bg-gray-50/50 dark:bg-[#1E1E24]/30 text-center">
                  <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mb-3">
                    <Plus className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-medium text-foreground">Add more competitors</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Track more rivals to get better insights.</p>
                </div>
              )}
            </div>

            {/* Detailed Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Detailed Comparison</h2>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search competitors..." className="pl-10 h-9 bg-white dark:bg-[#1E1E24] border-border/40" />
                </div>
              </div>

              <div className="rounded-xl border border-border/40 bg-white dark:bg-[#1E1E24] shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50/50 dark:bg-[#2A2A30]/50">
                    <TableRow className="hover:bg-transparent border-border/40">
                      <TableHead className="w-[250px]">{t.competitor}</TableHead>
                      <TableHead>{t.visibility}</TableHead>
                      <TableHead>Overlap</TableHead>
                      <TableHead>Avg. Pos</TableHead>
                      <TableHead>Trend</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {competitors.map((comp) => (
                      <TableRow key={comp.id} className="hover:bg-gray-50/50 dark:hover:bg-[#2A2A30]/50 border-border/40 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-md bg-secondary/50 flex items-center justify-center text-xs font-bold text-muted-foreground">
                              {comp.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{comp.name}</p>
                              <p className="text-xs text-muted-foreground">{comp.domain}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">{comp.visibility_score || 0}%</span>
                            <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${comp.visibility_score || 0}%` }} />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{comp.overlap}%</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono">#{comp.avgPosition}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <TrendingUp className="w-3 h-3" />
                            {comp.change}
                          </div>
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
                              <DropdownMenuItem>View Report</DropdownMenuItem>
                              <DropdownMenuItem>Compare Keywords</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">Stop Tracking</DropdownMenuItem>
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
