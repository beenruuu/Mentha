"""
Onboarding-specific analysis endpoint.
Creates a complete initial analysis that populates all tables.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
from uuid import UUID
from pydantic import BaseModel
from datetime import datetime

from app.api.deps import get_current_user
from app.models.auth import UserProfile
from app.models.brand import Brand
from app.services.supabase.database import SupabaseDatabaseService
from app.services.analysis.analysis_service import AnalysisService
from app.models.analysis import Analysis, AnalysisStatus, AnalysisType, AIModel

router = APIRouter()


class OnboardingAnalysisRequest(BaseModel):
    """Request body for onboarding analysis with all context"""
    industry: str
    target_audience: str = ""
    key_services: List[str] = []
    discovery_prompts: List[Any] = [] # Can be objects or strings
    competitors: List[Dict[str, Any]] = []


@router.post("/onboarding/{brand_id}")
async def run_onboarding_analysis(
    brand_id: UUID,
    request: OnboardingAnalysisRequest,
    current_user: UserProfile = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Execute COMPLETE initial analysis for a brand.
    This is different from regular analysis because it:
    1. Uses rich onboarding data (audience, services, competitors)
    2. Populates ALL tables (geo_visibility, citations, hallucinations, etc.)
    3. Is blocking/synchronous in terms of initial population (or we return task ID)
    
    BUT for UX reasons, we return immediately and let the frontend poll progress.
    """
    
    # 1. Get Brand
    brand_db = SupabaseDatabaseService("brands", Brand)
    brand = await brand_db.get(str(brand_id))
    
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
        
    if str(brand.user_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # 2. Update brand with any new details from request
    update_data = {}
    if request.industry:
        update_data["industry"] = request.industry
    if request.key_services:
        update_data["services"] = request.key_services
    
    # Save target audience in metadata or description
    current_desc = brand.description or ""
    if request.target_audience and request.target_audience not in current_desc:
        update_data["description"] = f"{current_desc}\n\nTarget Audience: {request.target_audience}".strip()
        
    if update_data:
        await brand_db.update(str(brand_id), update_data)
        
    # 3. Create Analysis Record
    analysis_db = SupabaseDatabaseService("aeo_analyses", Analysis)
    
    # Build enriched input data
    input_data = {
        "brand": {
            "name": brand.name,
            "domain": brand.domain,
            "industry": request.industry,
            "description": update_data.get("description", brand.description),
            "target_audience": request.target_audience,
            "key_services": request.key_services
        },
        "competitors": request.competitors, # Pre-discovered competitors
        "discovery_prompts": request.discovery_prompts,
        "is_onboarding": True
    }
    
    data = {
        "user_id": str(current_user.id),
        "brand_id": str(brand_id),
        "status": AnalysisStatus.pending,
        "analysis_type": AnalysisType.domain,
        "input_data": input_data,
        "created_at": datetime.utcnow().isoformat()
    }
    
    analysis = await analysis_db.create(data)
    
    # 4. Trigger Analysis Service
    # We use the existing service but with a special flag/method if needed
    service = AnalysisService()
    
    # Run in background (frontend will poll /analysis/status/{brand_id})
    from fastapi import BackgroundTasks
    # Note: We can't inject BackgroundTasks here cleanly without changing signature
    # So we'll run it as a detached task using asyncio
    import asyncio
    asyncio.create_task(service.run_analysis(analysis.id))
    
    return {
        "status": "started",
        "analysis_id": str(analysis.id),
        "estimated_time": 60 # seconds
    }
