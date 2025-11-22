from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID

from app.api.deps import get_current_user
from app.models.auth import UserProfile
from app.models.brand import Brand, BrandCreate, BrandUpdate
from app.services.supabase.database import SupabaseDatabaseService

router = APIRouter()

def get_brand_service():
    return SupabaseDatabaseService("brands", Brand)

@router.get("/", response_model=List[Brand])
async def list_brands(
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_brand_service)
):
    return await service.list(filters={"user_id": current_user.id})

@router.post("/", response_model=Brand)
async def create_brand(
    brand: BrandCreate,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_brand_service)
):
    data = brand.dict(exclude_unset=True)
    data["user_id"] = current_user.id
    return await service.create(data)

@router.get("/{brand_id}", response_model=Brand)
async def get_brand(
    brand_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_brand_service)
):
    brand = await service.get(str(brand_id))
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    if str(brand.user_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this brand")
    return brand

@router.put("/{brand_id}", response_model=Brand)
async def update_brand(
    brand_id: UUID,
    brand_update: BrandUpdate,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_brand_service)
):
    # Check ownership first
    existing_brand = await service.get(str(brand_id))
    if not existing_brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    if str(existing_brand.user_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this brand")
        
    return await service.update(str(brand_id), brand_update.dict(exclude_unset=True))

@router.delete("/{brand_id}")
async def delete_brand(
    brand_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_brand_service)
):
    # Check ownership first
    existing_brand = await service.get(str(brand_id))
    if not existing_brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    if str(existing_brand.user_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this brand")
        
    success = await service.delete(str(brand_id))
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete brand")
    return {"status": "success"}
