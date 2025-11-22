from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID

from app.api.deps import get_current_user
from app.models.auth import UserProfile
from app.models.recommendation import Recommendation, RecommendationCreate, RecommendationUpdate
from app.services.supabase.database import SupabaseDatabaseService

router = APIRouter()

def get_recommendation_service():
    return SupabaseDatabaseService("recommendations", Recommendation)

@router.get("/", response_model=List[Recommendation])
async def list_recommendations(
    brand_id: UUID = None,
    analysis_id: UUID = None,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_recommendation_service)
):
    filters = {"user_id": current_user.id}
    if brand_id:
        filters["brand_id"] = str(brand_id)
    if analysis_id:
        filters["analysis_id"] = str(analysis_id)
    return await service.list(filters=filters)

@router.post("/", response_model=Recommendation)
async def create_recommendation(
    recommendation: RecommendationCreate,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_recommendation_service)
):
    data = recommendation.dict(exclude_unset=True)
    data["user_id"] = current_user.id
    return await service.create(data)

@router.get("/{recommendation_id}", response_model=Recommendation)
async def get_recommendation(
    recommendation_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_recommendation_service)
):
    recommendation = await service.get(str(recommendation_id))
    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    if str(recommendation.user_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this recommendation")
    return recommendation

@router.put("/{recommendation_id}", response_model=Recommendation)
async def update_recommendation(
    recommendation_id: UUID,
    recommendation_update: RecommendationUpdate,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_recommendation_service)
):
    existing_recommendation = await service.get(str(recommendation_id))
    if not existing_recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    if str(existing_recommendation.user_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this recommendation")
        
    return await service.update(str(recommendation_id), recommendation_update.dict(exclude_unset=True))

@router.delete("/{recommendation_id}")
async def delete_recommendation(
    recommendation_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_recommendation_service)
):
    existing_recommendation = await service.get(str(recommendation_id))
    if not existing_recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    if str(existing_recommendation.user_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this recommendation")
        
    success = await service.delete(str(recommendation_id))
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete recommendation")
    return {"status": "success"}
