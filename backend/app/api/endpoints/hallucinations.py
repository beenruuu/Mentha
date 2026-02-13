"""
Hallucination Detection API Endpoints.

Endpoints for detecting and tracking hallucinations (false claims)
about brands in AI-generated responses.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.models.auth import UserProfile
from app.services.analysis.hallucination_detection_service import get_hallucination_detection_service


router = APIRouter(prefix="/hallucinations", tags=["Hallucinations"])


class HallucinationCheckRequest(BaseModel):
    brand_name: str
    domain: str
    industry: Optional[str] = ""
    known_facts: Optional[Dict[str, Any]] = None


class HallucinationCheckResponse(BaseModel):
    brand_name: str
    analyzed_at: str
    total_claims: int
    accurate: int
    hallucinations: int  
    unverified: int
    accuracy_rate: float
    hallucination_rate: float
    claims: List[Dict[str, Any]]
    summary: str


@router.post("/check", response_model=HallucinationCheckResponse)
async def check_hallucinations(
    request: HallucinationCheckRequest,
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Check for hallucinations about a brand in AI responses.
    
    Queries multiple AI models and compares their claims against
    known facts to identify false information.
    """
    service = get_hallucination_detection_service()
    
    try:
        results = await service.detect_hallucinations(
            brand_name=request.brand_name,
            domain=request.domain,
            industry=request.industry,
            known_facts=request.known_facts
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/check/{brand_id}")
async def check_hallucinations_for_brand(
    brand_id: UUID,
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Check hallucinations for an existing brand by ID.
    
    Fetches brand details and runs hallucination detection.
    """
    from supabase import create_client
    from app.core.config import settings
    
    try:
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        
        # Get brand
        brand_result = supabase.table("brands").select("*").eq("id", str(brand_id)).single().execute()
        
        if not brand_result.data:
            raise HTTPException(status_code=404, detail="Brand not found")
        
        brand = brand_result.data
        
        service = get_hallucination_detection_service()
        results = await service.detect_hallucinations(
            brand_name=brand["name"],
            domain=brand["domain"],
            industry=brand.get("industry", "")
        )
        
        return results
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
