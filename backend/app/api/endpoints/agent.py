"""
Firecrawl Agent API Endpoints
REST endpoints for autonomous web data discovery using FIRE-1 agent.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
import logging

from app.api import deps
from app.services.firecrawl_agent_workflows import get_agent_workflows
from app.services.firecrawl_schemas import (
    BrandMentionRequest,
    CompetitorScanRequest,
    AgentJobStatus
)
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/discover-mentions", response_model=dict)
async def discover_brand_mentions(
    request: BrandMentionRequest,
    current_user = Depends(deps.get_current_user)
):
    """
    Discover brand mentions across AI search engines using Firecrawl Agent.
    
    This endpoint uses the FIRE-1 autonomous agent to search for how your brand
    is mentioned in ChatGPT, Perplexity, Claude, and other AI engines.
    
    Returns either immediate results or a job_id for async polling.
    """
    if not settings.FIRECRAWL_AGENT_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Firecrawl Agent is not enabled. Contact administrator."
        )
    
    workflows = get_agent_workflows()
    
    try:
        result = await workflows.discover_brand_mentions(
            brand_name=request.brand_name,
            industry=request.industry,
            ai_engines=request.ai_engines,
            additional_keywords=request.keywords
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to start brand mention discovery")
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in discover_brand_mentions endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/competitor-scan", response_model=dict)
async def scan_competitors(
    request: CompetitorScanRequest,
    current_user = Depends(deps.get_current_user)
):
    """
    Scan for competitor intelligence using Firecrawl Agent.
    
    Monitors known competitors and discovers new ones by analyzing
    AI search results for your industry.
    
    Returns either immediate results or a job_id for async polling.
    """
    if not settings.FIRECRAWL_AGENT_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Firecrawl Agent is not enabled. Contact administrator."
        )
    
    workflows = get_agent_workflows()
    
    try:
        result = await workflows.monitor_competitor_presence(
            brand_name=request.brand_name,
            known_competitors=request.known_competitors,
            industry=request.industry,
            keywords=request.keywords
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to start competitor scan")
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in scan_competitors endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/visibility-analysis", response_model=dict)
async def analyze_visibility(
    brand_name: str,
    industry: str,
    keywords: list[str],
    current_user = Depends(deps.get_current_user)
):
    """
    Analyze brand visibility across industry keywords.
    
    Checks how your brand appears in AI search results compared to competitors
    for specific keywords in your industry.
    """
    if not settings.FIRECRAWL_AGENT_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Firecrawl Agent is not enabled. Contact administrator."
        )
    
    if not keywords:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one keyword is required"
        )
    
    workflows = get_agent_workflows()
    
    try:
        result = await workflows.analyze_industry_visibility(
            brand_name=brand_name,
            industry=industry,
            target_keywords=keywords
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to start visibility analysis")
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in analyze_visibility endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/status/{job_id}", response_model=dict)
async def get_agent_job_status(
    job_id: str,
    current_user = Depends(deps.get_current_user)
):
    """
    Check the status of an async agent job.
    
    Poll this endpoint to get results when an agent task completes.
    
    Possible statuses:
    - pending: Job is queued
    - running: Agent is actively working
    - completed: Results are ready
    - failed: Job encountered an error
    """
    workflows = get_agent_workflows()
    
    try:
        result = await workflows.get_job_status(job_id)
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result.get("error", "Job not found")
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting agent job status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/health", response_model=dict)
async def agent_health_check():
    """
    Check if the Firecrawl Agent service is available.
    
    Returns configuration status without requiring authentication.
    """
    return {
        "enabled": settings.FIRECRAWL_AGENT_ENABLED,
        "api_configured": bool(settings.FIRECRAWL_API_KEY),
        "max_pages_per_request": settings.FIRECRAWL_AGENT_MAX_PAGES
    }


@router.post("/search", response_model=dict)
async def search_web(
    query: str,
    limit: int = 10,
    lang: str = "es",
    country: str = "es",
    current_user = Depends(deps.get_current_user)
):
    """
    Search the web and extract content from results.
    
    This endpoint uses Firecrawl's /search API which combines web search
    with content extraction in a single call. Results are cached for 1 day.
    
    Cheaper than /agent for simple search tasks.
    """
    if not settings.FIRECRAWL_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Firecrawl API is not configured"
        )
    
    from app.services.firecrawl_service import FirecrawlService
    firecrawl = FirecrawlService()
    
    try:
        result = await firecrawl.search_web(
            query=query,
            limit=limit,
            lang=lang,
            country=country
        )
        await firecrawl.close()
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Search failed")
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in search_web endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
