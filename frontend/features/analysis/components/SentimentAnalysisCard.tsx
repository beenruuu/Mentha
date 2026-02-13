'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, ThumbsUp, ThumbsDown, AlertCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTranslations } from "@/lib/i18n"

interface SentimentData {
  overall_sentiment: 'positive' | 'neutral' | 'negative' | 'mixed'
  sentiment_score: number
  trend: 'improving' | 'stable' | 'declining'
  positive_aspects: string[]
  negative_aspects: string[]
  sample_count?: number
  last_analyzed?: string
}

interface SentimentAnalysisCardProps {
  brandId: string
  brandName: string
  onRefresh?: () => void
  lastUpdated?: number
}

// Component-level translations
const componentTranslations = {
  es: {
    brandSentiment: 'Sentimiento de Marca',
    howAIPerceives: 'Cómo los modelos de IA perciben tu marca',
    refreshSentiment: 'Actualizar análisis de sentimiento',
    trend: 'Tendencia',
    improving: 'Mejorando',
    stable: 'Estable',
    declining: 'Decayendo',
    positive: 'Positivo',
    negative: 'Negativo',
    neutral: 'Neutral',
    mixed: 'Mixto',
    positiveAspects: 'Positivo',
    needsImprovement: 'Necesita mejorar',
    noSentimentData: 'Sin datos de sentimiento aún. Ejecuta un análisis para ver insights.',
    noAspectsIdentified: 'No se identificaron aspectos específicos.',
    couldNotLoad: 'No se pudieron cargar los datos de sentimiento'
  },
  en: {
    brandSentiment: 'Brand Sentiment',
    howAIPerceives: 'How AI models perceive your brand',
    refreshSentiment: 'Refresh sentiment analysis',
    trend: 'Trend',
    improving: 'Improving',
    stable: 'Stable',
    declining: 'Declining',
    positive: 'Positive',
    negative: 'Negative',
    neutral: 'Neutral',
    mixed: 'Mixed',
    positiveAspects: 'Positive',
    needsImprovement: 'Needs Improvement',
    noSentimentData: 'No sentiment data yet. Run an analysis to see insights.',
    noAspectsIdentified: 'No specific aspects identified.',
    couldNotLoad: 'Could not load sentiment data'
  }
}

export function SentimentAnalysisCard({ brandId, brandName, onRefresh, lastUpdated }: SentimentAnalysisCardProps) {
  const { lang } = useTranslations()
  const texts = componentTranslations[lang as 'es' | 'en'] || componentTranslations.en

  const [sentiment, setSentiment] = useState<SentimentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSentiment()
  }, [brandId, lastUpdated])

  const fetchSentiment = async () => {
    try {
      setError(null)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sentiment/${brandId}/summary`)

      if (response.ok) {
        const data = await response.json()
        setSentiment(data)
      } else {
        // No data yet - show placeholder
        setSentiment({
          overall_sentiment: 'neutral',
          sentiment_score: 50,
          trend: 'stable',
          positive_aspects: [],
          negative_aspects: [],
          sample_count: 0
        })
      }
    } catch (err) {
      console.error('Failed to fetch sentiment:', err)
      // Don't show error, just show placeholder
      setSentiment({
        overall_sentiment: 'neutral',
        sentiment_score: 50,
        trend: 'stable',
        positive_aspects: [],
        negative_aspects: [],
        sample_count: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      // Trigger a new sentiment analysis
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sentiment/${brandId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_name: brandName, language: lang })
      })

      // Then fetch the updated results
      await fetchSentiment()
      onRefresh?.()
    } catch (err) {
      console.error('Failed to refresh sentiment:', err)
    } finally {
      setRefreshing(false)
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30'
      case 'negative': return 'text-red-600 bg-red-100 dark:bg-red-900/30'
      case 'mixed': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800'
    }
  }

  const getSentimentLabel = (sentimentType: string) => {
    switch (sentimentType) {
      case 'positive': return texts.positive
      case 'negative': return texts.negative
      case 'mixed': return texts.mixed
      default: return texts.neutral
    }
  }

  const getTrendLabel = (trend: string) => {
    switch (trend) {
      case 'improving': return texts.improving
      case 'declining': return texts.declining
      default: return texts.stable
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <ThumbsUp className="w-4 h-4" />
      case 'negative': return <ThumbsDown className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-emerald-500" />
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-500" />
      default: return <Minus className="w-4 h-4 text-gray-400" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-emerald-500'
    if (score >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (loading) {
    return (
      <Card className="border-border/50 shadow-sm rounded-xl animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 shadow-sm rounded-xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            {getSentimentIcon(sentiment?.overall_sentiment || 'neutral')}
            {texts.brandSentiment}
          </CardTitle>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleRefresh}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{texts.refreshSentiment}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Badge className={getSentimentColor(sentiment?.overall_sentiment || 'neutral')}>
              {getSentimentLabel(sentiment?.overall_sentiment || 'neutral')}
            </Badge>
          </div>
        </div>
        <CardDescription className="text-xs">
          {texts.howAIPerceives}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Circle */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-gray-100 dark:border-gray-800 flex items-center justify-center">
              <div className="text-center">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {sentiment?.sentiment_score || 50}
                </span>
                <span className="text-xs text-gray-400 block">/100</span>
              </div>
            </div>
            <div
              className={`absolute inset-0 rounded-full ${getScoreColor(sentiment?.sentiment_score || 50)}`}
              style={{
                clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.sin((sentiment?.sentiment_score || 50) / 100 * 2 * Math.PI)}% ${50 - 50 * Math.cos((sentiment?.sentiment_score || 50) / 100 * 2 * Math.PI)}%`,
                opacity: 0.2
              }}
            />
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{texts.trend}</span>
              <span className="flex items-center gap-1 font-medium">
                {getTrendIcon(sentiment?.trend || 'stable')}
                {getTrendLabel(sentiment?.trend || 'stable')}
              </span>
            </div>
            <Progress
              value={sentiment?.sentiment_score || 50}
              className="h-2"
            />
          </div>
        </div>

        {/* Aspects */}
        {(sentiment?.positive_aspects?.length || sentiment?.negative_aspects?.length) ? (
          <div className="space-y-3">
            {sentiment?.positive_aspects?.length ? (
              <div>
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 mb-1">
                  <ThumbsUp className="w-3 h-3" /> {texts.positiveAspects}
                </span>
                <div className="flex flex-wrap gap-1">
                  {sentiment.positive_aspects.slice(0, 3).map((aspect, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                      {aspect}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {sentiment?.negative_aspects?.length ? (
              <div>
                <span className="text-xs text-red-600 font-medium flex items-center gap-1 mb-1">
                  <ThumbsDown className="w-3 h-3" /> {texts.needsImprovement}
                </span>
                <div className="flex flex-wrap gap-1">
                  {sentiment.negative_aspects.slice(0, 3).map((aspect, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800">
                      {aspect}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="text-center py-2 text-muted-foreground text-xs">
            {(sentiment?.sample_count || 0) === 0
              ? texts.noSentimentData
              : texts.noAspectsIdentified}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
