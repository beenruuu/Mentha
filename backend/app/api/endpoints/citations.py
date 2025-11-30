"""
Citations API Endpoints - Track brand citations across AI platforms.
"""

import logging
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel, Field

from app.models.auth import UserProfile
from app.api.deps import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/citations", tags=["citations"])


class CitationTrackRequest(BaseModel):
    """Request model for citation tracking."""
    brand_name: str = Field(..., description="Brand name to track")
    domain: str = Field(default="", description="Brand's domain")
    industry: str = Field(default="", description="Industry category")
    topics: List[str] = Field(default=[], description="Key topics/keywords")
    competitors: List[str] = Field(default=[], description="Competitor names")


@router.post("/track")
async def track_citations(
    request: CitationTrackRequest,
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Track brand citations across AI platforms.
    """
    try:
        from app.services.analysis.citation_tracking_service import get_citation_tracking_service
        service = get_citation_tracking_service()
        
        result = await service.track_citations(
            brand_name=request.brand_name,
            domain=request.domain,
            industry=request.industry,
            topics=request.topics,
            competitors=request.competitors
        )
        
        logger.info(f"[API] Citation tracking complete for: {request.brand_name}")
        return result
        
    except Exception as e:
        logger.error(f"[API] Citation tracking failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary")
async def get_citation_summary(
    brand_name: str,
    current_user: UserProfile = Depends(get_current_user)
):
    """Get a summary of citation history for a brand."""
    logger.info(f"[API] Citation summary request for: {brand_name}")
    
    # For now, return a placeholder - this would query stored citation data
    return {
        "brand_name": brand_name,
        "message": "Citation history tracking requires running track_citations first",
        "recent_citations": [],
        "total_tracked": 0
    }
