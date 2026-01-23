'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import {
    FileText,
    Code,
    Copy,
    Check,
    ArrowRight,
    AlertCircle,
    Zap,
    CheckCircle2,
    Globe,
    Search,
    Bot,
    ExternalLink,
    Sparkles,
    BarChart3,
    Lightbulb,
    RefreshCw,
    FileCode,
    AlertTriangle,
    Clock
} from 'lucide-react'
import { toast } from 'sonner'
import { getTranslations, getLanguage, type Language } from '@/lib/i18n'
import { siteAuditService, type SiteAudit, type PageFinding, type Recommendation } from '@/features/optimization/api/site-audit'

interface OptimizeTabProps {
    brandId: string
    brandName: string
    domain: string
    industry?: string
    recommendations?: Recommendation[]
}

/**
 * OptimizeTab - AEO/GEO Optimization Dashboard
 * 
 * Features:
 * - Real data from /site-audit API using Firecrawl
 * - Contextual recommendations based on actual site analysis
 * - i18n support (es/en)
 * - Consistent monochrome icons
 */
export function OptimizeTab({
    brandId,
    brandName,
    domain,
    industry,
    recommendations
}: OptimizeTabProps) {
    const [subTab, setSubTab] = useState('audit')
    const [copied, setCopied] = useState<string | null>(null)
    const [analyzing, setAnalyzing] = useState(false)
    const [audit, setAudit] = useState<SiteAudit | null>(null)
    const [loading, setLoading] = useState(true)

    const [lang, setLang] = useState<Language>('es')
    const t = getTranslations(lang)

    useEffect(() => {
        setLang(getLanguage())
    }, [])

    // Merge recommendations from audit and props
    const allRecommendations = React.useMemo(() => {
        const auditRecs = audit?.recommendations || []
        const propRecs = recommendations || []
        
        // Merge and deduplicate by title
        const merged = [...auditRecs]
        propRecs.forEach(pr => {
            if (!merged.some(m => m.title === pr.title)) {
                merged.push(pr)
            }
        })
        
        return merged
    }, [audit?.recommendations, recommendations])

    // Load latest audit on mount
    const loadLatestAudit = useCallback(async () => {
        try {
            const data = await siteAuditService.getLatestAudit(brandId)
            if (data) {
                setAudit(data)
                if (data.status === 'processing') {
                    setAnalyzing(true)
                }
            }
        } catch (error) {
            console.error('Error loading audit:', error)
        } finally {
            setLoading(false)
        }
    }, [brandId])

    useEffect(() => {
        loadLatestAudit()
    }, [loadLatestAudit])

    // Poll for audit status if processing
    useEffect(() => {
        if (!audit || audit.status !== 'processing') return

        const interval = setInterval(async () => {
            try {
                const data = await siteAuditService.getAudit(audit.audit_id)
                setAudit(data)
                if (data.status === 'completed') {
                    toast.success(t.auditTab + ' ' + t.completedOnboarding?.toLowerCase() || 'completed')
                    setAnalyzing(false)
                } else if (data.status === 'failed') {
                    toast.error(t.auditFailed)
                    setAnalyzing(false)
                }
            } catch (error) {
                console.error('Error polling audit:', error)
            }
        }, 5000)

        return () => clearInterval(interval)
    }, [audit, t])

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text)
        setCopied(id)
        toast.success(t.copiedBtn)
        setTimeout(() => setCopied(null), 2000)
    }

    const handleAnalyze = async () => {
        setAnalyzing(true)
        toast.info(t.auditInProgressDesc)

        try {
            const data = await siteAuditService.analyze({
                brand_id: brandId,
                pages_limit: 5
            })
            setAudit(data)
        } catch (error: any) {
            toast.error(error.message || t.auditFailed)
            setAnalyzing(false)
        }
    }

    const generateLlmsTxt = () => {
        return `# ${brandName}

> ${brandName} is a leading company in ${industry || 'its sector'}.

## About
- Website: https://${domain}
${industry ? `- Industry: ${industry}` : ''}
- Generated: ${new Date().toISOString().split('T')[0]}

## Contact
- For inquiries, visit https://${domain}/contact

## Important
- This file provides context for AI language models
- Updated regularly to ensure accuracy`
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
            case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400'
            case 'low': return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-400'
            default: return 'text-gray-600 bg-gray-50 border-gray-200'
        }
    }

    const getPriorityLabel = (priority: string) => {
        switch (priority) {
            case 'high': return t.recommendationPriorityHigh
            case 'medium': return t.recommendationPriorityMedium
            case 'low': return t.recommendationPriorityLow
            default: return priority
        }
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {t.optimizationPageTitle}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t.optimizationPageDescription}
                    </p>
                </div>
                <Button
                    onClick={handleAnalyze}
                    disabled={analyzing || audit?.status === 'processing'}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                    {analyzing || audit?.status === 'processing' ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                        <Sparkles className="h-4 w-4" />
                    )}
                    {analyzing || audit?.status === 'processing' ? t.analyzingBtn : t.analyzeSiteBtn}
                </Button>
            </div>

            {/* Sub-tabs */}
            <Tabs value={subTab} onValueChange={setSubTab} className="w-full">
                <TabsList className="bg-gray-100 dark:bg-gray-900 p-1 rounded-lg h-10">
                    <TabsTrigger value="audit" className="text-xs px-4 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 gap-2">
                        <BarChart3 className="h-3.5 w-3.5" />
                        {t.auditTab}
                    </TabsTrigger>
                    <TabsTrigger value="recommendations" className="text-xs px-4 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 gap-2">
                        <Lightbulb className="h-3.5 w-3.5" />
                        {t.recommendationsTab}
                        {audit?.recommendations && audit.recommendations.length > 0 && (
                            <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">{audit.recommendations.length}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="tools" className="text-xs px-4 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 gap-2">
                        <Code className="h-3.5 w-3.5" />
                        {t.toolsTab}
                    </TabsTrigger>
                </TabsList>

                {/* Audit Tab */}
                <TabsContent value="audit" className="mt-6">
                    {!audit ? (
                        <Card className="border-gray-200 dark:border-gray-800">
                            <CardContent className="py-12 text-center">
                                <Search className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t.noAuditYet}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {t.noAuditYetDesc}
                                </p>
                                <Button onClick={handleAnalyze} className="mt-4 gap-2" variant="outline">
                                    <Sparkles className="h-4 w-4" />
                                    {t.analyzeSiteBtn}
                                </Button>
                            </CardContent>
                        </Card>
                    ) : audit.status === 'processing' ? (
                        <Card className="border-gray-200 dark:border-gray-800">
                            <CardContent className="py-12 text-center">
                                <Loader2 className="h-10 w-10 text-emerald-500 mx-auto mb-3 animate-spin" />
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t.auditInProgress}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {t.auditInProgressDesc}
                                </p>
                            </CardContent>
                        </Card>
                    ) : audit.status === 'failed' ? (
                        <Card className="border-red-200 dark:border-red-800">
                            <CardContent className="py-12 text-center">
                                <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
                                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                                    {t.auditFailed}
                                </p>
                                <p className="text-xs text-red-500 mt-1">
                                    {audit.error || t.auditFailedDesc}
                                </p>
                                <Button onClick={handleAnalyze} className="mt-4 gap-2" variant="outline">
                                    <RefreshCw className="h-4 w-4" />
                                    {t.retryBtn}
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 lg:grid-cols-12">
                            {/* Left: Summary Stats */}
                            <div className="lg:col-span-4 space-y-4">
                                <Card className="border-gray-200 dark:border-gray-800">
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">{t.lastAuditLabel}</span>
                                            <span className="text-sm font-medium flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5" />
                                                {formatDate(audit.completed_at || audit.created_at)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">{t.pagesAnalyzedLabel}</span>
                                            <span className="text-sm font-medium">{audit.pages_analyzed}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">{t.issuesFoundLabel}</span>
                                            <span className="text-sm font-medium text-amber-600">{audit.findings?.total_issues || 0}</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Schema Status */}
                                <Card className="border-gray-200 dark:border-gray-800">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <FileCode className="h-4 w-4 text-gray-500" />
                                            {t.schemaMarkupSection}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {audit.findings?.schema_markup?.found ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-emerald-600">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    <span className="text-sm">{t.schemaMarkupFound}</span>
                                                </div>
                                                {audit.findings.schema_markup.types.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {audit.findings.schema_markup.types.map((type, i) => (
                                                            <Badge key={i} variant="secondary" className="text-xs">{type}</Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-amber-600">
                                                <AlertCircle className="h-4 w-4" />
                                                <span className="text-sm">{t.schemaMarkupNotFound}</span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Content Summary */}
                                <Card className="border-gray-200 dark:border-gray-800">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-gray-500" />
                                            {t.contentStructureSection}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500">{t.totalWordsLabel}</span>
                                            <span className="text-sm font-medium">{audit.findings?.content?.total_words?.toLocaleString() || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {(audit.findings?.content?.faq_pages || 0) > 0 ? (
                                                <>
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                    <span className="text-sm text-emerald-600">{t.faqContentFound}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle className="h-4 w-4 text-amber-600" />
                                                    <span className="text-sm text-amber-600">{t.faqContentNotFound}</span>
                                                </>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right: Pages Analyzed */}
                            <div className="lg:col-span-8">
                                <Card className="border-gray-200 dark:border-gray-800">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">{t.pagesAnalyzedLabel}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {audit.pages?.map((page, i) => (
                                            <div key={i} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                                <div className="flex items-start justify-between">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium truncate">{page.title || page.url}</p>
                                                        <p className="text-xs text-gray-500 truncate">{page.url}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0 ml-4">
                                                        {page.has_schema_markup && (
                                                            <Badge variant="secondary" className="text-xs">Schema</Badge>
                                                        )}
                                                        {page.has_faq_content && (
                                                            <Badge variant="secondary" className="text-xs">FAQ</Badge>
                                                        )}
                                                        <span className="text-xs text-gray-500">{page.word_count} words</span>
                                                    </div>
                                                </div>
                                                {page.issues.length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                        {page.issues.slice(0, 2).map((issue, j) => (
                                                            <span key={j} className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded">
                                                                {issue.split(' on ')[0]}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* Recommendations Tab */}
                <TabsContent value="recommendations" className="mt-6">
                    {allRecommendations.length === 0 ? (
                        <Card className="border-gray-200 dark:border-gray-800">
                            <CardContent className="py-12 text-center">
                                <Sparkles className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t.noRecommendations}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {t.noRecommendationsDesc}
                                </p>
                                <Button onClick={handleAnalyze} className="mt-4 gap-2" variant="outline">
                                    <Sparkles className="h-4 w-4" />
                                    {t.analyzeSiteBtn}
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {allRecommendations.map((rec, i) => (
                                <Card key={i} className="border-gray-200 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
                                    <CardContent className="py-4 px-4">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${getPriorityColor(rec.priority)}`}>
                                                <Lightbulb className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{rec.title}</h4>
                                                    <Badge variant="outline" className={`text-[10px] h-4 px-1.5 uppercase ${getPriorityColor(rec.priority)}`}>
                                                        {getPriorityLabel(rec.priority)}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{rec.description}</p>
                                                <div className="flex items-center gap-2 mt-3">
                                                    {rec.action && (
                                                        <Button
                                                            size="sm"
                                                            className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
                                                            onClick={() => {
                                                                if (rec.action === 'generate_llms_txt') {
                                                                    setSubTab('tools')
                                                                } else if (rec.action === 'generate_schema') {
                                                                    setSubTab('tools')
                                                                }
                                                            }}
                                                        >
                                                            {t.applyRecommendation}
                                                            <ArrowRight className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Tools Tab */}
                <TabsContent value="tools" className="mt-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* llms.txt Generator */}
                        <Card className="border-gray-200 dark:border-gray-800">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    {t.llmsTxtGenerator}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    {t.llmsTxtDesc}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-[#1e1e1e] rounded-lg overflow-hidden">
                                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
                                        <span className="text-xs text-gray-400 font-mono">llms.txt</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleCopy(generateLlmsTxt(), 'llms')}
                                            className="h-6 text-xs text-gray-400 hover:text-white gap-1"
                                        >
                                            {copied === 'llms' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                            {copied === 'llms' ? t.copiedBtn : t.copyBtn}
                                        </Button>
                                    </div>
                                    <pre className="p-4 text-xs font-mono text-gray-300 overflow-auto max-h-[200px] whitespace-pre-wrap">
                                        {generateLlmsTxt()}
                                    </pre>
                                </div>
                                <p className="text-xs text-muted-foreground mt-3">
                                    {t.llmsTxtInstruction}{' '}
                                    <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">https://{domain}/llms.txt</code>
                                </p>
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card className="border-gray-200 dark:border-gray-800">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Zap className="h-4 w-4" />
                                    {t.quickActionsTitle}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    {t.quickActionsDesc}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button variant="outline" className="w-full justify-between h-10 text-sm" asChild>
                                    <a href={`https://${domain}/robots.txt`} target="_blank" rel="noopener noreferrer">
                                        <span className="flex items-center gap-2">
                                            <Bot className="h-4 w-4" />
                                            {t.checkRobotsTxt}
                                        </span>
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                </Button>
                                <Button variant="outline" className="w-full justify-between h-10 text-sm" asChild>
                                    <a href={`https://${domain}/sitemap.xml`} target="_blank" rel="noopener noreferrer">
                                        <span className="flex items-center gap-2">
                                            <Globe className="h-4 w-4" />
                                            {t.checkSitemap}
                                        </span>
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                </Button>
                                <Button variant="outline" className="w-full justify-between h-10 text-sm" asChild>
                                    <a href={`https://search.google.com/test/rich-results?url=https://${domain}`} target="_blank" rel="noopener noreferrer">
                                        <span className="flex items-center gap-2">
                                            <Search className="h-4 w-4" />
                                            {t.testRichResults}
                                        </span>
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                </Button>
                                <Button variant="outline" className="w-full justify-between h-10 text-sm" asChild>
                                    <a href={`https://validator.schema.org/#url=https://${domain}`} target="_blank" rel="noopener noreferrer">
                                        <span className="flex items-center gap-2">
                                            <Code className="h-4 w-4" />
                                            {t.validateSchema}
                                        </span>
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
