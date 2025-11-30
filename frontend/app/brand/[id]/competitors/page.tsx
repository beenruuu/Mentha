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
import { Users, Plus, Search, Globe, Loader2, ExternalLink, Trash2 } from 'lucide-react'
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

export default function BrandCompetitorsPage() {
    const params = useParams<{ id: string }>()
    const brandId = params?.id
    const { t } = useTranslations()
    const [brand, setBrand] = useState<Brand | null>(null)
    const [competitors, setCompetitors] = useState<Competitor[]>([])
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
            setCompetitors(competitorsData)
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
                similarity_score: 0 // Default
            })

            toast({
                title: "Competitor added",
                description: `${newCompetitorName} has been added to tracking`,
            })

            setNewCompetitorName('')
            setNewCompetitorDomain('')
            setIsDialogOpen(false)
            loadData() // Reload list
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
                    icon={<Users className="h-5 w-5 text-emerald-600" />}
                    title={t.competition}
                />

                <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 bg-[#f5f5f5] dark:bg-[#0A0A0A]">
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Link href={`/brand/${brandId}`}>{renderBrandBadge()}</Link>
                            <span className="text-gray-400 dark:text-gray-600">/</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">{t.competition}</span>
                        </div>
                        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">{t.competition}</h1>
                        <p className="text-gray-600 dark:text-gray-400">Monitor your competitors' performance and strategies.</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <Card className="bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
                            <CardHeader className="pb-2">
                                <CardDescription className="text-gray-500 dark:text-gray-400">Tracked Competitors</CardDescription>
                                <CardTitle className="text-3xl text-gray-900 dark:text-white">{competitors.length}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Active tracking
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
                            <CardHeader className="pb-2">
                                <CardDescription className="text-gray-500 dark:text-gray-400">Avg. Visibility Score</CardDescription>
                                <CardTitle className="text-3xl text-emerald-600">
                                    {competitors.length > 0
                                        ? Math.round(competitors.reduce((acc, c) => acc + (c.visibility_score || 0), 0) / competitors.length)
                                        : 0}%
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Across AI platforms
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
                            <CardHeader className="pb-2">
                                <CardDescription className="text-gray-500 dark:text-gray-400">Overlap</CardDescription>
                                <CardTitle className="text-3xl text-gray-900 dark:text-white">High</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Keyword overlap
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Competitors List */}
                    <Card className="w-full bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <CardTitle className="text-gray-900 dark:text-white">Competitors List</CardTitle>
                                    <CardDescription className="text-gray-500 dark:text-gray-400">
                                        Manage your direct and indirect competitors
                                    </CardDescription>
                                </div>
                                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="ml-0 md:ml-auto">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Competitor
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add New Competitor</DialogTitle>
                                            <DialogDescription>
                                                Enter the details of the competitor you want to track.
                                            </DialogDescription>
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
                                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button onClick={handleAddCompetitor}>
                                                Add
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Competitor</TableHead>
                                            <TableHead>Domain</TableHead>
                                            <TableHead>Visibility Score</TableHead>
                                            <TableHead>Overlap</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {competitors.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                                                    No competitors tracked. Add one to start monitoring.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            competitors.map((comp) => (
                                                <TableRow key={comp.id}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-3">
                                                            {comp.favicon || comp.domain ? (
                                                                <img
                                                                    src={comp.favicon || `https://www.google.com/s2/favicons?domain=${comp.domain}&sz=64`}
                                                                    alt={`${comp.name} logo`}
                                                                    className="w-8 h-8 rounded-lg object-contain bg-gray-100 dark:bg-[#1E1E24] p-1"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                                    }}
                                                                />
                                                            ) : null}
                                                            <div className={`w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#1E1E24] flex items-center justify-center text-xs font-bold ${comp.favicon || comp.domain ? 'hidden' : ''}`}>
                                                                {comp.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            {comp.name}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <a href={comp.domain.startsWith('http') ? comp.domain : `https://${comp.domain}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                                                            {comp.domain}
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className="text-gray-500">
                                                            {comp.visibility_score && comp.visibility_score > 0
                                                                ? `${comp.visibility_score}%`
                                                                : '—'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-gray-400">—</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50">
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
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
