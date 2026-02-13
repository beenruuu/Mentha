"""
Technical AEO Endpoint - Access to technical AEO audit results.

Provides access to technical AEO data stored during analysis,
including AI crawler permissions, structured data, and recommendations.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any

from app.models.auth import UserProfile
from app.api.deps import get_current_user
from app.services.supabase.auth import get_auth_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/technical-aeo", tags=["Technical AEO"])


@router.get("/")
async def get_technical_aeo(
    brand_id: Optional[str] = Query(None, description="Filter by brand ID"),
    current_user: UserProfile = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Get technical AEO audit results.
    
    Returns technical AEO data including:
    - AI crawler permissions (GPTBot, Google-Extended, etc.)
    - Structured data analysis (Schema.org types found)
    - Technical signals (HTTPS, mobile, response time)
    - AEO readiness score
    - Recommendations for improvement
    """
    auth_service = get_auth_service()
    supabase = auth_service.supabase
    
    try:
        query = supabase.table("technical_aeo").select("*")
        
        if brand_id:
            query = query.eq("brand_id", brand_id)
        
        # Order by most recent
        query = query.order("created_at", desc=True)
        
        result = query.execute()
        
        return result.data if result.data else []
        
    except Exception as e:
        logger.error(f"Error fetching technical AEO data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{aeo_id}")
async def get_technical_aeo_by_id(
    aeo_id: str,
    current_user: UserProfile = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get a specific technical AEO record by ID."""
    auth_service = get_auth_service()
    supabase = auth_service.supabase
    
    try:
        result = supabase.table("technical_aeo")\
            .select("*")\
            .eq("id", aeo_id)\
            .single()\
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Technical AEO record not found")
        
        return result.data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching technical AEO by ID: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/brand/{brand_id}/latest")
async def get_latest_technical_aeo(
    brand_id: str,
    current_user: UserProfile = Depends(get_current_user)
) -> Optional[Dict[str, Any]]:
    """Get the latest technical AEO audit for a brand."""
    auth_service = get_auth_service()
    supabase = auth_service.supabase
    
    try:
        result = supabase.table("technical_aeo")\
            .select("*")\
            .eq("brand_id", brand_id)\
            .order("created_at", desc=True)\
            .limit(1)\
            .execute()
        
        return result.data[0] if result.data else None
        
    except Exception as e:
        logger.error(f"Error fetching latest technical AEO: {e}")
        raise HTTPException(status_code=500, detail=str(e))
