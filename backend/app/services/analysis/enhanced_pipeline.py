"""
Enhanced Analysis Pipeline - Integrates GEO/AEO modules.

This module orchestrates the new GEO/AEO capabilities:
- Entity Resolution (Knowledge Graph grounding)
- Brand Voice Profiling
- Persona-based query simulation
- RAG Simulation for visibility diagnosis
- Entity Gap Analysis
- Enhanced Hallucination Detection (RAGAS/DeepEval)
- Semantic Share of Voice metrics

Architecture:
- Designed to be called from the main AnalysisService
- Async-first for FastAPI compatibility
- Celery task integration for background processing
- Structured results for frontend consumption

Usage:
    from app.services.analysis.enhanced_pipeline import get_enhanced_pipeline
    
    pipeline = get_enhanced_pipeline()
    
    result = await pipeline.run_enhanced_analysis(
        brand_id=str(brand.id),
        brand_name=brand.name,
        brand_domain=brand.domain,
        brand_description=brand.description,
        competitors=[{"name": "...", "domain": "..."}],
        existing_content="...",
    )
"""

import asyncio
import json
import logging
import math
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field, asdict
from datetime import datetime
from uuid import UUID

from app.core.config import settings


def _sanitize_nan(value: Any) -> Any:
    """Recursively sanitize NaN/Inf values to None for JSON compatibility."""
    if value is None:
        return None
    if isinstance(value, float):
        if math.isnan(value) or math.isinf(value):
            return None
        return value
    if isinstance(value, dict):
        return {k: _sanitize_nan(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_sanitize_nan(v) for v in value]
    return value

# New GEO/AEO services
from app.services.onboarding.entity_resolution_service import (
    get_entity_resolution_service,
    EntityResolutionResult,
)
from app.services.onboarding.brand_voice_profiler import (
    get_brand_voice_profiler,
    VoiceProfile,
)
from app.services.onboarding.persona_manager import (
    get_persona_manager,
    UserPersona,
)
from app.services.analysis.rag_simulator import (
    get_rag_simulator,
    RAGSimulationResult,
)
from app.services.analysis.entity_gap_analyzer import (
    get_entity_gap_analyzer,
    EntityGapAnalysisResult,
)
from app.services.analysis.enhanced_hallucination_service import (
    get_enhanced_hallucination_service,
    EnhancedHallucinationResult,
)
from app.services.analysis.ssov_metrics import (
    get_ssov_calculator,
    SSoVResult,
)

logger = logging.getLogger(__name__)


@dataclass
class EnhancedAnalysisResult:
    """Complete result from enhanced GEO/AEO analysis."""
    brand_id: str
    brand_name: str
    
    # Entity Resolution
    entity_resolution: Optional[Dict[str, Any]] = None
    knowledge_graph_grounded: bool = False
    wikidata_ids: List[str] = field(default_factory=list)
    
    # Brand Voice
    voice_profile: Optional[Dict[str, Any]] = None
    voice_dimensions: Dict[str, float] = field(default_factory=dict)
    
    # RAG Simulation
    rag_simulation: Optional[Dict[str, Any]] = None
    retrieval_readiness: float = 0.0
    
    # Entity Gap
    entity_gaps: Optional[Dict[str, Any]] = None
    high_priority_gaps: int = 0
    
    # Hallucination Detection
    hallucination_analysis: Optional[Dict[str, Any]] = None
    hallucination_risk: str = "unknown"
    
    # Semantic Share of Voice
    ssov: Optional[Dict[str, Any]] = None
    ssov_score: float = 0.0
    
    # Overall scores
    geo_readiness_score: float = 0.0  # Overall GEO readiness 0-100
    
    # Recommendations
    recommendations: List[Dict[str, Any]] = field(default_factory=list)
    
    # Metadata
    analysis_timestamp: Optional[str] = None
    processing_time_seconds: float = 0.0
    
    def _safe_round(self, value: float, decimals: int = 1) -> Optional[float]:
        """Safely round a value, returning None for NaN/Inf."""
        if value is None or (isinstance(value, float) and (math.isnan(value) or math.isinf(value))):
            return None
        return round(value, decimals)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization with NaN sanitization."""
        return _sanitize_nan({
            "brand_id": self.brand_id,
            "brand_name": self.brand_name,
            "entity_resolution": self.entity_resolution,
            "knowledge_graph_grounded": self.knowledge_graph_grounded,
            "wikidata_ids": self.wikidata_ids,
            "voice_profile": self.voice_profile,
            "voice_dimensions": self.voice_dimensions,
            "rag_simulation": self.rag_simulation,
            "retrieval_readiness": self._safe_round(self.retrieval_readiness),
            "entity_gaps": self.entity_gaps,
            "high_priority_gaps": self.high_priority_gaps,
            "hallucination_analysis": self.hallucination_analysis,
            "hallucination_risk": self.hallucination_risk,
            "ssov": self.ssov,
            "ssov_score": self._safe_round(self.ssov_score),
            "geo_readiness_score": self._safe_round(self.geo_readiness_score),
            "recommendations": self.recommendations,
            "analysis_timestamp": self.analysis_timestamp,
            "processing_time_seconds": self._safe_round(self.processing_time_seconds, 2),
        })


class EnhancedAnalysisPipeline:
    """
    Enhanced Analysis Pipeline orchestrating GEO/AEO modules.
    
    This pipeline runs after basic AEO analysis to add advanced
    GEO capabilities for enterprise-level brand optimization.
    """
    
    _instance: Optional["EnhancedAnalysisPipeline"] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if hasattr(self, "_initialized") and self._initialized:
            return
        
        # Initialize services
        self._entity_resolution = get_entity_resolution_service()
        self._voice_profiler = get_brand_voice_profiler()
        self._persona_manager = get_persona_manager()
        self._rag_simulator = get_rag_simulator()
        self._entity_gap_analyzer = get_entity_gap_analyzer()
        self._hallucination_service = get_enhanced_hallucination_service()
        self._ssov_calculator = get_ssov_calculator()
        
        self._initialized = True
    
    async def run_enhanced_analysis(
        self,
        brand_id: str,
        brand_name: str,
        brand_domain: str,
        brand_description: str = "",
        industry: str = "",
        existing_content: str = "",
        sample_content_urls: Optional[List[str]] = None,
        competitors: Optional[List[Dict[str, str]]] = None,
        discovery_queries: Optional[List[str]] = None,
        run_rag_simulation: bool = True,
        run_entity_analysis: bool = True,
        run_hallucination_check: bool = True,
        run_ssov: bool = True,
    ) -> EnhancedAnalysisResult:
        """
        Run complete enhanced GEO/AEO analysis.
        
        Args:
            brand_id: Brand UUID
            brand_name: Brand name
            brand_domain: Brand's domain
            brand_description: Brand description
            industry: Industry vertical
            existing_content: Content from brand's pages
            sample_content_urls: URLs to scrape for content
            competitors: List of competitor info dicts
            discovery_queries: Queries to test visibility
            run_rag_simulation: Enable RAG simulation
            run_entity_analysis: Enable entity gap analysis
            run_hallucination_check: Enable hallucination detection
            run_ssov: Enable SSoV calculation
            
        Returns:
            EnhancedAnalysisResult with all analysis data
        """
        start_time = datetime.utcnow()
        
        logger.info(f"Starting enhanced GEO/AEO analysis for {brand_name}")
        
        result = EnhancedAnalysisResult(
            brand_id=brand_id,
            brand_name=brand_name,
        )
        
        competitors = competitors or []
        discovery_queries = discovery_queries or self._generate_default_queries(brand_name, industry)
        
        # Phase 1: Entity Resolution (Ground brand in Knowledge Graphs)
        logger.info("Phase 1: Entity Resolution")
        try:
            entity_result = await self._entity_resolution.resolve_entity(
                brand_name=brand_name,
                brand_domain=brand_domain,
                industry=industry,
            )
            
            result.entity_resolution = entity_result.to_dict()
            result.knowledge_graph_grounded = entity_result.is_known_entity
            result.wikidata_ids = [
                identity.entity_id for identity in entity_result.alternative_identities
                if identity.source == "wikidata" and identity.entity_id
            ][:5]
            
            logger.info(f"Entity Resolution: grounded={entity_result.is_known_entity}")
        except Exception as e:
            logger.warning(f"Entity Resolution failed: {e}")
            result.entity_resolution = {"error": str(e)}
        
        # Phase 2: Brand Voice Profiling
        logger.info("Phase 2: Brand Voice Profiling")
        try:
            if existing_content:
                voice_result = await self._voice_profiler.analyze_content(
                    content=existing_content,
                    content_title=brand_name,
                    use_llm=False,  # Faster analysis without LLM
                )
                
                result.voice_profile = voice_result.to_dict()
                result.voice_dimensions = {
                    "formality": voice_result.formality_score,
                    "technical_depth": voice_result.technical_score,
                    "complexity": voice_result.complexity_score,
                    "vocabulary_level": voice_result.vocabulary_score,
                    "sentiment": voice_result.sentiment_score,
                }
                
                logger.info(f"Voice Profile: formality={voice_result.formality_score:.2f}")
        except Exception as e:
            logger.warning(f"Voice Profiling failed: {e}")
            result.voice_profile = {"error": str(e)}
        
        # Phase 3: RAG Simulation (if enabled)
        if run_rag_simulation and existing_content:
            logger.info("Phase 3: RAG Simulation")
            try:
                # First create content chunks from the content
                chunks = self._rag_simulator.chunk_content(
                    content=existing_content,
                    source_url=f"https://{brand_domain}",
                )
                
                if chunks:
                    query = discovery_queries[0] if discovery_queries else f"What is {brand_name}?"
                    rag_result = await self._rag_simulator.full_simulation(
                        brand_name=brand_name,
                        query=query,
                        content_chunks=chunks,
                    )
                    
                    result.rag_simulation = rag_result.to_dict()
                    result.retrieval_readiness = rag_result.overall_visibility_score
                    
                    # Add RAG-based recommendations
                    for rec in rag_result.recommendations:
                        result.recommendations.append({
                            "source": "rag_simulation",
                            "priority": "high" if rag_result.overall_visibility_score < 50 else "medium",
                            "category": "content_structure",
                            "recommendation": rec,
                        })
                    
                    logger.info(f"RAG Simulation: score={rag_result.overall_visibility_score:.1f}")
                else:
                    logger.warning("No content chunks created for RAG simulation")
                    result.rag_simulation = {"error": "No content chunks"}
            except Exception as e:
                logger.warning(f"RAG Simulation failed: {e}")
                result.rag_simulation = {"error": str(e)}
        
        # Phase 4: Entity Gap Analysis (if competitors provided)
        if run_entity_analysis and competitors:
            logger.info("Phase 4: Entity Gap Analysis")
            try:
                # Prepare competitor content (would normally be scraped)
                competitor_contents = []
                for comp in competitors[:5]:  # Limit to 5 competitors
                    competitor_contents.append({
                        "name": comp.get("name", "Unknown"),
                        "domain": comp.get("domain", ""),
                        "content": comp.get("content", ""),  # Would be scraped
                    })
                
                gap_result = await self._entity_gap_analyzer.analyze(
                    brand_name=brand_name,
                    brand_domain=brand_domain,
                    brand_content=existing_content,
                    competitor_contents=competitor_contents,
                )
                
                result.entity_gaps = gap_result.to_dict()
                result.high_priority_gaps = gap_result.high_priority_gaps
                
                # Add gap-based recommendations
                for gap in gap_result.gaps[:5]:  # Top 5 gaps
                    if gap.priority == "high":
                        result.recommendations.append({
                            "source": "entity_gap",
                            "priority": "high",
                            "category": "content_topics",
                            "recommendation": gap.recommendation,
                            "entity": gap.entity_text,
                        })
                
                logger.info(f"Entity Gaps: {gap_result.total_gaps} total, {gap_result.high_priority_gaps} high priority")
            except Exception as e:
                logger.warning(f"Entity Gap Analysis failed: {e}")
                result.entity_gaps = {"error": str(e)}
        
        # Phase 5: Hallucination Detection
        if run_hallucination_check:
            logger.info("Phase 5: Hallucination Detection")
            try:
                # Use discovery queries to test AI responses
                query = discovery_queries[0] if discovery_queries else f"Tell me about {brand_name}"
                
                halluc_result = await self._hallucination_service.detect_hallucinations(
                    brand_name=brand_name,
                    query=query,
                    ai_response="",  # Would be from actual AI query
                    contexts=[existing_content] if existing_content else [],
                    ground_truth_facts={
                        "name": brand_name,
                        "domain": brand_domain,
                        "description": brand_description,
                    },
                )
                
                result.hallucination_analysis = halluc_result.to_dict()
                result.hallucination_risk = halluc_result.risk_level
                
                # Add hallucination-based recommendations
                for rec in halluc_result.recommendations:
                    result.recommendations.append({
                        "source": "hallucination_detection",
                        "priority": "critical" if halluc_result.risk_level == "critical" else "high",
                        "category": "fact_accuracy",
                        "recommendation": rec,
                    })
                
                logger.info(f"Hallucination Risk: {halluc_result.risk_level}")
            except Exception as e:
                logger.warning(f"Hallucination Detection failed: {e}")
                result.hallucination_analysis = {"error": str(e)}
        
        # Phase 6: Semantic Share of Voice
        if run_ssov:
            logger.info("Phase 6: Semantic Share of Voice")
            try:
                competitor_names = [c.get("name", "") for c in competitors if c.get("name")]
                
                ssov_result = await self._ssov_calculator.calculate_ssov(
                    brand_name=brand_name,
                    brand_domain=brand_domain,
                    competitors=competitor_names[:5],
                    queries=discovery_queries[:3],  # Limit queries
                )
                
                result.ssov = ssov_result.to_dict()
                result.ssov_score = ssov_result.ssov_score
                
                # Add SSoV-based recommendations
                for rec in ssov_result.recommendations:
                    result.recommendations.append({
                        "source": "ssov",
                        "priority": "medium",
                        "category": "ai_visibility",
                        "recommendation": rec,
                    })
                
                logger.info(f"SSoV Score: {ssov_result.ssov_score:.1f}%")
            except Exception as e:
                logger.warning(f"SSoV calculation failed: {e}")
                result.ssov = {"error": str(e)}
        
        # Calculate overall GEO readiness score
        result.geo_readiness_score = self._calculate_geo_readiness(result)
        
        # Add overall recommendations based on score
        if result.geo_readiness_score < 40:
            result.recommendations.insert(0, {
                "source": "overall",
                "priority": "critical",
                "category": "geo_readiness",
                "recommendation": (
                    f"GEO readiness is critically low ({result.geo_readiness_score:.0f}/100). "
                    "Focus on entity grounding, content structure, and fact accuracy first."
                ),
            })
        
        # Finalize
        end_time = datetime.utcnow()
        result.analysis_timestamp = end_time.isoformat()
        result.processing_time_seconds = (end_time - start_time).total_seconds()
        
        logger.info(
            f"Enhanced analysis complete: GEO={result.geo_readiness_score:.1f}, "
            f"time={result.processing_time_seconds:.1f}s"
        )
        
        return result
    
    def _generate_default_queries(self, brand_name: str, industry: str) -> List[str]:
        """Generate default discovery queries if none provided."""
        queries = [
            f"What is {brand_name}?",
            f"Tell me about {brand_name}",
        ]
        
        if industry:
            queries.extend([
                f"Best {industry} tools",
                f"Top {industry} companies",
            ])
        
        return queries
    
    def _calculate_geo_readiness(self, result: EnhancedAnalysisResult) -> float:
        """
        Calculate overall GEO readiness score.
        
        Weights:
        - Entity Grounding: 25%
        - RAG Readiness: 25%
        - Hallucination Risk: 20%
        - SSoV: 15%
        - Entity Gaps: 15%
        """
        scores = []
        weights = []
        
        # Entity grounding (25%)
        if result.knowledge_graph_grounded:
            scores.append(80)  # Base score for being grounded
            if result.wikidata_ids:
                scores[-1] = min(100, 80 + len(result.wikidata_ids) * 5)
        else:
            scores.append(20)
        weights.append(0.25)
        
        # RAG readiness (25%)
        if result.retrieval_readiness > 0:
            scores.append(result.retrieval_readiness)
        else:
            scores.append(50)  # Neutral if not measured
        weights.append(0.25)
        
        # Hallucination risk (20%) - inverted
        risk_scores = {
            "low": 90,
            "medium": 60,
            "high": 30,
            "critical": 10,
            "unknown": 50,
        }
        scores.append(risk_scores.get(result.hallucination_risk, 50))
        weights.append(0.20)
        
        # SSoV (15%)
        if result.ssov_score > 0:
            scores.append(result.ssov_score)
        else:
            scores.append(50)
        weights.append(0.15)
        
        # Entity gaps (15%) - inverted (fewer gaps = better)
        if result.high_priority_gaps > 0:
            gap_score = max(20, 100 - (result.high_priority_gaps * 10))
        else:
            gap_score = 80
        scores.append(gap_score)
        weights.append(0.15)
        
        # Weighted average
        total = sum(s * w for s, w in zip(scores, weights))
        return total
    
    async def run_quick_check(
        self,
        brand_name: str,
        brand_domain: str,
        content: str
    ) -> Dict[str, Any]:
        """
        Run a quick GEO check without full analysis.
        
        Useful for initial assessment or preview.
        """
        result = {
            "brand": brand_name,
            "checks": {},
            "overall": "pending",
        }
        
        # Quick entity check
        try:
            entity_result = await self._entity_resolution.resolve_entity(
                entity_name=brand_name,
                entity_type="organization",
            )
            result["checks"]["entity_grounded"] = entity_result.is_grounded
        except:
            result["checks"]["entity_grounded"] = None
        
        # Quick voice check
        if content:
            try:
                voice_result = await self._voice_profiler.analyze_voice(
                    content=content[:5000],
                    brand_name=brand_name,
                )
                result["checks"]["voice_confidence"] = voice_result.confidence
            except:
                result["checks"]["voice_confidence"] = None
        
        # Overall quick assessment
        checks = result["checks"]
        if checks.get("entity_grounded") and checks.get("voice_confidence", 0) > 0.5:
            result["overall"] = "good"
        elif checks.get("entity_grounded") or checks.get("voice_confidence", 0) > 0.3:
            result["overall"] = "fair"
        else:
            result["overall"] = "needs_work"
        
        return result


# Singleton instance
_enhanced_pipeline: Optional[EnhancedAnalysisPipeline] = None


def get_enhanced_pipeline() -> EnhancedAnalysisPipeline:
    """Get singleton instance."""
    global _enhanced_pipeline
    if _enhanced_pipeline is None:
        _enhanced_pipeline = EnhancedAnalysisPipeline()
    return _enhanced_pipeline


# Celery task integration
def create_celery_tasks():
    """
    Create Celery tasks for background processing.
    
    Usage:
        from app.services.analysis.enhanced_pipeline import create_celery_tasks
        
        tasks = create_celery_tasks()
        # Register with Celery app
    """
    try:
        from celery import shared_task
        
        @shared_task(name="run_enhanced_geo_analysis")
        def run_enhanced_geo_analysis_task(
            brand_id: str,
            brand_name: str,
            brand_domain: str,
            **kwargs
        ):
            """
            Celery task for running enhanced GEO analysis in background.
            """
            import asyncio
            
            pipeline = get_enhanced_pipeline()
            
            loop = asyncio.get_event_loop()
            result = loop.run_until_complete(
                pipeline.run_enhanced_analysis(
                    brand_id=brand_id,
                    brand_name=brand_name,
                    brand_domain=brand_domain,
                    **kwargs
                )
            )
            
            return result.to_dict()
        
        return {
            "run_enhanced_geo_analysis": run_enhanced_geo_analysis_task,
        }
    except ImportError:
        logger.warning("Celery not installed, background tasks not available")
        return {}
