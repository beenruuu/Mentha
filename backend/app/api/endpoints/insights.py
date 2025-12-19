"""
Insights API Endpoint - Dynamic insights for dashboard.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any

from app.api.deps import get_current_user_id
from app.services.analysis.insights_service import get_insights_service

router = APIRouter()


@router.get("/{brand_id}")
async def get_brand_insights(
    brand_id: str,
    days: int = 30,
    user_id: str = Depends(get_current_user_id)
) -> Dict[str, Any]:
    """
    Get dynamic insights for a brand.
    
    Returns dynamic insights:
    - Consecutive trend (improved/declined X days)
    - Leading AI model
    - Score changes
    - New competitors
    - Overall assessment
    """
    service = get_insights_service()
    insights = await service.get_brand_insights(brand_id, days)
    
    if "error" in insights:
        raise HTTPException(status_code=500, detail=insights["error"])
    
    return insights


@router.get("/{brand_id}/languages")
async def get_language_comparison(
    brand_id: str,
    days: int = 30,
    user_id: str = Depends(get_current_user_id)
) -> Dict[str, Any]:
    """
    Get visibility comparison by language.
    
    Returns scores for each language the brand has been measured in.
    """
    service = get_insights_service()
    return await service.get_language_comparison(brand_id, days)


@router.get("/{brand_id}/regions")
async def get_regional_comparison(
    brand_id: str,
    days: int = 30,
    user_id: str = Depends(get_current_user_id)
) -> Dict[str, Any]:
    """
    Get visibility comparison by region/country.
    
    Returns scores for each region the brand has visibility in.
    """
    service = get_insights_service()
    return await service.get_regional_comparison(brand_id, days)
