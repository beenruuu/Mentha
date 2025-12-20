'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    FileText,
    Code,
    Copy,
    Check,
    ArrowRight,
    Plus,
    Trash2,
    AlertCircle,
    Zap,
    CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from '@/lib/i18n'

interface OptimizeTabProps {
    brandId: string
    brandName: string
    domain: string
    industry?: string
    recommendations?: any[]
}

export function OptimizeTab({
    brandId,
    brandName,
    domain,
    industry,
    recommendations = []
}: OptimizeTabProps) {
    const { t } = useTranslations()
    const [subTab, setSubTab] = useState('recommendations')
    const [copied, setCopied] = useState<string | null>(null)

    // llms.txt form
    const [llmsDescription, setLlmsDescription] = useState('')
    const [llmsServices, setLlmsServices] = useState('')

    // Schema form
    const [faqItems, setFaqItems] = useState<{ q: string; a: string }[]>([
        { q: '', a: '' }
    ])

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text)
        setCopied(id)
        toast.success('Copiado al portapapeles')
        setTimeout(() => setCopied(null), 2000)
    }

    const generateLlmsTxt = () => {
        const services = llmsServices.split('\n').filter(s => s.trim())
        return `# ${brandName}

> ${llmsDescription || `${brandName} es un líder en su industria...`}

## About
- Website: https://${domain}
${industry ? `- Industry: ${industry}` : ''}
- Generated: ${new Date().toISOString().split('T')[0]}

${services.length > 0 ? `## Services\n${services.map(s => `- ${s}`).join('\n')}` : ''}`
    }

    const generateFaqSchema = () => {
        const validFaqs = faqItems.filter(f => f.q && f.a)
        if (validFaqs.length === 0) return ''

        return JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": validFaqs.map(f => ({
                "@type": "Question",
                "name": f.q,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": f.a
                }
            }))
        }, null, 2)
    }

    const addFaqItem = () => setFaqItems([...faqItems, { q: '', a: '' }])
    const removeFaqItem = (index: number) => setFaqItems(faqItems.filter((_, i) => i !== index))
    const updateFaqItem = (index: number, field: 'q' | 'a', value: string) => {
        const newItems = [...faqItems]
        newItems[index][field] = value
        setFaqItems(newItems)
    }

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'high': return <AlertCircle className="h-4 w-4" />
            case 'medium': return <Zap className="h-4 w-4" />
            default: return <CheckCircle2 className="h-4 w-4" />
        }
    }

    const getPriorityStyle = (priority: string) => {
        switch (priority) {
            case 'high': return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
            case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
            default: return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
        }
    }

    return (
        <div className="space-y-6">
            {/* Header - Minimal */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.brand_optimization}</h2>
                <p className="text-sm text-gray-500">Herramientas para mejorar tu visibilidad en modelos LLM</p>
            </div>

            {/* Sub-tabs - Compact style */}
            <Tabs value={subTab} onValueChange={setSubTab} className="w-full">
                <TabsList className="bg-gray-100 dark:bg-gray-900 p-1 rounded-lg h-9">
                    <TabsTrigger value="recommendations" className="text-xs px-3 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                        Recomendaciones {recommendations.length > 0 && <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">{recommendations.length}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="llms-txt" className="text-xs px-3 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                        llms.txt
                    </TabsTrigger>
                    <TabsTrigger value="schema" className="text-xs px-3 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                        Schema FAQ
                    </TabsTrigger>
                </TabsList>

                {/* Recommendations Tab */}
                <TabsContent value="recommendations" className="mt-4">
                    {recommendations.length === 0 ? (
                        <Card className="border-gray-200 dark:border-gray-800">
                            <CardContent className="py-12 text-center">
                                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No hay recomendaciones pendientes</p>
                                <p className="text-xs text-gray-500 mt-1">Tu marca está optimizada</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {recommendations.map((rec, i) => (
                                <Card key={i} className="border-gray-200 dark:border-gray-800">
                                    <CardContent className="py-4 px-4">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${getPriorityStyle(rec.priority)}`}>
                                                {getPriorityIcon(rec.priority)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{rec.title}</h4>
                                                    <Badge variant="outline" className={`text-[10px] h-4 px-1.5 uppercase ${getPriorityStyle(rec.priority)}`}>
                                                        {rec.priority}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{rec.description}</p>
                                                <Button size="sm" variant="ghost" className="mt-2 h-7 text-xs text-gray-500 hover:text-emerald-600 gap-1 px-0">
                                                    Aplicar <ArrowRight className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* llms.txt Tab */}
                <TabsContent value="llms-txt" className="mt-4">
                    <div className="grid lg:grid-cols-2 gap-6">
                        {/* Editor */}
                        <Card className="border-gray-200 dark:border-gray-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Configuración</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label className="text-xs font-medium text-gray-600">Descripción</Label>
                                    <Textarea
                                        placeholder="Descripción breve de tu empresa..."
                                        value={llmsDescription}
                                        onChange={(e) => setLlmsDescription(e.target.value)}
                                        className="mt-1.5 min-h-[80px] resize-none text-sm"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-medium text-gray-600">Servicios (uno por línea)</Label>
                                    <Textarea
                                        placeholder="Servicio 1&#10;Servicio 2&#10;Servicio 3"
                                        value={llmsServices}
                                        onChange={(e) => setLlmsServices(e.target.value)}
                                        className="mt-1.5 min-h-[120px] resize-none text-sm font-mono"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Preview */}
                        <Card className="border-gray-200 dark:border-gray-800 bg-[#1e1e1e]">
                            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
                                <span className="text-xs text-gray-400 font-mono">llms.txt</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopy(generateLlmsTxt(), 'llms')}
                                    className="h-6 text-xs text-gray-400 hover:text-white gap-1"
                                >
                                    {copied === 'llms' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    {copied === 'llms' ? 'Copiado' : 'Copiar'}
                                </Button>
                            </div>
                            <pre className="p-4 text-xs font-mono text-gray-300 overflow-auto max-h-[300px] whitespace-pre-wrap">
                                {generateLlmsTxt()}
                            </pre>
                        </Card>
                    </div>
                </TabsContent>

                {/* Schema Tab */}
                <TabsContent value="schema" className="mt-4">
                    <div className="grid lg:grid-cols-2 gap-6">
                        {/* FAQ Builder */}
                        <Card className="border-gray-200 dark:border-gray-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">FAQ Builder</CardTitle>
                                <CardDescription className="text-xs">Crea preguntas frecuentes estructuradas</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {faqItems.map((item, i) => (
                                    <div key={i} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-medium text-gray-500">Pregunta {i + 1}</span>
                                            {faqItems.length > 1 && (
                                                <button onClick={() => removeFaqItem(i)} className="text-gray-400 hover:text-red-500">
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                        <Input
                                            placeholder="¿Pregunta?"
                                            value={item.q}
                                            onChange={(e) => updateFaqItem(i, 'q', e.target.value)}
                                            className="mb-2 text-sm h-8"
                                        />
                                        <Textarea
                                            placeholder="Respuesta..."
                                            value={item.a}
                                            onChange={(e) => updateFaqItem(i, 'a', e.target.value)}
                                            rows={2}
                                            className="text-sm resize-none"
                                        />
                                    </div>
                                ))}
                                <Button variant="outline" onClick={addFaqItem} className="w-full border-dashed text-xs h-8 gap-1">
                                    <Plus className="h-3 w-3" /> Añadir pregunta
                                </Button>
                            </CardContent>
                        </Card>

                        {/* JSON-LD Preview */}
                        <Card className="border-gray-200 dark:border-gray-800 bg-[#1e1e1e]">
                            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
                                <span className="text-xs text-gray-400 font-mono">JSON-LD</span>
                                {faqItems.some(f => f.q && f.a) && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleCopy(generateFaqSchema(), 'schema')}
                                        className="h-6 text-xs text-gray-400 hover:text-white gap-1"
                                    >
                                        {copied === 'schema' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                        {copied === 'schema' ? 'Copiado' : 'Copiar'}
                                    </Button>
                                )}
                            </div>
                            {faqItems.some(f => f.q && f.a) ? (
                                <pre className="p-4 text-xs font-mono text-[#9cdcfe] overflow-auto max-h-[400px]">
                                    {generateFaqSchema()}
                                </pre>
                            ) : (
                                <div className="p-8 text-center text-gray-500">
                                    <Code className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-xs">Rellena el formulario para generar el código</p>
                                </div>
                            )}
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
