'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TrendingUp, TrendingDown, Plus, Search, Loader2, Minus, Filter, ArrowUpDown, MoreHorizontal, Image as ImageIcon, Video, MapPin, ShoppingBag, Newspaper, Zap } from 'lucide-react'
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
import { brandsService, Brand } from '@/lib/services/brands'
import Link from 'next/link'
import { BrandKeywordsPageSkeleton } from '@/components/skeletons'
import { Sparkline } from '@/components/ui/sparkline'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface KeywordDisplay extends Keyword {
    estimatedPosition?: number;
    derivedTrend: 'up' | 'down' | 'neutral';
    hasMentions: boolean;
    trendData: number[];
    serpFeatures: string[];
}

export default function BrandKeywordsPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
    const params = useParams<{ id: string }>()
    const brandId = params?.id
    const { t } = useTranslations()
    const [brand, setBrand] = useState<Brand | null>(null)
    const [keywords, setKeywords] = useState<KeywordDisplay[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        total: 0,
        avgVisibility: 0,
        top3: 0,
        improvements: 0
    })
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [newKeyword, setNewKeyword] = useState('')
    const { toast } = useToast()

    useEffect(() => {
        if (brandId) {
            loadData()
        }
    }, [brandId])

    const loadData = async () => {
        try {
            setLoading(true)
            const [brandData, keywordsData] = await Promise.all([
                brandsService.getById(brandId!),
                keywordsService.getAll(brandId!)
            ])
            const keywordsWithVisibility = keywordsData.filter(k => (k.ai_visibility_score || 0) > 0)
            const avgVisibility = keywordsWithVisibility.length > 0
                ? Math.round(keywordsWithVisibility.reduce((acc, k) => acc + (k.ai_visibility_score || 0), 0) / keywordsWithVisibility.length)
                : 0
            const top3 = 0
            const improvements = keywordsData.filter(k => {
                const score = k.ai_visibility_score || 0
                return score > 0 && score < 50
            }).length

            const total = keywordsData.length
            setStats({ total, avgVisibility, top3, improvements })
        } catch (error) {
            console.error('Failed to load data:', error)
            toast({
                title: t.errorTitle,
                description: "Failed to load brand data",
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
                brand_id: brandId,
                tracked: true
            })

            toast({
                title: t.keywordAdded,
                description: t.keywordAddedToTracking.replace('{keyword}', newKeyword),
            })

            setNewKeyword('')
            setIsDialogOpen(false)
            loadData()
        } catch (error) {
            toast({
                title: t.errorTitle,
                description: "Failed to add keyword",
                variant: 'destructive',
            })
        }
    }

    const getSerpIcon = (feature: string) => {
        switch (feature) {
            case 'image': return <ImageIcon className="w-3 h-3" />
            case 'video': return <Video className="w-3 h-3" />
            case 'local': return <MapPin className="w-3 h-3" />
            case 'shopping': return <ShoppingBag className="w-3 h-3" />
            case 'news': return <Newspaper className="w-3 h-3" />
            case 'ai_overview': return <Zap className="w-3 h-3 text-amber-500" />
            default: return null
        }
    }

    if (!brandId) return null

    if (loading && !brand) {
        return <BrandKeywordsPageSkeleton />
    }

    const Content = () => {
        const InnerContent = () => (
            <div className={isEmbedded ? "space-y-8" : "p-8 max-w-7xl mx-auto space-y-8"}>
                {/* Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 border-gray-200 dark:border-gray-800 shadow-sm">
                        <CardContent className="p-6">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t.trackedKeywords}</p>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border-emerald-100 dark:border-emerald-900/20 shadow-sm">
                        <CardContent className="p-6">
                            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-2">{t.averageVisibility}</p>
                            <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                                {stats.avgVisibility > 0 ? `${stats.avgVisibility}%` : '—'}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white dark:bg-[#161619] border-gray-200 dark:border-[#2A2A30] shadow-sm">
                        <CardContent className="p-6">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t.top3Positions}</p>
                            <div className="text-3xl font-bold text-gray-400 dark:text-gray-600">—</div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Requires SERP integration</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white dark:bg-[#161619] border-gray-200 dark:border-[#2A2A30] shadow-sm">
                        <CardContent className="p-6">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t.potentialImprovements}</p>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                {stats.improvements > 0 ? stats.improvements : '—'}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <Card className="border border-gray-200 dark:border-[#2A2A30] shadow-sm bg-white dark:bg-[#161619] overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-[#2A2A30] flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder={t.searchKeywords}
                                className="pl-9 bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-gray-800 focus:bg-white dark:focus:bg-black/40 transition-colors"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="h-9 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                                <Filter className="w-4 h-4 mr-2" />
                                Filter
                            </Button>
                            <Button variant="outline" size="sm" className="h-9 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                                <ArrowUpDown className="w-4 h-4 mr-2" />
                                Sort
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/50 dark:bg-white/5">
                                <TableRow className="hover:bg-transparent border-gray-200 dark:border-white/5">
                                    <TableHead className="w-[300px]">{t.keyword}</TableHead>
                                    <TableHead>{t.volume}</TableHead>
                                    <TableHead className="w-[150px]">{t.difficulty}</TableHead>
                                    <TableHead>{t.aiVisibility}</TableHead>
                                    <TableHead>SERP Features</TableHead>
                                    <TableHead>{t.trend}</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {keywords.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-gray-500 dark:text-gray-400">
                                            No keywords found. Add some keywords to start tracking.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    keywords.map((kw) => (
                                        <TableRow key={kw.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 border-gray-200 dark:border-white/5 transition-colors">
                                            <TableCell className="font-medium text-gray-900 dark:text-white">{kw.keyword}</TableCell>
                                            <TableCell className="text-gray-600 dark:text-gray-400">{kw.search_volume?.toLocaleString() || '-'}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-gray-500 dark:text-gray-400">KD</span>
                                                        <span className={`font-medium ${(kw.difficulty || 0) >= 70 ? 'text-red-600 dark:text-red-400' :
                                                            (kw.difficulty || 0) >= 40 ? 'text-amber-600 dark:text-amber-400' :
                                                                'text-emerald-600 dark:text-emerald-400'
                                                            }`}>{kw.difficulty || 0}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${(kw.difficulty || 0) >= 70 ? 'bg-red-500' :
                                                                (kw.difficulty || 0) >= 40 ? 'bg-amber-500' :
                                                                    'bg-emerald-500'
                                                                }`}
                                                            style={{ width: `${kw.difficulty || 0}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-emerald-500"
                                                            style={{ width: `${kw.ai_visibility_score || 0}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{kw.ai_visibility_score ? `${Math.round(kw.ai_visibility_score)}%` : '-'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <TooltipProvider>
                                                        {kw.serpFeatures.map((feature, i) => (
                                                            <Tooltip key={i}>
                                                                <TooltipTrigger asChild>
                                                                    <div className="p-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                                                                        {getSerpIcon(feature)}
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p className="capitalize">{feature.replace('_', ' ')}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        ))}
                                                    </TooltipProvider>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="w-24 h-8">
                                                    <Sparkline data={kw.trendData} color={
                                                        kw.derivedTrend === 'up' ? '#10b981' :
                                                            kw.derivedTrend === 'down' ? '#ef4444' : '#6b7280'
                                                    } />
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900 dark:hover:text-white">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem>View Analysis</DropdownMenuItem>
                                                        <DropdownMenuItem>Refresh Data</DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-red-600">Stop Tracking</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
        )

        if (isEmbedded) {
            return <InnerContent />
        }

        return (
            <div className="bg-[#FAFAFA] dark:bg-[#09090b] h-full flex flex-col h-screen overflow-hidden">
                <header className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 shrink-0">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger className="-ml-1" />
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-gray-800 flex items-center justify-center overflow-hidden shadow-sm">
                            <img
                                src={`https://www.google.com/s2/favicons?domain=${brand?.domain}&sz=64`}
                                alt={brand?.name || ''}
                                className="w-5 h-5 object-contain"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement!.innerText = brand?.name.charAt(0).toUpperCase() || '';
                                }}
                            />
                        </div>
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">{t.keywordsAI}</h1>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20">
                                <Plus className="mr-2 h-4 w-4" />
                                <span className="hidden md:inline">{t.addKeyword}</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{t.addNewKeyword}</DialogTitle>
                                <DialogDescription>{t.enterKeywordToTrack}</DialogDescription>
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
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t.cancel}</Button>
                                <Button onClick={handleAddKeyword}>{t.add}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </header>

                <main className="flex-1 bg-white dark:bg-black rounded-tl-3xl border-t border-l border-gray-200 dark:border-[#2A2A30] overflow-y-auto shadow-sm relative z-10">
                    <InnerContent />
                </main>
            </div>
        )
    }

    if (isEmbedded) {
        return <Content />
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-[#FAFAFA] dark:bg-[#09090b] h-screen overflow-hidden flex flex-col">
                <Content />
            </SidebarInset>
        </SidebarProvider>
    )
}
