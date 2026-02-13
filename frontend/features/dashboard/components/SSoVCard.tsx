"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Zap } from "lucide-react";
import type { SSoVData, CompetitorComparison } from "../types/enhanced-geo";

// Support both legacy data format and new explicit props
interface SSoVCardProps {
  // Legacy format
  data?: SSoVData | null;
  isLoading?: boolean;
  // New explicit format
  ssov?: number;
  modelBreakdown?: Record<string, {
    ssov: number;
    mentions: number;
    sentiment: number;
    prominence: number;
  }>;
  competitorComparison?: Record<string, number>;
  trend?: number;
  compact?: boolean;
}

export function SSoVCard({ 
  data, 
  isLoading,
  ssov: explicitSSoV,
  modelBreakdown,
  competitorComparison,
  trend: explicitTrend,
  compact = false
}: SSoVCardProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className={compact ? "pb-2" : ""}>
          <div className="h-6 bg-muted rounded w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="h-24 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  // Handle both data formats
  const ssovScore = explicitSSoV ?? data?.ssov?.score ?? 0;
  const hasData = ssovScore > 0 || data;

  if (!hasData) {
    return (
      <Card>
        <CardHeader className={compact ? "pb-2" : ""}>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Semantic Share of Voice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No hay datos de SSoV disponibles. Ejecuta un análisis completo.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Determine trend
  const trendValue = explicitTrend ?? data?.trend?.percentage ?? 0;
  const trendDirection = trendValue > 0 ? "up" : trendValue < 0 ? "down" : "stable";

  const TrendIcon = trendDirection === "up" 
    ? TrendingUp 
    : trendDirection === "down" 
      ? TrendingDown 
      : Minus;

  const trendColor = trendDirection === "up" 
    ? "text-green-500" 
    : trendDirection === "down" 
      ? "text-red-500" 
      : "text-muted-foreground";

  // Build model breakdown from either format
  const models = modelBreakdown 
    ? Object.entries(modelBreakdown).map(([name, data]) => ({ name, score: data.ssov }))
    : data?.breakdown?.by_model 
      ? Object.entries(data.breakdown.by_model).map(([name, score]) => ({ name, score }))
      : [];

  // Build competitor comparison from either format
  const competitors = competitorComparison 
    ? Object.entries(competitorComparison).map(([name, compSSoV]) => ({
        competitor: name,
        competitor_ssov: compSSoV,
        brand_ssov: ssovScore,
        delta: ssovScore - compSSoV,
        brand_leading: ssovScore > compSSoV,
      }))
    : data?.competitor_comparisons ?? [];

  return (
    <Card>
      <CardHeader className={compact ? "pb-2" : ""}>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            {compact ? "SSoV" : "Semantic Share of Voice"}
          </div>
          <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
            <TrendIcon className="h-4 w-4" />
            {trendValue > 0 ? "+" : ""}{trendValue.toFixed(1)}%
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className={compact ? "space-y-3" : "space-y-6"}>
        {/* Main Score */}
        <div className="text-center">
          <div className={`${compact ? "text-3xl" : "text-5xl"} font-bold`}>
            {ssovScore.toFixed(1)}%
          </div>
          {!compact && data?.mentions && (
            <p className="text-sm text-muted-foreground mt-1">
              {data.mentions.brand} menciones de {data.mentions.total} totales
            </p>
          )}
        </div>

        {/* Score Breakdown - Hidden in compact mode */}
        {!compact && data?.ssov && (
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="font-medium">{data.ssov.raw.toFixed(1)}%</div>
              <div className="text-muted-foreground">Raw</div>
            </div>
            <div>
              <div className="font-medium">{data.ssov.sentiment_adjusted.toFixed(1)}%</div>
              <div className="text-muted-foreground">Sentiment</div>
            </div>
            <div>
              <div className="font-medium">{data.ssov.prominence_adjusted.toFixed(1)}%</div>
              <div className="text-muted-foreground">Prominence</div>
            </div>
          </div>
        )}

        {/* Model Breakdown */}
        {models.length > 0 && (
          <div className="space-y-2">
            {!compact && <h4 className="text-sm font-medium">Por Modelo IA</h4>}
            {models.slice(0, compact ? 2 : undefined).map(({ name, score }) => (
              <div key={name} className="flex items-center gap-2">
                <span className="text-sm w-20 capitalize truncate">{name}</span>
                <Progress value={score} className="flex-1 h-2" />
                <span className="text-sm w-10 text-right">{score.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        )}

        {/* Competitor Comparison - Hidden in compact mode */}
        {!compact && competitors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">vs Competidores</h4>
            {competitors.slice(0, 3).map((comp) => (
              <CompetitorRow key={comp.competitor} data={comp} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CompetitorRowData {
  competitor: string;
  brand_leading: boolean;
  delta: number;
}

function CompetitorRow({ data }: { data: CompetitorRowData }) {
  const isWinning = data.brand_leading;
  
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex items-center gap-2">
        {isWinning ? (
          <Badge variant="default" className="bg-green-500 text-xs">Ganando</Badge>
        ) : (
          <Badge variant="destructive" className="text-xs">Perdiendo</Badge>
        )}
        <span className="text-sm">{data.competitor}</span>
      </div>
      <div className="text-sm">
        <span className={isWinning ? "text-green-500" : "text-red-500"}>
          {data.delta > 0 ? "+" : ""}{data.delta.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
