from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID

from app.api.deps import get_current_user
from app.models.auth import UserProfile
from app.models.keyword import Keyword, KeywordCreate, KeywordUpdate
from app.services.supabase.database import SupabaseDatabaseService

router = APIRouter()

def get_keyword_service():
    return SupabaseDatabaseService("keywords", Keyword)

@router.get("/", response_model=List[Keyword])
async def list_keywords(
    brand_id: UUID = None,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_keyword_service)
):
    filters = {"user_id": current_user.id}
    if brand_id:
        filters["brand_id"] = str(brand_id)
    return await service.list(filters=filters)

@router.post("/", response_model=Keyword)
async def create_keyword(
    keyword: KeywordCreate,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_keyword_service)
):
    data = keyword.dict(exclude_unset=True)
    data["user_id"] = current_user.id
    return await service.create(data)

@router.get("/{keyword_id}", response_model=Keyword)
async def get_keyword(
    keyword_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_keyword_service)
):
    keyword = await service.get(str(keyword_id))
    if not keyword:
        raise HTTPException(status_code=404, detail="Keyword not found")
    if str(keyword.user_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this keyword")
    return keyword

@router.put("/{keyword_id}", response_model=Keyword)
async def update_keyword(
    keyword_id: UUID,
    keyword_update: KeywordUpdate,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_keyword_service)
):
    existing_keyword = await service.get(str(keyword_id))
    if not existing_keyword:
        raise HTTPException(status_code=404, detail="Keyword not found")
    if str(existing_keyword.user_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this keyword")
        
    return await service.update(str(keyword_id), keyword_update.dict(exclude_unset=True))

@router.delete("/{keyword_id}")
async def delete_keyword(
    keyword_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_keyword_service)
):
    existing_keyword = await service.get(str(keyword_id))
    if not existing_keyword:
        raise HTTPException(status_code=404, detail="Keyword not found")
    if str(existing_keyword.user_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this keyword")
        
    success = await service.delete(str(keyword_id))
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete keyword")
    return {"status": "success"}
