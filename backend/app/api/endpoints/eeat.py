"""
E-E-A-T API Endpoints - Analyze Experience, Expertise, Authoritativeness, Trust signals.
"""

import logging
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from pydantic import BaseModel, Field

from app.models.auth import UserProfile
from app.api.deps import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/eeat", tags=["eeat"])


class EEATAnalyzeRequest(BaseModel):
    """Request model for E-E-A-T analysis."""
    url: str = Field(default="", description="URL to analyze")
    html_content: Optional[str] = Field(default=None, description="Raw HTML content (alternative to URL)")
    brand_name: str = Field(default="", description="Brand name for context")
    domain: str = Field(default="", description="Domain for additional checks")


@router.post("/analyze")
async def analyze_eeat_signals(
    request: EEATAnalyzeRequest,
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Analyze E-E-A-T signals for a webpage.
    
    Evaluates Experience, Expertise, Authoritativeness, and Trustworthiness
    signals that are critical for AI visibility and search rankings.
    """
    logger.info(f"[API] E-E-A-T analysis request for: {request.url or request.domain}")
    
    try:
        from app.services.eeat_analyzer_service import get_eeat_analyzer
        service = get_eeat_analyzer()
        
        result = await service.analyze_eeat_signals(
            url=request.url if request.url else None,
            html_content=request.html_content,
            brand_name=request.brand_name,
            domain=request.domain
        )
        
        logger.info(f"[API] E-E-A-T analysis complete. Grade: {result.get('grade', 'N/A')}")
        return result
        
    except Exception as e:
        logger.error(f"[API] E-E-A-T analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/score")
async def get_eeat_score(
    url: str,
    current_user: UserProfile = Depends(get_current_user)
):
    """Get a quick E-E-A-T score for a URL."""
    logger.info(f"[API] Quick E-E-A-T score for: {url}")
    
    try:
        from app.services.eeat_analyzer_service import get_eeat_analyzer
        service = get_eeat_analyzer()
        
        result = await service.analyze_eeat_signals(url=url)
        
        return {
            "url": url,
            "overall_score": result.get("overall_score", 0),
            "grade": result.get("grade", "N/A"),
            "experience_score": result.get("experience", {}).get("score", 0),
            "expertise_score": result.get("expertise", {}).get("score", 0),
            "authoritativeness_score": result.get("authoritativeness", {}).get("score", 0),
            "trustworthiness_score": result.get("trustworthiness", {}).get("score", 0)
        }
        
    except Exception as e:
        logger.error(f"[API] Quick E-E-A-T score failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
