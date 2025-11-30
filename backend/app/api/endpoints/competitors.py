from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List
from uuid import UUID
from datetime import datetime

from app.api.deps import get_current_user
from app.models.auth import UserProfile
from app.models.competitor import Competitor, CompetitorCreate, CompetitorUpdate
from app.services.supabase.database import SupabaseDatabaseService
from app.services.analysis.competitor_analyzer import CompetitorAnalyzerService

router = APIRouter()

def get_competitor_service():
    return SupabaseDatabaseService("competitors", Competitor)

@router.get("/", response_model=List[Competitor])
async def list_competitors(
    brand_id: UUID = None,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_competitor_service)
):
    filters = {"user_id": current_user.id}
    if brand_id:
        filters["brand_id"] = str(brand_id)
    return await service.list(filters=filters)

@router.post("/", response_model=Competitor)
async def create_competitor(
    competitor: CompetitorCreate,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_competitor_service)
):
    data = competitor.dict(exclude_unset=True)
    data["user_id"] = current_user.id
    return await service.create(data)

@router.get("/{competitor_id}", response_model=Competitor)
async def get_competitor(
    competitor_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_competitor_service)
):
    competitor = await service.get(str(competitor_id))
    if not competitor:
        raise HTTPException(status_code=404, detail="Competitor not found")
    if str(competitor.user_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this competitor")
    return competitor

@router.put("/{competitor_id}", response_model=Competitor)
async def update_competitor(
    competitor_id: UUID,
    competitor_update: CompetitorUpdate,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_competitor_service)
):
    existing_competitor = await service.get(str(competitor_id))
    if not existing_competitor:
        raise HTTPException(status_code=404, detail="Competitor not found")
    if str(existing_competitor.user_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this competitor")
        
    return await service.update(str(competitor_id), competitor_update.dict(exclude_unset=True))

@router.delete("/{competitor_id}")
async def delete_competitor(
    competitor_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_competitor_service)
):
    existing_competitor = await service.get(str(competitor_id))
    if not existing_competitor:
        raise HTTPException(status_code=404, detail="Competitor not found")
    if str(existing_competitor.user_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this competitor")
        
    success = await service.delete(str(competitor_id))
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete competitor")
    return {"status": "success"}

@router.post("/{competitor_id}/analyze", response_model=Competitor)
async def analyze_competitor(
    competitor_id: UUID,
    background_tasks: BackgroundTasks,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_competitor_service)
):
    """
    Trigger a real-time analysis of the competitor.
    Crawls the competitor site and compares it with the brand site.
    """
    competitor = await service.get(str(competitor_id))
    if not competitor:
        raise HTTPException(status_code=404, detail="Competitor not found")
    if str(competitor.user_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # We need the brand URL to compare against
    # Assuming brand_id is present and we can fetch the brand
    # For now, we'll fetch the brand using a separate service instance or passed in context
    # To keep it simple, we'll assume the brand URL is accessible via a brands table lookup
    # But since we don't have direct access to brands service here easily without circular deps,
    # we will fetch the brand using the generic service
    
    # Run analysis in background
    background_tasks.add_task(
        _run_competitor_analysis,
        competitor_id=competitor_id,
        competitor_url=competitor.domain,
        brand_id=competitor.brand_id,
        service=service
    )
    
    return competitor

async def _run_competitor_analysis(
    competitor_id: UUID,
    competitor_url: str,
    brand_id: UUID,
    service: SupabaseDatabaseService
):
    """Background task to run competitor analysis."""
    try:
        # Fetch brand URL (Need to instantiate brand service or query DB directly)
        # Using the supabase client from the service
        brand_res = service.supabase.table("brands").select("domain").eq("id", str(brand_id)).execute()
        if not brand_res.data:
            print(f"Brand {brand_id} not found for competitor analysis")
            return
            
        brand_url = brand_res.data[0]["domain"]
        
        analyzer = CompetitorAnalyzerService()
        results = await analyzer.analyze_competitor(brand_url, competitor_url)
        await analyzer.close()
        
        # Update competitor record
        await service.update(str(competitor_id), {
            "analysis_data": results,
            "visibility_score": results.get("visibility_score"),
            "last_analyzed_at": datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        print(f"Competitor analysis failed: {e}")
