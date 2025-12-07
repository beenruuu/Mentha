'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare, Plus, Calendar, Copy, Loader2, Search, Filter, ArrowUpDown, MoreHorizontal } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { UserAvatarMenu } from "@/components/layout/user-avatar-menu"
import { useTranslations } from '@/lib/i18n'
import { brandsService, type Brand } from '@/lib/services/brands'
import { analysisService, type Analysis } from '@/lib/services/analysis'
import { queriesService, type Query } from '@/lib/services/queries'
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function BrandQueriesPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const params = useParams<{ id: string }>()
  const brandId = params?.id
  const { t } = useTranslations()
  const [brand, setBrand] = useState<Brand | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [queries, setQueries] = useState<Query[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!brandId) return

    const fetchData = async () => {
      try {
        setLoading(true)
        const [brandResponse, analyses, queriesData] = await Promise.all([
          brandsService.getById(brandId),
          analysisService.getAll(brandId),
          queriesService.getAll(brandId)
        ])
        setBrand(brandResponse)
        setQueries(queriesData)

        const latestAnalysis = [...analyses]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        setAnalysis(latestAnalysis ?? null)
      } catch (error) {
        console.error('Failed to load query insights:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [brandId])

  const filteredQueries = useMemo(() => {
    return queries.filter(q =>
      q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.question.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [queries, searchTerm])

  const stats = useMemo(() => {
    if (queries.length === 0) {
      return { total: 0, highPriority: 0, categories: 0, weekly: 0 }
    }
    const categories = new Set(queries.map((q) => q.category))
    return {
      total: queries.length,
      highPriority: queries.filter((q) => q.priority === 'high').length,
      categories: categories.size,
      weekly: queries.filter((q) => q.frequency === 'weekly').length,
    }
  }, [queries])

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      console.error('Failed to copy query', error)
    }
  }

  if (!brandId) return null

  const Content = () => (
    <div className={`bg-[#fdfdfc] dark:bg-[#050505] h-full flex flex-col ${isEmbedded ? '' : 'h-screen overflow-hidden'}`}>
      {/* Header - Only show if NOT embedded */}
      {!isEmbedded && (
        <header className="flex items-center justify-between px-8 py-6 bg-[#fdfdfc] dark:bg-[#050505] border-b border-border/40">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-1" />
            <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-800 border border-border/50 flex items-center justify-center overflow-hidden shadow-sm">
              <img
                src={`https://www.google.com/s2/favicons?domain=${brand?.domain}&sz=64`}
                alt={brand?.name || ''}
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerText = brand?.name.charAt(0).toUpperCase() || '';
                }}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t.queries}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Strategic queries for AI optimization</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              {t.newQuery}
            </Button>
            <UserAvatarMenu />
          </div>
        </header>
      )}

      <main className={`flex-1 overflow-y-auto p-8 bg-[#fdfdfc] dark:bg-[#050505] ${isEmbedded ? '' : ''}`}>
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-card/50 backdrop-blur-sm border-border/40 shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground mb-2">{t.totalQueries}</p>
                <div className="text-3xl font-bold text-foreground">{stats.total}</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm border-border/40 shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground mb-2">{t.activeQueries}</p>
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.highPriority}</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm border-border/40 shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground mb-2">{t.categories}</p>
                <div className="text-3xl font-bold text-foreground">{stats.categories}</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm border-border/40 shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground mb-2">{t.weekly}</p>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.weekly}</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="p-4 border-b border-border/40 flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search queries..."
                  className="pl-9 bg-white dark:bg-zinc-900/50 border-border/40"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-9 border-border/40">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm" className="h-9 border-border/40">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  Sort
                </Button>
              </div>
            </div>

            <div className="rounded-md border-border/40">
              <Table>
                <TableHeader className="bg-secondary/30">
                  <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead className="w-[300px]">Query</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQueries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No queries found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredQueries.map((query) => (
                      <TableRow key={query.id} className="hover:bg-secondary/20 border-border/40 transition-colors">
                        <TableCell className="font-medium">
                          <div>
                            <div className="text-sm font-semibold text-foreground">{query.title}</div>
                            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{query.question}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                            {query.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${query.priority === 'high' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' :
                            query.priority === 'medium' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800' :
                              'bg-secondary text-muted-foreground'
                            }`}>
                            {query.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3 mr-1.5" />
                            {query.frequency}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleCopy(query.question)}>
                              <Copy className="w-4 h-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleCopy(query.question)}>
                                  Copy Query
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Edit Query</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">Delete Query</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )

  if (loading || !brand) {
    if (isEmbedded) {
      return (
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )
    }
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex items-center justify-center h-screen bg-[#fdfdfc] dark:bg-[#050505]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (isEmbedded) {
    return <Content />
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#fdfdfc] dark:bg-[#050505] h-screen overflow-hidden flex flex-col">
        <Content />
      </SidebarInset>
    </SidebarProvider>
  )
}