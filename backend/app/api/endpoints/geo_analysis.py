"""
GEO Analysis Endpoints - Complete Generative Engine Optimization analysis.

This module provides comprehensive GEO/AEO analysis by orchestrating
all specialized analysis services.
"""

import logging
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime
from pydantic import BaseModel, Field

from app.models.auth import UserProfile
from app.api.deps import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/geo-analysis", tags=["geo-analysis"])


# Request/Response Models
class GEOAnalysisRequest(BaseModel):
    """Request model for GEO analysis."""
    brand_name: str = Field(..., description="Brand name to analyze")
    domain: str = Field(..., description="Brand's website domain")
    industry: str = Field(default="", description="Industry category")
    competitors: List[str] = Field(default=[], description="Competitor brand names")
    topics: List[str] = Field(default=[], description="Key topics/keywords")
    run_full_analysis: bool = Field(default=True, description="Run all analysis modules")
    modules: List[str] = Field(
        default=["ai_visibility", "citations", "search_simulator", "content_structure", "knowledge_graph", "eeat"],
        description="Specific modules to run"
    )


class GEOAnalysisResponse(BaseModel):
    """Response model for GEO analysis."""
    id: UUID
    brand_name: str
    domain: str
    status: str
    created_at: str
    completed_at: Optional[str] = None
    overall_score: float = 0
    grade: str = "N/A"
    modules: Dict[str, Any] = {}
    summary: Dict[str, Any] = {}
    recommendations: List[Dict[str, str]] = []
    error: Optional[str] = None


# In-memory cache for analysis results (use database in production)
_geo_analysis_cache: Dict[str, GEOAnalysisResponse] = {}


@router.post("/analyze", response_model=GEOAnalysisResponse)
async def run_geo_analysis(
    request: GEOAnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user: UserProfile = Depends(get_current_user)
) -> GEOAnalysisResponse:
    """
    Run comprehensive GEO (Generative Engine Optimization) analysis.
    
    This endpoint orchestrates multiple analysis services:
    - AI Visibility: How visible is the brand in AI responses
    - Citation Tracking: How often is the brand cited as a source
    - AI Search Simulation: How the brand appears across AI platforms
    - Content Structure: How well content is optimized for AI extraction
    - Knowledge Graph: Brand presence in knowledge bases
    - E-E-A-T: Experience, Expertise, Authoritativeness, Trust signals
    
    The analysis runs asynchronously. Poll the status endpoint for results.
    """
    analysis_id = uuid4()
    
    response = GEOAnalysisResponse(
        id=analysis_id,
        brand_name=request.brand_name,
        domain=request.domain,
        status="processing",
        created_at=datetime.utcnow().isoformat() + "Z"
    )
    
    _geo_analysis_cache[str(analysis_id)] = response
    
    # Run analysis in background
    background_tasks.add_task(
        _run_full_geo_analysis,
        analysis_id=analysis_id,
        request=request
    )
    
    return response


async def _run_full_geo_analysis(
    analysis_id: UUID,
    request: GEOAnalysisRequest
):
    """Background task to run full GEO analysis."""
    logger.info(f"[GEO] Starting full GEO analysis for {request.brand_name}")
    logger.info(f"[GEO] Analysis ID: {analysis_id}")
    logger.info(f"[GEO] Domain: {request.domain}, Industry: {request.industry}")
    
    response = _geo_analysis_cache.get(str(analysis_id))
    if not response:
        logger.error(f"[GEO] Analysis {analysis_id} not found in cache")
        return
    
    try:
        modules_to_run = request.modules if not request.run_full_analysis else [
            "ai_visibility", "citations", "search_simulator", 
            "content_structure", "knowledge_graph", "eeat"
        ]
        
        logger.info(f"[GEO] Modules to run: {modules_to_run}")
        
        results = {}
        all_recommendations = []
        total_score = 0
        module_count = 0
        
        # Run each analysis module
        if "ai_visibility" in modules_to_run:
            try:
                logger.info("[GEO] Running AI visibility module...")
                from app.services.ai_visibility_service import get_ai_visibility_service
                service = get_ai_visibility_service()
                result = await service.measure_visibility(
                    brand_name=request.brand_name,
                    domain=request.domain,
                    industry=request.industry,
                    keywords=request.topics
                )
                results["ai_visibility"] = result
                logger.info(f"[GEO] AI visibility complete. Score: {result.get('overall_score', 'N/A')}")
                if result.get("overall_score"):
                    total_score += result["overall_score"]
                    module_count += 1
            except Exception as e:
                logger.error(f"[GEO] AI visibility failed: {e}")
                results["ai_visibility"] = {"error": str(e)}
        
        if "citations" in modules_to_run:
            try:
                logger.info("[GEO] Running citations tracking module...")
                from app.services.citation_tracking_service import get_citation_tracking_service
                service = get_citation_tracking_service()
                result = await service.track_citations(
                    brand_name=request.brand_name,
                    domain=request.domain,
                    industry=request.industry,
                    topics=request.topics,
                    competitors=request.competitors
                )
                results["citations"] = result
                logger.info(f"[GEO] Citations complete. Score: {result.get('citation_score', 'N/A')}")
                if result.get("citation_score"):
                    total_score += result["citation_score"]
                    module_count += 1
            except Exception as e:
                logger.error(f"[GEO] Citations tracking failed: {e}")
                results["citations"] = {"error": str(e)}
        
        if "search_simulator" in modules_to_run:
            try:
                logger.info("[GEO] Running AI search simulator module...")
                from app.services.ai_search_simulator_service import get_ai_search_simulator
                service = get_ai_search_simulator()
                result = await service.simulate_search(
                    brand_name=request.brand_name,
                    domain=request.domain,
                    industry=request.industry,
                    competitors=request.competitors,
                    problems=request.topics
                )
                results["search_simulator"] = result
                logger.info(f"[GEO] Search simulator complete. Score: {result.get('overall_score', 'N/A')}")
                if result.get("overall_score"):
                    total_score += result["overall_score"]
                    module_count += 1
                if result.get("insights"):
                    all_recommendations.extend([
                        {"priority": i.get("type", "medium"), "category": "search", **i}
                        for i in result["insights"]
                    ])
            except Exception as e:
                logger.error(f"[GEO] Search simulator failed: {e}")
                results["search_simulator"] = {"error": str(e)}
        
        if "content_structure" in modules_to_run:
            try:
                logger.info("[GEO] Running content structure analysis module...")
                from app.services.content_structure_analyzer_service import get_content_structure_analyzer
                service = get_content_structure_analyzer()
                
                # Ensure domain has protocol
                url = request.domain
                if not url.startswith(('http://', 'https://')):
                    url = f'https://{url}'
                
                result = await service.analyze_content_structure(url=url)
                results["content_structure"] = result
                logger.info(f"[GEO] Content structure complete. Score: {result.get('overall_structure_score', 'N/A')}")
                if result.get("overall_structure_score"):
                    total_score += result["overall_structure_score"]
                    module_count += 1
                if result.get("recommendations"):
                    all_recommendations.extend(result["recommendations"])
            except Exception as e:
                logger.error(f"[GEO] Content structure analysis failed: {e}")
                results["content_structure"] = {"error": str(e)}
        
        if "knowledge_graph" in modules_to_run:
            try:
                logger.info("[GEO] Running knowledge graph monitor module...")
                from app.services.knowledge_graph_service import get_knowledge_graph_monitor
                service = get_knowledge_graph_monitor()
                result = await service.monitor_knowledge_presence(
                    brand_name=request.brand_name,
                    domain=request.domain
                )
                results["knowledge_graph"] = result
                logger.info(f"[GEO] Knowledge graph complete. Score: {result.get('presence_score', 'N/A')}")
                if result.get("presence_score"):
                    total_score += result["presence_score"]
                    module_count += 1
                if result.get("recommendations"):
                    all_recommendations.extend(result["recommendations"])
            except Exception as e:
                logger.error(f"[GEO] Knowledge graph monitor failed: {e}")
                results["knowledge_graph"] = {"error": str(e)}
        
        if "eeat" in modules_to_run:
            try:
                logger.info("[GEO] Running E-E-A-T analyzer module...")
                from app.services.eeat_analyzer_service import get_eeat_analyzer
                service = get_eeat_analyzer()
                
                url = request.domain
                if not url.startswith(('http://', 'https://')):
                    url = f'https://{url}'
                
                result = await service.analyze_eeat_signals(
                    url=url,
                    brand_name=request.brand_name,
                    domain=request.domain
                )
                results["eeat"] = result
                logger.info(f"[GEO] E-E-A-T complete. Score: {result.get('overall_score', 'N/A')}, Grade: {result.get('grade', 'N/A')}")
                if result.get("overall_score"):
                    total_score += result["overall_score"]
                    module_count += 1
                if result.get("recommendations"):
                    all_recommendations.extend(result["recommendations"])
            except Exception as e:
                logger.error(f"[GEO] E-E-A-T analyzer failed: {e}")
                results["eeat"] = {"error": str(e)}
        
        # Calculate overall score
        overall_score = total_score / module_count if module_count > 0 else 0
        logger.info(f"[GEO] All modules complete. Overall score: {overall_score:.1f}, Modules: {module_count}")
        
        # Determine grade
        grade = _score_to_grade(overall_score)
        logger.info(f"[GEO] Final grade: {grade}")
        
        # Create summary
        summary = _create_analysis_summary(results, overall_score)
        
        # Deduplicate and sort recommendations
        unique_recommendations = _deduplicate_recommendations(all_recommendations)
        
        # Update response
        response.status = "completed"
        response.completed_at = datetime.utcnow().isoformat() + "Z"
        response.overall_score = round(overall_score, 1)
        response.grade = grade
        response.modules = results
        response.summary = summary
        response.recommendations = unique_recommendations[:20]  # Top 20 recommendations
        
    except Exception as e:
        response.status = "failed"
        response.error = str(e)
    
    _geo_analysis_cache[str(analysis_id)] = response


def _score_to_grade(score: float) -> str:
    """Convert score to letter grade."""
    if score >= 90:
        return "A+"
    elif score >= 85:
        return "A"
    elif score >= 80:
        return "A-"
    elif score >= 75:
        return "B+"
    elif score >= 70:
        return "B"
    elif score >= 65:
        return "B-"
    elif score >= 60:
        return "C+"
    elif score >= 55:
        return "C"
    elif score >= 50:
        return "C-"
    elif score >= 45:
        return "D+"
    elif score >= 40:
        return "D"
    else:
        return "F"


def _create_analysis_summary(results: Dict, overall_score: float) -> Dict[str, Any]:
    """Create a summary of the analysis results."""
    summary = {
        "overall_score": round(overall_score, 1),
        "strengths": [],
        "weaknesses": [],
        "quick_wins": [],
        "module_scores": {}
    }
    
    # Extract module scores
    score_mapping = {
        "ai_visibility": ("AI Visibility", "overall_score"),
        "citations": ("Citation Rate", "citation_score"),
        "search_simulator": ("AI Search Presence", "overall_score"),
        "content_structure": ("Content Structure", "overall_structure_score"),
        "knowledge_graph": ("Knowledge Graph", "presence_score"),
        "eeat": ("E-E-A-T", "overall_score"),
    }
    
    for module, (display_name, score_key) in score_mapping.items():
        if module in results and not results[module].get("error"):
            score = results[module].get(score_key, 0)
            summary["module_scores"][display_name] = score
            
            # Categorize as strength or weakness
            if score >= 70:
                summary["strengths"].append(f"{display_name}: {score:.0f}/100")
            elif score < 40:
                summary["weaknesses"].append(f"{display_name}: {score:.0f}/100")
    
    # Identify quick wins (high-impact, easy fixes)
    quick_win_categories = ["structured_data", "trust", "content"]
    
    for module_data in results.values():
        if isinstance(module_data, dict) and "recommendations" in module_data:
            for rec in module_data["recommendations"]:
                if rec.get("category") in quick_win_categories and rec.get("priority") in ["high", "critical"]:
                    summary["quick_wins"].append(rec.get("title", ""))
    
    summary["quick_wins"] = list(set(summary["quick_wins"]))[:5]
    
    return summary


def _deduplicate_recommendations(recommendations: List[Dict]) -> List[Dict]:
    """Remove duplicate recommendations and sort by priority."""
    seen_titles = set()
    unique = []
    
    priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3, "action": 1, "warning": 2, "success": 3}
    
    # Sort by priority first
    sorted_recs = sorted(
        recommendations,
        key=lambda x: priority_order.get(x.get("priority", "low"), 4)
    )
    
    for rec in sorted_recs:
        title = rec.get("title", "")
        if title and title not in seen_titles:
            seen_titles.add(title)
            unique.append(rec)
    
    return unique


@router.get("/analyze/{analysis_id}", response_model=GEOAnalysisResponse)
async def get_geo_analysis(
    analysis_id: UUID,
    current_user: UserProfile = Depends(get_current_user)
) -> GEOAnalysisResponse:
    """Get the status and results of a GEO analysis."""
    result = _geo_analysis_cache.get(str(analysis_id))
    if not result:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return result


@router.post("/quick-check")
async def quick_geo_check(
    brand_name: str,
    domain: str,
    current_user: UserProfile = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Run a quick GEO check (AI visibility + basic EEAT).
    
    This is a faster alternative to the full analysis for quick insights.
    """
    results = {
        "brand_name": brand_name,
        "domain": domain,
        "checked_at": datetime.utcnow().isoformat() + "Z",
        "ai_visibility_score": 0,
        "eeat_score": 0,
        "quick_recommendations": []
    }
    
    try:
        # Quick AI visibility check
        from app.services.ai_visibility_service import get_ai_visibility_service
        visibility_service = get_ai_visibility_service()
        visibility = await visibility_service.measure_visibility(
            brand_name=brand_name,
            domain=domain,
            num_queries=2
        )
        results["ai_visibility_score"] = visibility.get("overall_score", 0)
        
        # Quick EEAT check
        from app.services.eeat_analyzer_service import get_eeat_analyzer
        eeat_service = get_eeat_analyzer()
        
        url = domain if domain.startswith(('http://', 'https://')) else f'https://{domain}'
        eeat = await eeat_service.analyze_eeat_signals(url=url, brand_name=brand_name)
        results["eeat_score"] = eeat.get("overall_score", 0)
        
        # Top 3 recommendations
        if eeat.get("recommendations"):
            results["quick_recommendations"] = eeat["recommendations"][:3]
        
        results["overall_health"] = "good" if (results["ai_visibility_score"] + results["eeat_score"]) / 2 >= 50 else "needs_improvement"
        
    except Exception as e:
        results["error"] = str(e)
    
    return results


@router.get("/modules")
async def list_available_modules(
    current_user: UserProfile = Depends(get_current_user)
) -> Dict[str, Any]:
    """List all available GEO analysis modules."""
    return {
        "modules": [
            {
                "id": "ai_visibility",
                "name": "AI Visibility",
                "description": "Measure how visible your brand is in AI-generated responses across ChatGPT, Claude, and Perplexity.",
                "api_required": ["openai", "anthropic", "perplexity"]
            },
            {
                "id": "citations",
                "name": "Citation Tracking",
                "description": "Track when and how AI systems cite your brand or content as a source.",
                "api_required": ["openai", "anthropic", "perplexity"]
            },
            {
                "id": "search_simulator",
                "name": "AI Search Simulator",
                "description": "Simulate user queries across AI platforms to understand your brand's appearance in responses.",
                "api_required": ["openai", "anthropic", "perplexity"]
            },
            {
                "id": "content_structure",
                "name": "Content Structure",
                "description": "Analyze how well your content is structured for AI extraction (FAQs, How-tos, definitions).",
                "api_required": []
            },
            {
                "id": "knowledge_graph",
                "name": "Knowledge Graph",
                "description": "Monitor your brand's presence in Wikipedia, Wikidata, and other knowledge bases.",
                "api_required": ["openai"]
            },
            {
                "id": "eeat",
                "name": "E-E-A-T Analysis",
                "description": "Analyze Experience, Expertise, Authoritativeness, and Trust signals on your website.",
                "api_required": []
            }
        ]
    }
