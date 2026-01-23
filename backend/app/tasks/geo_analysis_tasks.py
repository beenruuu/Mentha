import logging
from typing import Dict, Any, List
from uuid import UUID
from datetime import datetime
from app.core.celery_app import celery_app
from app.core.async_utils import async_to_sync
from app.services.supabase.auth import get_auth_service
from app.crud.geo_analysis import get_geo_crud

logger = logging.getLogger(__name__)

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

@celery_app.task(name="run_full_geo_analysis")
def run_full_geo_analysis_task(
    analysis_id: str,
    brand_id: str,
    request_data: Dict[str, Any]
):
    """
    Execute full GEO analysis workflow for a given analysis ID (Celery Task).
    """
    logger.info(f"[GEO] Starting full GEO analysis task for {analysis_id}")
    
    async def _process():
        # Get database connection
        auth_service = get_auth_service()
        crud = get_geo_crud(auth_service.supabase)
        
        try:
            brand_name = request_data.get("brand_name")
            domain = request_data.get("domain")
            industry = request_data.get("industry", "")
            competitors = request_data.get("competitors", [])
            topics = request_data.get("topics", [])
            modules_requested = request_data.get("modules", [])
            run_full = request_data.get("run_full_analysis", True)

            modules_to_run = modules_requested if not run_full else [
                "ai_visibility", "citations", "search_simulator", 
                "content_structure", "eeat"
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
                        brand_name=brand_name,
                        domain=domain,
                        industry=industry,
                        keywords=topics
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
                        brand_name=brand_name,
                        domain=domain,
                        industry=industry,
                        topics=topics,
                        competitors=competitors
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
                        brand_name=brand_name,
                        domain=domain,
                        industry=industry,
                        competitors=competitors,
                        problems=topics
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
                    url = domain
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
            
            if "eeat" in modules_to_run:
                try:
                    logger.info("[GEO] Running E-E-A-T analyzer module...")
                    from app.services.analysis.eeat_analyzer_service import get_eeat_analyzer
                    service = get_eeat_analyzer()
                    
                    url = domain
                    if not url.startswith(('http://', 'https://')):
                        url = f'https://{url}'
                    
                    result = await service.analyze_eeat_signals(
                        url=url,
                        brand_name=brand_name,
                        domain=domain
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
                        # Skip google_search
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
            logger.error(f"[GEO] Analysis failed: {e}", exc_info=True)
            try:
                await crud.update_geo_analysis(
                    analysis_id=analysis_id,
                    status="failed",
                    completed_at=datetime.utcnow()
                )
            except Exception as db_error:
                 logger.error(f"Error updating failed status in database: {db_error}")

    return async_to_sync(_process())
