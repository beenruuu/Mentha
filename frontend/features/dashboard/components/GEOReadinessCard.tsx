"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Network, 
  MessageSquare, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Info
} from "lucide-react";
import type { EnhancedGEOResult } from "../types/enhanced-geo";

// Support both legacy data format and new explicit props
interface GEOReadinessCardProps {
  // Legacy format (from EnhancedGEOResult)
  data?: EnhancedGEOResult | null;
  isLoading?: boolean;
  // New explicit format
  score?: number;
  metrics?: {
    entityResolution: number;
    ragSimulation: number;
    hallucinationPrevention: number;
    ssov: number;
    entityGaps: number;
  };
  recommendations?: (string | { recommendation: string; [key: string]: unknown })[];
  compact?: boolean;
}

export function GEOReadinessCard({ 
  data, 
  isLoading,
  score: explicitScore,
  metrics: explicitMetrics,
  recommendations: explicitRecommendations,
  compact = false
}: GEOReadinessCardProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className={compact ? "pb-2" : ""}>
          <div className="h-6 bg-muted rounded w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  // Handle both data formats
  const score = explicitScore ?? data?.geo_readiness_score ?? 0;
  const hasData = score > 0 || data;
  
  if (!hasData) {
    return (
      <Card>
        <CardHeader className={compact ? "pb-2" : ""}>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            GEO Readiness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No hay datos de GEO disponibles aún.
          </p>
        </CardContent>
      </Card>
    );
  }

  const scoreColor = score >= 70 
    ? "text-green-500" 
    : score >= 40 
      ? "text-yellow-500" 
      : "text-red-500";

  // Build metrics from either explicit props or data
  const metrics = explicitMetrics ? [
    {
      label: "Entity Resolution",
      value: explicitMetrics.entityResolution,
      icon: Network,
      description: `${explicitMetrics.entityResolution.toFixed(0)}% cobertura`,
    },
    {
      label: "RAG Readiness",
      value: explicitMetrics.ragSimulation * 100,
      icon: MessageSquare,
      description: `${(explicitMetrics.ragSimulation * 100).toFixed(0)}% recuperable`,
    },
    {
      label: "SSoV",
      value: explicitMetrics.ssov,
      icon: Brain,
      description: `${explicitMetrics.ssov.toFixed(1)}% share of voice`,
    },
    {
      label: "Hallucination Prevention",
      value: explicitMetrics.hallucinationPrevention * 100,
      icon: Shield,
      description: `${(explicitMetrics.hallucinationPrevention * 100).toFixed(0)}% fidelidad`,
    },
    {
      label: "Entity Gaps",
      value: Math.max(explicitMetrics.entityGaps, 0),
      icon: AlertTriangle,
      description: explicitMetrics.entityGaps >= 80 ? "Sin gaps críticos" : "Gaps pendientes",
    },
  ] : data ? [
    {
      label: "Knowledge Graph",
      value: data.knowledge_graph_grounded ? 100 : 20,
      icon: Network,
      description: data.wikidata_ids.length > 0 
        ? `${data.wikidata_ids.length} IDs vinculados` 
        : "Sin vincular",
    },
    {
      label: "RAG Readiness",
      value: data.retrieval_readiness,
      icon: MessageSquare,
      description: `${data.retrieval_readiness.toFixed(0)}% recuperable`,
    },
    {
      label: "SSoV",
      value: data.ssov_score,
      icon: Brain,
      description: `${data.ssov_score.toFixed(1)}% share of voice`,
    },
    {
      label: "Hallucination Risk",
      value: getRiskScore(data.hallucination_risk),
      icon: Shield,
      description: `Riesgo ${translateRisk(data.hallucination_risk)}`,
    },
    {
      label: "Entity Gaps",
      value: Math.max(0, 100 - data.high_priority_gaps * 10),
      icon: AlertTriangle,
      description: data.high_priority_gaps === 0 
        ? "Sin gaps críticos" 
        : `${data.high_priority_gaps} gaps prioritarios`,
    },
  ] : [];

  const recommendations = (explicitRecommendations ?? 
    data?.recommendations ?? []).map(r => typeof r === 'string' ? r : r.recommendation);

  return (
    <Card>
      <CardHeader className={compact ? "pb-2" : ""}>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            {compact ? "GEO" : "GEO Readiness Score"}
          </div>
          <Badge variant={score >= 70 ? "default" : score >= 40 ? "secondary" : "destructive"}>
            {getScoreLabel(score)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className={compact ? "space-y-3" : "space-y-6"}>
        {/* Main Score Circle */}
        <div className="flex items-center justify-center">
          <div className={`relative ${compact ? "w-20 h-20" : "w-32 h-32"}`}>
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx={compact ? "40" : "64"}
                cy={compact ? "40" : "64"}
                r={compact ? "32" : "56"}
                stroke="currentColor"
                strokeWidth={compact ? "6" : "8"}
                fill="none"
                className="text-muted"
              />
              <circle
                cx={compact ? "40" : "64"}
                cy={compact ? "40" : "64"}
                r={compact ? "32" : "56"}
                stroke="currentColor"
                strokeWidth={compact ? "6" : "8"}
                fill="none"
                strokeDasharray={`${(score / 100) * (compact ? 201 : 352)} ${compact ? 201 : 352}`}
                className={scoreColor}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className={`${compact ? "text-xl" : "text-3xl"} font-bold ${scoreColor}`}>
                {score.toFixed(0)}
              </span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
          </div>
        </div>

        {/* Metrics Breakdown - Hidden in compact mode */}
        {!compact && (
          <div className="space-y-3">
            {metrics.map((metric) => (
              <MetricRow key={metric.label} {...metric} />
            ))}
          </div>
        )}

        {/* Top Recommendations - Limited in compact mode */}
        {recommendations.length > 0 && (
          <div className={`space-y-2 ${compact ? "" : "pt-4 border-t"}`}>
            {!compact && (
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Info className="h-4 w-4" />
                Recomendaciones Prioritarias
              </h4>
            )}
            {recommendations.slice(0, compact ? 1 : 3).map((rec, idx) => (
              <div key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                <span className={compact ? "line-clamp-2" : ""}>{rec}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MetricRowProps {
  label: string;
  value: number;
  icon: React.ElementType;
  description: string;
}

function MetricRow({ label, value, icon: Icon, description }: MetricRowProps) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div className="flex-1">
        <div className="flex items-center justify-between text-sm mb-1">
          <span>{label}</span>
          <span className="text-muted-foreground">{description}</span>
        </div>
        <Progress value={value} className="h-1.5" />
      </div>
    </div>
  );
}

function getRiskScore(risk: string): number {
  switch (risk) {
    case "low": return 90;
    case "medium": return 60;
    case "high": return 30;
    case "critical": return 10;
    default: return 50;
  }
}

function translateRisk(risk: string): string {
  switch (risk) {
    case "low": return "bajo";
    case "medium": return "medio";
    case "high": return "alto";
    case "critical": return "crítico";
    default: return "desconocido";
  }
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excelente";
  if (score >= 60) return "Bueno";
  if (score >= 40) return "Mejorable";
  if (score >= 20) return "Bajo";
  return "Crítico";
}
