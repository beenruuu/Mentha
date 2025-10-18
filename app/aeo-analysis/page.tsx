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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Loader2, Sparkles, TrendingUp, AlertCircle, CheckCircle2, Brain, Target } from 'lucide-react'

export default function AEOAnalysisPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const [error, setError] = useState('')

  const [domain, setDomain] = useState('')
  const [content, setContent] = useState('')
  const [analysisType, setAnalysisType] = useState('content')
  const [aiModel, setAiModel] = useState('chatgpt')

  const handleAnalyze = async () => {
    if (!domain || !content) {
      setError('Por favor completa el dominio y el contenido')
      return
    }

    setLoading(true)
    setError('')
    setAnalysis(null)

    // MODO DEMO: Usar datos mock en lugar de llamar a la API
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

    if (isDemoMode) {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Importar datos mock dinámicamente
      const { mockAnalysisResult } = await import('@/lib/mock-data')
      
      setAnalysis({
        id: Date.now(),
        results: mockAnalysisResult,
        score: mockAnalysisResult.score,
        status: 'completed',
        ai_model: aiModel,
        created_at: new Date().toISOString(),
      })
      setLoading(false)
      return
    }

    // Modo producción: llamar a la API real
    try {
      const response = await fetch('/api/aeo/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: analysisType,
          domain,
          content,
          aiModel,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al analizar')
      }

      const data = await response.json()
      setAnalysis(data.analysis)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white dark:bg-black">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Análisis AEO</h1>
          </div>
          <div className="flex-1" />
          <UserAvatarMenu />
        </header>

        <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 bg-[#f5f5f5] dark:bg-[#0A0A0A]">
          <div className="grid gap-6 xl:grid-cols-2">
            {/* Input Section */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Nueva Análisis</CardTitle>
                <CardDescription>
                  Analiza contenido para optimizar tu visibilidad en motores de IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="domain">Dominio</Label>
                  <Input
                    id="domain"
                    placeholder="ejemplo.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="analysisType">Tipo de Análisis</Label>
                  <Select value={analysisType} onValueChange={setAnalysisType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="content">Contenido</SelectItem>
                      <SelectItem value="domain">Dominio Completo</SelectItem>
                      <SelectItem value="keyword">Keywords</SelectItem>
                      <SelectItem value="competitor">Competencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aiModel">Modelo de IA</Label>
                  <Select value={aiModel} onValueChange={setAiModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chatgpt">ChatGPT (GPT-4)</SelectItem>
                      <SelectItem value="claude">Claude (Sonnet)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Contenido a Analizar</Label>
                  <Textarea
                    id="content"
                    placeholder="Pega aquí el contenido de tu página, artículo o descripción..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <Button onClick={handleAnalyze} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analizando...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Analizar con IA
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results Section */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Resultados del Análisis</CardTitle>
                <CardDescription>
                  {analysis ? 'Tu puntuación AEO y recomendaciones' : 'Los resultados aparecerán aquí'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!analysis && !loading && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Completa el formulario y haz clic en "Analizar con IA" para obtener tu puntuación AEO
                    </p>
                  </div>
                )}

                {loading && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Loader2 className="h-12 w-12 text-emerald-600 animate-spin mb-4" />
                    <p className="text-muted-foreground">
                      Analizando tu contenido con {aiModel === 'chatgpt' ? 'GPT-4' : 'Claude'}...
                    </p>
                  </div>
                )}

                {analysis && (
                  <div className="space-y-6">
                    {/* Score */}
                    <div className="text-center">
                      <div className={`text-5xl font-bold mb-2 ${getScoreColor(analysis.results?.score || 0)}`}>
                        {analysis.results?.score || 0}
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">Puntuación AEO</p>
                      <Progress value={analysis.results?.score || 0} className="h-2" />
                    </div>

                    <Tabs defaultValue="strengths">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="strengths">Fortalezas</TabsTrigger>
                        <TabsTrigger value="weaknesses">Debilidades</TabsTrigger>
                        <TabsTrigger value="recommendations">Acciones</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="strengths" className="space-y-2 mt-4">
                        {analysis.results?.strengths?.map((strength: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                            <span>{strength}</span>
                          </div>
                        ))}
                      </TabsContent>
                      
                      <TabsContent value="weaknesses" className="space-y-2 mt-4">
                        {analysis.results?.weaknesses?.map((weakness: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                            <span>{weakness}</span>
                          </div>
                        ))}
                      </TabsContent>
                      
                      <TabsContent value="recommendations" className="space-y-2 mt-4">
                        {analysis.results?.recommendations?.map((rec: any, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm border-l-2 border-emerald-600 pl-3 py-1">
                            <Target className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                            <span>{typeof rec === 'string' ? rec : rec.title || rec.description}</span>
                          </div>
                        ))}
                      </TabsContent>
                    </Tabs>

                    {/* Keywords */}
                    {analysis.results?.keywords && analysis.results.keywords.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Keywords Sugeridas
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {analysis.results.keywords.map((keyword: string, i: number) => (
                            <Badge key={i} variant="secondary">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Analyses */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Análisis Recientes</CardTitle>
              <CardDescription>
                Historial de análisis realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay análisis previos. Realiza tu primer análisis AEO arriba.
              </p>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
