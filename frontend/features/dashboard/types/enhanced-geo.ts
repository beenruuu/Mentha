/**
 * Enhanced GEO/AEO Types - Frontend type definitions for the new pipeline.
 */

// Semantic Share of Voice
export interface SSoVScore {
  score: number; // 0-100
  raw: number;
  sentiment_adjusted: number;
  prominence_adjusted: number;
}

export interface SSoVMention {
  brand: string;
  query: string;
  model: string;
  prominence: 'featured' | 'listed' | 'mentioned' | 'hidden' | 'absent';
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  position: number;
  scores: {
    raw: number;
    sentiment_weight: number;
    prominence_weight: number;
    final: number;
  };
}

export interface CompetitorComparison {
  competitor: string;
  competitor_ssov: number;
  brand_ssov: number;
  delta: number;
  brand_leading: boolean;
  winning_queries: string[];
  losing_queries: string[];
}

export interface SSoVData {
  brand_name: string;
  period: string;
  ssov: SSoVScore;
  mentions: {
    total: number;
    brand: number;
    competitors: number;
  };
  breakdown: {
    by_model: Record<string, number>;
    by_query_type: Record<string, number>;
  };
  competitor_comparisons: CompetitorComparison[];
  trend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
  };
  recommendations: string[];
}

// Entity Gap Analysis
export interface EntityGap {
  entity: string;
  type: string;
  competitors_with_entity: string[];
  competitor_count: number;
  priority: 'high' | 'medium' | 'low';
  impact_score: number;
  wikidata_id?: string;
  recommendation?: string;
}

export interface EntityGapData {
  brand_name: string;
  competitors_analyzed: string[];
  summary: {
    total_gaps: number;
    high_priority: number;
    medium_priority: number;
    low_priority: number;
  };
  entity_comparison: {
    exclusive_to_brand: string[];
    shared_entities: string[];
    competitor_only: string[];
  };
  gaps: EntityGap[];
  scores: {
    entity_coverage: number;
    topic_diversity: number;
  };
  graph_data: {
    nodes: Array<{
      id: string;
      label: string;
      type: string;
      size: number;
    }>;
    edges: Array<{
      source: string;
      target: string;
      type: string;
    }>;
  };
}

// Voice Profile
export interface VoiceProfile {
  formality: number;
  technical_depth: number;
  humor: number;
  authority: number;
  empathy: number;
  urgency: number;
}

export interface VoiceAnalysis {
  voice_vector: VoiceProfile;
  writing_style: string;
  tone: string;
  vocabulary_level: string;
  average_sentence_length: number;
  confidence: number;
}

// RAG Simulation
export interface RAGSimulationData {
  chunks_analyzed: number;
  query: string;
  retrieval_results: {
    chunks_retrieved: number;
    avg_similarity: number;
    brand_mention_in_top_chunks: boolean;
  };
  generation_results: {
    brand_mentioned: boolean;
    mention_position: number;
    context_used: number;
  };
  overall_score: number;
  recommendations: string[];
}

// Hallucination Detection (RAGAS)
export interface RAGASMetrics {
  faithfulness: number;
  answer_relevance: number;
  context_precision: number;
  context_recall: number;
  overall_score: number;
  hallucination_risk: 'low' | 'medium' | 'high' | 'critical';
}

export interface HallucinationClaim {
  claim: string;
  type: 'factual' | 'attribution' | 'fabrication' | 'exaggeration' | 'outdated';
  is_hallucination: boolean;
  confidence: number;
  explanation: string;
}

export interface HallucinationData {
  brand_name: string;
  query: string;
  ragas_metrics?: RAGASMetrics;
  claims: HallucinationClaim[];
  summary: {
    total_claims: number;
    hallucinated: number;
    verified: number;
    unverified: number;
  };
  scores: {
    overall_accuracy: number;
    hallucination_rate: number;
    risk_level: string;
  };
  recommendations: string[];
}

// Entity Resolution
export interface EntityResolution {
  is_grounded: boolean;
  wikidata_ids: string[];
  google_kg_id?: string;
  same_as: string[];
  matches: Array<{
    wikidata_id: string;
    label: string;
    description: string;
    confidence: number;
  }>;
}

// Complete Enhanced GEO Result
export interface EnhancedGEOResult {
  brand_id: string;
  brand_name: string;
  
  // Entity Resolution
  entity_resolution?: EntityResolution;
  knowledge_graph_grounded: boolean;
  wikidata_ids: string[];
  
  // Brand Voice
  voice_profile?: VoiceAnalysis;
  voice_dimensions: VoiceProfile;
  
  // RAG Simulation
  rag_simulation?: RAGSimulationData;
  retrieval_readiness: number;
  
  // Entity Gaps
  entity_gaps?: EntityGapData;
  high_priority_gaps: number;
  
  // Hallucination
  hallucination_analysis?: HallucinationData;
  hallucination_risk: string;
  
  // SSoV
  ssov?: SSoVData;
  ssov_score: number;
  
  // Overall
  geo_readiness_score: number;
  recommendations: Array<{
    source: string;
    priority: string;
    category: string;
    recommendation: string;
  }>;
  
  analysis_timestamp: string;
  processing_time_seconds: number;
}
