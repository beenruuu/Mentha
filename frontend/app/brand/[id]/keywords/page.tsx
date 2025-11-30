'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { PageHeader } from "@/components/layout/page-header"
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TrendingUp, TrendingDown, Plus, Search, Loader2, Minus } from 'lucide-react'
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

// Extended interface for UI display - note that position, mentions, and trend are derived
interface KeywordDisplay extends Keyword {
    estimatedPosition?: number;
    derivedTrend: 'up' | 'down' | 'neutral';
    hasMentions: boolean;
}

export default function BrandKeywordsPage() {
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

            setBrand(brandData)

            // Map backend data to UI format
            // Note: We only show real data. Fields with 0 indicate "no data available"
            const mappedData: KeywordDisplay[] = keywordsData.map(k => {
                // Only consider visibility scores > 0 as having real data
                const hasRealVisibilityData = (k.ai_visibility_score || 0) > 0
                const hasRealVolumeData = (k.search_volume || 0) > 0

                return {
                    ...k,
                    // Don't estimate positions - only show if we have real ranking data
                    estimatedPosition: undefined, // TODO: Get real SERP position data
                    // Trend requires historical data comparison
                    derivedTrend: 'neutral' as const, // TODO: Calculate from real historical data
                    // Only mark as having mentions if we actually measured it
                    hasMentions: hasRealVisibilityData
                }
            })
            setKeywords(mappedData)

            // Calculate stats - only counting keywords with REAL data
            const total = keywordsData.length
            // Only count visibility if we have real measurements
            const keywordsWithVisibility = keywordsData.filter(k => (k.ai_visibility_score || 0) > 0)
            const avgVisibility = keywordsWithVisibility.length > 0
                ? Math.round(keywordsWithVisibility.reduce((acc, k) => acc + (k.ai_visibility_score || 0), 0) / keywordsWithVisibility.length)
                : 0
            // We can't determine "top 3" without real ranking data
            const top3 = 0 // TODO: Requires SERP tracking integration
            // Improvement opportunities based on real low visibility scores
            const improvements = keywordsData.filter(k => {
                const score = k.ai_visibility_score || 0
                return score > 0 && score < 50
            }).length

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

    const getDifficultyColor = (difficulty: number | undefined) => {
        if (!difficulty && difficulty !== 0) return 'text-gray-600'
        if (difficulty >= 70) return 'text-red-600'
        if (difficulty >= 50) return 'text-orange-600'
        return 'text-green-600'
    }

    const getVisibilityColor = (score: number | undefined) => {
        if (!score && score !== 0) return 'text-gray-600'
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
                brand_id: brandId,
                tracked: true
            })

            toast({
                title: t.keywordAdded,
                description: t.keywordAddedToTracking.replace('{keyword}', newKeyword),
            })

            setNewKeyword('')
            setIsDialogOpen(false)
            loadData() // Reload list
        } catch (error) {
            toast({
                title: t.errorTitle,
                description: "Failed to add keyword",
                variant: 'destructive',
            })
        }
    }

    const renderBrandBadge = () => {
        if (!brand) return null
        return (
            <Badge
                variant="secondary"
                className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-[#0A0A0F]"
            >
                <div className="w-3.5 h-3.5 bg-emerald-600 rounded-full flex items-center justify-center text-[8px] font-bold text-white">
                    {brand.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium">{brand.name}</span>
            </Badge>
        )
    }

    if (!brandId) return null

    if (loading && !brand) {
        return (
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                    </div>
                </SidebarInset>
            </SidebarProvider>
        )
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <PageHeader
                    icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
                    title={t.keywordsAI}
                />

                <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 bg-[#f5f5f5] dark:bg-[#0A0A0A]">
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Link href={`/brand/${brandId}`}>{renderBrandBadge()}</Link>
                            <span className="text-gray-400 dark:text-gray-600">/</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">{t.keywordsAI}</span>
                        </div>
                        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">{t.keywordsTitle}</h1>
                        <p className="text-gray-600 dark:text-gray-400">{t.trackKeywordPerformance}</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
                            <CardHeader className="pb-2">
                                <CardDescription className="text-gray-500 dark:text-gray-400">{t.trackedKeywords}</CardDescription>
                                <CardTitle className="text-3xl text-gray-900 dark:text-white">{stats.total}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {t.trackedKeywords || 'Keywords tracked'}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
                            <CardHeader className="pb-2">
                                <CardDescription className="text-gray-500 dark:text-gray-400">{t.averageVisibility}</CardDescription>
                                <CardTitle className="text-3xl text-emerald-600">
                                    {stats.avgVisibility > 0 ? `${stats.avgVisibility}%` : '—'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {stats.avgVisibility > 0 ? 'Based on AI visibility checks' : 'Requires AI visibility measurement'}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
                            <CardHeader className="pb-2">
                                <CardDescription className="text-gray-500 dark:text-gray-400">{t.top3Positions}</CardDescription>
                                <CardTitle className="text-3xl text-gray-400">—</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Requires SERP tracking integration
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
                            <CardHeader className="pb-2">
                                <CardDescription className="text-gray-500 dark:text-gray-400">{t.potentialImprovements}</CardDescription>
                                <CardTitle className="text-3xl text-gray-900 dark:text-white">
                                    {stats.improvements > 0 ? stats.improvements : '—'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {stats.improvements > 0 ? t.opportunitiesIdentified : 'Based on visibility analysis'}
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
                                                        <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                                                            No keywords found. Add some keywords or run an analysis to discover them.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    keywords.map((kw) => (
                                                        <TableRow key={kw.id}>
                                                            <TableCell className="font-medium">{kw.keyword}</TableCell>
                                                            <TableCell>{kw.search_volume?.toLocaleString() || '-'}</TableCell>
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
                                                                <Badge variant={kw.estimatedPosition && kw.estimatedPosition <= 3 ? 'default' : 'secondary'}>
                                                                    {kw.estimatedPosition ? `#${kw.estimatedPosition}` : '-'}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex gap-1">
                                                                    {kw.hasMentions && (
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
                                                                    {!kw.hasMentions && <span className="text-gray-400 text-xs">-</span>}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                {kw.derivedTrend === 'up' ? (
                                                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                                                ) : kw.derivedTrend === 'down' ? (
                                                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                                                ) : (
                                                                    <Minus className="h-4 w-4 text-gray-400" />
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
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
