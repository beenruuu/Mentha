"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Network, 
  ExternalLink,
  TrendingUp
} from "lucide-react";
import type { EntityGapData, EntityGap } from "../types/enhanced-geo";

// Simplified gap type for new format
interface SimpleGap {
  entity: string;
  entity_type: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  competitors_using: string[];
  suggested_context: string;
}

// Support both legacy data format and new explicit props
interface EntityGapsCardProps {
  // Legacy format
  data?: EntityGapData | null;
  isLoading?: boolean;
  // New explicit format
  gaps?: SimpleGap[];
  coverageScore?: number;
  entityDiversity?: number;
  compact?: boolean;
}

export function EntityGapsCard({ 
  data, 
  isLoading,
  gaps: explicitGaps,
  coverageScore,
  entityDiversity,
  compact = false
}: EntityGapsCardProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className={compact ? "pb-2" : ""}>
          <div className="h-6 bg-muted rounded w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  // Handle both data formats
  const hasData = (explicitGaps && explicitGaps.length > 0) || data;
  
  if (!hasData) {
    return (
      <Card>
        <CardHeader className={compact ? "pb-2" : ""}>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Entity Gaps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No hay datos de análisis de entidades disponibles.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Build data from either format
  const gaps = explicitGaps ?? data?.gaps ?? [];
  const coverage = coverageScore ?? data?.scores?.entity_coverage ?? 0;
  const diversity = entityDiversity ?? data?.scores?.topic_diversity ?? 0;
  
  const highPriorityCount = gaps.filter(g => 
    g.priority === 'high' || g.priority === 'critical'
  ).length;
  const mediumPriorityCount = gaps.filter(g => g.priority === 'medium').length;
  const lowPriorityCount = gaps.filter(g => g.priority === 'low').length;

  return (
    <Card>
      <CardHeader className={compact ? "pb-2" : ""}>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-blue-500" />
            {compact ? "Entity Gaps" : "Entity Gap Analysis"}
          </div>
          <Badge variant={highPriorityCount === 0 ? "default" : "destructive"}>
            {gaps.length} gaps
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className={compact ? "space-y-3" : "space-y-6"}>
        {/* Summary Stats */}
        <div className={`grid ${compact ? "grid-cols-2" : "grid-cols-3"} gap-4`}>
          <StatBox
            label="Cobertura"
            value={`${coverage.toFixed(0)}%`}
            description={compact ? "" : "Entidades compartidas"}
            variant={coverage >= 70 ? "good" : "warning"}
          />
          {!compact && (
            <StatBox
              label="Diversidad"
              value={`${diversity.toFixed(0)}%`}
              description="Tipos de entidades"
              variant={diversity >= 50 ? "good" : "warning"}
            />
          )}
          <StatBox
            label="Prioritarios"
            value={highPriorityCount.toString()}
            description={compact ? "" : "Gaps críticos"}
            variant={highPriorityCount === 0 ? "good" : "bad"}
          />
        </div>

        {/* Priority Breakdown - Hidden in compact mode */}
        {!compact && (
          <div className="flex gap-2">
            <Badge variant="destructive" className="text-xs">
              {highPriorityCount} alta
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {mediumPriorityCount} media
            </Badge>
            <Badge variant="outline" className="text-xs">
              {lowPriorityCount} baja
            </Badge>
          </div>
        )}

        {/* Gap List */}
        {gaps.length > 0 && (
          <div className="space-y-2">
            {!compact && <h4 className="text-sm font-medium">Gaps Prioritarios</h4>}
            <ScrollArea className={compact ? "h-32" : "h-48"}>
              <div className="space-y-2">
                {gaps.slice(0, compact ? 3 : 10).map((gap, idx) => (
                  <SimpleGapItem key={idx} gap={gap} compact={compact} />
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Exclusive Entities - Hidden in compact mode */}
        {!compact && data?.entity_comparison?.exclusive_to_brand && 
         data.entity_comparison.exclusive_to_brand.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Tu Ventaja Semántica
            </h4>
            <div className="flex flex-wrap gap-1">
              {data.entity_comparison.exclusive_to_brand.slice(0, 8).map((entity, idx) => (
                <Badge key={idx} variant="outline" className="text-xs capitalize">
                  {entity}
                </Badge>
              ))}
              {data.entity_comparison.exclusive_to_brand.length > 8 && (
                <Badge variant="secondary" className="text-xs">
                  +{data.entity_comparison.exclusive_to_brand.length - 8} más
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StatBoxProps {
  label: string;
  value: string;
  description: string;
  variant: "good" | "warning" | "bad";
}

function StatBox({ label, value, description, variant }: StatBoxProps) {
  const colors = {
    good: "text-green-500",
    warning: "text-yellow-500",
    bad: "text-red-500",
  };

  return (
    <div className="text-center p-3 rounded-lg bg-muted/50">
      <div className={`text-2xl font-bold ${colors[variant]}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      {description && <div className="text-xs text-muted-foreground">{description}</div>}
    </div>
  );
}

// Simple gap item for new format
function SimpleGapItem({ gap, compact }: { gap: SimpleGap | EntityGap; compact?: boolean }) {
  const priorityColors: Record<string, string> = {
    critical: "bg-red-600",
    high: "bg-red-500",
    medium: "bg-yellow-500",
    low: "bg-gray-400",
  };

  // Handle both formats
  const entity = gap.entity;
  const type = 'entity_type' in gap ? gap.entity_type : gap.type;
  const priority = gap.priority;
  const competitorCount = 'competitors_using' in gap 
    ? gap.competitors_using.length 
    : 'competitor_count' in gap ? gap.competitor_count : 0;
  const recommendation = 'suggested_context' in gap 
    ? gap.suggested_context 
    : 'recommendation' in gap ? gap.recommendation : null;
  const wikidataId = 'wikidata_id' in gap ? gap.wikidata_id : null;

  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <div className={`w-2 h-2 rounded-full mt-2 ${priorityColors[priority]}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm capitalize truncate">
            {entity}
          </span>
          {!compact && (
            <>
              <Badge variant="outline" className="text-xs">
                {type}
              </Badge>
              {wikidataId && (
                <a 
                  href={`https://www.wikidata.org/wiki/${wikidataId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </>
          )}
        </div>
        {!compact && (
          <>
            <p className="text-xs text-muted-foreground mt-0.5">
              Mencionado por {competitorCount} competidor{competitorCount !== 1 ? "es" : ""}
            </p>
            {recommendation && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                💡 {recommendation}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
