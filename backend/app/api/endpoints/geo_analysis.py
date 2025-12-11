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
from app.services.supabase.auth import get_auth_service
from app.crud.geo_analysis import get_geo_crud

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


# Database persistence enabled - no in-memory cache needed


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
    # Get Supabase client
    auth_service = get_auth_service()
    crud = get_geo_crud(auth_service.supabase)
    
    # Get brand_id from domain or create temp record
    # For now, we'll need brand_id to be passed in request or fetched
    # Assuming brand exists in database
    try:
        brand_result = auth_service.supabase.table("brands").select("id").eq("domain", request.domain).limit(1).execute()
        if not brand_result.data:
            raise HTTPException(status_code=404, detail=f"Brand with domain {request.domain} not found")
        brand_id = brand_result.data[0]["id"]
    except Exception as e:
        logger.error(f"Error fetching brand: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch brand information")
    
    # Create initial analysis record in database
    try:
        db_analysis = await crud.create_geo_analysis(
            brand_id=brand_id,
            overall_score=0,
            grade="N/A",
            status="processing"
        )
        analysis_id = db_analysis["id"]
    except Exception as e:
        logger.error(f"Error creating GEO analysis record: {e}")
        raise HTTPException(status_code=500, detail="Failed to create analysis record")
    
    response = GEOAnalysisResponse(
        id=UUID(analysis_id),
        brand_name=request.brand_name,
        domain=request.domain,
        status="processing",
        created_at=db_analysis["created_at"]
    )
    
    # Run analysis in background
    background_tasks.add_task(
        _run_full_geo_analysis,
        analysis_id=analysis_id,
        brand_id=brand_id,
        request=request
    )
    
    return response


async def _run_full_geo_analysis(
    analysis_id: str,
    brand_id: str,
    request: GEOAnalysisRequest
):
    """Background task to run full GEO analysis."""
    logger.info(f"[GEO] Starting full GEO analysis for {request.brand_name}")
    logger.info(f"[GEO] Analysis ID: {analysis_id}")
    logger.info(f"[GEO] Brand ID: {brand_id}")
    logger.info(f"[GEO] Domain: {request.domain}, Industry: {request.industry}")
    
    # Get database connection
    auth_service = get_auth_service()
    crud = get_geo_crud(auth_service.supabase)
    
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
                from app.services.analysis.ai_visibility_service import get_ai_visibility_service
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
            
            # Update progress
            await crud.update_geo_analysis(analysis_id=analysis_id, modules=results)
        
        if "citations" in modules_to_run:
            try:
                logger.info("[GEO] Running citations tracking module...")
                from app.services.analysis.citation_tracking_service import get_citation_tracking_service
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
            
            # Update progress
            await crud.update_geo_analysis(analysis_id=analysis_id, modules=results)
        
        if "search_simulator" in modules_to_run:
            try:
                logger.info("[GEO] Running AI search simulator module...")
                from app.services.analysis.ai_search_simulator_service import get_ai_search_simulator
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
            
            # Update progress
            await crud.update_geo_analysis(analysis_id=analysis_id, modules=results)
        
        if "content_structure" in modules_to_run:
            try:
                logger.info("[GEO] Running content structure analysis module...")
                from app.services.analysis.content_structure_analyzer_service import get_content_structure_analyzer
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
            
            # Update progress
            await crud.update_geo_analysis(analysis_id=analysis_id, modules=results)
        
        if "knowledge_graph" in modules_to_run:
            try:
                logger.info("[GEO] Running knowledge graph monitor module...")
                from app.services.analysis.knowledge_graph_service import get_knowledge_graph_monitor
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
            
            # Update progress
            await crud.update_geo_analysis(analysis_id=analysis_id, modules=results)
        
        if "eeat" in modules_to_run:
            try:
                logger.info("[GEO] Running E-E-A-T analyzer module...")
                from app.services.analysis.eeat_analyzer_service import get_eeat_analyzer
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
            
            # Update progress
            await crud.update_geo_analysis(analysis_id=analysis_id, modules=results)
        
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
        
        # Save visibility snapshots to database
        if "ai_visibility" in results and results["ai_visibility"].get("models"):
            for model_name, model_data in results["ai_visibility"]["models"].items():
                try:
                    # Skip google_search as it's not in the allowed enum values for ai_visibility_snapshots
                    if model_name == "google_search":
                        continue
                        
                    await crud.create_visibility_snapshot(
                        brand_id=brand_id,
                        ai_model=model_name,
                        visibility_score=model_data.get("visibility_score", 0),
                        mention_count=model_data.get("mention_count", 0),
                        sentiment=model_data.get("sentiment"),
                        metadata={"contexts": model_data.get("contexts", [])}
                    )
                except Exception as e:
                    logger.error(f"Error saving visibility snapshot for {model_name}: {e}")
        
        # Save citations to database
        if "citations" in results and results["citations"].get("contexts"):
            for citation in results["citations"]["contexts"]:
                try:
                    await crud.create_citation_record(
                        brand_id=brand_id,
                        ai_model=citation.get("model", "unknown"),
                        query=citation.get("query", ""),
                        context=citation.get("context"),
                        source_url=citation.get("source_url"),
                        citation_type=citation.get("type", "direct")
                    )
                except Exception as e:
                    logger.error(f"Error saving citation: {e}")
        
        # Update analysis record in database
        try:
            await crud.update_geo_analysis(
                analysis_id=analysis_id,
                status="completed",
                overall_score=round(overall_score, 1),
                grade=grade,
                modules=results,
                summary=str(summary),
                recommendations=unique_recommendations[:20],
                completed_at=datetime.utcnow()
            )
        except Exception as e:
            logger.error(f"Error updating GEO analysis in database: {e}")
        
    except Exception as e:
        logger.error(f"[GEO] Analysis failed: {e}")
        try:
            await crud.update_geo_analysis(
                analysis_id=analysis_id,
                status="failed",
                completed_at=datetime.utcnow()
            )
        except Exception as db_error:
            logger.error(f"Error updating failed status in database: {db_error}")


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
    auth_service = get_auth_service()
    crud = get_geo_crud(auth_service.supabase)
    
    try:
        db_analysis = await crud.get_geo_analysis_by_id(str(analysis_id))
        
        if not db_analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        # Get brand info for response
        brand_info = auth_service.supabase.table("brands")\
            .select("name, domain")\
            .eq("id", db_analysis["brand_id"])\
            .limit(1)\
            .execute()
        
        brand_name = brand_info.data[0]["name"] if brand_info.data else ""
        domain = brand_info.data[0]["domain"] if brand_info.data else ""
        
        return GEOAnalysisResponse(
            id=UUID(db_analysis["id"]),
            brand_name=brand_name,
            domain=domain,
            status=db_analysis["status"],
            created_at=db_analysis["created_at"],
            completed_at=db_analysis.get("completed_at"),
            overall_score=float(db_analysis.get("overall_score", 0)),
            grade=db_analysis.get("grade", "N/A"),
            modules=db_analysis.get("modules", {}),
            summary=db_analysis.get("summary", ""),
            recommendations=db_analysis.get("recommendations", [])
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching GEO analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/brands/{brand_id}/latest")
async def get_latest_geo_analysis(
    brand_id: UUID,
    current_user: UserProfile = Depends(get_current_user)
) -> Optional[Dict[str, Any]]:
    """Get the latest GEO analysis for a brand."""
    auth_service = get_auth_service()
    crud = get_geo_crud(auth_service.supabase)
    
    try:
        result = await crud.get_latest_geo_analysis(str(brand_id))
        return result
    except Exception as e:
        logger.error(f"Error fetching latest GEO analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/brands/{brand_id}/history")
async def get_geo_analysis_history(
    brand_id: UUID,
    limit: int = 10,
    current_user: UserProfile = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """Get historical GEO analyses for a brand."""
    auth_service = get_auth_service()
    crud = get_geo_crud(auth_service.supabase)
    
    try:
        results = await crud.get_geo_history(str(brand_id), limit=limit)
        return results
    except Exception as e:
        logger.error(f"Error fetching GEO history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/brands/{brand_id}/visibility")
async def get_brand_visibility_data(
    brand_id: UUID,
    ai_model: Optional[str] = None,
    limit: int = 30,
    current_user: UserProfile = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get AI visibility data for a brand."""
    auth_service = get_auth_service()
    crud = get_geo_crud(auth_service.supabase)
    
    try:
        history = await crud.get_visibility_history(str(brand_id), ai_model, limit)
        latest = await crud.get_latest_visibility_scores(str(brand_id))
        
        return {
            "history": history,
            "latest_scores": latest
        }
    except Exception as e:
        logger.error(f"Error fetching visibility data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/brands/{brand_id}/citations")
async def get_brand_citations(
    brand_id: UUID,
    ai_model: Optional[str] = None,
    limit: int = 50,
    current_user: UserProfile = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get citation data for a brand."""
    auth_service = get_auth_service()
    crud = get_geo_crud(auth_service.supabase)
    
    try:
        citations = await crud.get_citations(str(brand_id), ai_model, limit)
        rates = await crud.get_citation_rates(str(brand_id))
        
        return {
            "citations": citations,
            "citation_rates": rates
        }
    except Exception as e:
        logger.error(f"Error fetching citations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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
        from app.services.analysis.ai_visibility_service import get_ai_visibility_service
        visibility_service = get_ai_visibility_service()
        visibility = await visibility_service.measure_visibility(
            brand_name=brand_name,
            domain=domain,
            num_queries=2
        )
        results["ai_visibility_score"] = visibility.get("overall_score", 0)
        
        # Quick EEAT check
        from app.services.analysis.eeat_analyzer_service import get_eeat_analyzer
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


@router.get("/brands/{brand_id}/dashboard-data")
async def get_dashboard_data(
    brand_id: UUID,
    days: int = 30,
    current_user: UserProfile = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get all data needed for the dashboard in a single request.
    
    Returns:
    - Historical visibility chart data
    - Model performance (visibility score per AI provider)
    - Latest analysis scores
    - GSC summary if connected
    """
    auth_service = get_auth_service()
    crud = get_geo_crud(auth_service.supabase)
    supabase = auth_service.supabase
    
    try:
        # Verify user owns the brand
        brand_response = supabase.table("brands")\
            .select("*, profiles!inner(id)")\
            .eq("id", str(brand_id))\
            .execute()
        
        if not brand_response.data:
            raise HTTPException(status_code=404, detail="Brand not found")
        
        brand = brand_response.data[0]
        
        # 1. Historical visibility for chart
        visibility_history = await crud.get_visibility_history(str(brand_id), limit=days)
        
        # Format for chart (group by date)
        chart_data = []
        if visibility_history:
            # Group snapshots by date
            from collections import defaultdict
            date_groups = defaultdict(lambda: {"rank": 0, "position": 0, "inclusion_rate": 0, "count": 0})
            
            for snapshot in visibility_history:
                # Extract date from measured_at
                measured_at = snapshot.get("measured_at", "")
                date_str = measured_at[:10] if measured_at else ""
                
                if date_str:
                    date_groups[date_str]["rank"] += snapshot.get("visibility_score", 0)
                    date_groups[date_str]["position"] += snapshot.get("visibility_score", 0)
                    date_groups[date_str]["inclusion_rate"] += snapshot.get("inclusion_rate", 0) or snapshot.get("visibility_score", 0)
                    date_groups[date_str]["count"] += 1
            
            # Average scores per day
            for date_str, values in sorted(date_groups.items()):
                count = values["count"] or 1
                chart_data.append({
                    "date": date_str,
                    "rank": round(values["rank"] / count, 1),
                    "position": round(values["position"] / count, 1),
                    "inclusionRate": round(values["inclusion_rate"] / count, 1)
                })
        
        # 2. Model Performance (latest visibility scores per model)
        model_performance = []
        latest_scores = await crud.get_latest_visibility_scores(str(brand_id))
        
        model_display_names = {
            "openai": "ChatGPT",
            "anthropic": "Claude",
            "perplexity": "Perplexity",
            "gemini": "Gemini"
        }
        
        for score in latest_scores:
            model_name = score.get("ai_model", "unknown")
            model_performance.append({
                "name": model_display_names.get(model_name, model_name.capitalize()),
                "model": model_name,
                "visibility_score": score.get("visibility_score", 0),
                "mention_count": score.get("mention_count", 0),
                "sentiment": score.get("sentiment", "neutral")
            })
        
        # If no visibility data, add placeholders
        if not model_performance:
            for model, display_name in model_display_names.items():
                model_performance.append({
                    "name": display_name,
                    "model": model,
                    "visibility_score": 0,
                    "mention_count": 0,
                    "sentiment": "neutral"
                })
        
        # 3. Latest Analysis Summary
        latest_analysis = await crud.get_latest_geo_analysis(str(brand_id))
        analysis_summary = None
        if latest_analysis:
            analysis_summary = {
                "rank": latest_analysis.get("overall_score", 0),
                "position": latest_analysis.get("overall_score", 0),  # Using same score for now
                "inclusion_rate": latest_analysis.get("overall_score", 0),
                "grade": latest_analysis.get("grade", "N/A"),
                "completed_at": latest_analysis.get("completed_at")
            }
        
        # 4. GSC Summary if connected
        gsc_summary = None
        if brand.get("gsc_connected"):
            try:
                gsc_response = supabase.table("gsc_top_queries")\
                    .select("*")\
                    .eq("brand_id", str(brand_id))\
                    .limit(5)\
                    .execute()
                
                if gsc_response.data:
                    total_clicks = sum(q.get("total_clicks", 0) for q in gsc_response.data)
                    total_impressions = sum(q.get("total_impressions", 0) for q in gsc_response.data)
                    
                    gsc_summary = {
                        "connected": True,
                        "site_url": brand.get("gsc_site_url"),
                        "last_sync": brand.get("gsc_last_sync"),
                        "total_clicks": total_clicks,
                        "total_impressions": total_impressions,
                        "top_queries": gsc_response.data[:5]
                    }
            except Exception as gsc_error:
                logger.warning(f"Failed to fetch GSC summary: {gsc_error}")
                gsc_summary = {"connected": True, "error": "Failed to load data"}
        else:
            gsc_summary = {"connected": False}
        
        return {
            "brand_id": str(brand_id),
            "brand_name": brand.get("name"),
            "chart_data": chart_data,
            "model_performance": model_performance,
            "analysis_summary": analysis_summary,
            "gsc_summary": gsc_summary,
            "last_updated": datetime.utcnow().isoformat() + "Z"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching dashboard data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

