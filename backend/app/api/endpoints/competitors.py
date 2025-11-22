from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID

from app.api.deps import get_current_user
from app.models.auth import UserProfile
from app.models.competitor import Competitor, CompetitorCreate, CompetitorUpdate
from app.services.supabase.database import SupabaseDatabaseService

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
