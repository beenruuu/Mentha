'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { UserAvatarMenu } from '@/components/user-avatar-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { 
    Loader2, 
    Globe, 
    Building2, 
    Plus,
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    Search,
    Brain,
    BarChart3
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useTranslations } from '@/lib/i18n'
import { fetchAPI } from '@/lib/api-client'
import { cn } from '@/lib/utils'

const INDUSTRIES = [
    'Technology',
    'E-commerce',
    'Healthcare',
    'Finance',
    'Education',
    'Real Estate',
    'Manufacturing',
    'Consulting',
    'Marketing',
    'Legal',
    'Travel',
    'Food & Beverage',
    'Entertainment',
    'Other'
]

interface AnalysisStep {
    id: string
    message: string
    status: 'pending' | 'running' | 'completed' | 'error'
}

export default function NewBrandPage() {
    const router = useRouter()
    const { toast } = useToast()
    const { t } = useTranslations()
    
    // Form state
    const [name, setName] = useState('')
    const [domain, setDomain] = useState('')
    const [industry, setIndustry] = useState('')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)
    const [fetchingMeta, setFetchingMeta] = useState(false)
    const [favicon, setFavicon] = useState('')
    
    // Analysis state
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysisProgress, setAnalysisProgress] = useState(0)
    const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>([
        { id: 'create', message: 'Creating brand profile...', status: 'pending' },
        { id: 'crawl', message: 'Crawling website...', status: 'pending' },
        { id: 'seo', message: 'Running SEO audit...', status: 'pending' },
        { id: 'aeo', message: 'Analyzing AI optimization...', status: 'pending' },
        { id: 'complete', message: 'Finalizing analysis...', status: 'pending' },
    ])

    const updateStepStatus = (id: string, status: AnalysisStep['status']) => {
        setAnalysisSteps(prev => prev.map(step => 
            step.id === id ? { ...step, status } : step
        ))
    }

    const handleDomainBlur = async () => {
        if (!domain) return
        
        setFetchingMeta(true)
        try {
            const url = domain.startsWith('http') ? domain : `https://${domain}`
            const data = await fetchAPI<{
                url: string
                domain: string
                title: string
                description: string
                favicon: string
            }>(`/utils/metadata?url=${encodeURIComponent(url)}`)
            
            if (!name && data.title) {
                setName(data.title)
            }
            if (!description && data.description) {
                setDescription(data.description)
            }
            if (data.favicon) {
                setFavicon(data.favicon)
            }
        } catch (err) {
            console.warn('Could not fetch metadata:', err)
        } finally {
            setFetchingMeta(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!name || !domain) {
            toast({
                title: 'Missing Information',
                description: 'Please provide at least a brand name and domain.',
                variant: 'destructive'
            })
            return
        }

        setIsAnalyzing(true)
        setAnalysisProgress(0)

        try {
            // Step 1: Create brand
            updateStepStatus('create', 'running')
            setAnalysisProgress(10)
            
            const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
            
            const brand = await fetchAPI<{ id: string }>('/brands/', {
                method: 'POST',
                body: JSON.stringify({
                    name,
                    domain: cleanDomain,
                    industry: industry || 'Other',
                    description: description || `${name} - ${industry || 'Business'}`
                })
            })
            
            updateStepStatus('create', 'completed')
            setAnalysisProgress(25)

            // Step 2: Website Crawl
            updateStepStatus('crawl', 'running')
            try {
                const fullUrl = domain.startsWith('http') ? domain : `https://${domain}`
                await fetchAPI('/page-analysis/analyze', {
                    method: 'POST',
                    body: JSON.stringify({
                        url: fullUrl,
                        analyze_headings: true,
                        analyze_extra_tags: true,
                        extract_links: true,
                        run_llm_analysis: false
                    })
                })
                updateStepStatus('crawl', 'completed')
            } catch {
                updateStepStatus('crawl', 'completed') // Continue even if fails
            }
            setAnalysisProgress(50)

            // Step 3: SEO Audit
            updateStepStatus('seo', 'running')
            try {
                await fetchAPI(`/technical-aeo/audit?domain=${encodeURIComponent(cleanDomain)}`)
                updateStepStatus('seo', 'completed')
            } catch {
                updateStepStatus('seo', 'completed')
            }
            setAnalysisProgress(75)

            // Step 4: AEO Analysis (runs in background via brand creation)
            updateStepStatus('aeo', 'running')
            await new Promise(resolve => setTimeout(resolve, 1000))
            updateStepStatus('aeo', 'completed')
            setAnalysisProgress(90)

            // Step 5: Complete
            updateStepStatus('complete', 'running')
            await new Promise(resolve => setTimeout(resolve, 500))
            updateStepStatus('complete', 'completed')
            setAnalysisProgress(100)

            toast({
                title: 'Brand Created!',
                description: 'Your brand has been added and analysis is running.',
            })

            // Redirect to brand dashboard
            setTimeout(() => {
                router.push(`/brand/${brand.id}`)
            }, 1000)

        } catch (err: any) {
            console.error('Failed to create brand:', err)
            toast({
                title: 'Error',
                description: err.message || 'Failed to create brand. Please try again.',
                variant: 'destructive'
            })
            setIsAnalyzing(false)
            
            // Reset steps
            setAnalysisSteps(prev => prev.map(step => ({
                ...step,
                status: step.status === 'running' ? 'error' : step.status
            })))
        }
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white dark:bg-black">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => router.back()}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <div className="flex-1" />
                    <UserAvatarMenu />
                </header>

                <div className="flex-1 p-4 md:p-6 lg:p-8 bg-[#f5f5f5] dark:bg-[#0A0A0A]">
                    <div className="max-w-2xl mx-auto">
                        {!isAnalyzing ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Plus className="h-5 w-5" />
                                        Add New Brand
                                    </CardTitle>
                                    <CardDescription>
                                        Add a new brand to track its AI visibility and SEO performance.
                                        Analysis will start automatically after creation.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        {/* Domain Input */}
                                        <div className="space-y-2">
                                            <Label htmlFor="domain">
                                                Website Domain <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="relative">
                                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="domain"
                                                    placeholder="example.com"
                                                    value={domain}
                                                    onChange={(e) => setDomain(e.target.value)}
                                                    onBlur={handleDomainBlur}
                                                    className="pl-10"
                                                    required
                                                />
                                                {fetchingMeta && (
                                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Brand Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="name">
                                                Brand Name <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="relative">
                                                {favicon && (
                                                    <img 
                                                        src={favicon} 
                                                        alt="" 
                                                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded"
                                                    />
                                                )}
                                                <Input
                                                    id="name"
                                                    placeholder="Acme Corp"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className={favicon ? "pl-10" : ""}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Industry */}
                                        <div className="space-y-2">
                                            <Label htmlFor="industry">Industry</Label>
                                            <Select value={industry} onValueChange={setIndustry}>
                                                <SelectTrigger>
                                                    <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                                                    <SelectValue placeholder="Select industry" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {INDUSTRIES.map((ind) => (
                                                        <SelectItem key={ind} value={ind}>
                                                            {ind}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Description */}
                                        <div className="space-y-2">
                                            <Label htmlFor="description">Description (optional)</Label>
                                            <Textarea
                                                id="description"
                                                placeholder="Brief description of the brand..."
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                rows={3}
                                            />
                                        </div>

                                        <Button type="submit" className="w-full" disabled={loading}>
                                            {loading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Creating...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="mr-2 h-4 w-4" />
                                                    Create Brand & Start Analysis
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        ) : (
                            /* Analysis Progress View */
                            <Card>
                                <CardHeader className="text-center">
                                    <div className="relative w-20 h-20 mx-auto mb-4">
                                        <div className="absolute inset-0 border-4 border-primary/30 rounded-full animate-ping opacity-20"></div>
                                        <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                                        </div>
                                    </div>
                                    <CardTitle>Setting up {name || 'your brand'}</CardTitle>
                                    <CardDescription>
                                        Running initial analysis...
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Progress bar */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Progress</span>
                                            <span className="text-primary font-medium">{analysisProgress}%</span>
                                        </div>
                                        <Progress value={analysisProgress} className="h-2" />
                                    </div>

                                    {/* Steps */}
                                    <div className="space-y-3">
                                        {analysisSteps.map((step) => (
                                            <div
                                                key={step.id}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-lg transition-all",
                                                    step.status === 'running' && "bg-primary/10 border border-primary/20",
                                                    step.status === 'completed' && "bg-green-500/5",
                                                    step.status === 'error' && "bg-red-500/10",
                                                    step.status === 'pending' && "opacity-50"
                                                )}
                                            >
                                                {step.status === 'completed' ? (
                                                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                                                ) : step.status === 'running' ? (
                                                    <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
                                                ) : step.status === 'error' ? (
                                                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                                                ) : (
                                                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                                                )}
                                                <span className={cn(
                                                    "text-sm",
                                                    step.status === 'running' && "font-medium",
                                                    step.status === 'completed' && "text-green-600 dark:text-green-400",
                                                    step.status === 'error' && "text-red-600"
                                                )}>
                                                    {step.message}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <p className="text-xs text-center text-muted-foreground">
                                        Detailed analysis will continue in the background.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
