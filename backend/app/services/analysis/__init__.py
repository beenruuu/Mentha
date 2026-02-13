"""
Analysis Services Package - GEO/AEO Analysis Engine.

This package contains all analysis services for the Mentha platform,
including traditional SEO analysis and advanced GEO/AEO capabilities.

Core Services:
- AnalysisService: Main orchestration service
- AIVisibilityService: AI model visibility measurement

GEO/AEO Enhanced Services:
- RAGSimulator: Simulated RAG pipeline for visibility diagnosis
- EntityGapAnalyzer: Competitive entity comparison
- EnhancedHallucinationService: RAGAS/DeepEval hallucination detection
- SSoVCalculator: Semantic Share of Voice metrics
- EnhancedAnalysisPipeline: Orchestrates all enhanced services
"""

# Core Analysis
from app.services.analysis.analysis_service import AnalysisService

# RAG Simulation
from app.services.analysis.rag_simulator import (
    RAGSimulator,
    get_rag_simulator,
    RAGSimulationResult,
    ContentChunk,
)

# Entity Gap Analysis
from app.services.analysis.entity_gap_analyzer import (
    EntityGapAnalyzer,
    get_entity_gap_analyzer,
    EntityGapAnalysisResult,
    EntityGap,
)

# Enhanced Hallucination Detection
from app.services.analysis.enhanced_hallucination_service import (
    EnhancedHallucinationService,
    get_enhanced_hallucination_service,
    EnhancedHallucinationResult,
    RAGASMetrics,
    DeepEvalMetrics,
)

# Semantic Share of Voice
from app.services.analysis.ssov_metrics import (
    SSoVCalculator,
    get_ssov_calculator,
    SSoVResult,
    BrandMention,
)

# Enhanced Pipeline
from app.services.analysis.enhanced_pipeline import (
    EnhancedAnalysisPipeline,
    get_enhanced_pipeline,
    EnhancedAnalysisResult,
)

__all__ = [
    # Core
    "AnalysisService",
    # RAG Simulator
    "RAGSimulator",
    "get_rag_simulator",
    "RAGSimulationResult",
    "ContentChunk",
    # Entity Gap
    "EntityGapAnalyzer",
    "get_entity_gap_analyzer",
    "EntityGapAnalysisResult",
    "EntityGap",
    # Hallucination
    "EnhancedHallucinationService",
    "get_enhanced_hallucination_service",
    "EnhancedHallucinationResult",
    "RAGASMetrics",
    "DeepEvalMetrics",
    # SSoV
    "SSoVCalculator",
    "get_ssov_calculator",
    "SSoVResult",
    "BrandMention",
    # Pipeline
    "EnhancedAnalysisPipeline",
    "get_enhanced_pipeline",
    "EnhancedAnalysisResult",
]
