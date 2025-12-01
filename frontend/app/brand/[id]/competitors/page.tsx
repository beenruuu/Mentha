'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Users, Plus, Search, Globe, Loader2, ExternalLink, Trash2, TrendingUp, ArrowRight, BarChart3, ArrowUpRight } from 'lucide-react'
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
import { brandsService, Brand } from '@/lib/services/brands'
import Link from 'next/link'
import { BrandCompetitorsPageSkeleton } from '@/components/skeletons'
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
import { Progress } from "@/components/ui/progress"

interface CompetitorDisplay extends Competitor {
    overlapScore: number;
    trend: 'up' | 'down' | 'neutral';
}

export default function BrandCompetitorsPage() {
    const params = useParams<{ id: string }>()
    const brandId = params?.id
    const { t } = useTranslations()
    const [brand, setBrand] = useState<Brand | null>(null)
    const [competitors, setCompetitors] = useState<CompetitorDisplay[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [newCompetitorName, setNewCompetitorName] = useState('')
    const [newCompetitorDomain, setNewCompetitorDomain] = useState('')
    const { toast } = useToast()

    useEffect(() => {
        if (brandId) {
            loadData()
        }
    }, [brandId])

    const loadData = async () => {
        try {
            setLoading(true)
            const [brandData, competitorsData] = await Promise.all([
                brandsService.getById(brandId!),
                competitorsService.getAll(brandId!)
            ])

            setBrand(brandData)

            const mappedCompetitors = competitorsData.map(c => ({
                ...c,
                overlapScore: c.similarity_score || 0,
                trend: 'neutral' as const
            }))
            setCompetitors(mappedCompetitors)
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

    const handleAddCompetitor = async () => {
        if (!newCompetitorName.trim() || !newCompetitorDomain.trim()) {
            toast({
                title: t.errorTitle,
                description: "Please enter both name and domain",
                variant: 'destructive',
            })
            return
        }

        try {
            await competitorsService.create({
                brand_id: brandId!,
                name: newCompetitorName,
                domain: newCompetitorDomain,
                similarity_score: 0
            })

            toast({
                title: "Competitor added",
                description: `${newCompetitorName} has been added to tracking`,
            })

            setNewCompetitorName('')
            setNewCompetitorDomain('')
            setIsDialogOpen(false)
            loadData()
        } catch (error) {
            toast({
                title: t.errorTitle,
                description: "Failed to add competitor",
                variant: 'destructive',
            })
        }
    }

    const handleDeleteCompetitor = async (id: string) => {
        try {
            await competitorsService.delete(id)
            toast({
                title: "Competitor deleted",
                description: "Competitor has been removed from tracking",
            })
            loadData()
        } catch (error) {
            toast({
                title: t.errorTitle,
                description: "Failed to delete competitor",
                variant: 'destructive',
            })
        }
    }

    if (!brandId) return null

    if (loading && !brand) {
        return <BrandCompetitorsPageSkeleton />
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-[#FAFAFA] dark:bg-[#09090b] h-screen overflow-hidden flex flex-col">
                {/* Header */}
                <header className="flex items-center justify-between px-6 py-4 shrink-0">
                    <div className="flex items-center gap-4">
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
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">{t.competition}</h1>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Competitor
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Competitor</DialogTitle>
                                <DialogDescription>Enter the details of the competitor you want to track.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Competitor Inc."
                                        value={newCompetitorName}
                                        onChange={(e) => setNewCompetitorName(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="domain">Domain</Label>
                                    <Input
                                        id="domain"
                                        placeholder="e.g. competitor.com"
                                        value={newCompetitorDomain}
                                        onChange={(e) => setNewCompetitorDomain(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleAddCompetitor}>Add</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </header>

                <main className="flex-1 bg-white dark:bg-black rounded-tl-3xl border-t border-l border-gray-200 dark:border-[#2A2A30] overflow-y-auto shadow-2xl relative z-10">
                    <div className="p-8 max-w-7xl mx-auto space-y-8">

                        {/* Stats Cards */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-100 dark:border-blue-900/20 shadow-sm">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                            <Users className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{competitors.length}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Tracked Competitors</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border-emerald-100 dark:border-emerald-900/20 shadow-sm">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                            <BarChart3 className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {competitors.length > 0
                                            ? Math.round(competitors.reduce((acc, c) => acc + (c.visibility_score || 0), 0) / competitors.length)
                                            : 0}%
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Visibility Score</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-white dark:bg-[#161619] border-gray-200 dark:border-[#2A2A30] shadow-sm">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                            <ArrowUpRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <div className="text-3xl font-bold text-gray-900 dark:text-white">High</div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Keyword Overlap</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Head-to-Head Preview */}
                        {competitors.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {competitors.slice(0, 3).map((comp) => (
                                    <Card key={comp.id} className="bg-white dark:bg-[#161619] border-gray-200 dark:border-[#2A2A30] shadow-sm hover:border-emerald-500/30 hover:shadow-md transition-all group">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                                                        <img
                                                            src={`https://www.google.com/s2/favicons?domain=${comp.domain}&sz=64`}
                                                            alt={comp.name}
                                                            className="w-5 h-5 object-contain"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                e.currentTarget.parentElement!.innerText = comp.name.charAt(0).toUpperCase();
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">{comp.name}</CardTitle>
                                                        <CardDescription className="text-xs text-gray-500 dark:text-gray-400">{comp.domain}</CardDescription>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                                                    {comp.visibility_score ? `${comp.visibility_score}%` : '-'}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4 mt-2">
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-gray-500 dark:text-gray-400">Keyword Overlap</span>
                                                        <span className="font-medium text-gray-900 dark:text-white">{comp.overlapScore}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500 rounded-full"
                                                            style={{ width: `${comp.overlapScore}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="pt-2 flex justify-end">
                                                    <Button variant="ghost" size="sm" className="text-xs h-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                                                        Full Analysis <ArrowRight className="w-3 h-3 ml-1" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {/* Competitors List */}
                        <Card className="border border-gray-200 dark:border-[#2A2A30] shadow-sm bg-white dark:bg-[#161619] overflow-hidden">
                            <CardHeader className="border-b border-gray-200 dark:border-[#2A2A30] bg-gray-50/30 dark:bg-white/5">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Detailed Comparison</CardTitle>
                                        <CardDescription className="text-gray-500 dark:text-gray-400">
                                            Manage your direct and indirect competitors
                                        </CardDescription>
                                    </div>
                                    <div className="relative w-full md:w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Search competitors..."
                                            className="pl-9 bg-white dark:bg-black/20 border-gray-200 dark:border-gray-800 focus:bg-white dark:focus:bg-black/40 transition-colors"
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-gray-50/50 dark:bg-white/5">
                                        <TableRow className="hover:bg-transparent border-gray-200 dark:border-white/5">
                                            <TableHead className="w-[300px]">Competitor</TableHead>
                                            <TableHead>Visibility</TableHead>
                                            <TableHead className="w-[200px]">Overlap</TableHead>
                                            <TableHead>Trend</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {competitors.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-12 text-gray-500 dark:text-gray-400">
                                                    No competitors tracked. Add one to start monitoring.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            competitors.map((comp) => (
                                                <TableRow key={comp.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 border-gray-200 dark:border-white/5 transition-colors">
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-gray-800 flex items-center justify-center overflow-hidden shadow-sm">
                                                                <img
                                                                    src={`https://www.google.com/s2/favicons?domain=${comp.domain}&sz=64`}
                                                                    alt={comp.name}
                                                                    className="w-4 h-4 object-contain"
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.display = 'none';
                                                                        e.currentTarget.parentElement!.innerText = comp.name.charAt(0).toUpperCase();
                                                                    }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-gray-900 dark:text-white">{comp.name}</div>
                                                                <a href={`https://${comp.domain}`} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 dark:text-gray-400 hover:text-emerald-600 flex items-center gap-1 transition-colors">
                                                                    {comp.domain} <ExternalLink className="w-2.5 h-2.5" />
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-16 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-emerald-500"
                                                                    style={{ width: `${comp.visibility_score || 0}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-sm font-medium text-gray-900 dark:text-white">{comp.visibility_score || 0}%</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-medium w-8 text-right text-gray-600 dark:text-gray-400">{comp.overlapScore}%</span>
                                                            <Progress value={comp.overlapScore} className="h-1.5 flex-1" />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {comp.trend === 'up' ? (
                                                            <div className="flex items-center text-emerald-600 text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full w-fit">
                                                                <TrendingUp className="w-3 h-3 mr-1" />
                                                                Rising
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center text-gray-500 text-xs font-medium bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full w-fit">
                                                                <TrendingUp className="w-3 h-3 mr-1 rotate-90" />
                                                                Stable
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Delete Competitor?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Are you sure you want to stop tracking {comp.name}? This action cannot be undone.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDeleteCompetitor(comp.id)} className="bg-red-600 hover:bg-red-700">
                                                                        Delete
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
